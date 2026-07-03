from datetime import datetime
from pydantic import BaseModel, ConfigDict
from typing import Any, Dict

class ScreeningResponse(BaseModel):
    id: int
    job_id: int
    candidate_name: str
    resume_filename: str
    resume_text: str
    compatibility_score: int
    analysis_results: Dict[str, Any]
    created_at: datetime
    
    model_config = ConfigDict(from_attributes=True)
