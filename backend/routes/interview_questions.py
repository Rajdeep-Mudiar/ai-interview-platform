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
                # Use recruiter's questions and preferred answers if available
                questions_list = job["questions"]
                preferred_answers = job.get("preferred_answers", [])
                
                # Combine them into objects for the frontend
                combined = []
                for i, q in enumerate(questions_list):
                    combined.append({
                        "question": q,
                        "preferred_answer": preferred_answers[i] if i < len(preferred_answers) else ""
                    })
                return {"questions": combined}
        except Exception as e:
            print(f"Error fetching job questions: {e}")

    # 2. Fallback to AI generation if no job_id or no questions in job
    qs = generate_questions(data.skills)
    # Convert to objects for consistency
    combined_fallback = [{"question": q, "preferred_answer": ""} for q in qs]
    return {"questions": combined_fallback}
