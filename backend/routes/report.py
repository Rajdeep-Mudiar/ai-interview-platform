from fastapi import APIRouter, HTTPException
from fastapi.responses import FileResponse
from pydantic import BaseModel
from typing import List, Optional
from ai_modules.report_generator import generate_report
import os

router = APIRouter(prefix="/reports", tags=["reports"])

class ReportRequest(BaseModel):
    name: str
    email: Optional[str] = "N/A"
    phone: Optional[str] = "N/A"
    job_title: Optional[str] = "N/A"
    overall_score: float
    resume_score: float
    interview_score: float
    integrity_score: float
    matched_skills: List[str]
    missing_skills: List[str]
    recommendation: str
    suggestions: Optional[List[str]] = []

@router.post("/generate")
def create_report(data: ReportRequest):
    try:
        filename = generate_report(data.dict())
        return {"file": filename, "download_url": f"http://127.0.0.1:8000/reports/download/{filename}"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to generate report: {str(e)}")

@router.get("/download/{filename}")
def download_report(filename: str):
    file_path = f"reports/{filename}"
    if not os.path.exists(file_path):
        raise HTTPException(status_code=404, detail="Report not found")
    
    return FileResponse(
        path=file_path,
        filename=filename,
        media_type='application/pdf'
    )
