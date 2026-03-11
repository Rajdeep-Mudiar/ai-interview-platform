import pymongo
from pydantic import BaseModel

client = pymongo.MongoClient("mongodb://localhost:27017/")
db = client["ai_interview_platform"]

class Interview(BaseModel):
    user_id: str
    name: str
    resume: str
    jd: str
    fit_score: int
    overallScore: int
    timeTaken: int
    integrity: int
    missing_skills: list
    questions: list
    suggestions: list
