from typing import List, Optional
import json
import logging
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from datetime import datetime
from bson import ObjectId

from database.mongo import results_col, alerts_col
from ai_modules.gemini_client import get_gemini_model

router = APIRouter(prefix="/interview", tags=["evaluation"])

logger = logging.getLogger(__name__)

class InterviewItem(BaseModel):
    question: str
    preferred_answer: str
    candidate_answer: str

class EvaluateRequest(BaseModel):
    candidate_id: str
    candidate_name: str
    job_id: str
    job_title: str
    integrity_score: float
    time_taken_seconds: int
    items: List[InterviewItem]
    session_id: Optional[str] = None

class TerminateRequest(BaseModel):
    candidate_id: str
    candidate_name: str
    job_id: str
    job_title: str
    integrity_score: float
    time_taken_seconds: int
    session_id: Optional[str] = None

@router.post("/evaluate")
async def evaluate_interview(body: EvaluateRequest):
    model = get_gemini_model()
    
    # Fetch all activity logs if session_id is provided
    suspicious_logs = []
    if body.session_id:
        from database.mongo import _db as db
        logs = list(db.activity_logs.find({
            "session_id": body.session_id,
            "event": {"$nin": ["device_connected", "heartbeat"]}
        }).sort("timestamp", 1))
        for log in logs:
            suspicious_logs.append({
                "event": log["event"],
                "device": log["device"],
                "timestamp": str(log["timestamp"]),
                "confidence": log.get("confidence_score", 1.0)
            })

    per_question_results = []
    total_score = 0
    
    for item in body.items:
        prompt = f"""
        Evaluate the candidate's answer based on the preferred answer.
        Question: {item.question}
        Preferred Answer: {item.preferred_answer}
        Candidate's Answer: {item.candidate_answer}
        
        Provide a score from 0 to 10 and brief feedback.
        Format your response as valid JSON:
        {{"score": number, "feedback": "string"}}
        """
        
        try:
            response = model.generate_content(prompt)
            # Basic JSON extraction from response text
            text = response.text.strip()
            if "```json" in text:
                text = text.split("```json")[1].split("```")[0].strip()
            elif "```" in text:
                text = text.split("```")[1].split("```")[0].strip()
            
            result = json.loads(text)
            score = float(result.get("score", 0))
            feedback = result.get("feedback", "No feedback provided")
            
            res_item = {
                "question": item.question,
                "preferred_answer": item.preferred_answer,
                "candidate_answer": item.candidate_answer,
                "score": score,
                "feedback": feedback
            }
            per_question_results.append(res_item)
            total_score += score
        except Exception as e:
            logger.error(f"Error evaluating question: {e}")
            per_question_results.append({
                "question": item.question,
                "preferred_answer": item.preferred_answer,
                "candidate_answer": item.candidate_answer,
                "score": 0,
                "feedback": f"Evaluation error: {str(e)}"
            })

    avg_score = total_score / len(body.items) if body.items else 0
    
    doc = {
        "status": "completed",
        "candidate_id": body.candidate_id,
        "candidate_name": body.candidate_name,
        "job_id": body.job_id,
        "job_title": body.job_title,
        "integrity_score": body.integrity_score,
        "time_taken_seconds": body.time_taken_seconds,
        "average_score": round(avg_score, 2),
        "per_question": per_question_results,
        "suspicious_activities": suspicious_logs,
        "created_at": datetime.utcnow()
    }
    
    results_col.insert_one(doc)
    doc["id"] = str(doc.pop("_id"))
    return doc

@router.post("/terminate")
async def terminate_interview(body: TerminateRequest):
    doc = {
        "status": "terminated",
        "candidate_id": body.candidate_id,
        "candidate_name": body.candidate_name,
        "job_id": body.job_id,
        "job_title": body.job_title,
        "integrity_score": body.integrity_score,
        "time_taken_seconds": body.time_taken_seconds,
        "average_score": 0,
        "per_question": [],
        "created_at": datetime.utcnow()
    }
    
    results_col.insert_one(doc)
    doc["id"] = str(doc.pop("_id"))
    return doc
