from fastapi import APIRouter, UploadFile, Form, HTTPException
from ai_modules.resume_matcher import analyze_resume, extract_text_from_pdf, calculate_match_details, extract_skills_with_context
from database.mongo import get_jobs_col
from bson import ObjectId

router = APIRouter()

@router.post("/analyze-resume")
async def analyze(file: UploadFile, job_description: str = Form(...)):
    result = analyze_resume(file.file, job_description)
    return result

@router.post("/match-jobs")
async def match_jobs(file: UploadFile):
    """Matches a resume against all available jobs in the database."""
    # 1. Extract text from the resume
    resume_text = extract_text_from_pdf(file.file)
    if not resume_text:
        raise HTTPException(status_code=400, detail="Could not extract text from PDF.")

    # 2. Extract parsed skills
    resume_skills = extract_skills_with_context(resume_text)

    # 3. Fetch all jobs
    jobs_col = get_jobs_col()
    all_jobs = list(jobs_col.find({}))
    
    if not all_jobs:
        return {"matches": [], "resume_skills": resume_skills}

    # 4. Match against each job
    matches = []
    for job in all_jobs:
        details = calculate_match_details(resume_text, job["description"])
        
        matches.append({
            "job_id": str(job["_id"]),
            "title": job["title"],
            "company": job.get("company", "N/A"),
            "score": details["scores"]["overall_score"],
            "metrics": details["scores"],
            "matched_skills": details["matched_skills"],
            "missing_skills": details["missing_skills"],
            "description_preview": job["description"][:200] + "...",
            "questions": job.get("questions", [])
        })

    # 5. Sort by score descending
    matches.sort(key=lambda x: x["score"], reverse=True)
    
    return {
        "matches": matches, 
        "resume_skills": resume_skills,
        "resume_text": resume_text[:1000]
    }
