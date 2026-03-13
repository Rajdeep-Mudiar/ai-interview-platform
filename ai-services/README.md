# CareBridge AI Proctoring Services

This service provides real-time AI-based proctoring for the CareBridge Interview Platform.

## Architecture

The service is split into three main components to ensure stability and compatibility across different operating systems (especially Windows):

1.  **`server.py`**: A FastAPI-based controller that manages the proctoring session. It launches the vision and voice proctors as standalone background processes.
2.  **`vision_proctor.py`**: A standalone script that uses MediaPipe (Face Mesh) and YOLOv8 to monitor eye gaze, multiple faces, and unauthorized objects (phones, laptops).
3.  **`voice_proctor.py`**: A standalone script that uses OpenAI's Whisper model to detect background speech and possible external assistance.

## Prerequisites

-   Python 3.10+
-   `ffmpeg` (required for Whisper voice transcription)
-   Webcam and Microphone access

## Installation

```bash
pip install -r requirements.txt
```

## Running the Service

1.  **Start the Controller Server**:
    ```bash
    python server.py
    ```
    The server will run on `http://localhost:8001`.

2.  **Start Proctoring**:
    Send a POST request to `/start` with the `user_id`:
    ```powershell
    Invoke-RestMethod -Uri http://localhost:8001/start -Method Post -Body '{"user_id": "test_user"}' -ContentType "application/json"
    ```

3.  **Check Status**:
    ```powershell
    Invoke-RestMethod -Uri http://localhost:8001/status -Method Get
    ```

4.  **Stop Proctoring**:
    ```powershell
    Invoke-RestMethod -Uri http://localhost:8001/stop -Method Post
    ```

## Files and Folders

-   `server.py`: FastAPI application entry point.
-   `vision_proctor.py`: Visual monitoring logic.
-   `voice_proctor.py`: Voice monitoring logic.
-   `face_landmarker.task`: Pre-trained MediaPipe model for face mesh.
-   `yolov8n.pt`: YOLOv8 model for object detection.
-   `ai_server.log`: Service logs.
