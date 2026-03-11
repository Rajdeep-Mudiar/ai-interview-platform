from fastapi import APIRouter
from database.mongo import get_jobs_col, get_results_col, get_users_col

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
    user_results = list(results_col.find({"user_id": user_id}).sort("_id", -1))
    if not user_results:
        return {
            "status": "Not Started",
            "percentile": "—",
            "timeTaken": "—",
            "lastScore": 0
        }
    
    latest = user_results[0]
    
    # Calculate percentile (mock logic for now or simple count)
    all_scores = [r["overallScore"] for r in results_col.find({}, {"overallScore": 1})]
    all_scores.sort()
    count_below = sum(1 for s in all_scores if s < latest["overallScore"])
    percentile = round((count_below / len(all_scores)) * 100) if all_scores else 0
    
    return {
        "status": "Completed",
        "percentile": f"Top {100 - percentile}%",
        "betterThan": count_below,
        "timeTaken": f"{latest.get('time_taken', 0)}m",
        "lastScore": latest.get("overall_score", 0)
    }

@router.get("/candidate/{user_id}/history")
async def get_candidate_history(user_id: str):
    results_col = get_results_col()
    # Find all results for this user, sorted by most recent first
    user_results = list(results_col.find({"user_id": user_id}).sort("created_at", -1))
    
    # Format results for the frontend
    history = []
    for res in user_results:
        history.append({
            "id": str(res["_id"]),
            "job_title": res.get("job_title", "General Interview"),
            "overall_score": res.get("overall_score", 0),
            "recommendation": res.get("recommendation", "N/A"),
            "created_at": res.get("created_at"),
            "matched_skills": res.get("matched_skills", []),
            "missing_skills": res.get("missing_skills", [])
        })
        
    return {"history": history}
