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

app = FastAPI()

app.add_middleware(
CORSMiddleware,
allow_origins=["*"],
allow_methods=["*"],
allow_headers=["*"],
)

alerts = []

@app.post("/alert")
def receive_alert(data: dict):

    alerts.append(data)

    return {"status":"received"}

@app.get("/alerts")
def get_alerts():

    return alerts

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