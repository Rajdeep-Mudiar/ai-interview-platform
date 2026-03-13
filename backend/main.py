from fastapi import FastAPI, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from resume_parser.parser import parse_resume
import shutil
from jd_matcher.matcher import analyze_candidate
from ai_interviewer.question_generator import generate_questions
from ai_interviewer.evaluator import analyze_answer
from analytics.scoring import calculate_final_score
from analytics.integrity import cheating_risk
from analytics.explain import generate_explanation
from database.store import save_candidate
from analytics.resume_advisor import resume_suggestions
from ai_interviewer.ollama_questions import generate_ai_questions
from analytics.emotion import analyze_emotions
from leaderboard import router as leaderboard_router
from pipeline_db import db, Interview

from routes.ranking import router as ranking_router
from routes.resume_analysis import router as resume_router
from routes.interview_questions import router as question_router
from routes.evaluate_answer import router as eval_router
from routes.report import router as report_router
from routes.hiring_decision import router as decision_router
from routes.auth import router as auth_router
from routes.jobs import router as jobs_router
from routes.stats import router as stats_router
from routes.monitoring import router as monitoring_router

app = FastAPI()
app.include_router(ranking_router)
app.include_router(resume_router)
app.include_router(question_router)
app.include_router(eval_router)
app.include_router(report_router)
app.include_router(decision_router)
app.include_router(auth_router)
app.include_router(jobs_router)
app.include_router(stats_router)
app.include_router(leaderboard_router)
app.include_router(monitoring_router)

app.add_middleware(
CORSMiddleware,
allow_origins=["*"],
allow_methods=["*"],
allow_headers=["*"],
)

@app.post("/match_jd")
def match_jd(data: dict):
    resume_text = data["resume"]
    jd_text = data["jd"]
    result = analyze_candidate(resume_text, jd_text)
    return result

@app.post("/final_score")

def final_score(data:dict):

    resume_score = data["resume_score"]
    interview_score = data["interview_score"]
    cheating_flags = data["cheating_flags"]

    result = calculate_final_score(
        resume_score,
        interview_score,
        cheating_flags
    )

    return result

@app.post("/cheating_score")
def cheating(data: dict):
    warnings = data["warnings"]
    risk = cheating_risk(warnings)
    return {"cheating_risk": risk}

@app.post("/explain_decision")

def explain(data:dict):

    explanation = generate_explanation(
        data["resume_score"],
        data["interview_score"],
        data["missing_skills"],
        data["cheating_risk"]
    )

    return {"explanation": explanation}

@app.post("/save_candidate")
def save(data: dict):
    save_candidate(data)
    return {"status": "saved"}

@app.post("/resume_suggestions")

def suggest(data:dict):

    suggestions = resume_suggestions(
        data["missing_skills"],
        data["resume"]
    )

    return {"suggestions": suggestions}

@app.post("/generate_ai_questions")
def ai_questions(data:dict):

    questions = generate_ai_questions(
        data["resume"],
        data["jd"],
        data["missing_skills"]
    )

    return {"questions":questions}

@app.post("/emotion_analysis")
def emotion(data: dict):
    result = analyze_emotions(data["emotions"])
    return {"emotion_summary": result}

@app.post("/interview")
async def save_interview(interview: Interview):
    from database.mongo import results_col
    results_col.insert_one(interview.dict())
    return {"message": "Interview saved successfully"}
