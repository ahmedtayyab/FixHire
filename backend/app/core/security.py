from datetime import datetime, timedelta, timezone
from jose import JWTError, jwt
import bcrypt
from app.core.config import settings

# Direct bcrypt library usage is used here instead of passlib to avoid
# compatibility conflicts with modern Python versions and modern bcrypt.
# Hashing is a one-way cryptographic function to protect passwords.

def verify_password(plain_password: str, hashed_password: str) -> bool:
    """
    Compares a plain-text password with its hashed version from the database.
    """
    try:
        # bcrypt.checkpw expects bytes for both arguments.
        # It reads the salt embedded in the hashed password and hashes the plain password with it.
        return bcrypt.checkpw(plain_password.encode("utf-8"), hashed_password.encode("utf-8"))
    except Exception:
        return False

def get_password_hash(password: str) -> str:
    """
    Generates a secure cryptographically hashed version of a plain-text password.
    """
    # gensalt() generates a secure random salt.
    salt = bcrypt.gensalt()
    # hashpw hashes the password bytes using the salt bytes.
    hashed = bcrypt.hashpw(password.encode("utf-8"), salt)
    # Decode the resulting bytes back into a UTF-8 string for storage in SQLite/PostgreSQL.
    return hashed.decode("utf-8")


def create_access_token(data: dict, expires_delta: timedelta | None = None) -> str:
    """
    Generates a JSON Web Token (JWT) that candidates and recruiters will use
    as a proof of authentication for subsequent API calls.
    """
    to_encode = data.copy()
    
    # Set expiration time for the token. Default to the setting value.
    if expires_delta:
        expire = datetime.now(timezone.utc) + expires_delta
    else:
        expire = datetime.now(timezone.utc) + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    
    # Store expiration claim ("exp") as an integer Unix timestamp.
    to_encode.update({"exp": expire})
    
    # Sign the token using our secret key and algorithm.
    # This prevents users from altering their user ID or details in the token.
    encoded_jwt = jwt.encode(to_encode, settings.JWT_SECRET_KEY, algorithm=settings.JWT_ALGORITHM)
    return encoded_jwt

def decode_access_token(token: str) -> dict | None:
    """
    Decodes and verifies a JWT token. Returns the token payload if valid, or None if invalid.
    """
    try:
        payload = jwt.decode(token, settings.JWT_SECRET_KEY, algorithms=[settings.JWT_ALGORITHM])
        return payload
    except JWTError:
        # If the token signature is invalid, or if the token is expired, JWTError is raised.
        return None
