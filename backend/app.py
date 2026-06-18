"""
USETAI Website Flask App

This module starts a minimal Flask web server that serves the single-page
frontend located in ../frontend.

Files served:
- GET /  -> renders index.html (includes the streaming binary background)
- GET /health -> returns JSON health-check

The application is intentionally small and uses the Flask builtin server
for development. For production, containerize and run under a WSGI server
(e.g., gunicorn or uWSGI).

Usage:
    python backend/app.py

Author: Generated sample for USETAI International Technology
"""

from flask import Flask, render_template, jsonify
import os

app = Flask(
    __name__,
    template_folder=os.path.join(os.path.dirname(__file__), "../frontend/templates"),
    static_folder=os.path.join(os.path.dirname(__file__), "../frontend/static"),
)


@app.route("/")
def index():
    """
    Render the main landing page.

    Returns:
        A rendered HTML page (index.html) which includes the binary streaming
        background animation implemented in frontend/static/js/animation.js.
    """
    return render_template("index.html")


@app.route("/health")
def health():
    """
    Simple health endpoint for monitoring.

    Returns:
        JSON dict with a simple status field and a short description.
    """
    return jsonify({"status": "ok", "service": "usetai-website", "version": "0.1.0"})


if __name__ == "__main__":
    # Development server. In production use a WSGI server.
    app.run(host="127.0.0.1", port=5000, debug=True)
