from fastapi import APIRouter
from database.mongo import results_col
from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime

router = APIRouter(prefix="/history", tags=["history"])

@router.get("/candidate/{user_id}")
async def get_candidate_history(user_id: str):
    """
    Get all interview results for a specific candidate.
    """
    docs = list(results_col.find({"user_id": user_id}).sort("timestamp", -1))
    history = []
    for doc in docs:
        history.append({
            "id": str(doc["_id"]),
            "name": doc.get("name", "Unknown"),
            "overallScore": doc.get("overallScore", 0),
            "timeTaken": doc.get("timeTaken", 0),
            "integrity": doc.get("integrity", 0),
            "timestamp": doc.get("timestamp", datetime.now()),
            "fit_score": doc.get("fit_score", 0),
            "missing_skills": doc.get("missing_skills", []),
            "alerts": doc.get("alerts", [])
        })
    return history

@router.get("/all")
async def get_all_history():
    """
    Get all interview results (for recruiter view).
    """
    docs = list(results_col.find().sort("timestamp", -1))
    history = []
    for doc in docs:
        history.append({
            "id": str(doc["_id"]),
            "user_id": doc.get("user_id"),
            "name": doc.get("name", "Unknown"),
            "overallScore": doc.get("overallScore", 0),
            "timeTaken": doc.get("timeTaken", 0),
            "integrity": doc.get("integrity", 0),
            "timestamp": doc.get("timestamp", datetime.now()),
            "fit_score": doc.get("fit_score", 0),
            "missing_skills": doc.get("missing_skills", []),
            "alerts": doc.get("alerts", [])
        })
    return history
