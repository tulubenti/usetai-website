# USETAI Technology — Website

This repository is a small website for USETAI Technology (startup).
It uses a minimal Python Flask backend to serve a single-page frontend that
features an animated diagonal particle background and an enterprise-ready homepage.

Quick start (development):
1. Create a virtual environment: `python -m venv .venv`
2. Activate it:
   - macOS / Linux: `source .venv/bin/activate`
   - Windows (PowerShell): `.venv\\Scripts\\Activate.ps1`
3. Install dependencies: `pip install -r requirements.txt`
4. Run the backend (Flask): `python backend/app.py`
5. Open http://127.0.0.1:5000 in your browser.

Build and validation:
- There is no separate frontend build step: Flask serves the template and static CSS/JavaScript directly.
- Run the app with `python backend/app.py`; production deployments should use a WSGI server instead of Flask's development server.
- Run the test suite with `pytest`.
- Optional backend checks: `black --check backend tests`, `isort --check-only backend tests`, `flake8 backend tests`, and `mypy backend`.

Project layout:
- backend/ : Flask application and Python code.
- frontend/ : HTML template plus static assets (CSS + JS).
- docs/ : Architecture and notes and placeholders (sitemap, responsible-ai).

Branch & deployment:
- The default branch is `main`; deploy the Flask app with a production WSGI server.

Notes:
- The diagonal particle animation is implemented in `frontend/static/js/animation.js`.
- A minimal POST /api/contact endpoint has been added to backend/app.py for local testing; replace with production code as needed.
- The Services and Case Studies tabs progressively enhance from server-rendered content to live client-side explorers backed by `/api/services` and `/api/projects`.

Validation:
- The dark/light theme, tab navigation, content explorers, and contact form work without a JavaScript bundler or additional frontend dependencies.
