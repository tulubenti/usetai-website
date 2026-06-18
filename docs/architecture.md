# Architecture Overview — USETAI Website (sample)

This document describes the small sample architecture used for the USETAI marketing site.

Components
- backend/app.py
  - Minimal Flask application that serves:
    - `GET /` : renders the site from `frontend/templates/index.html`.
    - `GET /health` : monitoring-friendly JSON response.
  - Development-only server. Replace with WSGI (gunicorn) for production.

- frontend/templates/index.html
  - Single page that contains a `canvas#binary-canvas` for the animated background.
  - Overlay content (hero, mission, features, contact) is standard HTML.

- frontend/static/js/animation.js
  - Client-side canvas animation that paints streaming binary digits (0 and 1).
  - Uses requestAnimationFrame and adapts to DPR (devicePixelRatio) for crispness.

- frontend/static/css/styles.css
  - Styles to make the canvas background and overlay content readable and accessible.

Deployment notes
- Containerization: Create a Dockerfile that runs a WSGI server and copies frontend files.
- Static hosting option: Because the site is mostly static, you can compile the assets
  and host them on any static host (Netlify, GitHub Pages, S3 + CloudFront). If you do
  that, you can remove the Flask backend and serve only static assets.

Accessibility considerations
- The canvas is marked `aria-hidden="true"` to avoid noise for screen readers.
- Ensure any important content is available as real HTML (not embedded in canvas).

Extending the site
- Add a CMS or headless CMS integration for content editing.
- Add an API route for subscribing to newsletters or accepting contact forms (POST /contact).
- Add telemetry (Sentry, Prometheus) to production deployment.
