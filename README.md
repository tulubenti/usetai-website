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

Project layout:
- backend/ : Flask application and Python code.
- frontend/ : HTML template plus static assets (CSS + JS).
- docs/ : Architecture and notes and placeholders (sitemap, responsible-ai).

Branch & deployment:
- Changes for the enterprise expansion are made on branch `enterprise-expansion`.

Notes:
- The diagonal particle animation is implemented in `frontend/static/js/animation.js`.
- A minimal POST /api/contact endpoint has been added to backend/app.py for local testing; replace with production code as needed.
- The Services and Case Studies tabs progressively enhance from server-rendered content to live client-side explorers backed by `/api/services` and `/api/projects`.

Validation:
- Run tests with `pytest`.
- Run backend quality checks with `black --check backend tests`, `isort --check-only backend tests`, `flake8 backend tests`, and `mypy backend`.
