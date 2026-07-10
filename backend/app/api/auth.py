import json
from fastapi import APIRouter, Depends, HTTPException, status, Request
from fastapi.security import OAuth2PasswordBearer
from starlette.responses import RedirectResponse
from sqlalchemy.orm import Session
from authlib.integrations.starlette_client import OAuth
from app.core.database import get_db
from app.core.security import get_password_hash, verify_password, create_access_token, decode_access_token
from app.core.config import settings
from app.models.user import User
from app.schemas.user import UserCreate, UserLogin, UserResponse, Token

router = APIRouter(prefix="/auth", tags=["Authentication"])

# OAuth2PasswordBearer is a security dependency. It looks for an Authorization header
# containing a Bearer token. If the header is missing, it will automatically throw an HTTP 401 error.
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="api/auth/login")

oauth = OAuth()
if settings.GOOGLE_CLIENT_ID and settings.GOOGLE_CLIENT_SECRET:
    oauth.register(
        name="google",
        client_id=settings.GOOGLE_CLIENT_ID,
        client_secret=settings.GOOGLE_CLIENT_SECRET,
        server_metadata_url="https://accounts.google.com/.well-known/openid-configuration",
        client_kwargs={"scope": "openid email profile"},
    )


def get_google_oauth_client():
    if not settings.GOOGLE_CLIENT_ID or not settings.GOOGLE_CLIENT_SECRET:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Google OAuth is not configured. Please set GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET.",
        )
    return oauth.google

def get_current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)) -> User:
    """
    Dependency to fetch the currently authenticated user from the database.
    This dependency can be injected into any route that requires a logged-in user.
    """
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    
    # Decode the JWT token to extract the email claim.
    payload = decode_access_token(token)
    if payload is None:
        raise credentials_exception
        
    email: str | None = payload.get("sub")
    if email is None:
        raise credentials_exception
        
    # Query the user database using the email extracted from the token.
    user = db.query(User).filter(User.email == email).first()
    if user is None:
        raise credentials_exception
        
    return user


@router.post("/register", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
def register(user_in: UserCreate, db: Session = Depends(get_db)):
    """
    Registers a new user in the system.
    """
    # 1. Check if the user email already exists.
    existing_user = db.query(User).filter(User.email == user_in.email).first()
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="A user with this email address already exists.",
        )
        
    # 2. Hash the user's password for security.
    hashed_pwd = get_password_hash(user_in.password)
    
    # 3. Create a new SQLAlchemy User object.
    new_user = User(
        email=user_in.email,
        hashed_password=hashed_pwd,
        full_name=user_in.full_name,
        role=user_in.role
    )
    
    # 4. Save the user in the database.
    db.add(new_user)
    db.commit()
    db.refresh(new_user)  # Refresh loads the database-generated ID and timestamps
    
    return new_user


@router.post("/login", response_model=Token)
def login(credentials: UserLogin, db: Session = Depends(get_db)):
    """
    Authenticates a user and returns a JSON Web Token (JWT) on success.
    """
    # 1. Look up the user by email.
    user = db.query(User).filter(User.email == credentials.email).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password.",
        )
        
    # 2. Verify that the password matches the stored hash.
    if not user.hashed_password or not verify_password(credentials.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password.",
        )
        
    # 3. Create the JWT payload and access token.
    # The 'sub' (subject) claim is standard in JWTs to hold the primary identifier.
    access_token = create_access_token(data={"sub": user.email, "role": user.role})
    
    # 4. Return the token and basic user details.
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "role": user.role,
        "full_name": user.full_name,
        "email": user.email
    }


@router.get("/google/login")
async def google_login(request: Request, role: str = "candidate"):
    """
    Redirects the user to Google's OAuth consent screen.
    """
    if role not in ["candidate", "recruiter"]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid role specified for Google login.",
        )

    google = get_google_oauth_client()
    redirect_uri = settings.GOOGLE_OAUTH_REDIRECT_URI
    return await google.authorize_redirect(request, redirect_uri, state=json.dumps({"role": role}))


@router.get("/google/callback")
async def google_callback(request: Request, db: Session = Depends(get_db)):
    """
    Handles the Google OAuth callback and issues a JWT token.
    """
    google = get_google_oauth_client()
    token = await google.authorize_access_token(request)
    # authlib >= 1.x: userinfo is populated automatically via parse_id_token during
    # authorize_access_token when the openid scope is present. Fall back to
    # userinfo endpoint for robustness.
    user_info = token.get("userinfo")
    if not user_info:
        user_info = await google.userinfo(token=token)

    email = user_info.get("email")
    if not email:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Google account did not return an email address.",
        )

    full_name = user_info.get("name") or email.split("@")[0]
    role = "candidate"
    state_value = request.query_params.get("state")
    if state_value:
        try:
            state_payload = json.loads(state_value)
            role = state_payload.get("role", "candidate")
        except json.JSONDecodeError:
            pass

    user = db.query(User).filter(User.email == email).first()
    if not user:
        user = User(
            email=email,
            hashed_password="",
            full_name=full_name,
            role=role,
        )
        db.add(user)
        db.commit()
        db.refresh(user)
    else:
        role = user.role

    access_token = create_access_token(data={"sub": user.email, "role": user.role})
    redirect_url = f"{settings.FRONTEND_URL.rstrip('/')}/login?google_token={access_token}&role={role}"
    return RedirectResponse(redirect_url)


@router.get("/me", response_model=UserResponse)
def read_current_user(current_user: User = Depends(get_current_user)):
    """
    Returns details of the currently logged-in user.
    Useful for checking session status on frontend page loads.
    """
    return current_user
