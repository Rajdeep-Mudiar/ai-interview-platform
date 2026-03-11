from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from datetime import datetime
import bcrypt

from database.mongo import users_col

router = APIRouter(prefix="/auth", tags=["auth"])


class SignInBody(BaseModel):
    name: str
    password: str
    role: str  # "candidate" or "recruiter"


def _user_to_public(doc):
    return {
        "id": str(doc["_id"]),
        "name": doc["name"],
        "role": doc["role"],
    }


@router.post("/signin")
def signin(body: SignInBody):
    """
    Simple sign-in endpoint backed by MongoDB.

    - If user (name + role) does not exist, it is created with the given password.
    - If it exists, password is validated.
    """
    if body.role not in {"candidate", "recruiter"}:
        raise HTTPException(status_code=400, detail="Invalid role")

    existing = users_col.find_one({"name": body.name, "role": body.role})

    if existing:
        if not bcrypt.checkpw(
            body.password.encode("utf-8"), existing["password_hash"]
        ):
            raise HTTPException(status_code=401, detail="Invalid credentials")
        return _user_to_public(existing)

    # Create new user
    password_hash = bcrypt.hashpw(
        body.password.encode("utf-8"), bcrypt.gensalt()
    )
    doc = {
        "name": body.name,
        "role": body.role,
        "password_hash": password_hash,
        "created_at": datetime.utcnow(),
    }
    result = users_col.insert_one(doc)
    doc["_id"] = result.inserted_id
    return _user_to_public(doc)

