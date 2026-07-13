from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from starlette.middleware.sessions import SessionMiddleware
from app.core.config import settings
from app.core.database import engine, Base
from app.api.auth import router as auth_router
from app.api.analysis import router as analysis_router

# Import database models to ensure they are registered with the declarative Base
# before calling create_all. This guarantees SQLite tables are generated on start.
from app.models.user import User
from app.models.analysis import Analysis
from app.models.job import Job
from app.models.screening import CandidateScreening
from app.utils.resume_storage import (
    get_screening_pdf_bytes,
    save_screening_pdf,
)

# Automatically create the database tables.
# Base.metadata.create_all looks at all classes that inherit from 'Base' 
# and creates the corresponding tables if they do not exist.
Base.metadata.create_all(bind=engine)

def apply_migrations() -> None:
    """Run simple schema migrations for existing tables."""
    from sqlalchemy import inspect, text
    inspector = inspect(engine)
    if not inspector.has_table('jobs'):
        return
    columns = [col['name'] for col in inspector.get_columns('jobs')]
    if 'company_name' not in columns:
        with engine.begin() as conn:
            conn.execute(text("ALTER TABLE jobs ADD COLUMN company_name VARCHAR"))

apply_migrations()


def backfill_missing_screening_pdfs() -> None:
    """Restore PDF bytes for screenings created before resume storage was enabled."""
    from app.core.database import SessionLocal

    db = SessionLocal()
    try:
        screenings = (
            db.query(CandidateScreening)
            .filter(CandidateScreening.resume_pdf.is_(None))
            .all()
        )
        updated = False
        for screening in screenings:
            pdf_bytes = get_screening_pdf_bytes(
                screening.id,
                screening.resume_filename,
                screening.resume_pdf,
            )
            if not pdf_bytes:
                continue
            screening.resume_pdf = pdf_bytes
            save_screening_pdf(screening.id, pdf_bytes)
            updated = True
        if updated:
            db.commit()
    finally:
        db.close()


backfill_missing_screening_pdfs()

# Create the core FastAPI application instance.
app = FastAPI(
    title=settings.PROJECT_NAME,
    description="Backend API for FixHire, the AI-powered candidate & recruiter SaaS platform.",
    version="1.0.0"
)

# CORS (Cross-Origin Resource Sharing) middleware configuration.
origins = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "http://localhost:5174",
    "http://127.0.0.1:5174",
    "http://localhost:5175",
    "http://127.0.0.1:5175",
]
frontend_origin = settings.FRONTEND_URL.rstrip("/")
if frontend_origin and frontend_origin not in origins:
    origins.append(frontend_origin)
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,      # Allows authentication headers/cookies to be sent
    allow_methods=["*"],         # Allows GET, POST, PUT, DELETE, etc.
    allow_headers=["*"],         # Allows any headers (like Authorization, Content-Type)
)
# SessionMiddleware is REQUIRED by authlib's starlette OAuth client to store
# the OAuth state/nonce between the initial redirect and the callback.
# Without it, every Google OAuth flow will fail with a state mismatch error.
app.add_middleware(SessionMiddleware, secret_key=settings.JWT_SECRET_KEY)

# Mount our authentication, analysis, and jobs routers under the /api prefix.
from app.api.job import router as job_router

app.include_router(auth_router, prefix="/api")
app.include_router(analysis_router, prefix="/api")
app.include_router(job_router, prefix="/api")


@app.get("/")
def read_root():
    """
    Root endpoint to verify the backend server is running correctly.
    """
    return {
        "status": "online",
        "project": settings.PROJECT_NAME,
        "message": "Welcome to the FixHire API! Navigate to /docs to view Swagger documentation."
    }
