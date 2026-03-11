import cv2
import requests
# Load face detection model
face_cascade = cv2.CascadeClassifier(
    cv2.data.haarcascades + "haarcascade_frontalface_default.xml"
)

# Open webcam
cap = cv2.VideoCapture(0)

while True:

    ret, frame = cap.read()

    if not ret:
        break

    gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)

    faces = face_cascade.detectMultiScale(
        gray,
        scaleFactor=1.3,
        minNeighbors=5
    )

    face_count = len(faces)

    # Draw rectangle around faces
    for (x,y,w,h) in faces:
        cv2.rectangle(frame,(x,y),(x+w,y+h),(0,255,0),2)

    # Show face count
    cv2.putText(
        frame,
        f"Faces Detected: {face_count}",
        (10,30),
        cv2.FONT_HERSHEY_SIMPLEX,
        1,
        (0,0,255),
        2
    )

    # Alert if more than one face
    if face_count > 1:
        print("ALERT: Multiple people detected!")

        requests.post(
        "http://localhost:8000/alert",
        json={
            "type":"multiple_person",
            "message":"More than one person detected"
        }
    )

    cv2.imshow("Face Detection",frame)

    if cv2.waitKey(1) & 0xFF == 27:
        break

cap.release()
cv2.destroyAllWindows()