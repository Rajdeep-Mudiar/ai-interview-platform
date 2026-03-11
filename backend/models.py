from pydantic import BaseModel, EmailStr, Field, GetJsonSchemaHandler, BeforeValidator
from typing import List, Optional, Dict, Any, Annotated
from datetime import datetime
from bson import ObjectId

# Simple V2 validator for ObjectId
def validate_object_id(v: Any) -> ObjectId:
    if isinstance(v, ObjectId):
        return v
    if not ObjectId.is_valid(v):
        raise ValueError("Invalid ObjectId")
    return ObjectId(v)

PyObjectId = Annotated[str, BeforeValidator(validate_object_id)]

# --- User Models ---
class UserBase(BaseModel):
    email: EmailStr
    role: str  # "candidate" or "recruiter"

class SignUpBody(UserBase):
    name: str
    password: str
    company: Optional[str] = None

class SignInBody(UserBase):
    password: str
    role: str

# --- Job Models ---
class JobQuestion(BaseModel):
    question: str
    answer: Optional[str] = ""

class JobCreate(BaseModel):
    recruiter_id: str
    title: str
    description: str
    questions: List[JobQuestion]

class JobUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    questions: Optional[List[JobQuestion]] = None

# --- Interview & Result Models ---
class InterviewResult(BaseModel):
    user_id: str
    job_id: Optional[str] = None
    name: str
    email: Optional[str] = "N/A"
    phone: Optional[str] = "N/A"
    job_title: str
    resume_score: float
    interview_score: float
    integrity_score: float
    overall_score: float
    matched_skills: List[str]
    missing_skills: List[str]
    recommendation: str
    suggestions: List[str]
    created_at: datetime = Field(default_factory=datetime.utcnow)

# --- Report Models ---
class ReportRequest(BaseModel):
    name: str
    email: Optional[str] = "N/A"
    phone: Optional[str] = "N/A"
    job_title: Optional[str] = "N/A"
    resume_score: float
    interview_score: float
    integrity_score: float
    matched_skills: List[str]
    missing_skills: List[str]
    job_id: Optional[str] = None
