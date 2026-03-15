from typing import List, Optional
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from datetime import datetime
from database.mongo import alerts_col

router = APIRouter(prefix="/alerts", tags=["alerts"])

class AlertCreate(BaseModel):
    candidate_id: str
    job_id: str
    type: str
    message: str

def _alert_to_public(doc):
    return {
        "id": str(doc["_id"]),
        "candidate_id": doc["candidate_id"],
        "job_id": doc["job_id"],
        "type": doc["type"],
        "message": doc["message"],
        "created_at": doc["created_at"]
    }

@router.post("/")
def create_alert(body: AlertCreate):
    doc = {
        "candidate_id": body.candidate_id,
        "job_id": body.job_id,
        "type": body.type,
        "message": body.message,
        "created_at": datetime.utcnow()
    }
    result = alerts_col.insert_one(doc)
    doc["_id"] = result.inserted_id
    return _alert_to_public(doc)

@router.get("/")
def list_alerts(candidate_id: Optional[str] = None, job_id: Optional[str] = None):
    query = {}
    if candidate_id:
        query["candidate_id"] = candidate_id
    if job_id:
        query["job_id"] = job_id
    
    docs = alerts_col.find(query).sort("created_at", -1)
    return [_alert_to_public(d) for d in docs]
