from typing import List, Optional
from fastapi import APIRouter
from pydantic import BaseModel
from bson import ObjectId
from database.mongo import jobs_col
from ai_modules.question_generator import generate_questions

router = APIRouter()

class QuestionRequest(BaseModel):
    skills: List[str]
    job_id: Optional[str] = None

@router.post("/generate-questions")
def questions(data: QuestionRequest):
    # 1. Try to get questions from the specific job first (recruiter set)
    if data.job_id:
        try:
            job = jobs_col.find_one({"_id": ObjectId(data.job_id)})
            if job and job.get("questions"):
                # Use recruiter's questions
                return {"questions": job["questions"]}
        except Exception as e:
            print(f"Error fetching job questions: {e}")

    # 2. Fallback to AI generation if no job_id or no questions in job
    qs = generate_questions(data.skills)
    return {"questions": qs}
