from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base, sessionmaker
from app.core.config import settings

# Determine if we are using SQLite. 
# SQLite requires 'check_same_thread: False' to allow multi-threaded requests in FastAPI.
IS_SQLITE = settings.DATABASE_URL.startswith("sqlite")

connect_args = {"check_same_thread": False} if IS_SQLITE else {}

# Engine represents the core interface to the database. It manages the connection pool.
engine = create_engine(
    settings.DATABASE_URL, 
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
