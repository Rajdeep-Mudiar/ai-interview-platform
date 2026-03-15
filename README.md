# AI Interview & Recruitment Platform

## Prerequisites

Install these before running the project:

- Python 3.10+
- Node.js 18+
- npm
- MongoDB
- ngrok for mobile HTTPS testing
- FFmpeg if you use Whisper voice features

## Environment Setup

### Backend environment

Create a file at `backend/.env` with:

```env
MONGO_URI=mongodb://localhost:27017
MONGO_DB_NAME=ai_interview_platform
```

Optional:

```env
MOBILE_MONITORING_BASE_URL=https://your-ngrok-frontend-url
```

Notes:

- `MONGO_URI` is required
- `MOBILE_MONITORING_BASE_URL` is used to generate secure QR links for mobile monitoring

## Install Dependencies

From the project root:

```bash
npm install
```

Install backend Python dependencies:

```bash
cd backend
pip install -r requirements.txt
cd ..
```

Install AI services Python dependencies:

```bash
cd ai-services
pip install -r requirements.txt
cd ..
```

Install frontend dependencies:

```bash
cd frontend
npm install
cd ..
```

## Configure ngrok

If you want mobile camera access over HTTPS, configure ngrok.

### 1. Verify ngrok is installed

```bash
ngrok version
```

### 2. Authenticate ngrok

```bash
ngrok config add-authtoken <YOUR_NGROK_TOKEN>
```

### 3. Verify ngrok config

```bash
ngrok config check
```

### 4. Start tunnels manually if needed

```bash
ngrok start --all --config .ngrok-dev.yml
```

### 5. Check tunnel status

Open:

```text
http://127.0.0.1:4040
```

This shows the tunnel URLs for:

- Frontend
- Backend
- AI service

Notes:

- `npm run dev-all` starts ngrok automatically
- The ngrok startup script writes `frontend/.env.local` with the active tunnel URLs
- Restart the frontend if tunnel URLs change

## Available Root Scripts

From the project root:

### Install Python dependencies for backend and AI services

```bash
npm run py-deps
```

### Start frontend only

```bash
npm run frontend
```

### Start backend only

```bash
npm run backend
```

### Start AI service only

```bash
npm run ai
```

### Start ngrok automation only

```bash
npm run ngrok
```

### Start everything for local desktop development

```bash
npm run dev-all-local
```

### Start everything with ngrok for mobile HTTPS testing

```bash
npm run dev-all
```

## Run The Entire Project

### Option 1: Local desktop development

Use this when you are testing only on your laptop or desktop.

```bash
npm run dev-all-local
```

This starts:

- Backend on `http://0.0.0.0:8000`
- AI service on `http://0.0.0.0:8001`
- Frontend on `http://0.0.0.0:5173`

### Option 2: Mobile HTTPS testing

Use this when testing dual monitoring from a phone.

```bash
npm run dev-all
```

This starts:

- Backend on port `8000`
- AI service on port `8001`
- Frontend on port `5173`
- ngrok tunnels for backend, AI service, and frontend

It also writes `frontend/.env.local` with:

- `VITE_API_BASE_URL`
- `VITE_AI_BASE_URL`
- `VITE_BACKEND_WS_BASE_URL`
- `VITE_MOBILE_MONITORING_BASE_URL`

## Manual Run Steps

If you prefer separate terminals:

### Terminal 1: Backend

```bash
cd backend
python -m uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

### Terminal 2: AI services

```bash
cd ai-services
python server.py
```

### Terminal 3: Frontend

```bash
cd frontend
npm run dev -- --host 0.0.0.0 --port 5173
```

### Terminal 4: Optional ngrok

```bash
ngrok http 5173
```

## URLs

### Local

- Frontend: `http://localhost:5173`
- Backend: `http://localhost:8000`
- Backend docs: `http://localhost:8000/docs`
- AI service: `http://localhost:8001`

## Dev Networking Notes

In development, the frontend uses Vite proxy routes:

- `/api` -> backend on `8000`
- `/ai` -> AI service on `8001`
- `/secondary-ai` -> secondary AI service on `8002` if used

This allows the frontend and mobile traffic to go through the same frontend origin during development.

If ngrok gives a new frontend hostname, update `allowedHosts` in `frontend/vite.config.js` before starting the frontend server.
