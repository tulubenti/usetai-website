from backend.app import app


def create_test_client():
    app.config.update(TESTING=True)
    return app.test_client()


def test_homepage_exposes_dynamic_search_controls() -> None:
    client = create_test_client()

    response = client.get("/")
    html = response.get_data(as_text=True)

    assert response.status_code == 200
    assert (
        '<meta name="robots" content="index,follow,max-image-preview:large" />' in html
    )
    assert 'id="services-search"' in html
    assert 'id="projects-search"' in html
    assert 'aria-describedby="name-feedback"' in html
    assert '<meta property="og:image" content="https://usetai.example/static/img/og-image.png" />' in html


def test_homepage_sets_security_headers() -> None:
    client = create_test_client()

    response = client.get("/")

    assert response.headers["X-Content-Type-Options"] == "nosniff"
    assert response.headers["X-Frame-Options"] == "DENY"
    assert response.headers["Referrer-Policy"] == "strict-origin-when-cross-origin"
    csp = response.headers["Content-Security-Policy"]
    assert "frame-ancestors 'none'" in csp
    assert "script-src 'self';" in csp


def test_services_api_includes_tags() -> None:
    client = create_test_client()

    response = client.get("/api/services")
    payload = response.get_json()

    assert response.status_code == 200
    assert payload["services"][0]["tags"]


def test_contact_rejects_invalid_email() -> None:
    client = create_test_client()

    response = client.post(
        "/api/contact",
        json={
            "name": "A User",
            "email": "invalid-email",
            "message": "Hello there team",
        },
    )

    assert response.status_code == 400
    assert response.get_json()["message"] == "Invalid email address"


def test_contact_rejects_non_object_payload() -> None:
    client = create_test_client()

    response = client.post("/api/contact", json=["not", "an", "object"])

    assert response.status_code == 400
    assert response.get_json()["message"] == "Invalid JSON payload"


def test_contact_rejects_message_over_limit() -> None:
    client = create_test_client()

    response = client.post(
        "/api/contact",
        json={
            "name": "A User",
            "email": "user@example.com",
            "message": "x" * 1001,
        },
    )

    assert response.status_code == 400
    assert response.get_json()["message"] == "Field length exceeded for: message"


def test_contact_accepts_valid_payload() -> None:
    client = create_test_client()

    response = client.post(
        "/api/contact",
        json={
            "name": "A User",
            "email": "user@example.com",
            "message": "Hello there team, I would like to learn more.",
            "interest": "Responsible AI",
        },
    )

    assert response.status_code == 200
    assert response.get_json()["status"] == "success"
    assert response.get_json()["received"]["email"] == "user@example.com"
    assert response.get_json()["received"]["name"] == "A User"


def test_contact_accepts_normalized_valid_payload() -> None:
    client = create_test_client()

    response = client.post(
        "/api/contact",
        json={
            "name": "  A User  ",
            "email": "  user@Example.COM  ",
            "message": "  Hello there team, I would like to learn more.  ",
            "interest": "  Responsible AI  ",
        },
    )

    assert response.status_code == 200
    assert response.get_json()["status"] == "success"
    assert response.get_json()["received"]["email"] == "user@example.com"
    assert response.get_json()["received"]["name"] == "A User"
