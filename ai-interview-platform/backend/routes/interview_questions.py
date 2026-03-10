from fastapi import APIRouter
from pydantic import BaseModel
from ai_modules.question_generator import generate_questions

router = APIRouter()

class SkillRequest(BaseModel):
    skills:list[str]

@router.post("/generate-questions")
def questions(data:SkillRequest):
    qs = generate_questions(data.skills)
    return {"questions":qs}
