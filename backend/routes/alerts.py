from datetime import datetime
from typing import List, Optional

from fastapi import APIRouter
from pydantic import BaseModel

from database.mongo import alerts_col

router = APIRouter(prefix="/alerts", tags=["alerts"])


class AlertIn(BaseModel):
    candidate_id: str
    job_id: Optional[str] = None
    type: str
    message: str


class AlertOut(BaseModel):
    id: str
    candidate_id: str
    job_id: Optional[str] = None
    type: str
    message: str
    created_at: datetime


def _to_out(doc) -> AlertOut:
    return AlertOut(
        id=str(doc["_id"]),
        candidate_id=doc["candidate_id"],
        job_id=doc.get("job_id"),
        type=doc["type"],
        message=doc["message"],
        created_at=doc["created_at"],
    )


@router.post("/", response_model=dict)
def create_alert(body: AlertIn):
    doc = body.model_dump()
    doc["created_at"] = datetime.utcnow()
    alerts_col.insert_one(doc)
    return {"status": "received"}


@router.get("/", response_model=List[AlertOut])
def list_alerts(candidate_id: Optional[str] = None, job_id: Optional[str] = None):
    query: dict = {}
    if candidate_id:
        query["candidate_id"] = candidate_id
    if job_id:
        query["job_id"] = job_id
    docs = alerts_col.find(query).sort("created_at", -1)
    return [_to_out(d) for d in docs]

