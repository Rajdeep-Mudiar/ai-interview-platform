from fastapi import APIRouter
from pydantic import BaseModel
from ai_modules.hiring_decision import get_hiring_decision

router = APIRouter()

class DecisionRequest(BaseModel):
    resume_score: float
    interview_score: float
    integrity_score: float

@router.post("/hiring-decision")
def decision(data: DecisionRequest):
    result = get_hiring_decision(
        data.resume_score,
        data.interview_score,
        data.integrity_score
    )
    return result
