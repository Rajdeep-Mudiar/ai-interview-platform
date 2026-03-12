from ultralytics import YOLO
import cv2
import requests
import time
import threading
import logging

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

class ObjectDetector:
    def __init__(self, api_url="http://127.0.0.1:8000/alert", model_path="yolov8n.pt"):
        self.api_url = api_url
        self.user_id = "unknown"
        
        # Load YOLO model
        try:
            self.model = YOLO(model_path)
        except Exception as e:
            logger.error(f"Failed to load YOLO model: {e}")
            self.model = None

        self.last_alert_time = {}
        self.violation_counts = {
            "forbidden_object": 0
        }
        self.persistence_threshold = 5  # Frames required for an alert
        self.last_fps_time = time.time()
        self.fps = 0

    def send_alert_async(self, payload):
        """Threaded alert sending to prevent main loop lag."""
        try:
            requests.post(self.api_url, json=payload, timeout=2)
            logger.info(f"OBJECT ALERT SENT: {payload['type']} - {payload['message']}")
        except Exception as e:
            logger.error(f"Failed to send object alert: {e}")

    def send_alert(self, alert_type, message, severity="high", cooldown=10):
        """Send an alert if persistence is met and cooldown is over."""
        now = time.time()
        
        # Check cooldown for this specific alert type
        if alert_type in self.last_alert_time and (now - self.last_alert_time[alert_type]) < cooldown:
            return

        payload = {
            "user_id": self.user_id,
            "type": alert_type,
            "message": message,
            "severity": severity,
            "timestamp": time.strftime("%Y-%m-%d %H:%M:%S", time.localtime(now))
        }

        # Send in background thread
        threading.Thread(target=self.send_alert_async, args=(payload,), daemon=True).start()
        self.last_alert_time[alert_type] = now

    def run(self):
        cap = cv2.VideoCapture(0)
        if not cap.isOpened():
            logger.error("Could not open webcam.")
            return

        logger.info(f"Object Detection Service Started for user: {self.user_id}")
        
        while True:
            ret, frame = cap.read()
            if not ret:
                break

            # FPS Calculation
            curr_time = time.time()
            self.fps = 1 / (curr_time - self.last_fps_time)
            self.last_fps_time = curr_time
            
            # 1. YOLO Detection
            if self.model:
                results = self.model(frame, verbose=False, conf=0.5) # High confidence
                obj_detected = False
                
                # Forbidden objects for proctoring
                forbidden = ["cell phone", "phone", "laptop", "tablet", "book", "remote", "keyboard", "mouse"]
                
                for r in results:
                    for box in r.boxes:
                        cls = int(box.cls[0])
                        label = self.model.names[cls]
                        conf = float(box.conf[0])
                        
                        # Draw bounding box
                        x1, y1, x2, y2 = map(int, box.xyxy[0])
                        
                        if label.lower() in forbidden:
                            obj_detected = True
                            # Red box for forbidden items
                            cv2.rectangle(frame, (x1, y1), (x2, y2), (0, 0, 255), 2)
                            cv2.putText(frame, f"FORBIDDEN: {label} ({conf:.2f})", (x1, y1 - 10),
                                        cv2.FONT_HERSHEY_SIMPLEX, 0.6, (0, 0, 255), 2)
                        else:
                            # Green box for other items
                            cv2.rectangle(frame, (x1, y1), (x2, y2), (0, 255, 0), 1)
                            cv2.putText(frame, f"{label} ({conf:.2f})", (x1, y1 - 10),
                                        cv2.FONT_HERSHEY_SIMPLEX, 0.5, (0, 255, 0), 1)

                # Persistence logic to avoid glitches
                if obj_detected:
                    self.violation_counts["forbidden_object"] += 1
                    if self.violation_counts["forbidden_object"] >= self.persistence_threshold:
                        self.send_alert("forbidden_object", "foreign object detected", severity="high")
                else:
                    self.violation_counts["forbidden_object"] = 0

            # UI Feedback
            cv2.putText(frame, f"FPS: {int(self.fps)}", (10, 30), cv2.FONT_HERSHEY_SIMPLEX, 0.7, (255, 255, 0), 2)
            cv2.imshow("CareBridge Object Detection", frame)

            if cv2.waitKey(1) == 27: # ESC key
                break

        cap.release()
        cv2.destroyAllWindows()
        logger.info("Object Detection Service Stopped.")

if __name__ == "__main__":
    detector = ObjectDetector()
    detector.run()
