import logging
import logging.config
import os
from typing import Any, Dict, Tuple

from email_validator import EmailNotValidError, validate_email
from flask import Flask, jsonify, render_template, request

# Local site data (kept in a separate module)
# Support multiple import patterns so the app can be run as a package
# or as a script.
try:
    # Preferred package-relative import when running as a module
    # (python -m backend.app)
    from . import data as site_data  # backend/data.py (added)
except Exception:
    # If package import fails (running as script or installed differently),
    # try a few fallbacks.
    try:
        # First try importing as an absolute package name
        import importlib

        site_data = importlib.import_module("backend.data")
    except Exception:
        # Final fallback: load the data.py file directly from the same directory
        import importlib.util

        module_path = os.path.join(os.path.dirname(__file__), "data.py")
        spec = importlib.util.spec_from_file_location("backend.data", module_path)
        if spec is None or spec.loader is None:
            raise ImportError(f"Unable to load site data from {module_path}")
        site_data = importlib.util.module_from_spec(spec)
        spec.loader.exec_module(site_data)

# Configuration constants
DEFAULT_HOST: str = "127.0.0.1"
DEFAULT_PORT: int = 5000
DEFAULT_ENV: str = "development"
CONTACT_FIELD_LIMITS: Dict[str, int] = {
    "name": 120,
    "email": 254,
    "organization": 160,
    "industry": 80,
    "interest": 160,
    "message": 1000,
}
SECURITY_HEADERS: Dict[str, str] = {
    "X-Content-Type-Options": "nosniff",
    "X-Frame-Options": "DENY",
    "Referrer-Policy": "strict-origin-when-cross-origin",
    "Permissions-Policy": "camera=(), geolocation=(), microphone=()",
    "Cross-Origin-Opener-Policy": "same-origin",
}

# Logging configuration
LOGGING_CONFIG: Dict[str, Any] = {
    "version": 1,
    "disable_existing_loggers": False,
    "formatters": {
        "standard": {
            "format": (
                "%(asctime)s - %(name)s - %(levelname)s - "
                "[%(filename)s:%(lineno)d] - %(message)s"
            )
        },
        "simple": {"format": "%(levelname)s - %(message)s"},
    },
    "handlers": {
        "default": {
            "level": "INFO",
            "class": "logging.StreamHandler",
            "formatter": "standard",
        },
    },
    "loggers": {
        "": {
            "handlers": ["default"],
            "level": "INFO",
            "propagate": True,
        }
    },
}

# Apply logging configuration
logging.config.dictConfig(LOGGING_CONFIG)
logger: logging.Logger = logging.getLogger(__name__)


def create_app() -> Flask:
    """
    Create and configure the Flask application.

    Initializes Flask with proper template and static folder paths,
    registers error handlers, and configures logging.
    """
    try:
        base_dir: str = os.path.dirname(os.path.abspath(__file__))
        template_folder: str = os.path.join(base_dir, "../frontend/templates")
        static_folder: str = os.path.join(base_dir, "../frontend/static")

        if not os.path.isdir(template_folder):
            raise RuntimeError(f"Template folder not found at {template_folder}")
        if not os.path.isdir(static_folder):
            raise RuntimeError(f"Static folder not found at {static_folder}")

        flask_app: Flask = Flask(
            __name__,
            template_folder=template_folder,
            static_folder=static_folder,
        )

        env: str = os.getenv("FLASK_ENV", DEFAULT_ENV)
        flask_app.config["ENV"] = env
        flask_app.config["DEBUG"] = env == "development"

        logger.info("Flask app created in %s mode", env)
        return flask_app

    except RuntimeError as error:
        logger.error(f"Failed to create Flask app: {error}")
        raise
    except Exception as error:
        logger.error(f"Unexpected error creating Flask app: {error}")
        raise


app: Flask = create_app()


@app.after_request
def apply_security_headers(response: Any) -> Any:
    response.headers["Content-Security-Policy"] = (
        "default-src 'self'; "
        "img-src 'self' data:; "
        "font-src 'self' https://fonts.gstatic.com; "
        "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; "
        "style-src-elem 'self' https://fonts.googleapis.com; "
        "script-src 'self'; "
        "connect-src 'self'; "
        "form-action 'self'; "
        "base-uri 'self'; "
        "frame-ancestors 'none'; "
        "object-src 'none'"
    )
    for key, value in SECURITY_HEADERS.items():
        response.headers.setdefault(key, value)
    return response


