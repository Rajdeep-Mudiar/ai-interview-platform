from fastapi import FastAPI, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from resume_parser.parser import parse_resume
from jd_matcher.matcher import analyze_candidate
from analytics.scoring import calculate_final_score
from analytics.integrity import cheating_risk
from analytics.explain import generate_explanation
from analytics.resume_advisor import resume_suggestions
from analytics.emotion import analyze_emotions
from leaderboard import router as leaderboard_router
from schemas import (
    MatchJDRequest, FinalScoreRequest, CheatingScoreRequest,
    ExplainDecisionRequest, ResumeSuggestionsRequest,
    EmotionAnalysisRequest
)

from routes.ranking import router as ranking_router
from routes.resume_analysis import router as resume_router
from routes.interview_questions import router as question_router
from routes.report import router as report_router
from routes.hiring_decision import router as decision_router
from routes.auth import router as auth_router
from routes.jobs import router as jobs_router
from routes.stats import router as stats_router
from routes.monitoring import router as monitoring_router
from routes.evaluate_interview import router as interview_eval_router
from routes.reeval import router as reeval_router
from routes.alerts import router as alerts_router

app = FastAPI(title="AI Interview Proctoring Platform")

# Middlewares
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# Core Routers
app.include_router(auth_router)
app.include_router(jobs_router)
app.include_router(interview_eval_router)
app.include_router(alerts_router)
app.include_router(reeval_router)
app.include_router(leaderboard_router)
app.include_router(stats_router)
app.include_router(monitoring_router)

# Secondary Routers
app.include_router(resume_router)
app.include_router(question_router)
app.include_router(ranking_router)
app.include_router(report_router)
app.include_router(decision_router)

@app.get("/")
def health_check():
    return {"status": "ok", "message": "AI Interview Platform Backend is running"}

@app.post("/match_jd")
def match_jd(data: MatchJDRequest):
    result = analyze_candidate(data.resume, data.jd)
    return result

@app.post("/parse_resume")
async def parse_resume_route(file: UploadFile):
    result = parse_resume(file.file)
    return result

@app.post("/final_score")
def final_score(data: FinalScoreRequest):
    result = calculate_final_score(
        data.resume_score,
        data.interview_score,
        data.cheating_flags
    )
    return result

@app.post("/cheating_score")
def cheating(data: CheatingScoreRequest):
    risk = cheating_risk(data.warnings)
    return {"cheating_risk": risk}

@app.post("/explain_decision")
def explain(data: ExplainDecisionRequest):
    explanation = generate_explanation(
        data.resume_score,
        data.interview_score,
        data.missing_skills,
        data.cheating_risk
    )
    return {"explanation": explanation}

@app.post("/resume_suggestions")
def suggest(data: ResumeSuggestionsRequest):
    suggestions = resume_suggestions(
        data.missing_skills,
        data.resume
    )
    return {"suggestions": suggestions}

@app.post("/emotion_analysis")
def emotion(data: EmotionAnalysisRequest):
    result = analyze_emotions(data.emotions)
    return {"emotion_summary": result}
