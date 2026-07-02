from datetime import datetime
from pydantic import BaseModel, EmailStr, Field, ConfigDict

# Pydantic schemas define the data shapes that our API accepts (requests) and returns (responses).
# They act as validators, checking types, formats, and required fields before processing.

class UserBase(BaseModel):
    # EmailStr automatically validates that the input is a correctly formatted email address.
    email: EmailStr
    full_name: str = Field(..., min_length=2, max_length=100)
    
    # We restrict role options to either "candidate" or "recruiter".
    role: str = Field("candidate", pattern="^(candidate|recruiter)$")

class UserCreate(UserBase):
    # When creating a user, we require a password. 
    # We set a minimum length of 6 characters for basic safety.
    password: str = Field(..., min_length=6)

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class UserResponse(UserBase):
    id: int
    created_at: datetime
    updated_at: datetime

    # ConfigDict(from_attributes=True) is a Pydantic configuration.
    # It tells Pydantic that it should be able to read data directly from SQLAlchemy models 
    # (which are class objects rather than standard python dictionaries).
    model_config = ConfigDict(from_attributes=True)

class Token(BaseModel):
    access_token: str
    token_type: str
    role: str
    full_name: str
    email: str
