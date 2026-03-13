import subprocess
import multiprocessing
import logging
import sys
import os
import uvicorn
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.StreamHandler(sys.stdout),
        logging.FileHandler("ai_server.log")
    ]
)
logger = logging.getLogger("AI-Server")

app = FastAPI(title="CareBridge AI Proctoring Controller")

# Enable CORS for frontend control
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# Global process holders
vision_process: Optional[subprocess.Popen] = None
voice_process: Optional[subprocess.Popen] = None
active_user_id: Optional[str] = None

class StartRequest(BaseModel):
    user_id: str

@app.get("/status")
def get_status():
    """Check if the proctoring services are active."""
    return {
        "vision_active": vision_process is not None and vision_process.poll() is None,
        "voice_active": voice_process is not None and voice_process.poll() is None,
        "active_user_id": active_user_id
    }

@app.post("/start")
def start_proctoring(request: StartRequest):
    """Launch vision and voice proctoring as background processes."""
    global vision_process, voice_process, active_user_id
    
    user_id = request.user_id
    
    # Check if already running
    if (vision_process and vision_process.poll() is None) or \
       (voice_process and voice_process.poll() is None):
        return {
            "message": "Proctoring services are already running.",
            "active_user_id": active_user_id
        }
    
    logger.info(f"[*] Starting AI Proctoring Services for user: {user_id}")
    active_user_id = user_id
    
    python_executable = sys.executable
    service_dir = os.path.dirname(os.path.abspath(__file__))
    
    # 1. Start Vision Proctor
    try:
        vision_process = subprocess.Popen(
            [python_executable, "vision_proctor.py", user_id],
            cwd=service_dir
        )
        logger.info("[+] Vision Proctor launched.")
    except Exception as e:
        logger.error(f"[-] Failed to launch Vision Proctor: {e}")
        return {"message": f"Failed to launch Vision Proctor: {str(e)}"}
        
    # 2. Start Voice Proctor
    try:
        voice_process = subprocess.Popen(
            [python_executable, "voice_proctor.py", user_id],
            cwd=service_dir
        )
        logger.info("[+] Voice Proctor launched.")
    except Exception as e:
        logger.error(f"[-] Failed to launch Voice Proctor: {e}")
        # Optionally terminate vision if voice fails
        if vision_process: vision_process.terminate()
        return {"message": f"Failed to launch Voice Proctor: {str(e)}"}
    
    logger.info("✅ All AI Proctoring services launched.")
    return {
        "message": "AI Proctoring services started successfully.",
        "user_id": user_id
    }

@app.post("/stop")
def stop_proctoring():
    """Terminate the background proctoring processes."""
    global vision_process, voice_process, active_user_id
    
    logger.info(f"[*] Shutting down AI Proctoring for user: {active_user_id}")
    
    if vision_process and vision_process.poll() is None:
        vision_process.terminate()
        vision_process = None
        logger.info("[-] Vision Proctor terminated.")
        
    if voice_process and voice_process.poll() is None:
        voice_process.terminate()
        voice_process = None
        logger.info("[-] Voice Proctor terminated.")
        
    active_user_id = None
    return {"message": "AI Proctoring services stopped successfully."}

if __name__ == "__main__":
    # Needed for Windows multiprocessing support
    multiprocessing.freeze_support()
    
    logger.info("="*50)
    logger.info("CareBridge AI Proctoring Controller Server Starting")
    logger.info("Running on http://127.0.0.1:8001")
    logger.info("="*50)
    
    uvicorn.run(app, host="0.0.0.0", port=8001)
