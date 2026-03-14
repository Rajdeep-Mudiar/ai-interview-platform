import pymongo
from pydantic import BaseModel
from datetime import datetime
from typing import Optional, List

client = pymongo.MongoClient("mongodb://localhost:27017/")
db = client["ai_interview_platform"]

class Interview(BaseModel):
    user_id: str
    name: str
    resume: str
    jd: str
    job_id: Optional[str] = None
    session_id: Optional[str] = None
    fit_score: int
    overallScore: int
    timeTaken: int
    integrity: int
    status: str = "completed" # completed | terminated
    suspicious_activities: List[dict] = []
    missing_skills: list
    questions: list
    suggestions: list

class Session(BaseModel):
    session_id: str
    job_id: Optional[str] = None
    candidate_email: str
    desktop_connected: bool = False
    mobile_connected: bool = False
    start_time: datetime = datetime.now()
    end_time: Optional[datetime] = None
    status: str = "active" # active | completed
    desktop_metadata: Optional[dict] = {}
    mobile_metadata: Optional[dict] = {}
    integrity_score: float = 100.0

class ActivityLog(BaseModel):
    session_id: str
    device: str # mobile | desktop
    event: str # multiple_person_detected | phone_detected | tab_switch | looking_away | device_connected
    confidence_score: float
    timestamp: datetime = datetime.now()
    metadata: Optional[dict] = {}
