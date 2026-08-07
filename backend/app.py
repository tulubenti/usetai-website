import logging
import logging.config
import os
from typing import Dict, Tuple, Any

from flask import Flask, render_template, jsonify, request

# Local site data (kept in a separate module)
try:
    from . import data as site_data  # backend/data.py (added)
except Exception:
    # If package import fails (running as script), try relative import
    import backend.data as site_data  # type: ignore

# Configuration constants
DEFAULT_HOST: str = "127.0.0.1"
DEFAULT_PORT: int = 5000
DEFAULT_ENV: str = "development"

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

        logger.info(f"Flask app created in {env} mode")
        return flask_app

    except RuntimeError as error:
        logger.error(f"Failed to create Flask app: {error}")
        raise
    except Exception as error:
        logger.error(f"Unexpected error creating Flask app: {error}")
        raise


app: Flask = create_app()


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


@app.route("/health", methods=["GET"])
def health() -> Tuple[Dict[str, str], int]:
    try:
        logger.debug("Health check requested")
        response: Dict[str, str] = {
            "status": "ok",
            "service": "usetai-website",
            "version": "0.1.0",
        }
        return jsonify(response), 200
    except Exception as error:
        logger.error(f"Error in health check: {error}")
        return jsonify({"status": "error", "message": str(error)}), 500


@app.route("/api/contact", methods=["POST"])
def contact() -> Tuple[Dict[str, Any], int]:
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

        required_fields: list[str] = ["name", "email", "message"]
        missing_fields: list[str] = [
            field for field in required_fields if not data.get(field, "").strip()
        ]

        if missing_fields:
            logger.warning(f"Contact form missing fields: {', '.join(missing_fields)}")
            return (
                jsonify(
                    {
                        "status": "error",
                        "message": (f"Missing required fields: {', '.join(missing_fields)}"),
                    }
                ),
                400,
            )

        email: str = data.get("email", "").strip().lower()
        if "@" not in email:
            logger.warning(f"Contact form invalid email: {email}")
            return (jsonify({"status": "error", "message": "Invalid email address"}), 400)

        logger.info(
            f"Contact form submission from {data.get('name')} "
            f"({email}) - {data.get('interest', 'no interest specified')}"
        )

        # In production, send email or write to CRM here.

        return (
            jsonify(
                {
                    "status": "success",
                    "message": (
                        "Thank you for contacting USETAI. "
                        "We will respond within 2 business days."
                    ),
                }
            ),
            200,
        )

    except Exception as error:
        logger.error(f"Error processing contact form: {error}", exc_info=True)
        return (jsonify({"status": "error", "message": "Server error processing your request"}), 500)


# New small JSON endpoints so frontend can fetch content if desired
@app.route("/api/services", methods=["GET"])
def api_services() -> Tuple[Any, int]:
    try:
        return jsonify({"services": site_data.SERVICES}), 200
    except Exception as error:
        logger.error(f"Error returning services API: {error}", exc_info=True)
        return jsonify({"status": "error", "message": "Failed to load services"}), 500


@app.route("/api/projects", methods=["GET"])
def api_projects() -> Tuple[Any, int]:
    try:
        return jsonify({"projects": site_data.PROJECTS}), 200
    except Exception as error:
        logger.error(f"Error returning projects API: {error}", exc_info=True)
        return jsonify({"status": "error", "message": "Failed to load projects"}), 500


def render_error_page(status_code: int, message: str) -> str:
    return (
        f"""
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
    )


@app.errorhandler(404)
def not_found(error: Exception) -> Tuple[str, int]:
    logger.warning(f"404 error: {request.path}")
    return render_error_page(404, "Page not found"), 404


@app.errorhandler(500)
def server_error(error: Exception) -> Tuple[str, int]:
    logger.error(f"500 error: {error}", exc_info=True)
    return render_error_page(500, "Internal server error"), 500


if __name__ == "__main__":
    host: str = os.getenv("HOST", DEFAULT_HOST)
    port: int = int(os.getenv("PORT", DEFAULT_PORT))
    env: str = os.getenv("FLASK_ENV", DEFAULT_ENV)
    debug: bool = env == "development"

    logger.info(f"Starting USETAI website server on {host}:{port} ({env} mode)")
    logger.info("Visit http://localhost:5000 in your browser")

    try:
        app.run(host=host, port=port, debug=debug)
    except KeyboardInterrupt:
        logger.info("Server shutdown requested")
    except Exception as error:
        logger.error(f"Server error: {error}", exc_info=True)
        raise
