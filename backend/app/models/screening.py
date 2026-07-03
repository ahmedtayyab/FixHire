from sqlalchemy import Column, Integer, String, Text, ForeignKey, DateTime, JSON, LargeBinary
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from app.core.database import Base

class CandidateScreening(Base):
    __tablename__ = "candidate_screenings"
    
    id = Column(Integer, primary_key=True, index=True)
    job_id = Column(Integer, ForeignKey("jobs.id", ondelete="CASCADE"), nullable=False)
    
    candidate_name = Column(String, nullable=False)
    resume_filename = Column(String, nullable=False)
    resume_text = Column(Text, nullable=False)
    resume_pdf = Column(LargeBinary, nullable=True)
    compatibility_score = Column(Integer, nullable=False)
    
    # Store the structured Gemini feedback in JSON format
    analysis_results = Column(JSON, nullable=False)
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    # Relationships
    job = relationship("Job", back_populates="screenings")