def normalize_contact_payload(data: Dict[str, Any]) -> Dict[str, str]:
    normalized: Dict[str, str] = {}
    for field_name in CONTACT_FIELD_LIMITS:
        value = data.get(field_name, "")
        if value is None:
            value = ""
        normalized[field_name] = str(value).strip()
    return normalized


def validate_contact_email(email: str) -> str:
    normalized_email = validate_email(email, check_deliverability=False)
    return normalized_email.normalized


@app.route("/", methods=["GET"])
def index() -> str:
    """
    Render the main landing page, providing structured site data into the
    template so the frontend becomes dynamic.
    """
    try:
        logger.debug("Rendering index.html with site data")
        context = {
            "SITE_INFO": site_data.SITE_INFO,
            "site_title": site_data.SITE_INFO.get("title"),
            "site_description": site_data.SITE_INFO.get("description"),
            "site_url": site_data.SITE_INFO.get("url"),
            "services": site_data.SERVICES,
            "industries": site_data.INDUSTRIES,
            "projects": site_data.PROJECTS,
            "contact": site_data.CONTACT,
        }
        return render_template("index.html", **context)
    except Exception as error:
        logger.error(f"Error rendering index page: {error}")
        return render_error_page(500, "Failed to load landing page")


@app.route("/privacy", methods=["GET"])
def privacy_policy() -> str:
    return render_info_page(
        "Privacy Policy",
        (
            "USETAI Technology handles submitted contact information solely for "
            "responding to business inquiries and service requests."
        ),
    )


@app.route("/terms", methods=["GET"])
def terms_of_use() -> str:
    return render_info_page(
        "Terms of Use",
        (
            "This website content is provided for informational purposes. "
            "By using this site, you agree to lawful and responsible use."
        ),
    )


@app.route("/responsible-ai", methods=["GET"])
def responsible_ai() -> str:
    return render_info_page(
        "Responsible AI",
        (
            "USETAI Technology applies safety, explainability, privacy, and "
            "governance practices across all AI delivery engagements."
        ),
    )


@app.route("/health", methods=["GET"])
def health() -> Tuple[Any, int]:
    try:
        logger.debug("Health check requested")
        response: Dict[str, str] = {
            "status": "ok",
            "service": "usetai-website",
            "version": "0.1.0",
        }
        return jsonify(response), 200
    except Exception as error:
        logger.error("Error in health check: %s", error)
        return jsonify({"status": "error", "message": str(error)}), 500


@app.route("/api/contact", methods=["POST"])
def contact() -> Tuple[Any, int]:
    try:
        data: Dict[str, Any] | None = request.get_json(silent=True)

        if not data:
            logger.warning("Contact form submission with empty payload")
            return (
                jsonify(
                    {
                        "status": "error",
                        "message": "Invalid JSON payload",
                    }
                ),
                400,
            )

        if not isinstance(data, dict):
            logger.warning("Contact form submission with non-object payload")
            return (
                jsonify(
                    {
                        "status": "error",
                        "message": "Invalid JSON payload",
                    }
                ),
                400,
            )

        normalized_payload = normalize_contact_payload(data)
        oversized_fields = [
            field_name
            for field_name, limit in CONTACT_FIELD_LIMITS.items()
            if len(normalized_payload.get(field_name, "")) > limit
        ]

        if oversized_fields:
            logger.warning(
                "Contact form oversized fields: %s",
                ", ".join(oversized_fields),
            )
            return (
                jsonify(
                    {
                        "status": "error",
                        "message": (
                            "Field length exceeded for: "
                            f"{', '.join(oversized_fields)}"
                        ),
                    }
                ),
                400,
            )

        required_fields: list[str] = ["name", "email", "message"]
        missing_fields: list[str] = [
            field
            for field in required_fields
            if not normalized_payload.get(field, "").strip()
        ]

        if missing_fields:
            logger.warning(
                "Contact form missing fields: %s",
                ", ".join(missing_fields),
            )
            return (
                jsonify(
                    {
                        "status": "error",
                        "message": (
                            f"Missing required fields: {', '.join(missing_fields)}"
                        ),
                    }
                ),
                400,
            )

        try:
            email = validate_contact_email(normalized_payload["email"])
        except EmailNotValidError:
            logger.warning(
                "Contact form invalid email: %s",
                normalized_payload["email"],
            )
            return (
                jsonify({"status": "error", "message": "Invalid email address"}),
                400,
            )

        logger.info(
            "Contact form submission from %s (%s) - %s",
            normalized_payload.get("name"),
            email,
            normalized_payload.get("interest") or "no interest specified",
        )

        # In production, send email or write to CRM here.

        return (
            jsonify(
                {
                    "status": "success",
                    "message": (
                        "Thank you for contacting USETAI Technology. "
                        "We will respond within 2 business days."
                    ),
                    "received": {
                        "email": email,
                        "name": normalized_payload["name"],
                    },
                }
            ),
            200,
        )

    except Exception as error:
        logger.error("Error processing contact form: %s", error, exc_info=True)
        return (
            jsonify(
                {"status": "error", "message": "Server error processing your request"}
            ),
            500,
        )


