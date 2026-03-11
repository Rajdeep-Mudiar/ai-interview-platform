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

## Setup

### Backend

1. Navigate to `ai-interview-platform/backend`
2. Install dependencies:
   ```
   pip install -r requirements.txt
   ```
3. Start backend server:
   ```
   uvicorn main:app --reload
   ```

### Frontend

1. Navigate to `ai-interview-platform/frontend`
2. Install dependencies:
   ```
   npm install
   ```
3. Start frontend server:
   ```
   npm run dev
   ```

## Folder Structure

- `frontend/` — React app (UI, pages, components)
- `backend/` — FastAPI app (APIs, modules, reports)
- `ai-services/` — Python AI modules (face detection, voice, object detection)

## Key Endpoints

- `/analyze-resume` — Resume analysis
- `/generate-questions` — Interview question generator
- `/evaluate-answer` — AI answer evaluation
- `/generate-report` — PDF report generator
- `/hiring-decision` — Final hiring recommendation

## License

MIT
