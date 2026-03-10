from fastapi import APIRouter
from pydantic import BaseModel

router = APIRouter()

class Candidate(BaseModel):
    name: str
    score: float

@router.post("/rank-candidates")
def rank_candidates(candidates: list[Candidate]):
    ranked = sorted(candidates, key=lambda x: x.score, reverse=True)
    return {"ranking": ranked}
