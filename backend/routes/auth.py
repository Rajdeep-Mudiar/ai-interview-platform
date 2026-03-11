from fastapi import APIRouter, HTTPException, Body
from pydantic import BaseModel, EmailStr
from datetime import datetime
from typing import Optional
import bcrypt
import logging

from database.mongo import get_users_col

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/auth", tags=["auth"])
users_col = get_users_col()

class UserBase(BaseModel):
    email: EmailStr
    role: str  # "candidate" or "recruiter"

class SignUpBody(UserBase):
    name: str
    password: str
    company: Optional[str] = None  # Optional field, primarily for recruiters

class SignInBody(UserBase):
    password: str

def _user_to_public(doc):
    return {
        "id": str(doc["_id"]),
        "name": doc.get("name"),
        "email": doc.get("email"),
        "role": doc.get("role"),
        "company": doc.get("company"),
        "created_at": doc.get("created_at")
    }

@router.post("/signup")
def signup(body: SignUpBody):
    """
    Explicit sign-up endpoint. 
    Checks if a user with the given email and role already exists.
    """
    logger.info(f"Signup request received: {body.email} as {body.role}")
    if body.role not in {"candidate", "recruiter"}:
        raise HTTPException(status_code=400, detail="Invalid role. Must be 'candidate' or 'recruiter'.")

    # Check if user already exists with this email AND role
    existing = users_col.find_one({"email": body.email, "role": body.role})
    if existing:
        raise HTTPException(status_code=409, detail=f"User with this email already exists as a {body.role}.")

    # Hash the password
    password_hash = bcrypt.hashpw(
        body.password.encode("utf-8"), bcrypt.gensalt()
    )

    # Prepare document
    user_doc = {
        "name": body.name,
        "email": body.email,
        "role": body.role,
        "password_hash": password_hash,
        "company": body.company if body.role == "recruiter" else None,
        "created_at": datetime.utcnow(),
    }

    try:
        result = users_col.insert_one(user_doc)
        user_doc["_id"] = result.inserted_id
        logger.info(f"New {body.role} registered successfully: {body.email}")
        return _user_to_public(user_doc)
    except Exception as e:
        logger.error(f"Error during signup: {e}")
        raise HTTPException(status_code=500, detail="Internal server error during registration.")

@router.post("/signin")
def signin(body: SignInBody):
    """
    Explicit sign-in endpoint.
    Validates credentials against email and role.
    """
    logger.info(f"Signin request received: {body.email} as {body.role}")
    if body.role not in {"candidate", "recruiter"}:
        raise HTTPException(status_code=400, detail="Invalid role.")

    # Find the user
    user = users_col.find_one({"email": body.email, "role": body.role})
    
    if not user:
        logger.warning(f"Signin failed: User not found - {body.email} as {body.role}")
        raise HTTPException(status_code=401, detail="Invalid email or password.")

    # Verify password
    if not bcrypt.checkpw(body.password.encode("utf-8"), user["password_hash"]):
        logger.warning(f"Signin failed: Incorrect password for {body.email}")
        raise HTTPException(status_code=401, detail="Invalid email or password.")

    logger.info(f"User signed in successfully: {body.email} as {body.role}")
    return _user_to_public(user)
