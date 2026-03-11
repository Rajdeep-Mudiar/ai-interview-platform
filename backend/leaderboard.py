from fastapi import APIRouter
from database.mongo import get_results_col

router = APIRouter()

@router.get("/leaderboard")
async def get_leaderboard():
    results_col = get_results_col()
    docs = results_col.find().sort("overall_score", -1).limit(10)
    candidates = []
    for doc in docs:
        candidates.append({
            "id": str(doc["_id"]),
            "name": doc.get("name", "Unknown"),
            "email": doc.get("email", "N/A"),
            "job_title": doc.get("job_title", "N/A"),
            "overall_score": doc.get("overall_score", 0),
            "integrity_score": doc.get("integrity_score", 0),
            "proctoring_score": doc.get("proctoring_score", 100.0),
            "report_file": doc.get("report_file"),
            "created_at": doc.get("created_at")
        })
    return candidates
