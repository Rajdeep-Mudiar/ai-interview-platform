from typing import List, Optional

from bson import ObjectId
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from database.mongo import jobs_col

router = APIRouter(prefix="/jobs", tags=["jobs"])


class JobCreate(BaseModel):
    recruiter_id: str
    title: str
    description: str
    questions: List[str]
<<<<<<< HEAD
    deadline: Optional[str] = None
=======
    preferred_answers: List[str]
>>>>>>> f8fff86 (changes)


class JobUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    questions: Optional[List[str]] = None
<<<<<<< HEAD
    deadline: Optional[str] = None
=======
    preferred_answers: Optional[List[str]] = None
>>>>>>> f8fff86 (changes)


def _job_to_public(doc):
    return {
        "id": str(doc["_id"]),
        "recruiter_id": doc["recruiter_id"],
        "title": doc["title"],
        "description": doc["description"],
        "questions": doc.get("questions", []),
<<<<<<< HEAD
        "deadline": doc.get("deadline"),
=======
        "preferred_answers": doc.get("preferred_answers", []),
>>>>>>> f8fff86 (changes)
    }


@router.post("/", response_model=dict)
def create_job(body: JobCreate):
    if len(body.preferred_answers) != len(body.questions):
        raise HTTPException(
            status_code=400,
            detail="preferred_answers must have the same length as questions",
        )
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
    doc = jobs_col.find_one({"_id": ObjectId(job_id)})
    if not doc:
        raise HTTPException(status_code=404, detail="Job not found")
    return _job_to_public(doc)


