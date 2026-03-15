import cv2
import mediapipe as mp
import sys
import os
import time
import requests
from ultralytics import YOLO

# Suppress some common warnings for cleaner logs
os.environ['TF_CPP_MIN_LOG_LEVEL'] = '3'

class VisionProctor:
    def __init__(self, user_id="unknown", backend_url="http://localhost:8000"):
        self.user_id = user_id
        self.backend_url = backend_url
        
        print(f"[*] Initializing Visual Proctor for user: {user_id}")
        
        # 1. Load YOLO for object detection
        try:
            self.yolo = YOLO("yolov8n.pt")
            print("[+] YOLOv8 loaded successfully.")
        except Exception as e:
            print(f"[-] Failed to load YOLO: {e}")
            self.yolo = None

        # 2. Setup MediaPipe Face Mesh for eye gaze
        try:
            from mediapipe.tasks import python
            from mediapipe.tasks.python import vision
            
            # Use the downloaded task file
            model_path = 'face_landmarker.task'
            if not os.path.exists(model_path):
                print(f"[-] ERROR: {model_path} not found. Gaze detection will be disabled.")
                self.face_mesh = None
            else:
                base_options = python.BaseOptions(model_asset_path=model_path)
                options = vision.FaceLandmarkerOptions(
                    base_options=base_options,
                    output_face_blendshapes=True,
                    output_facial_transformation_matrixes=True,
                    num_faces=1
                )
                self.detector = vision.FaceLandmarker.create_from_options(options)
                self.face_mesh = True # Flag to indicate we have a detector
                print("[+] MediaPipe Face Landmarker (Tasks API) initialized.")
        except Exception as e:
            print(f"[-] Failed to initialize MediaPipe Tasks: {e}")
            self.face_mesh = None

        # 3. Setup Face Cascade for basic face detection (multiple people)
        self.face_cascade = cv2.CascadeClassifier(
            cv2.data.haarcascades + "haarcascade_frontalface_default.xml"
        )
        
        # 4. Open Camera
        self.cap = cv2.VideoCapture(0)
        if not self.cap.isOpened():
            print("[-] Error: Could not open camera.")
            sys.exit(1)
        
        self.running = False
        print("[+] Vision Proctor ready.")

    def report_alert(self, alert_type, message, confidence=1.0):
        """Sends an alert to the backend server."""
        try:
            payload = {
                "session_id": self.user_id, # Assuming user_id is the session_id
                "device": "webcam",
                "event": alert_type,
                "confidence_score": confidence,
                "message": message,
                "timestamp": time.time()
            }
            requests.post(f"{self.backend_url}/monitoring/events", json=payload, timeout=2)
            print(f"[ALERT] {alert_type}: {message}")
        except Exception as e:
            print(f"[-] Failed to report alert: {e}")

    def run(self):
        self.running = True
        print("[*] Vision Proctor running. Press ESC to stop.")
        
        last_alert_time = {} # For debouncing alerts

        while self.running:
            ret, frame = self.cap.read()
            if not ret:
                break

            rgb_frame = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
            gray_frame = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
            current_time = time.time()

            # --- A. FACE DETECTION (Multiple Persons) ---
            faces = self.face_cascade.detectMultiScale(gray_frame, 1.3, 5)
            face_count = len(faces)
            
            # Visualize detected faces
            for (x, y, w, h) in faces:
                cv2.rectangle(frame, (x, y), (x + w, y + h), (0, 255, 0), 2)

            if face_count > 1:
                if current_time - last_alert_time.get("multiple_faces", 0) > 5:
                    self.report_alert("multiple_faces", f"{face_count} faces detected.")
                    last_alert_time["multiple_faces"] = current_time

            # --- B. EYE GAZE MONITORING ---
            if self.face_mesh:
                try:
                    mp_image = mp.Image(image_format=mp.ImageFormat.SRGB, data=rgb_frame)
                    detection_result = self.detector.detect(mp_image)
                    
                    if detection_result.face_landmarks:
                        for face_landmarks in detection_result.face_landmarks:
                            # Landmarker landmark indices (33 for left eye corner, 263 for right eye corner)
                            l_eye = face_landmarks[33]
                            r_eye = face_landmarks[263]

                            gaze_text = "Center"
                            if l_eye.x < 0.3: gaze_text = "Looking Left"
                            elif r_eye.x > 0.7: gaze_text = "Looking Right"

                            if gaze_text != "Center":
                                cv2.putText(frame, gaze_text, (30, 50), cv2.FONT_HERSHEY_SIMPLEX, 1, (0, 0, 255), 2)
                                if current_time - last_alert_time.get("gaze", 0) > 10:
                                    self.report_alert("suspicious_gaze", f"User looking away ({gaze_text}).")
                                    last_alert_time["gaze"] = current_time
                            else:
                                cv2.putText(frame, "Gaze: Center", (30, 50), cv2.FONT_HERSHEY_SIMPLEX, 1, (0, 255, 0), 2)
                except Exception as e:
                    print(f"[-] Gaze detection error: {e}")

            # --- C. OBJECT DETECTION (Phones, etc.) ---
            if self.yolo:
                results = self.yolo(frame, verbose=False)
                for r in results:
                    for box in r.boxes:
                        cls = int(box.cls[0])
                        label = self.yolo.names[cls]
                        
                        if label.lower() in ["cell phone", "laptop", "tablet"]:
                            x1, y1, x2, y2 = map(int, box.xyxy[0])
                            cv2.rectangle(frame, (x1, y1), (x2, y2), (0, 0, 255), 2)
                            cv2.putText(frame, f"ALERT: {label}", (x1, y1-10), cv2.FONT_HERSHEY_SIMPLEX, 0.5, (0, 0, 255), 2)
                            
                            if current_time - last_alert_time.get("device", 0) > 5:
                                self.report_alert("unauthorized_device", f"Detected unauthorized {label}.")
                                last_alert_time["device"] = current_time

            # Show window
            cv2.imshow(f"Vision Proctor - {self.user_id}", frame)
            
            # ESC key to exit
            if cv2.waitKey(1) & 0xFF == 27:
                break

        self.stop()

    def stop(self):
        self.running = False
        if self.cap:
            self.cap.release()
        cv2.destroyAllWindows()
        print("[*] Vision Proctor stopped.")

if __name__ == "__main__":
    uid = sys.argv[1] if len(sys.argv) > 1 else "unknown"
    proctor = VisionProctor(user_id=uid)
    try:
        proctor.run()
    except KeyboardInterrupt:
        proctor.stop()
