import cv2
import mediapipe as mp
from ultralytics import YOLO
import requests
import time
import logging
import threading

# Configure logging (set to WARNING to reduce console logs)
logging.basicConfig(level=logging.WARNING, format='%(asctime)s - %(levelname)s - %(message)s')
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
        
        # Persistence counters to reduce false positives (glitches)
        self.violation_counts = {
            "multiple_person": 0,
            "no_face": 0,
            "forbidden_object": 0,
            "eye_gaze": 0,
            "body_intrusion": 0
        }
        self.persistence_threshold = 5 # Default frames for general alerts
        self.obj_persistence_threshold = 3 # Faster detection for objects like phones
        
        self.gaze_start_time = None
        self.last_fps_time = time.time()
        self.fps = 0

    def send_alert_async(self, payload):
        """Threaded alert sending to prevent main loop lag."""
        try:
            requests.post(self.api_url, json=payload, timeout=2)
            logger.info(f"ALERT SENT: [{payload['severity'].upper()}] {payload['type']} - {payload['message']}")
        except Exception as e:
            logger.error(f"Failed to send alert to backend: {e}")

    def send_alert(self, alert_type, message, severity="medium", cooldown=5):
        """Send an alert with a timestamp and severity score if persistence is met."""
        now = time.time()
        
        # Check cooldown
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

        # Send alert in a background thread
        threading.Thread(target=self.send_alert_async, args=(payload,), daemon=True).start()
        self.last_alert_time[alert_type] = now

    def process_frame(self, frame):
        rgb_frame = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
        h, w, _ = frame.shape
        
        # FPS Calculation
        curr_time = time.time()
        self.fps = 1 / (curr_time - self.last_fps_time)
        self.last_fps_time = curr_time
        cv2.putText(frame, f"FPS: {int(self.fps)}", (w - 100, 30), cv2.FONT_HERSHEY_SIMPLEX, 0.6, (0, 255, 0), 2)

        # 0. Basic Image Quality Check (Lighting)
        gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
        avg_brightness = cv2.mean(gray)[0]
        if avg_brightness < 40: # Too dark
            cv2.putText(frame, "LIGHTING TOO LOW", (30, 170), cv2.FONT_HERSHEY_SIMPLEX, 0.7, (0, 165, 255), 2)
        elif avg_brightness > 220: # Too bright
            cv2.putText(frame, "LIGHTING TOO BRIGHT", (30, 170), cv2.FONT_HERSHEY_SIMPLEX, 0.7, (0, 165, 255), 2)

        # 1. Face and Gaze Detection (MediaPipe)
        results = self.face_mesh.process(rgb_frame)
        face_count = 0
        
        if results.multi_face_landmarks:
            face_count = len(results.multi_face_landmarks)
            self.violation_counts["no_face"] = 0 # Reset no face counter
            
            # Multiple Face Detection Logic
            if face_count > 1:
                self.violation_counts["multiple_person"] += 1
                if self.violation_counts["multiple_person"] >= self.persistence_threshold:
                    self.send_alert("multiple_person", "multiple persons detected", severity="high")
                cv2.putText(frame, "MULTIPLE FACES!", (30, 80), cv2.FONT_HERSHEY_SIMPLEX, 0.7, (0, 0, 255), 2)
            else:
                self.violation_counts["multiple_person"] = 0

            # Single Face Landmark Logic (Gaze)
            for face_landmarks in results.multi_face_landmarks:
                # Gaze detection
                left_eye_center = face_landmarks.landmark[468] 
                right_eye_center = face_landmarks.landmark[473]
                
                looking_away = False
                if left_eye_center.x < 0.35 or right_eye_center.x > 0.65:
                    looking_away = True
                
                if looking_away:
                    self.violation_counts["eye_gaze"] += 1
                    if self.violation_counts["eye_gaze"] >= self.persistence_threshold * 2: # More slack for gaze
                        self.send_alert("eye_gaze", "look at the center", severity="medium")
                    cv2.putText(frame, "LOOK AT CENTER", (30, 50), cv2.FONT_HERSHEY_SIMPLEX, 0.7, (0, 0, 255), 2)
                else:
                    self.violation_counts["eye_gaze"] = 0
        else:
            # TRY SECONDARY SCAN WITH BRIGHTENED FRAME IF NO FACE DETECTED
            bright_frame = cv2.convertScaleAbs(rgb_frame, alpha=1.2, beta=30)
            results_retry = self.face_mesh.process(bright_frame)
            
            if results_retry.multi_face_landmarks:
                self.violation_counts["no_face"] = 0
                cv2.putText(frame, "FACE FOUND (BRIGHTENED)", (30, 140), cv2.FONT_HERSHEY_SIMPLEX, 0.7, (0, 255, 255), 2)
            else:
                self.violation_counts["no_face"] += 1
                if self.violation_counts["no_face"] >= self.persistence_threshold:
                    self.send_alert("no_face", "No face detected in frame", severity="high")
                    cv2.putText(frame, "NO FACE DETECTED", (30, 140), cv2.FONT_HERSHEY_SIMPLEX, 0.7, (0, 0, 255), 2)

        # 2. Object and Person Detection (YOLO)
        if self.yolo:
            # Lower confidence for faster detection of smaller objects like phones
            yolo_results = self.yolo(frame, verbose=False, conf=0.35) 
            person_count = 0
            obj_detected = False
            
            for r in yolo_results:
                for box in r.boxes:
                    cls = int(box.cls[0])
                    label = self.yolo.names[cls]
                    conf = float(box.conf[0])
                    
                    # Draw all detections for recruiter (bounding boxes)
                    x1, y1, x2, y2 = map(int, box.xyxy[0])
                    
                    if label == "person":
                        person_count += 1
                        cv2.rectangle(frame, (x1, y1), (x2, y2), (0, 255, 0), 2)
                    else:
                        # ANY non-human object is treated as foreign/unauthorized
                        # Exclude only common environmental furniture to avoid noise
                        environmental_items = ["chair", "dining table", "couch", "bed", "potted plant"]
                        
                        if label.lower() not in environmental_items:
                            obj_detected = True
                            # Immediate visual feedback even before alert persistence
                            cv2.rectangle(frame, (x1, y1), (x2, y2), (0, 0, 255), 3)
                            cv2.putText(frame, f"UNAUTHORIZED: {label.upper()}", (x1, y1 - 10), 
                                        cv2.FONT_HERSHEY_SIMPLEX, 0.6, (0, 0, 255), 2)

            # Object persistence
            if obj_detected:
                self.violation_counts["forbidden_object"] += 1
                if self.violation_counts["forbidden_object"] >= self.obj_persistence_threshold:
                    self.send_alert("forbidden_object", "foreign object detected", severity="high")
            else:
                self.violation_counts["forbidden_object"] = 0

            # Person persistence (Body Intrusion)
            if person_count > 1:
                self.violation_counts["body_intrusion"] += 1
                if self.violation_counts["body_intrusion"] >= self.persistence_threshold:
                    self.send_alert("body_intrusion", "body part intrusion detected", severity="high")
                cv2.putText(frame, "BODY INTRUSION!", (30, 110), cv2.FONT_HERSHEY_SIMPLEX, 0.7, (0, 0, 255), 2)
            else:
                self.violation_counts["body_intrusion"] = 0

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
