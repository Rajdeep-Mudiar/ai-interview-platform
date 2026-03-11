# CareBridge AI Proctoring Services

This folder contains Python-based AI services used for real-time candidate proctoring during interviews.

## Overview

The services monitor the candidate via webcam and microphone to ensure interview integrity.

### 1. Main Proctoring Engine (`proctor_engine.py`)
This is the primary service that combines:
- **Multiple Face Detection**: Alerts if more than one person is in the frame.
- **Eye Gaze Tracking**: Alerts if the candidate looks away from the screen for extended periods.
- **Forbidden Object Detection**: Uses YOLOv8 to detect prohibited items like cell phones, laptops, or tablets.

**To run:**
```bash
python proctor_engine.py
```

### 2. Voice Proctoring (`voice_detection.py`)
Continuously monitors background audio to detect speech.
- **Whisper AI**: Uses OpenAI's Whisper model to transcribe and detect if anyone is speaking in the background.

**To run:**
```bash
python voice_detection.py
```

## Setup

1. **Install Dependencies**:
   ```bash
   pip install -r requirements.txt
   ```
   *Note: `pyaudio` may require system-level portaudio libraries (e.g., `brew install portaudio` on Mac or `apt-get install python3-pyaudio` on Linux).*

2. **Model Files**:
   - The first run of `proctor_engine.py` will automatically download the `yolov8n.pt` model.
   - The first run of `voice_detection.py` will automatically download the Whisper `base` model.

## Integration

All services send real-time JSON alerts to the backend via the `/alert` endpoint:
- **multiple_person**: More than one person detected.
- **eye_gaze**: Candidate looking away.
- **forbidden_object**: Cell phone or other device detected.
- **background_voice**: External speech detected.

The frontend dashboard polls these alerts to update the candidate's integrity score and show warnings.
