import multiprocessing
import logging
import sys
import time
import os
import uvicorn
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from proctor_engine import ProctorEngine
from voice_detection import VoiceProctor

# Configure logging (set to WARNING to reduce console logs)
logging.basicConfig(
    level=logging.WARNING,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.StreamHandler(sys.stdout),
        logging.FileHandler("ai_services.log")
    ]
)
logger = logging.getLogger("AI-Server")

# To increase log detail, set level=logging.INFO or level=logging.DEBUG

app = FastAPI(title="CareBridge AI Proctoring Controller")

# Enable CORS for frontend control
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# Global process holders
vision_process = None
voice_process = None
active_user_id = None

def run_voice_proctor(user_id):
    """Function to run the voice proctor in a separate process."""
    try:
        logger.info(f"Initializing Voice Proctor for user {user_id}...")
        proctor = VoiceProctor()
        proctor.user_id = user_id
        proctor.run()
    except Exception as e:
        logger.error(f"Voice Proctor process failed: {e}")

def run_visual_proctor(user_id):
    """Function to run the visual proctor in a separate process."""
    try:
        logger.info(f"Initializing Visual Proctor for user {user_id} (OpenCV/MediaPipe)...")
        engine = ProctorEngine()
        engine.user_id = user_id
        engine.run()
    except Exception as e:
        logger.error(f"Visual Proctor failed: {e}")

@app.get("/status")
def get_status():
    return {
        "vision_active": vision_process is not None and vision_process.is_alive(),
        "voice_active": voice_process is not None and voice_process.is_alive(),
        "active_user_id": active_user_id
    }

@app.post("/start")
def start_proctoring(data: dict):
    global vision_process, voice_process, active_user_id
    
    user_id = data.get("user_id", "unknown")
    
    if (vision_process and vision_process.is_alive()) or (voice_process and voice_process.is_alive()):
        return {"message": "Proctoring services are already running.", "active_user_id": active_user_id}
    
    logger.info(f"Starting CareBridge AI Proctoring Services for user {user_id}...")
    active_user_id = user_id
    
    # 1. Start Voice Proctor in background
    voice_process = multiprocessing.Process(target=run_voice_proctor, args=(user_id,), name="VoiceProctorProcess")
    voice_process.daemon = True
    voice_process.start()
    
    # 2. Start Visual Proctor in background (it will open its own window)
    vision_process = multiprocessing.Process(target=run_visual_proctor, args=(user_id,), name="VisualProctorProcess")
    vision_process.daemon = True
    vision_process.start()
    
    logger.info("✅ All AI Proctoring services launched.")
    return {"message": "AI Proctoring services started successfully.", "user_id": user_id}

@app.post("/stop")
def stop_proctoring():
    global vision_process, voice_process, active_user_id
    
    logger.info(f"Shutting down AI Proctoring services for user {active_user_id}...")
    
    if vision_process and vision_process.is_alive():
        vision_process.terminate()
        vision_process.join()
        vision_process = None
        
    if voice_process and voice_process.is_alive():
        voice_process.terminate()
        voice_process.join()
        voice_process = None
        
    active_user_id = None
    logger.info("AI Proctoring services stopped.")
    return {"message": "AI Proctoring services stopped successfully."}

if __name__ == "__main__":
    # Needed for Windows multiprocessing support
    multiprocessing.freeze_support()

    logger.info("="*50)
    logger.info("CareBridge AI Proctoring Controller Server Starting")
    logger.info("Running on http://127.0.0.1:8001")
    logger.info("Waiting for interview to start via POST /start...")
    logger.info("="*50)

    # Start the control server on port 8001 (proctoring starts only when /start is called)
    uvicorn.run(app, host="127.0.0.1", port=8001, log_level="warning")
