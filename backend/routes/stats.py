from fastapi import APIRouter
from database.mongo import jobs_col, results_col, users_col
from typing import Optional

router = APIRouter(prefix="/stats", tags=["stats"])

@router.get("/recruiter")
async def get_recruiter_stats(recruiter_id: Optional[str] = None):
    job_query = {}
    result_query = {}
    
    if recruiter_id:
        job_query["recruiter_id"] = recruiter_id
        # Find all job IDs for this recruiter
        jobs = list(jobs_col.find({"recruiter_id": recruiter_id}, {"_id": 1}))
        job_ids = [str(j["_id"]) for j in jobs]
        result_query["job_id"] = {"$in": job_ids}

    active_jobs = jobs_col.count_documents(job_query)
    total_candidates = results_col.count_documents(result_query)
    
    pipeline = [
        {"$match": result_query},
        {"$group": {"_id": None, "avgScore": {"$avg": "$overallScore"}}}
    ]
    avg_score_res = list(results_col.aggregate(pipeline))
    avg_score = round(avg_score_res[0]["avgScore"], 1) if avg_score_res else 0
    
    integrity_pass_query = result_query.copy()
    integrity_pass_query["integrity"] = {"$gt": 80}
    integrity_pass = results_col.count_documents(integrity_pass_query)
    integrity_rate = round((integrity_pass / total_candidates * 100), 1) if total_candidates > 0 else 100
    
    return {
        "activeJobs": active_jobs,
        "totalCandidates": total_candidates,
        "avgScore": f"{avg_score}%",
        "integrityRisk": "Low" if integrity_rate > 90 else "Medium",
        "integrityRate": f"{integrity_rate}% passing"
    }

@router.get("/candidate/{user_id}")
async def get_candidate_stats(user_id: str):
    user_results = list(results_col.find({"user_id": user_id}).sort("_id", -1))
    if not user_results:
        return {
            "status": "Not Started",
            "percentile": "—",
            "timeTaken": "—",
            "lastScore": 0,
            "history": []
        }
    
    latest = user_results[0]
    
    # Calculate percentile (mock logic for now or simple count)
    all_scores = [r["overallScore"] for r in results_col.find({}, {"overallScore": 1})]
    all_scores.sort()
    count_below = sum(1 for s in all_scores if s < latest["overallScore"])
    percentile = round((count_below / len(all_scores)) * 100) if all_scores else 0
    
    # Format history for frontend
    history = []
    for res in user_results:
        history.append({
            "id": str(res["_id"]),
            "date": str(res.get("_id").generation_time.date()) if hasattr(res.get("_id"), "generation_time") else "Unknown",
            "score": res.get("overallScore", 0),
            "time": f"{res.get('timeTaken', 0)}m",
            "integrity": res.get("integrity", 0),
            "status": "Completed"
        })

    return {
        "status": "Completed",
        "percentile": f"Top {100 - percentile}%",
        "betterThan": count_below,
        "timeTaken": f"{latest.get('timeTaken', 0)}m",
        "lastScore": latest.get("overallScore", 0),
        "history": history
    }
