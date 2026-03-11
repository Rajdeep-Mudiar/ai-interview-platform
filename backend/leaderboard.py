from fastapi import APIRouter
from database.mongo import get_results_col

router = APIRouter()

@router.get("/leaderboard")
async def get_leaderboard():
    results_col = get_results_col()
    docs = results_col.find().sort("overallScore", -1).limit(10)
    candidates = []
    for doc in docs:
        candidates.append({
            "id": str(doc["_id"]),
            "name": doc.get("name", "Unknown"),
            "overallScore": doc.get("overallScore", 0),
            "timeTaken": doc.get("timeTaken", 0),
            "integrity": doc.get("integrity", 0),
        })
    return candidates
