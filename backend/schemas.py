from pydantic import BaseModel
from typing import List, Optional

class MatchJDRequest(BaseModel):
    resume: str
    jd: str

class FinalScoreRequest(BaseModel):
    resume_score: float
    interview_score: float
    cheating_flags: List[str]

class CheatingScoreRequest(BaseModel):
    warnings: List[str]

class ExplainDecisionRequest(BaseModel):
    resume_score: float
    interview_score: float
    missing_skills: List[str]
    cheating_risk: str

class SaveCandidateRequest(BaseModel):
    name: str
    email: str
    score: float
    status: str

class ResumeSuggestionsRequest(BaseModel):
    missing_skills: List[str]
    resume: str

class EmotionAnalysisRequest(BaseModel):
    emotions: List[str]
