from fastapi import APIRouter, UploadFile, Form
from ai_modules.resume_matcher import analyze_resume

router = APIRouter()

@router.post("/analyze-resume")
async def analyze(file: UploadFile, job_description: str = Form(...)):
    result = analyze_resume(file.file, job_description)
    return result
