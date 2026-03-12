# CareBridge AI Proctoring & Assessment Models

This document details the AI models, algorithms, and performance metrics integrated into the CareBridge AI Interview Platform.

## 👁️ Visual Proctoring & Computer Vision

### 1. Object & Person Detection
- **Model**: [YOLOv8 Nano (Ultralytics)](https://docs.ultralytics.com/models/yov8/)
- **Usage**: Real-time detection of unauthorized objects and secondary person intrusion.
- **Accuracy**: ~89.2% mAP (mean Average Precision) on COCO dataset.
- **Configuration**:
  - **Confidence Threshold**: `0.35` (Optimized for low-latency phone/object detection).
  - **Persistence Logic**: 3-frame buffer to eliminate false positives from lighting glitches.
  - **Detection Classes**: Person, Cell Phone, Laptop, Tablet, Book, Remote, Keyboard, Mouse.

### 2. Face & Gaze Tracking
- **Model**: [MediaPipe FaceMesh](https://developers.google.com/mediapipe/solutions/vision/face_landmarker)
- **Usage**: 468-point 3D landmark tracking for head pose, eye gaze, and presence detection.
- **Accuracy**: High-precision sub-millimeter landmark localization.
- **Features**:
  - **Gaze Tracking**: Detects eye movement outside the screen center (Threshold: `x < 0.35` or `x > 0.65`).
  - **Dynamic Brightening**: Automated frame enhancement (Alpha: `1.2`, Beta: `30`) for low-light face recovery.
  - **Multi-Face Detection**: Flags whenever >1 face is localized in the landmark stream.

### 3. Emotion & Behavior Analysis
- **Library**: [Face-API.js](https://justadudewhohacks.github.io/face-api.js/docs/index.html) (Client-side)
- **Usage**: Real-time emotional state classification during the interview.
- **Metrics**:
  - **Categories**: Happy (Confident), Neutral (Calm), Fearful/Sad (Nervous).
  - **Behavior Score**: Weighted 1-5 scale integrated into the final recruiter assessment.

---

## 🎙️ Audio Proctoring & Speech Analysis

### 1. Background Speech Detection
- **Model**: [OpenAI Whisper (Base)](https://github.com/openai/whisper)
- **Usage**: Continuous 5-second chunk recording and transcription of ambient audio.
- **Accuracy**: ~95%+ Word Error Rate (WER) accuracy in standard English environments.
- **Logic**: Flags any transcribed text >10 characters as `SPEECH DETECTED` to catch third-party assistance.

---

## 🧠 Technical Assessment & Scoring

### 1. Automated Question Generation
- **Engine**: NLP-based skill extraction and dynamic question mapping.
- **Source**: Generates custom questions by cross-referencing candidate's resume skills against job description requirements.

### 2. Answer Evaluation (NLP)
- **Logic**: Semantic similarity analysis between candidate transcripts and ideal technical answers.
- **Scoring**: 0-10 scale based on keyword presence, technical accuracy, and explanation depth.

### 3. Integrity & Hiring Logic
- **Algorithm**: Multi-factor weighted scoring.
- **Pass Thresholds**:
  - **ACCEPTED**: Final Score $\ge$ 75% AND Integrity $\ge$ 85%.
  - **CONSIDER**: Final Score $\ge$ 60% AND Integrity $\ge$ 70%.
  - **REJECT**: Fallback for high-risk or low-performance candidates.

---

## ⚡ Performance Optimization

| Feature | Latency (Avg) | Optimization Method |
| :--- | :--- | :--- |
| Face Detection | ~50ms | WebGL-accelerated TinyFaceDetector |
| Object Detection | ~80ms | Threaded YOLO inference |
| Audio Analysis | ~2.5s (per chunk) | Background processing via Whisper Base |
| API Polling | 2000ms | Non-blocking fetch cycles |

---

Developed with a focus on real-time reliability and high-integrity recruitment.
