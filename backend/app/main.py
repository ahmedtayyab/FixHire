from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings
from app.core.database import engine, Base
from app.api.auth import router as auth_router

# Automatically create the database tables.
# Base.metadata.create_all looks at all classes that inherit from 'Base' 
# (like our User model) and creates the corresponding tables if they do not exist.
# In a large production project, database migrations (using Alembic) are preferred.
# For our MVP and initial development, this automatic schema creation is ideal and clean.
Base.metadata.create_all(bind=engine)

# Create the core FastAPI application instance.
app = FastAPI(
    title=settings.PROJECT_NAME,
    description="Backend API for FixHire, the AI-powered candidate & recruiter SaaS platform.",
    version="1.0.0"
)

# CORS (Cross-Origin Resource Sharing) middleware configuration.
# The frontend (React running on http://localhost:5173) is a different 'origin'
# than our backend (FastAPI running on http://localhost:8000). 
# Web browsers block cross-origin requests by default unless the server explicitly allows them.
origins = [
    "http://localhost:5173",  # React local development server
    "http://127.0.0.1:5173"
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,      # Allows authentication headers/cookies to be sent
    allow_methods=["*"],         # Allows GET, POST, PUT, DELETE, etc.
    allow_headers=["*"],         # Allows any headers (like Authorization, Content-Type)
)

# Mount our authentication router under the /api prefix.
app.include_router(auth_router, prefix="/api")

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
