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

    # Aggregate to get only the highest score per user
    pipeline = [
        {"$match": query},
        {"$sort": {"overallScore": -1}},
        {"$group": {
            "_id": "$user_id",
            "name": {"$first": "$name"},
            "overallScore": {"$max": "$overallScore"},
            "timeTaken": {"$first": "$timeTaken"},
            "integrity": {"$first": "$integrity"},
            "latest_id": {"$first": "$_id"}
        }},
        {"$sort": {"overallScore": -1}},
        {"$limit": 10}
    ]
    
    docs = list(results_col.aggregate(pipeline))
    candidates = []
    for doc in docs:
        # Ensure all fields are present and properly formatted
        candidates.append({
            "id": str(doc["latest_id"]),
            "name": doc.get("name") or "Anonymous Candidate",
            "overallScore": int(doc.get("overallScore", 0)),
            "timeTaken": int(doc.get("timeTaken", 0)),
            "integrity": int(doc.get("integrity", 100)),
        })
    return candidates
