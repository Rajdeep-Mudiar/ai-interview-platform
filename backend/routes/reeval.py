from typing import List

from bson import ObjectId
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from database.mongo import results_col

router = APIRouter(prefix="/reeval", tags=["reeval"])


class ReevalRequestBody(BaseModel):
    result_id: str


@router.post("/request", response_model=dict)
def request_reeval(body: ReevalRequestBody):
    """
    Mark an interview result as pending re-evaluation.
    """
    res = results_col.find_one({"_id": ObjectId(body.result_id)})
    if not res:
        raise HTTPException(status_code=404, detail="Result not found")
    results_col.update_one(
        {"_id": res["_id"]},
        {"$set": {"status": "pending_reeval"}},
    )
    return {"status": "pending_reeval"}


@router.get("/pending/{recruiter_id}", response_model=List[dict])
def list_pending(recruiter_id: str):
    """
    List all pending re-eval requests for a recruiter.
    """
    docs = results_col.find(
        {"status": "pending_reeval", "recruiter_id": recruiter_id}
    ).sort("created_at", -1)
    out: List[dict] = []
    for d in docs:
        out.append(
            {
                "id": str(d["_id"]),
                "candidate_id": d.get("candidate_id"),
                "candidate_name": d.get("candidate_name"),
                "job_id": d.get("job_id"),
                "job_title": d.get("job_title"),
                "average_score": d.get("average_score", 0),
                "integrity_score": d.get("integrity_score", 0),
                "time_taken_seconds": d.get("time_taken_seconds", 0),
            }
        )
    return out


@router.post("/accept", response_model=dict)
def accept_reeval(body: ReevalRequestBody):
    """
    Accept a re-evaluation request.
    """
    res = results_col.find_one({"_id": ObjectId(body.result_id)})
    if not res:
        raise HTTPException(status_code=404, detail="Result not found")

    results_col.update_one(
        {"_id": res["_id"]},
        {"$set": {"status": "completed"}},
    )
    return {"status": "completed"}


@router.post("/reject", response_model=dict)
def reject_reeval(body: ReevalRequestBody):
    """
    Reject a re-evaluation request.
    """
    res = results_col.find_one({"_id": ObjectId(body.result_id)})
    if not res:
        raise HTTPException(status_code=404, detail="Result not found")

    results_col.update_one(
        {"_id": res["_id"]},
        {"$set": {"status": "reeval_rejected"}},
    )
    return {"status": "reeval_rejected"}

