# CareBridge AI Interview Platform

CareBridge is a high-integrity AI-powered interview platform designed to automate technical assessments while ensuring absolute candidate compliance through advanced proctoring.

## 🚀 Key Features

### 1. AI-Powered Technical Assessment
- **Smart Question Generation**: Dynamically generates interview questions based on candidate skills (from resume) and job requirements.
- **AI Answer Evaluation**: Uses NLP models to score candidate answers (0-10) in real-time.
- **Behavioral Insights**: Analyzes facial expressions during the interview to provide emotional and behavioral feedback (Confident, Calm, Nervous).

### 2. Advanced AI Proctoring System
The platform features a multi-layered proctoring engine that monitors candidates in real-time:
- **Visual Tracking (YOLOv8 + MediaPipe)**:
  - **Eye Gaze Tracking**: Detects if the candidate is looking away from the screen (`LOOK AT THE CENTER`).
  - **Multiple Face Detection**: Identifies if more than one person is present (`MULTIPLE PERSONS DETECTED`).
  - **Foreign Object Detection**: Detects unauthorized items like mobile phones, laptops, books, remotes, etc. (`FOREIGN OBJECT DETECTED`).
  - **Body Part Intrusion**: Detects suspicious movements like a hand passing notes (`BODY PART INTRUSION DETECTED`).
- **Audio Analysis (OpenAI Whisper)**:
  - Continuously records and transcribes background audio to identify potential external assistance (`SPEECH DETECTED`).
- **Browser Integrity**:
  - Monitors for tab switching or window minimization (`TAB SWITCHING DETECTED`).
- **Presence Monitoring**:
  - Real-time check for face presence (`NO FACE DETECTED`).

### 3. Recruiter Dashboard & Analytics
- **Live Integrity Alerts**: A real-time feed of candidate violations with numeric severity scores (1.0 for High, 0.5 for Medium).
- **Candidate Leaderboard**: Ranks candidates based on Technical Performance, Integrity Score, and Proctoring Compliance.
- **Automated PDF Reports**: Generates professional, multi-page reports including technical scores, behavioral analysis, and a detailed proctoring alert log.

---

## 🛠️ Technology Stack

- **Frontend**: React.js, Tailwind CSS, Face-API.js
- **Backend**: FastAPI (Python), MongoDB
- **AI/ML**:
  - **Vision**: YOLOv8 (Ultralytics), MediaPipe FaceMesh
  - **Audio**: OpenAI Whisper (Speech-to-Text)
  - **NLP**: Custom scoring algorithms for technical evaluation
- **Reporting**: ReportLab (PDF Generation)

---

## 📦 Project Structure

```text
ai-interview-platform/
├── ai-services/            # AI Proctoring Core (Python)
│   ├── proctor_engine.py   # Visual/Object detection logic
│   ├── voice_detection.py  # Audio/Whisper analysis
│   └── server.py           # AI Service Controller (Multi-user)
├── backend/                # API Backend (FastAPI)
│   ├── analytics/          # Scoring & Explainability models
│   ├── routes/             # Report & Leaderboard endpoints
│   └── database/           # MongoDB integration
└── frontend/               # React Application
    ├── src/pages/          # Interview & Recruiter Dashboard
    └── src/components/     # UI Components & Proctoring Overlay
```

---

## 🏁 How to Run

### 1. Start the Backend
```bash
cd backend
python main.py
```

### 2. Start the AI Proctoring Services
```bash
cd ai-services
python server.py
```

### 3. Start the Frontend
```bash
cd frontend
npm run dev
```

---

## 🛡️ Proctoring Warnings Table

| Violation | Message Displayed | Severity |
| :--- | :--- | :--- |
| Mobile/Forbidden Object | FOREIGN OBJECT DETECTED | HIGH |
| Looking Away | LOOK AT THE CENTER | MEDIUM |
| Multiple People | MULTIPLE PERSONS DETECTED | HIGH |
| Background Speech | SPEECH DETECTED | HIGH |
| Tab Switching | TAB SWITCHING DETECTED | MEDIUM |
| No Face Present | NO FACE DETECTED | HIGH |

---

Developed for high-integrity technical recruitment.
