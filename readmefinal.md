# CareBridge AI Interview & Hiring Platform

CareBridge is a professional, AI-powered recruitment platform designed to automate resume screening, proctoring, and interview analysis.

## Core Features

- **Candidate Pipeline**
  - **Job Listing**: Candidates can browse and select from a list of available jobs posted by recruiters.
  - **Resume Analysis**: Upload PDF resumes to get a detailed match score against job descriptions.
  - **Categorized Skills**: Automated extraction of Languages, Frameworks, and Tools/Cloud skills.
  - **AI Suggestions**: Personalized tips for candidates to improve their resumes based on job gaps.
  - **Contact Extraction**: Automated detection of candidate email and phone from resumes.

- **AI Interview & Proctoring**
  - **Video Interview**: Real-time AI-guided video interviews with technical questions.
  - **Dynamic Questions**: Questions are either recruiter-provided or AI-generated based on candidate skills.
  - **Speech-to-Text**: Candidate responses are captured using browser-based speech recognition.
  - **AI Evaluation**: Immediate technical scoring of candidate answers using keyword and context analysis.
  - **Integrity Tracking**:
    - **Face Detection**: Alerts if no face or multiple faces are detected.
    - **Eye Gaze Tracking**: Detects if a candidate is looking away from the screen.
    - **Object Detection (AI Services)**: Background monitoring for forbidden objects like cell phones.
    - **Voice Proctoring (AI Services)**: Detects background speech/assistance using Whisper AI.
  - **Integrity Score**: Real-time scoring that decreases based on proctoring alerts.
  - **Auto-Termination**: Interviews are automatically terminated if the integrity score reaches 0 to prevent further cheating.

- **Recruiter Tools**
  - **Job Management**: Recruiters can create and manage job postings with custom technical questions.
  - **Dashboard Analytics**: Overview of total candidates joined and top-performing candidates.
  - **Leaderboard**: Rank candidates based on overall performance and integrity.
  - **Integrity Alerts History**: Review suspicious activities recorded during interviews.
  - **Hiring Decisions**: AI-generated recommendations (Hire, Consider, Reject) based on data.
  - **Professional PDF Reports**: Generate and download comprehensive candidate performance reports.

- **AI Proctoring Architecture**
  - **server.py**: FastAPI controller running on port 8001 that manages AI services.
  - **On-Demand Activation**: Camera and Voice services only start when the candidate explicitly begins the interview.
  - **Proctor Engine**: Advanced vision system using MediaPipe and YOLOv8.
  - **Voice Proctor**: Continuous background monitoring using OpenAI's Whisper model.
  - **Backend Integration**: Real-time alert polling from AI services into the candidate's interview session.

## Technology Stack

- **Frontend**: React, Tailwind CSS, face-api.js, Axios, React Router.
- **Backend**: FastAPI (Python), MongoDB (Pymongo), Spacy NLP, Scikit-learn, ReportLab.
- **AI Models**: YOLOv8 (Vision), OpenAI Whisper (Audio), Spacy (NLP), Sentence Transformers.

## Getting Started

1. **Backend**: `cd backend && pip install -r requirements.txt && uvicorn main:app --reload`
2. **Frontend**: `cd frontend && npm install && npm run dev`
3. **AI Services**: `cd ai-services && pip install -r requirements.txt && python run_all.py`
