"""
USETAI Website Flask Application.

A minimal Flask web server that serves the USETAI International Technology
enterprise website with a single-page frontend featuring an animated particle
background and responsive design.

Endpoints:
    GET /: Render the main landing page with index.html
    GET /health: JSON health check endpoint
    POST /api/contact: Contact form submission (local testing)

The application uses Flask for request handling and Jinja2 for template
rendering. For production deployment, use a WSGI server (gunicorn, uWSGI)
with proper configuration management and error tracking.

Environment Variables:
    FLASK_ENV: Development or production mode (default: development)
    FLASK_DEBUG: Enable debug mode (default: False)
    PORT: Server port (default: 5000)
    HOST: Server host (default: 127.0.0.1)

Usage:
    python backend/app.py

Author:
    USETAI International Technology
"""

import logging
import logging.config
import os
from typing import Dict, Tuple, Any

from flask import Flask, render_template, jsonify, request

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

    Returns:
        Flask: Configured Flask application instance.

    Raises:
        RuntimeError: If template or static directories cannot be found.
    """
    try:
        # Get base directory path
        base_dir: str = os.path.dirname(os.path.abspath(__file__))
        template_folder: str = os.path.join(base_dir, "../frontend/templates")
        static_folder: str = os.path.join(base_dir, "../frontend/static")

        # Validate required directories exist
        if not os.path.isdir(template_folder):
            raise RuntimeError(
                f"Template folder not found at {template_folder}"
            )
        if not os.path.isdir(static_folder):
            raise RuntimeError(f"Static folder not found at {static_folder}")

        # Create Flask app
        flask_app: Flask = Flask(
            __name__,
            template_folder=template_folder,
            static_folder=static_folder,
        )

        # Set environment-specific configuration
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
    Render the main landing page.

    Serves the index.html template which includes the USETAI branding,
    navigation, service offerings, and contact form. The page features
    an animated diagonal particle background (animation.js) and
    accessible tab navigation (tabs.js).

    Returns:
        str: Rendered HTML content of the landing page.

    Raises:
        TemplateNotFound: If index.html template cannot be located.

    Example:
        GET / HTTP/1.1
        Host: localhost:5000
    """
    try:
        logger.debug("Rendering index.html")
        return render_template("index.html")
    except Exception as error:
        logger.error(f"Error rendering index page: {error}")
        return render_error_page(500, "Failed to load landing page")


@app.route("/health", methods=["GET"])
def health() -> Tuple[Dict[str, str], int]:
    """
    Health check endpoint for monitoring and load balancers.

    Provides a simple JSON response indicating the application status.
    Useful for Kubernetes probes, uptime monitoring, and deployment checks.

    Returns:
        Tuple[Dict[str, str], int]: JSON response with status information
            and HTTP 200 status code.

    Example Response:
        {
            "status": "ok",
            "service": "usetai-website",
            "version": "0.1.0"
        }
    """
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
    """
    Handle contact form submissions.

    Validates and processes contact form data from the frontend.
    In production, this should integrate with an email service or
    CRM system. Currently for local development testing only.

    Expected JSON payload:
        {
            "name": str,
            "email": str,
            "organization": str (optional),
            "industry": str (optional),
            "interest": str (optional),
            "message": str
        }

    Returns:
        Tuple[Dict[str, Any], int]: JSON response with status and optional
            message, with appropriate HTTP status code.

    Status Codes:
        200: Contact form successfully processed
        400: Validation error (missing required fields)
        500: Server error during processing
    """
    try:
        # Get JSON payload
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

        # Validate required fields
        required_fields: list[str] = ["name", "email", "message"]
        missing_fields: list[str] = [
            field
            for field in required_fields
            if not data.get(field, "").strip()
        ]

        if missing_fields:
            logger.warning(
                f"Contact form missing fields: {', '.join(missing_fields)}"
            )
            return (
                jsonify(
                    {
                        "status": "error",
                        "message": (
                            f"Missing required fields: "
                            f"{', '.join(missing_fields)}"
                        ),
                    }
                ),
                400,
            )

        # Sanitize input (basic validation)
        email: str = data.get("email", "").strip().lower()
        if "@" not in email:
            logger.warning(f"Contact form invalid email: {email}")
            return (
                jsonify(
                    {"status": "error", "message": "Invalid email address"}
                ),
                400,
            )

        # Log the submission (replace with production email/CRM logic)
        logger.info(
            f"Contact form submission from {data.get('name')} "
            f"({email}) - {data.get('interest', 'no interest specified')}"
        )

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
        return (
            jsonify(
                {
                    "status": "error",
                    "message": "Server error processing your request",
                }
            ),
            500,
        )


def render_error_page(status_code: int, message: str) -> str:
    """
    Render a simple error page.

    Provides basic error page rendering when template errors occur.
    In production, create proper error.html templates.

    Args:
        status_code: HTTP status code (e.g., 404, 500)
        message: Error message to display

    Returns:
        str: Simple HTML error page content
    """
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
    """
    Handle 404 Not Found errors.

    Args:
        error: The werkzeug HTTPException

    Returns:
        Tuple of (error page HTML, 404 status code)
    """
    logger.warning(f"404 error: {request.path}")
    return render_error_page(404, "Page not found"), 404


@app.errorhandler(500)
def server_error(error: Exception) -> Tuple[str, int]:
    """
    Handle 500 Internal Server errors.

    Args:
        error: The exception that occurred

    Returns:
        Tuple of (error page HTML, 500 status code)
    """
    logger.error(f"500 error: {error}", exc_info=True)
    return render_error_page(500, "Internal server error"), 500


if __name__ == "__main__":
    # Get configuration from environment variables
    host: str = os.getenv("HOST", DEFAULT_HOST)
    port: int = int(os.getenv("PORT", DEFAULT_PORT))
    env: str = os.getenv("FLASK_ENV", DEFAULT_ENV)
    debug: bool = env == "development"

    logger.info(
        f"Starting USETAI website server on {host}:{port} "
        f"({env} mode)"
    )
    logger.info("Visit http://localhost:5000 in your browser")

    try:
        app.run(host=host, port=port, debug=debug)
    except KeyboardInterrupt:
        logger.info("Server shutdown requested")
    except Exception as error:
        logger.error(f"Server error: {error}", exc_info=True)
        raise
