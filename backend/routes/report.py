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
        report_data = data.model_dump()
        report_data.update({
            "overall_score": scoring_result["final_score"],
            "recommendation": scoring_result["recommendation"],
            "suggestions": reasons
        })
        
        # 3. Fetch Proctoring Alerts for this user/session
        proctoring_alerts = []
        try:
            from database.mongo import MongoDB
            alerts_col = MongoDB.get_collection("proctoring_alerts")
            # Get alerts for this user that happened today (or since start of interview)
            proctoring_alerts = list(alerts_col.find({"user_id": str(data.user_id)}).sort("timestamp", 1))
            # Format alerts for report
            formatted_alerts = []
            for a in proctoring_alerts:
                formatted_alerts.append(f"[{a['timestamp']}] {a['type'].upper()} (Sev: {a['severity']}): {a['message']}")
            
            # Add to report data
            report_data["proctoring_alerts"] = formatted_alerts
            report_data["cheating_risk"] = c_risk
        except Exception as e:
            print(f"Error fetching alerts for report: {e}")
            report_data["proctoring_alerts"] = []

        # 4. Save to MongoDB Results collection
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
                "overall_score": scoring_result["final_score"],
                "matched_skills": data.matched_skills,
                "missing_skills": data.missing_skills,
                "recommendation": scoring_result["recommendation"],
                "suggestions": reasons,
                "report_file": filename,
                "proctoring_summary": formatted_alerts if proctoring_alerts else [],
                "created_at": datetime.utcnow()
            }
            results_col.insert_one(result_doc_dict)
            print(f"DEBUG: Saved result to MongoDB for user {user_id}")
        except Exception as mongo_err:
            print(f"CRITICAL: Failed to save result to MongoDB: {mongo_err}")
            filename = generate_report(report_data) # Fallback if DB fails
        
        # 5. Return results (text + download)
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
