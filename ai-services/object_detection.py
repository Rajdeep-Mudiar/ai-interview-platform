from ultralytics import YOLO
import cv2
import requests

# Load YOLO model
model = YOLO("yolov8n.pt")

cap = cv2.VideoCapture(0)

while True:

    ret, frame = cap.read()

    if not ret:
        break

    results = model(frame)

    for r in results:

        boxes = r.boxes

        for box in boxes:

            cls = int(box.cls[0])
            label = model.names[cls]

            x1,y1,x2,y2 = map(int, box.xyxy[0])

            cv2.rectangle(frame,(x1,y1),(x2,y2),(0,255,0),2)
            cv2.putText(frame,label,(x1,y1-10),
                        cv2.FONT_HERSHEY_SIMPLEX,
                        0.9,(0,255,0),2)

            # Detect phone
            if label == "cell phone":

                print("ALERT: Phone detected")

                requests.post(
                    "http://127.0.0.1:8000/alert",
                    json={
                        "type":"phone_detected",
                        "message":"Candidate using phone"
                    }
                )

    cv2.imshow("Object Detection",frame)

    if cv2.waitKey(1)==27:
        break

cap.release()
cv2.destroyAllWindows()