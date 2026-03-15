import cv2
import numpy as np
import base64
import time
import os
from ultralytics import YOLO

# Suppress warnings
os.environ['TF_CPP_MIN_LOG_LEVEL'] = '3'

class YoloDetector:
    def __init__(self):
        print("[*] Initializing YOLOv8 Object Detector...")
        try:
            self.model = YOLO("yolov8n.pt")
            print("[+] YOLOv8 model loaded successfully.")
        except Exception as e:
            print(f"[-] Failed to load YOLO model: {e}")
            self.model = None

    def detect_suspicious_activity(self, base64_image, session_id, device):
        if not self.model:
            return {"error": "Model not loaded"}

        try:
            # Decode base64 image
            if "base64," in base64_image:
                base64_image = base64_image.split("base64,")[1]
            
            img_data = base64.b64decode(base64_image)
            nparr = np.frombuffer(img_data, np.uint8)
            frame = cv2.imdecode(nparr, cv2.IMREAD_COLOR)

            if frame is None:
                return {"error": "Failed to decode image"}

            # Run detection
            results = self.model(frame, verbose=False)
            
            detections = []
            suspicious_objects = ["cell phone", "laptop", "tablet", "book", "person"]
            
            for result in results:
                for box in result.boxes:
                    cls = int(box.cls[0])
                    conf = float(box.conf[0])
                    label = self.model.names[cls]
                    
                    if conf > 0.5:
                        detections.append({
                            "label": label,
                            "confidence": conf,
                            "bbox": box.xyxy[0].tolist()
                        })

                        # Check for suspicious objects
                        if label in suspicious_objects:
                            # If multiple people detected, it's suspicious
                            if label == "person":
                                # We need to count people, this is per-box so we'll aggregate later
                                pass
                            elif label != "person":
                                print(f"[ALERT] Suspicious object detected: {label} ({conf:.2f})")

            return {
                "detections": detections,
                "timestamp": time.time()
            }

        except Exception as e:
            print(f"[-] Detection error: {e}")
            return {"error": str(e)}

# Create a singleton instance
detector = YoloDetector()
