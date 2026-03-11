from fastapi import APIRouter
from pydantic import BaseModel
from ai_modules.answer_evaluator import evaluate_answer

router = APIRouter()

class AnswerRequest(BaseModel):
    question: str
    answer: str

@router.post("/evaluate-answer")
def evaluate(data: AnswerRequest):
    result = evaluate_answer(data.question, data.answer)
    return result
