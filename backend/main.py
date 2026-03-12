import logging
logging.getLogger("uvicorn.access").setLevel(logging.WARNING)

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

from routes.ranking import router as ranking_router
from routes.resume_analysis import router as resume_router
from routes.interview_questions import router as question_router
from routes.evaluate_answer import router as eval_router
from routes.report import router as report_router
from routes.hiring_decision import router as decision_router
from routes.auth import router as auth_router
from routes.jobs import router as jobs_router
from routes.stats import router as stats_router
from routes.export import router as export_router

app = FastAPI()

# IMPORTANT: Add CORS middleware BEFORE including any routers
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

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
app.include_router(export_router)

from typing import List, Dict, Any
from datetime import datetime

# Existing alerts in memory (consider DB for production)
alerts: List[Dict[str, Any]] = []

@app.post("/alert")
def receive_alert(data: dict):
    # Ensure data has required fields, add if missing
    if "timestamp" not in data:
        data["timestamp"] = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    if "severity" not in data:
        # Default severity based on type
        high_severity_types = ["multiple_person", "forbidden_object", "background_voice", "no_face"]
        data["severity"] = "high" if data.get("type") in high_severity_types else "medium"
    
    alerts.append(data)
    print(f"DEBUG: Alert received: {data}")
    return {"status": "received"}

from analytics.integrity import cheating_risk, calculate_proctoring_score

@app.get("/alerts")
def get_alerts(user_id: str = None):
    if user_id:
        return [a for a in alerts if a.get("user_id") == user_id]
    return alerts

@app.get("/proctoring_summary")
def get_proctoring_summary(user_id: str = None):
    user_alerts = [a for a in alerts if a.get("user_id") == user_id] if user_id else alerts
    score = calculate_proctoring_score(user_alerts)
    risk = cheating_risk(score)
    return {
        "score": score,
        "risk": risk,
        "alerts": user_alerts
    }

@app.delete("/alerts")
def clear_alerts(user_id: str = None):
    global alerts
    if user_id:
        alerts = [a for a in alerts if a.get("user_id") != user_id]
        return {"status": f"cleared alerts for user {user_id}"}
    alerts = []
    return {"status": "cleared all alerts"}

@app.post("/upload_resume")
async def upload_resume(file: UploadFile):
    file_path = f"resumes/{file.filename}"
    with open(file_path,"wb") as buffer:
        shutil.copyfileobj(file.file,buffer)
    result = parse_resume(file_path)
    return result

@app.post("/match_jd")
def match_jd(data: dict):
    resume_text = data["resume"]
    jd_text = data["jd"]
    result = analyze_candidate(resume_text, jd_text)
    return result

@app.post("/generate_questions")

def generate(data:dict):

    matched = data["matched_skills"]
    missing = data["missing_skills"]

    questions = generate_questions(missing,matched)

    return {"questions":questions}

@app.post("/evaluate_answer")

def evaluate(data:dict):

    answer = data["answer"]
    question = data["question"]

    result = analyze_answer(answer,question)

    return result

@app.post("/final_score")
def final_score(data:dict):
    result = calculate_final_score(
        data.get("resume_score", 0),
        data.get("interview_score", 0),
        data.get("integrity_score", 100),
        data.get("proctoring_score", 100)
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
