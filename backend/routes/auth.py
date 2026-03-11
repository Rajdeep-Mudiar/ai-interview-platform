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
    email: str | None = None  # optional, mainly for future use/logging


class CandidateSignUpBody(BaseModel):
    name: str
    email: str
    password: str


class RecruiterSignUpBody(BaseModel):
    name: str
    email: str
    password: str


def _user_to_public(doc):
    return {
        "id": str(doc["_id"]),
        "name": doc["name"],
        "role": doc["role"],
    }


def _create_user(name: str, email: str, password: str, role: str):
    if role not in {"candidate", "recruiter"}:
        raise HTTPException(status_code=400, detail="Invalid role")

    existing = users_col.find_one({"name": name, "role": role})
    if existing:
        raise HTTPException(status_code=400, detail="User already exists")

    password_hash = bcrypt.hashpw(password.encode("utf-8"), bcrypt.gensalt())
    doc = {
        "name": name,
        "email": email,
        "role": role,
        "password_hash": password_hash,
        "created_at": datetime.utcnow(),
    }
    result = users_col.insert_one(doc)
    doc["_id"] = result.inserted_id
    return _user_to_public(doc)


@router.post("/signup/candidate")
def signup_candidate(body: CandidateSignUpBody):
    """
    Sign up a new candidate user.
    """
    return _create_user(
        name=body.name,
        email=body.email,
        password=body.password,
        role="candidate",
    )


@router.post("/signup/recruiter")
def signup_recruiter(body: RecruiterSignUpBody):
    """
    Sign up a new recruiter user.
    """
    return _create_user(
        name=body.name,
        email=body.email,
        password=body.password,
        role="recruiter",
    )


@router.post("/signin")
def signin(body: SignInBody):
    """
    Sign in an existing user backed by MongoDB.

    - If user (name + role) does not exist, a 404 error is returned.
    - If it exists, password is validated.
    """
    if body.role not in {"candidate", "recruiter"}:
        raise HTTPException(status_code=400, detail="Invalid role")

    existing = users_col.find_one({"name": body.name, "role": body.role})

    if not existing:
        raise HTTPException(status_code=404, detail="User not found. Please sign up first.")

    if not bcrypt.checkpw(
        body.password.encode("utf-8"), existing["password_hash"]
    ):
        raise HTTPException(status_code=401, detail="Invalid credentials")

    return _user_to_public(existing)

