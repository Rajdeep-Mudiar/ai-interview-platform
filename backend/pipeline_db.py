import pymongo
from pydantic import BaseModel

client = pymongo.MongoClient("mongodb://localhost:27017/")
db = client["ai_interview_platform"]

class Interview(BaseModel):
    resume: str
    jd: str
    fit_score: int
    missing_skills: list
    questions: list
    suggestions: list
