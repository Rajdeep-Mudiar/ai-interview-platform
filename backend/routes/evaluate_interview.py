from datetime import datetime
from typing import List

from bson import ObjectId
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from ai_modules.gemini_client import get_model
from database.mongo import jobs_col, results_col

router = APIRouter(prefix="/interview", tags=["interview"])


class QuestionAnswer(BaseModel):
    question: str
    preferred_answer: str
    candidate_answer: str


class InterviewEvalBody(BaseModel):
    candidate_id: str
    candidate_name: str
    recruiter_id: str
    job_id: str
    job_title: str
    integrity_score: float
    time_taken_seconds: int
    items: List[QuestionAnswer]


@router.post("/evaluate")
def evaluate_interview(body: InterviewEvalBody):
    if not body.items:
        raise HTTPException(status_code=400, detail="No answers provided")

    # Ensure job exists
    if not jobs_col.find_one({"_id": ObjectId(body.job_id)}):
        raise HTTPException(status_code=404, detail="Job not found")

    model = get_model()
    per_question = []

    for idx, item in enumerate(body.items, start=1):
        prompt = f"""
You are evaluating an interview answer.

Question:
{item.question}

Preferred (ideal) answer:
{item.preferred_answer}

Candidate's answer:
{item.candidate_answer}

Score the candidate from 0 to 10 (integer only) based on how close they are to the preferred answer.
Also provide 1–2 sentences of feedback.

Respond in JSON with fields: "score" (number) and "feedback" (string).
"""
        resp = model.generate_content(prompt)
        text = (resp.text or "").strip()

        score = 0.0
        feedback = text[:300]
        try:
            import json

            data = json.loads(text)
            score = float(data.get("score", 0))
            feedback = data.get("feedback", feedback)
        except Exception:
            # keep fallback
            pass

        per_question.append(
            {
                "question_number": idx,
                "question": item.question,
                "score": score,
                "feedback": feedback,
            }
        )

    avg_score = sum(q["score"] for q in per_question) / len(per_question)

    doc = {
        "candidate_id": body.candidate_id,
        "candidate_name": body.candidate_name,
        "recruiter_id": body.recruiter_id,
        "job_id": body.job_id,
        "job_title": body.job_title,
        "integrity_score": body.integrity_score,
        "time_taken_seconds": body.time_taken_seconds,
        "average_score": avg_score,
        "per_question": per_question,
        "status": "completed",
        "created_at": datetime.utcnow(),
    }
    result = results_col.insert_one(doc)

    return {
        "result_id": str(result.inserted_id),
        "average_score": avg_score,
        "integrity_score": body.integrity_score,
        "time_taken_seconds": body.time_taken_seconds,
        "results": per_question,
    }

