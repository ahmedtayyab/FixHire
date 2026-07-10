import os
from pydantic_settings import BaseSettings, SettingsConfigDict

# BaseSettings automatically loads variables from environment variables or a .env file.
# This helps keep our application secrets (like API keys and passwords) out of our source code.
class Settings(BaseSettings):
    PROJECT_NAME: str = "FixHire"
    
    # SQLite is the default database for local development. 
    # It stores data in a local file (fixhire.db) which is easy to set up.
    # In production, this will be overridden by the DATABASE_URL environment variable (e.g. PostgreSQL).
    DATABASE_URL: str = "sqlite:///./fixhire.db"
    
    # Security keys for signing JSON Web Tokens (JWT).
    # IMPORTANT: In production, JWT_SECRET_KEY must be a cryptographically secure random string
    # and should be loaded via environment variables, not hardcoded.
    JWT_SECRET_KEY: str = "dev_super_secret_key_change_me_in_production_12345"
    JWT_ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24  # 1 day expiration
    
    # Gemini API Key for processing candidate resumes and recruiter insights.
    GEMINI_API_KEY: str | None = None
    
    # Gemini Model Name (defaulting to the stable gemini-2.5-flash, as gemini-1.5-flash is deprecated/decommissioned)
    GEMINI_MODEL_NAME: str = "gemini-2.5-flash"

    # Google OAuth settings for social sign-in (set via environment variables).
    GOOGLE_CLIENT_ID: str | None = None
    GOOGLE_CLIENT_SECRET: str | None = None
    GOOGLE_OAUTH_REDIRECT_URI: str | None = "http://127.0.0.1:8000/api/auth/google/callback"
    FRONTEND_URL: str = "http://localhost:5173"

    # SettingsConfigDict tells Pydantic to read environment variables from a .env file.
    # We search both the current directory and the parent directory to accommodate different process roots.
    model_config = SettingsConfigDict(
        env_file=[".env", "../.env"],
        env_file_encoding="utf-8",
        extra="ignore"
    )

# Instantiate settings so we can import it across the project.
settings = Settings()
