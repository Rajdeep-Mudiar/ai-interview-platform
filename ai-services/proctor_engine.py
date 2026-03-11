import cv2
import mediapipe as mp
from ultralytics import YOLO
import requests

# ---------------- Models ----------------
yolo = YOLO("yolov8n.pt")

# MediaPipe FaceMesh
mp_face_mesh = mp.solutions.face_mesh
face_mesh = mp_face_mesh.FaceMesh(
    max_num_faces=1,
    refine_landmarks=True,
    min_detection_confidence=0.5,
    min_tracking_confidence=0.5
)

# Haar Cascade
face_cascade = cv2.CascadeClassifier(
    cv2.data.haarcascades + "haarcascade_frontalface_default.xml"
)

cap = cv2.VideoCapture(0)
print("AI Proctor Engine Running...")

while True:
    ret, frame = cap.read()
    if not ret:
        break

    rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
    gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)

    # Face detection
    faces = face_cascade.detectMultiScale(gray, 1.3, 5)
    face_count = len(faces)
    for (x, y, w, h) in faces:
        cv2.rectangle(frame, (x, y), (x + w, y + h), (0, 255, 0), 2)
    if face_count > 1:
        print("ALERT: Multiple faces detected")
        requests.post("http://localhost:8000/alert",
                      json={"type": "multiple_person", "message": "Multiple people detected"})

    # Eye gaze
    results = face_mesh.process(rgb)
    if results.multi_face_landmarks:
        for face_landmarks in results.multi_face_landmarks:
            left_eye = face_landmarks.landmark[33]
            right_eye = face_landmarks.landmark[263]

            gaze_text = "Looking Center"
            if left_eye.x < 0.3:
                gaze_text = "Looking Left"
            elif right_eye.x > 0.7:
                gaze_text = "Looking Right"

            print(gaze_text)
            cv2.putText(frame, gaze_text, (30, 50),
                        cv2.FONT_HERSHEY_SIMPLEX, 1, (0, 255, 0), 2)

    # Object detection
    detections = yolo(frame)
    for r in detections:
        for box in r.boxes:
            cls = int(box.cls[0])
            label = yolo.names[cls]
            x1, y1, x2, y2 = map(int, box.xyxy[0])
            cv2.rectangle(frame, (x1, y1), (x2, y2), (255, 0, 0), 2)
            cv2.putText(frame, label, (x1, y1 - 10),
                        cv2.FONT_HERSHEY_SIMPLEX, 0.9, (255, 0, 0), 2)
            if label.lower() == "cell phone":
                print("ALERT: Phone detected")
                requests.post("http://localhost:8000/alert",
                              json={"type": "phone_detected", "message": "Candidate using phone"})

    cv2.imshow("AI Proctor Engine", frame)
    if cv2.waitKey(1) & 0xFF == 27:
        break

cap.release()
cv2.destroyAllWindows()