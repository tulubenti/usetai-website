# Simple in-repo data store for site content. This is intentionally simple
# so it can be edited directly or replaced by a CMS later.

SITE_INFO = {
    "title": "Engineering the Future with Artificial Intelligence — USETAI Technology",
    "description": "USETAI develops ethical, scalable AI, ML, Generative AI, and Cloud solutions to solve climate, healthcare, cybersecurity, and public-sector challenges.",
    "url": "https://usetai.example/",
    "logo": "/static/img/og-image.png",
}

CONTACT = {
    "email": "hello@usetai.example",
    "response_time": "2 business days",
}

SERVICES = [
    {
        "id": "generative-ai",
        "title": "Generative AI & LLMs",
        "description": "Enterprise copilots, document intelligence, prompt-engineering, multi-agent systems and safe LLM deployment.",
        "bullets": ["Business value: Faster knowledge work, improved productivity.", "Tech: LangChain, OpenAI, Llama, Anthropic"],
    },
    {
        "id": "rag",
        "title": "Retrieval-Augmented Generation",
        "description": "Secure semantic search, embeddings, vector DBs and enterprise knowledge assistants.",
        "bullets": [],
    },
    {
        "id": "ml-data",
        "title": "Machine Learning & Data Science",
        "description": "Forecasting, anomaly detection, experimentation, dashboards and model monitoring.",
        "bullets": [],
    },
    {
        "id": "cloud",
        "title": "Cloud & Platform Engineering",
        "description": "Scalable cloud-native platforms on AWS, Azure, GCP; containers and orchestration.",
        "bullets": [],
    },
]

INDUSTRIES = [
    {"id": "government", "title": "Government", "description": "Citizen services, fraud detection, emergency response, smart cities, digital transformation."},
    {"id": "healthcare", "title": "Healthcare", "description": "Clinical decision support, medical imaging, predictive diagnostics and hospital optimization."},
    {"id": "finance", "title": "Finance", "description": "Fraud analytics, AML, risk modelling, portfolio analytics and customer intelligence."},
]

PROJECTS = [
    {
        "id": "case-study-1",
        "title": "AI for Climate Monitoring",
        "summary": "Applied time-series ML to large-scale climate data to improve forecasting accuracy.",
    },
    {
        "id": "case-study-2",
        "title": "Document Intelligence for Government",
        "summary": "RAG-based knowledge assistant for citizen-facing services, increasing throughput and accuracy.",
    },
]
