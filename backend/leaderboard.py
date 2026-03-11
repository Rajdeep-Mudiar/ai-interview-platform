from fastapi import APIRouter

router = APIRouter()

DUMMY_CANDIDATES = [
  { 'id': 1, 'name': 'John Doe', 'overallScore': 88, 'timeTaken': 25, 'integrity': 95 },
  { 'id': 2, 'name': 'Jane Smith', 'overallScore': 92, 'timeTaken': 22, 'integrity': 98 },
  { 'id': 3, 'name': 'Peter Jones', 'overallScore': 85, 'timeTaken': 28, 'integrity': 90 },
  { 'id': 4, 'name': 'Mary Johnson', 'overallScore': 95, 'timeTaken': 20, 'integrity': 99 },
]

@router.get("/leaderboard")
async def get_leaderboard():
    return DUMMY_CANDIDATES
