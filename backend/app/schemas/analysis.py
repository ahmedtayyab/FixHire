from datetime import datetime
from pydantic import BaseModel, ConfigDict
from typing import Any, Dict

class AnalysisResponse(BaseModel):
    id: int
    user_id: int
    job_title: str
    job_description: str
    resume_filename: str
    compatibility_score: int
    # Contains missing_skills, improvement_suggestions, star_bullet_points, cover_letter, recruiter_summary, interview_questions
    analysis_results: Dict[str, Any]
    created_at: datetime
    
    model_config = ConfigDict(from_attributes=True)
