# Simple in-repo data store for site content. This is intentionally simple
# so it can be edited directly or replaced by a CMS later.

SITE_INFO = {
    "title": "USETAI Technology | Responsible AI, Built for Impact",
    "description": (
        "We help government and enterprise teams turn complex data and operations "
        "into secure, dependable AI designed for real-world outcomes."
    ),
    "url": "https://usetai.example/",
    "logo": "/static/img/logo.svg",
    "social_image": "/static/img/og-image.png",
    "social_image_alt": "USETAI Technology — responsible AI, built for impact",
}

CONTACT = {
    "email": "hello@usetai.example",
    "response_time": "2 business days",
}

SERVICES = [
    {
        "id": "generative-ai",
        "title": "Generative AI & LLMs",
        "description": "Practical generative AI, from secure knowledge assistants to production-ready applications, designed around your workflows and governance needs.",
        "bullets": [
            "Use-case discovery and solution design",
            "Evaluation, safeguards, and deployment",
        ],
        "tags": ["Generative AI", "Copilots", "Responsible AI"],
    },
    {
        "id": "rag",
        "title": "Retrieval-Augmented Generation",
        "description": "Make trusted organizational knowledge easier to find with secure search and AI assistants grounded in approved source material.",
        "bullets": [],
        "tags": ["RAG", "Knowledge Search", "Enterprise Data"],
    },
    {
        "id": "ml-data",
        "title": "Machine Learning & Data Science",
        "description": "Turn complex data into useful signals with forecasting, anomaly detection, analytics, and production model monitoring.",
        "bullets": [],
        "tags": ["Forecasting", "Analytics", "MLOps"],
    },
    {
        "id": "cloud",
        "title": "Cloud & Platform Engineering",
        "description": "Build secure, resilient foundations for data and AI with cloud-native architecture, platform engineering, and MLOps.",
        "bullets": [],
        "tags": ["Cloud", "Platform", "Security"],
    },
]

INDUSTRIES = [
    {
        "id": "government",
        "title": "Government",
        "description": "Citizen services, fraud detection, emergency response, smart cities, digital transformation.",
    },
    {
        "id": "healthcare",
        "title": "Healthcare",
        "description": "Clinical decision support, medical imaging, predictive diagnostics and hospital optimization.",
    },
    {
        "id": "finance",
        "title": "Finance",
        "description": "Fraud analytics, AML, risk modelling, portfolio analytics and customer intelligence.",
    },
]

PROJECTS = [
    {
        "id": "case-study-1",
        "title": "Climate Forecasting",
        "summary": "Time-series machine learning applied to climate datasets to support more reliable forecasting and planning.",
        "outcome": "Designed to help teams make better-informed climate planning decisions.",
        "tags": ["Climate", "Machine Learning", "Forecasting"],
    },
    {
        "id": "case-study-2",
        "title": "Knowledge Access for Public Services",
        "summary": "A secure, retrieval-based assistant for public-service documents, designed to improve information access and reduce manual review.",
        "outcome": "Human-reviewed answers grounded in approved source material.",
        "tags": ["Government", "RAG", "Document AI"],
    },
]
