from sqlalchemy import Column, Integer, String, DateTime
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from app.core.database import Base

# This class defines the database table schema for users.
# Every instance of the User class will represent a row in the "users" table.
class User(Base):
    __tablename__ = "users"
    
    id = Column(Integer, primary_key=True, index=True)
    
    # We enforce uniqueness on emails so that two accounts cannot share the same email.
    email = Column(String, unique=True, index=True, nullable=False)
    
    # Stores the bcrypt hashed password. We never store plain text passwords!
    hashed_password = Column(String, nullable=False)
    
    full_name = Column(String, nullable=False)
    
    # Role differentiates the type of portal access.
    # It will contain either "candidate" or "recruiter".
    role = Column(String, nullable=False, default="candidate")
    
    # func.now() will tell the SQL database to insert the current timestamp on creation.
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    # onupdate=func.now() automatically updates this field whenever the user row is modified.
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    # Establish relationship to analyses. When a user is deleted, delete all their analyses.
    analyses = relationship("Analysis", back_populates="user", cascade="all, delete-orphan")
