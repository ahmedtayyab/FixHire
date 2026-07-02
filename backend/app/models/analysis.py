from sqlalchemy import Column, Integer, String, Text, ForeignKey, DateTime, JSON
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from app.core.database import Base

class Analysis(Base):
    __tablename__ = "analyses"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    
    job_title = Column(String, nullable=False)
    job_description = Column(Text, nullable=False)
    resume_filename = Column(String, nullable=False)
    
    compatibility_score = Column(Integer, nullable=False)
    
    # Store the structured feedback (missing skills, suggestions, cover letter, rewritten bullets, etc.) in JSON format.
    analysis_results = Column(JSON, nullable=False)
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    # Establish relationship back to User
    user = relationship("User", back_populates="analyses")
