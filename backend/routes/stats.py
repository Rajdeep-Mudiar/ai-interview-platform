from fastapi import APIRouter
from database.mongo import get_jobs_col, get_results_col, get_users_col
from datetime import datetime

router = APIRouter(prefix="/stats", tags=["stats"])

@router.get("/recruiter")
async def get_recruiter_stats():
    results_col = get_results_col()
    total_candidates = results_col.count_documents({})
    
    # Get top candidate by overallScore
    top_candidate = results_col.find_one(sort=[("overallScore", -1)])
    top_candidate_name = top_candidate.get("name", "N/A") if top_candidate else "N/A"
    
    return {
        "candidatesJoined": total_candidates,
        "topCandidateName": top_candidate_name
    }

@router.get("/candidate/{user_id}")
async def get_candidate_stats(user_id: str):
    results_col = get_results_col()
    # Be resilient with user_id query here too
    query = {"$or": [{"user_id": user_id}, {"user_id": str(user_id)}]}
    user_results = list(results_col.find(query).sort("created_at", -1))
    
    if not user_results:
        return {
            "status": "Not Started",
            "percentile": "—",
            "timeTaken": "—",
            "lastScore": 0
        }
    
    latest = user_results[0]
    
    # Calculate percentile (mock logic for now or simple count)
    all_scores = [r.get("overall_score") or r.get("overallScore") or 0 for r in results_col.find({}, {"overall_score": 1, "overallScore": 1})]
    all_scores.sort()
    current_score = latest.get("overall_score") or latest.get("overallScore") or 0
    count_below = sum(1 for s in all_scores if s < current_score)
    percentile = round((count_below / len(all_scores)) * 100) if all_scores else 0
    
    return {
        "status": "Completed",
        "percentile": f"Top {100 - percentile}%",
        "betterThan": count_below,
        "timeTaken": f"{latest.get('time_taken', 0)}m",
        "lastScore": current_score
    }

@router.get("/candidate/{user_id}/history")
async def get_candidate_history(user_id: str):
    results_col = get_results_col()
    print(f"DEBUG: Fetching history for user_id: {user_id}")
    
    # Try multiple possible formats for user_id to be extremely resilient
    query = {"$or": [
        {"user_id": user_id},
        {"user_id": str(user_id)},
        {"user_id": "unknown"},
        {"user_id": "undefined"}
    ]}
    
    try:
        user_results = list(results_col.find(query).sort("created_at", -1))
    except Exception as e:
        print(f"DEBUG: MongoDB Query Error: {e}")
        user_results = []
    
    print(f"DEBUG: Found {len(user_results)} results for user {user_id} (including fallbacks)")
    
    # Format results for the frontend
    history = []
    for res in user_results:
        # Debug the actual document structure
        # print(f"DEBUG: Found document: {res}")
        
        history.append({
            "id": str(res["_id"]),
            "job_title": res.get("job_title") or res.get("jobTitle") or "General Interview",
            "overall_score": res.get("overall_score") or res.get("overallScore") or 0,
            "resume_score": res.get("resume_score", 0),
            "interview_score": res.get("interview_score", 0),
            "integrity_score": res.get("integrity_score", 100),
            "recommendation": res.get("recommendation", "N/A"),
            "created_at": res.get("created_at") or datetime.utcnow(),
            "matched_skills": res.get("matched_skills", []),
            "missing_skills": res.get("missing_skills", []),
            "job_id": res.get("job_id"),
            "report_file": res.get("report_file")
        })
        
    return {"history": history}
