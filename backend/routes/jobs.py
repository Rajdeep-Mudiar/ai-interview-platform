from typing import List, Optional

from bson import ObjectId
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from database.mongo import jobs_col

router = APIRouter(prefix="/jobs", tags=["jobs"])


class JobCreate(BaseModel):
    recruiter_id: str
    title: str
    company: Optional[str] = None
    location: Optional[str] = None
    work_type: Optional[str] = "Remote" # "Remote" | "Onsite" | "Hybrid"
    salary: Optional[str] = None
    qualification: Optional[str] = None
    work_experience: Optional[str] = None
    description: str
    key_responsibilities: Optional[str] = None
    requirements: Optional[str] = None
    benefits: Optional[str] = None
    questions: List[str]
    preferred_answers: List[str]
    deadline: Optional[str] = None


class JobUpdate(BaseModel):
    title: Optional[str] = None
    company: Optional[str] = None
    location: Optional[str] = None
    work_type: Optional[str] = None
    salary: Optional[str] = None
    qualification: Optional[str] = None
    work_experience: Optional[str] = None
    description: Optional[str] = None
    key_responsibilities: Optional[str] = None
    requirements: Optional[str] = None
    benefits: Optional[str] = None
    questions: Optional[List[str]] = None
    preferred_answers: Optional[List[str]] = None
    deadline: Optional[str] = None


def _job_to_public(doc):
    return {
        "id": str(doc["_id"]),
        "recruiter_id": doc["recruiter_id"],
        "title": doc["title"],
        "company": doc.get("company"),
        "location": doc.get("location"),
        "work_type": doc.get("work_type", "Remote"),
        "salary": doc.get("salary"),
        "qualification": doc.get("qualification"),
        "work_experience": doc.get("work_experience"),
        "description": doc["description"],
        "key_responsibilities": doc.get("key_responsibilities"),
        "requirements": doc.get("requirements"),
        "benefits": doc.get("benefits"),
        "questions": doc.get("questions", []),
        "preferred_answers": doc.get("preferred_answers", []),
        "deadline": doc.get("deadline"),
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
    doc = jobs_col.find_one({"_id": ObjectId(job_id)})
    if not doc:
        raise HTTPException(status_code=404, detail="Job not found")
    return _job_to_public(doc)

