# CareBridge AI Proctoring Services

This folder contains the Python-based AI proctoring services used for real-time candidate monitoring. These services use advanced Computer Vision and Audio Analysis to ensure interview integrity.

## 🚀 Quick Start (Unified Entry Point)

The simplest way to run all proctoring services simultaneously is using the `server.py` script. This will launch both the Visual and Voice proctoring engines in parallel.

```bash
# Install dependencies first
pip install -r requirements.txt

# Run the unified proctoring server
python server.py
```

---

## 🛠️ Core Services

### 1. Unified Proctoring Server (`server.py`)
This script acts as the main entry point, managing multiple processes:
- **Main Process**: Runs the Visual Proctor (camera feed and UI).
- **Background Process**: Runs the Voice Proctor (microphone monitoring).
- **Log Management**: Automatically generates `ai_services.log` for debugging.

### 2. Visual Proctoring Engine (`proctor_engine.py`)
A comprehensive vision-based system that monitors:
- **Multi-Face Detection**: Uses MediaPipe to alert if more than one person is visible.
- **Eye Gaze Tracking**: Detects if the candidate is looking away from the screen for too long.
- **Object Detection**: Uses YOLOv8 to identify forbidden items like **cell phones**, **laptops**, or **tablets**.

### 3. Voice Proctoring Engine (`voice_detection.py`)
A speech-based system that uses **OpenAI's Whisper AI** for:
- **Continuous Audio Capture**: Records short audio chunks periodically.
- **Speech-to-Text Analysis**: Transcribes background noise to detect if anyone is speaking or providing assistance.
- **Dynamic Alerts**: Sends alerts to the backend if significant background speech is detected.

---

## 📋 Requirements & Setup

1. **Python Dependencies**:
   ```bash
   pip install -r requirements.txt
   ```
   *Note: On Windows, ensure you have the necessary Visual C++ Build Tools for certain libraries like `pyaudio`.*

2. **Automated Model Downloads**:
   The first time you run the server, it will automatically download:
   - **YOLOv8n**: For object detection (~6MB).
   - **Whisper 'base' Model**: For voice analysis (~140MB).

---

## 🔗 Integration Workflow

All services communicate with the main FastAPI backend via the `/alert` endpoint:
- **`multiple_person`**: Multiple faces detected.
- **`eye_gaze`**: Candidate looking away.
- **`forbidden_object`**: Prohibited device (phone/laptop) detected.
- **`background_voice`**: External speech/assistance detected.

The candidate's **Integrity Score** is automatically reduced based on these alerts. If the score hits **0**, the interview is automatically terminated.
