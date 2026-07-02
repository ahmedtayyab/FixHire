from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.security import get_password_hash, verify_password, create_access_token, decode_access_token
from app.models.user import User
from app.schemas.user import UserCreate, UserLogin, UserResponse, Token

router = APIRouter(prefix="/auth", tags=["Authentication"])

# OAuth2PasswordBearer is a security dependency. It looks for an Authorization header
# containing a Bearer token. If the header is missing, it will automatically throw an HTTP 401 error.
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="api/auth/login")

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
    if not verify_password(credentials.password, user.hashed_password):
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


@router.get("/me", response_model=UserResponse)
def read_current_user(current_user: User = Depends(get_current_user)):
    """
    Returns details of the currently logged-in user.
    Useful for checking session status on frontend page loads.
    """
    return current_user
