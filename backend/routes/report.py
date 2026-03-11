from fastapi import APIRouter, HTTPException
from fastapi.responses import FileResponse
from pydantic import BaseModel
from typing import List, Optional
from ai_modules.report_generator import generate_report
from analytics.scoring import calculate_final_score
from analytics.explain import generate_explanation
from analytics.integrity import cheating_risk
from database.mongo import get_results_col
from datetime import datetime
from models import ReportRequest, InterviewResult
import os

router = APIRouter(prefix="/reports", tags=["reports"])

@router.post("/generate")
def create_report(data: ReportRequest):
    results_col = get_results_col()
    try:
        # 1. Calculate Backend Logic
        # Scoring logic from backend (weighted average of technical + integrity penalties)
        scoring_result = calculate_final_score(
            data.resume_score,
            data.interview_score,
            data.integrity_score,
            data.proctoring_score if hasattr(data, 'proctoring_score') else 100.0
        )
        
        # Risk logic using proctoring score
        c_risk = cheating_risk(data.proctoring_score if hasattr(data, 'proctoring_score') else 100.0)
        
        # Explanation/Suggestions from backend
        reasons = generate_explanation(
            data.resume_score,
            data.interview_score,
            data.missing_skills,
            c_risk
        )
        
        # 2. Prepare full data for PDF
        report_data = data.model_dump()
        report_data.update({
            "overall_score": scoring_result["final_score"],
            "recommendation": scoring_result["recommendation"],
            "suggestions": reasons,
            "proctoring_score": data.proctoring_score if hasattr(data, 'proctoring_score') else 100.0,
            "proctoring_alerts": data.proctoring_alerts if hasattr(data, 'proctoring_alerts') else []
        })
        
        # 3. Save to MongoDB Results collection
        try:
            # Generate PDF first to get filename
            filename = generate_report(report_data)
            
            # Use user_id from data if available, otherwise handle placeholder
            user_id = data.user_id if hasattr(data, 'user_id') and data.user_id else "unknown"
            
            result_doc_dict = {
                "user_id": str(user_id), # Ensure it's a string
                "job_id": str(data.job_id) if data.job_id else None,
                "name": data.name,
                "email": data.email,
                "phone": data.phone,
                "job_title": data.job_title,
                "resume_score": data.resume_score,
                "interview_score": data.interview_score,
                "integrity_score": data.integrity_score,
                "proctoring_score": data.proctoring_score if hasattr(data, 'proctoring_score') else 100.0,
                "proctoring_alerts": data.proctoring_alerts if hasattr(data, 'proctoring_alerts') else [],
                "overall_score": scoring_result["final_score"],
                "matched_skills": data.matched_skills,
                "missing_skills": data.missing_skills,
                "recommendation": scoring_result["recommendation"],
                "suggestions": reasons,
                "report_file": filename,
                "created_at": datetime.utcnow()
            }
            results_col.insert_one(result_doc_dict)
            print(f"DEBUG: Saved result to MongoDB for user {user_id}")
        except Exception as mongo_err:
            print(f"CRITICAL: Failed to save result to MongoDB: {mongo_err}")
            filename = generate_report(report_data) # Fallback if DB fails
        
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
