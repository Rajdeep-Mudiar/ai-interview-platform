# AI Interview & Recruitment Platform

## Overview

A full-stack platform for automated resume screening, AI-powered interviews, behavioral analysis, and recruiter dashboards. Built with React (frontend) and FastAPI (backend), featuring real-time face detection, emotion analysis, resume parsing, interview scoring, and PDF report generation.

## Features

- Resume parsing and job matching (PDF upload, skill extraction)
- AI interview with question generator, answer evaluation, and behavioral scoring
- Real-time face detection and integrity scoring (face-api.js)
- Emotion detection and behavioral insights during interview
- Recruiter dashboard with candidate summary, hiring recommendation, and downloadable reports
- Automatic PDF report generation for interview results

## Tech Stack

- Frontend: React, Tailwind CSS, face-api.js
- Backend: FastAPI, Python, scikit-learn, spaCy, pdfplumber, sentence-transformers, reportlab

## Getting Started

### Prerequisites

- **Python** 3.10+ (virtual env recommended)
- **Node.js** 18+ and **npm**

All commands below assume you start from:

```bash
cd ai-interview-platform/ai-interview-platform
```

### 1. Backend (FastAPI)

1. Navigate to the backend folder:

   ```bash
   cd backend
   ```

2. (Optional but recommended) create and activate a virtual environment.

3. Install Python dependencies:

   ```
   pip install -r requirements.txt
   ```

4. Start the backend server (default on `http://127.0.0.1:8000`):

   ```
   python -m uvicorn main:app --reload --host 127.0.0.1 --port 8000
   ```

### 2. Frontend (React + Vite)

1. In a **separate terminal**, navigate to the frontend folder:

   ```bash
   cd ai-interview-platform/ai-interview-platform/frontend
   ```

2. Install npm dependencies:

   ```
   npm install
   ```

3. Start the dev server (Vite):

   ```
   npm run dev -- --host 127.0.0.1 --port 5173
   ```

4. Open the app in your browser:

- Frontend: `http://127.0.0.1:5173`
- Backend API: `http://127.0.0.1:8000`

### 3. Optional: Landing Video Setup

The landing page (home) can autoplay a login/welcome video.

- Place your video file at:

  ```
  frontend/public/videos/login.mp4
  ```

The app will automatically load it from `/videos/login.mp4`.

## Folder Structure

- `frontend/` — React app (UI, pages, components)
- `backend/` — FastAPI app (APIs, modules, reports)
- `ai-services/` — Python AI modules (face detection, voice, object detection)

## Key Endpoints

- `/analyze-resume` — Resume analysis
- `/generate-questions` — Interview question generator (skills → questions)
- `/evaluate-answer` — AI answer evaluation (score + feedback)
- `/generate-report` — PDF report generator
- `/hiring-decision` — Final hiring recommendation

## License

MIT
