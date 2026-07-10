from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base, sessionmaker
from app.core.config import settings

def _normalize_database_url(url: str) -> str:
    # Some hosts (Neon, Heroku) provide postgres://; SQLAlchemy expects postgresql://.
    if url.startswith("postgres://"):
        return url.replace("postgres://", "postgresql://", 1)
    return url

DATABASE_URL = _normalize_database_url(settings.DATABASE_URL)

# Determine if we are using SQLite. 
# SQLite requires 'check_same_thread: False' to allow multi-threaded requests in FastAPI.
IS_SQLITE = DATABASE_URL.startswith("sqlite")

connect_args = {"check_same_thread": False} if IS_SQLITE else {}

# Engine represents the core interface to the database. It manages the connection pool.
engine = create_engine(
    DATABASE_URL, 
    connect_args=connect_args
)

# SessionLocal is a factory for database sessions.
# We turn off autoflush and autocommit to control transaction boundaries manually.
SessionLocal = sessionmaker(
    autocommit=False, 
    autoflush=False, 
    bind=engine
)

# Base class is what all our database models (e.g. User, Job) will inherit from.
# It acts as the registry for our SQLAlchemy database schema.
Base = declarative_base()

# FastAPI Dependency: get_db yields a database session for each incoming request,
# and automatically closes it when the request is finished. 
# This prevents database connection leaks.
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
