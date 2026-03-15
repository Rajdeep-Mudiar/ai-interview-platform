# AI Interview Proctoring Platform

An end-to-end AI-powered recruitment solution featuring automated interview evaluation, integrity monitoring, and recruiter analytics.

### **Core Features**
- **AI Interviews**: Dynamic question generation and Gemini-powered answer evaluation (0-10 score).
- **Proctoring**: Real-time integrity tracking with face detection and multiple-person alerts.
- **Recruiter Dashboard**: Job management, preferred answer configuration, and candidate leaderboard.
- **Re-evaluation Workflow**: Integrated candidate requests and recruiter approval/rejection system.
- **Analytics**: Behavioral insights, integrity scoring, and performance metrics.

### **Tech Stack**
- **Frontend**: React, Vite, TailwindCSS, face-api.js, Framer Motion.
- **Backend**: FastAPI, MongoDB (pymongo), Google Gemini AI, bcrypt.

### **Quick Setup**

**1. Backend**
- Install dependencies: `pip install -r backend/requirements.txt`
- Configure `.env`: `MONGO_URI`, `MONGO_DB_NAME`, `GEMINI_API_KEYS`
- Start server: `uvicorn backend.main:app --reload`

**2. Frontend**
- Install dependencies: `npm install`
- Start development: `npm run dev`

### **Project Structure**
- `backend/`: API routes, AI evaluation logic, and database layer.
- `frontend/`: React components, dashboards, and interview UI.
- `ai-services/`: Standalone proctoring and detection modules.
