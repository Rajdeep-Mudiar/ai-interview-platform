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


class SignUpBody(BaseModel):
    name: str
    password: str
    role: str


def _user_to_public(doc):
    return {
        "id": str(doc["_id"]),
        "name": doc["name"],
        "role": doc["role"],
    }


def _get_or_create_user(name: str, password: str, role: str):
    if role not in {"candidate", "recruiter"}:
        raise HTTPException(status_code=400, detail="Invalid role")

    # Check for existing user by name and role
    existing = users_col.find_one({"name": name, "role": role})
    if existing:
        # Validate password
        if not bcrypt.checkpw(password.encode("utf-8"), existing["password_hash"]):
            raise HTTPException(status_code=401, detail="Invalid credentials")
        return _user_to_public(existing)

    # Create new user
    password_hash = bcrypt.hashpw(password.encode("utf-8"), bcrypt.gensalt())
    doc = {
        "name": name,
        "role": role,
        "password_hash": password_hash,
        "created_at": datetime.utcnow(),
    }
    result = users_col.insert_one(doc)
    doc["_id"] = result.inserted_id
    return _user_to_public(doc)


@router.post("/signin")
def signin(body: SignInBody):
    """
    Sign in an existing user or create a new one if not found.
    """
    return _get_or_create_user(name=body.name, password=body.password, role=body.role)

