from fastapi import APIRouter, HTTPException
from fastapi.responses import FileResponse
from pydantic import BaseModel
from typing import List, Optional
from ai_modules.report_generator import generate_report
from analytics.scoring import calculate_final_score
from analytics.explain import generate_explanation
from analytics.integrity import cheating_risk
import os

router = APIRouter(prefix="/reports", tags=["reports"])

class ReportRequest(BaseModel):
    name: str
    email: Optional[str] = "N/A"
    phone: Optional[str] = "N/A"
    job_title: Optional[str] = "N/A"
    # We take raw data and calculate the rest on backend
    resume_score: float
    interview_score: float # Average out of 10
    integrity_score: float # Out of 100
    matched_skills: List[str]
    missing_skills: List[str]

@router.post("/generate")
def create_report(data: ReportRequest):
    try:
        # 1. Calculate Backend Logic
        # Convert integrity (100) to cheating flags (count) for calculate_final_score logic
        # If integrity is 100, flags = 0. If 0, flags = 20.
        cheating_flags = (100 - data.integrity_score) / 5
        
        # Scoring logic from backend
        scoring_result = calculate_final_score(
            data.resume_score,
            data.interview_score,
            cheating_flags
        )
        
        # Risk logic
        c_risk = "High" if data.integrity_score < 40 else ("Medium" if data.integrity_score < 70 else "Low")
        
        # Explanation/Suggestions from backend
        reasons = generate_explanation(
            data.resume_score,
            data.interview_score,
            data.missing_skills,
            c_risk
        )
        
        # 2. Prepare full data for PDF
        report_data = data.dict()
        report_data.update({
            "overall_score": scoring_result["final_score"],
            "recommendation": scoring_result["recommendation"],
            "suggestions": reasons
        })
        
        # 3. Generate PDF
        filename = generate_report(report_data)
        
        # 4. Return results (text + download)
        return {
            "overall_score": scoring_result["final_score"],
            "recommendation": scoring_result["recommendation"],
            "suggestions": reasons,
            "file": filename,
            "download_url": f"http://127.0.0.1:8000/reports/download/{filename}"
        }
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
