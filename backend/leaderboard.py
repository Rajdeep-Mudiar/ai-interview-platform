from fastapi import APIRouter
from database.mongo import results_col
from typing import Optional

router = APIRouter()

@router.get("/leaderboard")
async def get_leaderboard(recruiter_id: Optional[str] = None):
    query = {}
    if recruiter_id:
        # Find all jobs by this recruiter
        from database.mongo import jobs_col
        jobs = list(jobs_col.find({"recruiter_id": recruiter_id}, {"_id": 1}))
        job_ids = [str(j["_id"]) for j in jobs]
        query["job_id"] = {"$in": job_ids}

    # Aggregate to get performance metrics per candidate
    pipeline = [
        {"$match": query},
        {"$group": {
            "_id": "$candidate_id",
            "name": {"$first": "$candidate_name"},
            "average_score": {"$avg": "$average_score"},
            "average_integrity": {"$avg": "$integrity_score"},
            "total_time": {"$sum": "$time_taken_seconds"},
            "attempts": {"$sum": 1}
        }},
        {"$sort": {"average_score": -1}},
        {"$limit": 20}
    ]
    
    docs = list(results_col.aggregate(pipeline))
    candidates = []
    for doc in docs:
        candidates.append({
            "candidate_id": str(doc["_id"]),
            "name": doc.get("name") or "Anonymous Candidate",
            "average_score": round(doc.get("average_score", 0), 2),
            "average_integrity": round(doc.get("average_integrity", 0), 2),
            "total_time": doc.get("total_time", 0),
            "attempts": doc.get("attempts", 0)
        })
    return candidates
