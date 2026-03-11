from typing import List, Optional

from bson import ObjectId
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from database.mongo import get_jobs_col
from models import JobCreate, JobUpdate, JobQuestion

router = APIRouter(prefix="/jobs", tags=["jobs"])
jobs_col = get_jobs_col()


def _job_to_public(doc):
    return {
        "id": str(doc["_id"]),
        "recruiter_id": doc["recruiter_id"],
        "title": doc["title"],
        "description": doc["description"],
        "questions": doc.get("questions", []),
    }


@router.post("/", response_model=dict)
def create_job(body: JobCreate):
    doc = body.model_dump()
    result = jobs_col.insert_one(doc)
    doc["_id"] = result.inserted_id
    return _job_to_public(doc)


@router.get("/", response_model=list[dict])
def list_jobs(recruiter_id: Optional[str] = None):
    query = {}
    if recruiter_id:
        query["recruiter_id"] = recruiter_id
    docs = jobs_col.find(query).sort("_id", -1)
    return [_job_to_public(d) for d in docs]


@router.get("/{job_id}", response_model=dict)
def get_job(job_id: str):
    try:
        doc = jobs_col.find_one({"_id": ObjectId(job_id)})
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid job ID format")
        
    if not doc:
        raise HTTPException(status_code=404, detail="Job not found")
    return _job_to_public(doc)


@router.put("/{job_id}", response_model=dict)
def update_job(job_id: str, body: JobUpdate):
    try:
        oid = ObjectId(job_id)
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid job ID format")

    update_data = {k: v for k, v in body.model_dump().items() if v is not None}
    if not update_data:
        raise HTTPException(status_code=400, detail="No fields to update")

    result = jobs_col.find_one_and_update(
        {"_id": oid},
        {"$set": update_data},
        return_document=True
    )

    if not result:
        raise HTTPException(status_code=404, detail="Job not found")
    
    return _job_to_public(result)


@router.delete("/{job_id}", response_model=dict)
def delete_job(job_id: str):
    try:
        oid = ObjectId(job_id)
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid job ID format")

    result = jobs_col.delete_one({"_id": oid})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Job not found")
    
    return {"message": "Job deleted successfully", "id": job_id}