# New small JSON endpoints so frontend can fetch content if desired
@app.route("/api/services", methods=["GET"])
def api_services() -> Tuple[Any, int]:
    try:
        return jsonify({"services": site_data.SERVICES}), 200
    except Exception as error:
        logger.error("Error returning services API: %s", error, exc_info=True)
        return jsonify({"status": "error", "message": "Failed to load services"}), 500


@app.route("/api/projects", methods=["GET"])
def api_projects() -> Tuple[Any, int]:
    try:
        return jsonify({"projects": site_data.PROJECTS}), 200
    except Exception as error:
        logger.error("Error returning projects API: %s", error, exc_info=True)
        return jsonify({"status": "error", "message": "Failed to load projects"}), 500


def render_error_page(status_code: int, message: str) -> str:
    return f"""
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Error {status_code}</title>
            <style>
                body {{ font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto;
                        margin: 0; padding: 2rem; background: #f5f5f5; }}
                .error {{ max-width: 600px; margin: 0 auto;
                         background: white; padding: 2rem; border-radius: 8px; }}
                h1 {{ color: #333; margin-top: 0; }}
                p {{ color: #666; }}
                a {{ color: #0066cc; text-decoration: none; }}
            </style>
        </head>
        <body>
            <div class="error">
                <h1>Error {status_code}</h1>
                <p>{message}</p>
                <a href="/">Return to home</a>
            </div>
        </body>
        </html>
        """


def render_info_page(title: str, message: str) -> str:
    return f"""
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>{title} | USETAI Technology</title>
            <style>
                body {{ font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto;
                        margin: 0; padding: 2rem; background: #f5f5f5; color: #111; }}
                .page {{ max-width: 760px; margin: 0 auto;
                         background: white; padding: 2rem; border-radius: 8px; }}
                h1 {{ margin-top: 0; color: #0b2a52; }}
                p {{ color: #2f3b4a; line-height: 1.65; }}
                a {{ color: #0055cc; text-decoration: none; font-weight: 600; }}
            </style>
        </head>
        <body>
            <main class="page">
                <h1>{title}</h1>
                <p>{message}</p>
                <a href="/">Return to home</a>
            </main>
        </body>
        </html>
        """


@app.errorhandler(404)
def not_found(error: Exception) -> Tuple[str, int]:
    logger.warning("404 error: %s", request.path)
    return render_error_page(404, "Page not found"), 404


@app.errorhandler(500)
def server_error(error: Exception) -> Tuple[str, int]:
    logger.error("500 error: %s", error, exc_info=True)
    return render_error_page(500, "Internal server error"), 500


if __name__ == "__main__":
    host: str = os.getenv("HOST", DEFAULT_HOST)
    port: int = int(os.getenv("PORT", DEFAULT_PORT))
    env: str = os.getenv("FLASK_ENV", DEFAULT_ENV)
    debug: bool = env == "development"

    logger.info(
        "Starting USETAI website server on %s:%s (%s mode)",
        host,
        port,
        env,
    )
    logger.info("Visit http://localhost:5000 in your browser")

    try:
        app.run(host=host, port=port, debug=debug)
    except KeyboardInterrupt:
        logger.info("Server shutdown requested")
    except Exception as error:
        logger.error("Server error: %s", error, exc_info=True)
        raise
