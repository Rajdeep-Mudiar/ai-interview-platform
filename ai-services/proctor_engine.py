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
        self.user_id = "unknown"
        
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
        self.gaze_away_count = 0
        self.gaze_start_time = None
        self.intrusion_count = 0

    def send_alert(self, alert_type, message, severity="medium", cooldown=5):
        """Send an alert with a timestamp and severity score."""
        now = time.time()
        if alert_type in self.last_alert_time and (now - self.last_alert_time[alert_type]) < cooldown:
            return

        severity_scores = {"high": 1.0, "medium": 0.5, "low": 0.2}
        payload = {
            "user_id": self.user_id,
            "type": alert_type,
            "message": message,
            "severity": severity,
            "severity_score": severity_scores.get(severity.lower(), 0.5),
            "timestamp": time.strftime("%Y-%m-%d %H:%M:%S", time.localtime(now))
        }

        try:
            requests.post(self.api_url, json=payload, timeout=2)
            self.last_alert_time[alert_type] = now
            logger.info(f"ALERT SENT: [{severity.upper()}] {alert_type} - {message}")
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
                self.send_alert("multiple_person", "multiple persons detected", severity="high")
                cv2.putText(frame, "multiple persons detected", (30, 80), cv2.FONT_HERSHEY_SIMPLEX, 0.7, (0, 0, 255), 2)

            for face_landmarks in results.multi_face_landmarks:
                # Gaze detection (using landmarks for eyes)
                # MediaPipe Iris landmarks: 468, 473
                left_eye_center = face_landmarks.landmark[468] 
                right_eye_center = face_landmarks.landmark[473]
                
                # Check if looking away (too far left or right)
                looking_away = False
                gaze_text = "Looking Center"
                
                if left_eye_center.x < 0.35 or right_eye_center.x > 0.65:
                    looking_away = True
                    gaze_text = "look at the center"
                
                if looking_away:
                    if self.gaze_start_time is None:
                        self.gaze_start_time = time.time()
                    
                    away_duration = time.time() - self.gaze_start_time
                    if away_duration > 2: # Looking away for more than 2 seconds
                        self.send_alert("eye_gaze", "look at the center", severity="medium")
                        self.gaze_away_count += 1
                else:
                    self.gaze_start_time = None

                # Visual feedback
                color = (0, 0, 255) if looking_away else (0, 255, 0)
                cv2.putText(frame, gaze_text, (30, 50), cv2.FONT_HERSHEY_SIMPLEX, 0.7, color, 2)
        else:
            self.send_alert("no_face", "No face detected in frame", severity="high")
            cv2.putText(frame, "No face detected", (30, 140), cv2.FONT_HERSHEY_SIMPLEX, 0.7, (0, 0, 255), 2)

        # 2. Object and Intrusion Detection (Phone, Person, etc.)
        if self.yolo:
            detections = self.yolo(frame, verbose=False)
            person_count = 0
            for r in detections:
                for box in r.boxes:
                    cls = int(box.cls[0])
                    label = self.yolo.names[cls]
                    
                    if label == "person":
                        person_count += 1
                    
                    if label.lower() in ["cell phone", "phone", "laptop", "tablet", "book", "remote", "keyboard", "mouse"]:
                        x1, y1, x2, y2 = map(int, box.xyxy[0])
                        cv2.rectangle(frame, (x1, y1), (x2, y2), (0, 0, 255), 2)
                        cv2.putText(frame, "foreign object detected", (x1, y1 - 10),
                                    cv2.FONT_HERSHEY_SIMPLEX, 0.5, (0, 0, 255), 2)
                        self.send_alert("forbidden_object", "foreign object detected", severity="high")

            if person_count > 1:
                self.send_alert("body_intrusion", "body part intrusion detected", severity="high")
                cv2.putText(frame, "body part intrusion detected", (30, 110), cv2.FONT_HERSHEY_SIMPLEX, 0.7, (0, 0, 255), 2)

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
