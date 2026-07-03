from datetime import datetime
from pydantic import BaseModel, ConfigDict
from typing import Optional, List
from app.schemas.screening import ScreeningResponse

class JobBase(BaseModel):
    title: str
    description: str
    requirements: Optional[str] = None
    location: Optional[str] = None

class JobCreate(JobBase):
    pass

class JobResponse(JobBase):
    id: int
    user_id: int
    created_at: datetime
    updated_at: datetime
    
    model_config = ConfigDict(from_attributes=True)

class JobDetailResponse(JobResponse):
    screenings: List[ScreeningResponse] = []
