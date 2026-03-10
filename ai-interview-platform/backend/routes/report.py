from fastapi import APIRouter
from pydantic import BaseModel
from ai_modules.report_generator import generate_report

router = APIRouter()

class ReportRequest(BaseModel):
    name: str
    resume_score: float
    interview_score: float
    integrity_score: float
    skills: list[str]
    missing_skills: list[str]
    recommendation: str

@router.post("/generate-report")
def report(data: ReportRequest):
    filename = generate_report(data.dict())
    return {"file": filename}
