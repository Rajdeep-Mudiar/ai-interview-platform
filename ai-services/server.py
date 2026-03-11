import multiprocessing
import logging
import sys
import time
import os
from proctor_engine import ProctorEngine
from voice_detection import VoiceProctor

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.StreamHandler(sys.stdout),
        logging.FileHandler("ai_services.log")
    ]
)
logger = logging.getLogger("AI-Server")

def run_voice_proctor():
    """Function to run the voice proctor in a separate process."""
    try:
        logger.info("Initializing Voice Proctor...")
        proctor = VoiceProctor()
        proctor.run()
    except Exception as e:
        logger.error(f"Voice Proctor process failed: {e}")

def run_visual_proctor():
    """Function to run the visual proctor in the main process."""
    try:
        logger.info("Initializing Visual Proctor (OpenCV/MediaPipe)...")
        engine = ProctorEngine()
        engine.run()
    except Exception as e:
        logger.error(f"Visual Proctor failed: {e}")

def main():
    logger.info("="*50)
    logger.info("CareBridge Unified AI Proctoring Server Starting")
    logger.info("="*50)
    
    # 1. Start Voice Proctor in a background process
    # This uses Whisper AI for background speech detection
    voice_process = multiprocessing.Process(target=run_voice_proctor, name="VoiceProctorProcess")
    voice_process.daemon = True # Ensure it exits when main process exits
    voice_process.start()
    logger.info("✅ Voice Proctoring process started in background.")

    # 2. Run Visual Proctor in the main thread
    # This is required because OpenCV GUI operations (imshow) must run in the main thread
    logger.info("✅ Starting Visual Proctoring (Camera & Vision AI)...")
    try:
        run_visual_proctor()
    except KeyboardInterrupt:
        logger.info("User requested shutdown.")
    except Exception as e:
        logger.error(f"Main server execution error: {e}")
    finally:
        # Clean up
        logger.info("Shutting down AI Proctoring processes...")
        if voice_process.is_alive():
            voice_process.terminate()
            voice_process.join()
        logger.info("CareBridge AI Server stopped.")

if __name__ == "__main__":
    # Needed for Windows multiprocessing support
    multiprocessing.freeze_support()
    main()
