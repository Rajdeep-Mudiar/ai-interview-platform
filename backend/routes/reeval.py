from typing import List, Optional
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from datetime import datetime
from bson import ObjectId

from database.mongo import reevals_col, results_col

router = APIRouter(prefix="/reeval", tags=["re-evaluation"])

class ReevalRequest(BaseModel):
    result_id: str
    candidate_id: str
    candidate_name: str
    job_id: str
    job_title: str
    reason: str

class AcceptRejectRequest(BaseModel):
    reeval_id: str

def _reeval_to_public(doc):
    return {
        "id": str(doc["_id"]),
        "result_id": doc["result_id"],
        "candidate_id": doc["candidate_id"],
        "candidate_name": doc["candidate_name"],
        "job_id": doc["job_id"],
        "job_title": doc["job_title"],
        "reason": doc["reason"],
        "status": doc["status"],
        "created_at": doc["created_at"]
    }

@router.post("/request")
def request_reeval(body: ReevalRequest):
    # Check if a request already exists for this result
    existing = reevals_col.find_one({"result_id": body.result_id, "status": "pending"})
    if existing:
        raise HTTPException(status_code=400, detail="A re-evaluation request for this interview is already pending.")
    
    doc = {
        "result_id": body.result_id,
        "candidate_id": body.candidate_id,
        "candidate_name": body.candidate_name,
        "job_id": body.job_id,
        "job_title": body.job_title,
        "reason": body.reason,
        "status": "pending",
        "created_at": datetime.utcnow()
    }
    
    # Update the result status to pending_reeval
    results_col.update_one(
        {"_id": ObjectId(body.result_id)},
        {"$set": {"status": "pending_reeval"}}
    )
    
    result = reevals_col.insert_one(doc)
    doc["_id"] = result.inserted_id
    return _reeval_to_public(doc)

@router.get("/pending/{recruiter_id}")
def get_pending_reevals(recruiter_id: str):
    # For now, simplify and just list all pending re-evaluations
    # In a real app, filter by recruiter's jobs
    docs = reevals_col.find({"status": "pending"}).sort("created_at", -1)
    return [_reeval_to_public(d) for d in docs]

@router.post("/accept")
def accept_reeval(body: AcceptRejectRequest):
    reeval = reevals_col.find_one({"_id": ObjectId(body.reeval_id)})
    if not reeval:
        raise HTTPException(status_code=404, detail="Re-evaluation request not found")
    
    # Update re-evaluation request status
    reevals_col.update_one(
        {"_id": ObjectId(body.reeval_id)},
        {"$set": {"status": "accepted"}}
    )
    
    # Update the result status back to completed, effectively allowing it to be "final" again
    # or it could trigger a new interview. Here we just set it back to "completed"
    results_col.update_one(
        {"_id": ObjectId(reeval["result_id"])},
        {"$set": {"status": "completed"}}
    )
    
    return {"message": "Re-evaluation request accepted"}

@router.post("/reject")
def reject_reeval(body: AcceptRejectRequest):
    reeval = reevals_col.find_one({"_id": ObjectId(body.reeval_id)})
    if not reeval:
        raise HTTPException(status_code=404, detail="Re-evaluation request not found")
    
    # Update re-evaluation request status
    reevals_col.update_one(
        {"_id": ObjectId(body.reeval_id)},
        {"$set": {"status": "rejected"}}
    )
    
    # Update the result status to reeval_rejected
    results_col.update_one(
        {"_id": ObjectId(reeval["result_id"])},
        {"$set": {"status": "reeval_rejected"}}
    )
    
    return {"message": "Re-evaluation request rejected"}
