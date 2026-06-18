# USETAI International Technology — Website

This repository is a small website for USETAI International Technology (startup).
It uses a minimal Python Flask backend to serve a single-page frontend that
features a streaming binary (zeros and ones) background animation.

Quick start (development):
1. Create a virtual environment: `python -m venv .venv`
2. Activate it:
   - macOS / Linux: `source .venv/bin/activate`
   - Windows (PowerShell): `.venv\\Scripts\\Activate.ps1`
3. Install dependencies: `pip install -r backend/requirements.txt`
4. Run the app: `python backend/app.py`
5. Open http://127.0.0.1:5000 in your browser.

Project layout:
- backend/ : Flask application and Python code.
- frontend/ : HTML template plus static assets (CSS + JS).
- docs/ : Architecture and notes.

Branch & deployment:
- I can create branch `dulbetech01` and push these files to the repository `tulubenti/usetai-website` once you confirm the repository owner.

Notes:
- The binary background animation is implemented in `frontend/static/js/animation.js`.
- The page content contains sample copy for your startup; replace or extend as needed.
