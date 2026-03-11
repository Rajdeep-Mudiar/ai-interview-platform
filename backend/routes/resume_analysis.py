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
    print(f"DEBUG: match_jobs called with file: {file.filename}")
    
    # Reset file pointer to beginning just in case
    file.file.seek(0)
    
    # 1. Extract text from the resume
    try:
        resume_text = extract_text_from_pdf(file.file)
    except Exception as e:
        print(f"DEBUG: Error extracting text: {str(e)}")
        raise HTTPException(status_code=400, detail=f"Error extracting text from PDF: {str(e)}")

    if not resume_text:
        print("DEBUG: Could not extract text from PDF (empty result)")
        raise HTTPException(status_code=400, detail="Could not extract text from PDF. The file might be empty or corrupted.")

    print(f"DEBUG: Extracted text length: {len(resume_text)}")
    # 2. Extract parsed skills
    try:
        resume_skills = extract_skills_with_context(resume_text)
        print(f"DEBUG: Extracted skills: {resume_skills}")
    except Exception as e:
        print(f"DEBUG: Error extracting skills: {str(e)}")
        resume_skills = {} # Fallback to empty skills if parser fails

    # 3. Fetch all jobs
    try:
        jobs_col = get_jobs_col()
        all_jobs = list(jobs_col.find({}))
        print(f"DEBUG: Found {len(all_jobs)} jobs in database")
    except Exception as e:
        print(f"DEBUG: Database error: {str(e)}")
        raise HTTPException(status_code=500, detail="Database error while fetching jobs.")
    
    if not all_jobs:
        return {"matches": [], "resume_skills": resume_skills}

    # 4. Match against each job
    matches = []
    for job in all_jobs:
        try:
            # Handle potential missing fields in job document
            job_desc = job.get("description", "")
            job_title = job.get("title", "Untitled Job")
            
            details = calculate_match_details(resume_text, job_desc)
            score = details.get("scores", {}).get("overall_score", 0)
            
            print(f"DEBUG: Job '{job_title}' score: {score}")
            
            matches.append({
                "job_id": str(job["_id"]),
                "title": job_title,
                "company": job.get("company", "N/A"),
                "score": score,
                "metrics": details.get("scores", {}),
                "matched_skills": details.get("matched_skills", []),
                "missing_skills": details.get("missing_skills", []),
                "description_preview": job_desc[:200] + "...",
                "questions": job.get("questions", [])
            })
        except Exception as e:
            print(f"DEBUG: Error matching job {job.get('_id')}: {str(e)}")
            continue

    # 5. Sort by score descending
    matches.sort(key=lambda x: x["score"], reverse=True)
    print(f"DEBUG: Returning {len(matches)} matches")
    
    return {
        "matches": matches, 
        "resume_skills": resume_skills,
        "resume_text_preview": resume_text[:500]
    }
