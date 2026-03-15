from jd_matcher.matcher import analyze_candidate
from resume_parser.parser import parse_resume

def analyze_resume(file, job_description):
    parsed = parse_resume(file)
    resume_text = parsed.get("text", "")
    
    # Use the unified matching engine from jd_matcher
    result = analyze_candidate(resume_text, job_description)
    
    return {
        "score": result["fit_score"],
        "resume_skills": result["matched_skills"],
        "missing_skills": result["missing_skills"],
        "resume_text": resume_text,
        "job_description": job_description,
        "experience_score": result["experience_score"],
        "skill_match_ratio": result["skill_match_ratio"]
    }
