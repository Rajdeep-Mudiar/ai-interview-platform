import cv2
import mediapipe as mp
from ultralytics import YOLO
import requests
import time
import logging

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

class ProctorEngine:
    def __init__(self, api_url="http://127.0.0.1:8000/alert", model_path="yolov8n.pt"):
        self.api_url = api_url
        
        # Load YOLO model
        try:
            self.yolo = YOLO(model_path)
        except Exception as e:
            logger.error(f"Failed to load YOLO model: {e}")
            self.yolo = None

        # MediaPipe FaceMesh for gaze and face detection
        self.mp_face_mesh = mp.solutions.face_mesh
        self.face_mesh = self.mp_face_mesh.FaceMesh(
            max_num_faces=5, # Allow detecting multiple faces to trigger alert
            refine_landmarks=True,
            min_detection_confidence=0.5,
            min_tracking_confidence=0.5
        )
        
        self.cap = None
        self.last_alert_time = {}

    def send_alert(self, alert_type, message, cooldown=5):
        """Send an alert with a cooldown period to avoid spamming the backend."""
        now = time.time()
        if alert_type in self.last_alert_time and (now - self.last_alert_time[alert_type]) < cooldown:
            return

        try:
            requests.post(self.api_url, json={"type": alert_type, "message": message}, timeout=2)
            self.last_alert_time[alert_type] = now
            logger.info(f"ALERT SENT: {alert_type} - {message}")
        except Exception as e:
            logger.error(f"Failed to send alert to backend: {e}")

    def process_frame(self, frame):
        rgb_frame = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
        
        # 1. Face and Gaze Detection
        results = self.face_mesh.process(rgb_frame)
        face_count = 0
        if results.multi_face_landmarks:
            face_count = len(results.multi_face_landmarks)
            
            if face_count > 1:
                self.send_alert("multiple_person", f"{face_count} people detected in frame")

            for face_landmarks in results.multi_face_landmarks:
                # Gaze detection (using landmarks for eyes)
                left_eye_center = face_landmarks.landmark[468] # MediaPipe Iris/Eye center
                right_eye_center = face_landmarks.landmark[473]
                
                gaze_text = "Looking Center"
                if left_eye_center.x < 0.35:
                    gaze_text = "Looking Left"
                    self.send_alert("eye_gaze", "Candidate looking away (Left)")
                elif right_eye_center.x > 0.65:
                    gaze_text = "Looking Right"
                    self.send_alert("eye_gaze", "Candidate looking away (Right)")
                
                # Draw landmarks for visual feedback (optional)
                cv2.putText(frame, gaze_text, (30, 50), cv2.FONT_HERSHEY_SIMPLEX, 0.7, (0, 255, 0), 2)
        else:
            self.send_alert("no_face", "No face detected in frame")

        # 2. Object Detection (Phone detection)
        if self.yolo:
            detections = self.yolo(frame, verbose=False)
            for r in detections:
                for box in r.boxes:
                    cls = int(box.cls[0])
                    label = self.yolo.names[cls]
                    if label.lower() in ["cell phone", "laptop", "tablet"]:
                        x1, y1, x2, y2 = map(int, box.xyxy[0])
                        cv2.rectangle(frame, (x1, y1), (x2, y2), (0, 0, 255), 2)
                        cv2.putText(frame, f"FORBIDDEN: {label}", (x1, y1 - 10),
                                    cv2.FONT_HERSHEY_SIMPLEX, 0.5, (0, 0, 255), 2)
                        self.send_alert("forbidden_object", f"Detected forbidden object: {label}")

        return frame

    def run(self):
        self.cap = cv2.VideoCapture(0)
        if not self.cap.isOpened():
            logger.error("Could not open webcam.")
            return

        logger.info("AI Proctor Engine Running (Press 'ESC' to exit)...")
        while True:
            ret, frame = self.cap.read()
            if not ret:
                break

            processed_frame = self.process_frame(frame)
            cv2.imshow("CareBridge AI Proctoring", processed_frame)
            
            if cv2.waitKey(1) & 0xFF == 27: # ESC key
                break

        self.cap.release()
        cv2.destroyAllWindows()
        logger.info("Proctor Engine stopped.")

if __name__ == "__main__":
    engine = ProctorEngine()
    engine.run()
