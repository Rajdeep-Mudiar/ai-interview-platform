import cv2
import mediapipe as mp

mp_face_mesh = mp.solutions.face_mesh
face_mesh = mp_face_mesh.FaceMesh()

cap = cv2.VideoCapture(0)

while True:

    success, frame = cap.read()

    if not success:
        break

    rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)

    result = face_mesh.process(rgb)

    if result.multi_face_landmarks:

        for face_landmarks in result.multi_face_landmarks:

            # Draw facial landmarks
            for id, landmark in enumerate(face_landmarks.landmark):

                h, w, _ = frame.shape

                x = int(landmark.x * w)
                y = int(landmark.y * h)

                cv2.circle(frame, (x, y), 1, (0,255,0), -1)

            # -------------------------
            # Simple Gaze Detection
            # -------------------------
            left_eye = face_landmarks.landmark[33]
            right_eye = face_landmarks.landmark[263]

            if left_eye.x < 0.3:
                print("Looking Left")
                cv2.putText(frame, "Looking Left", (30,50),
                            cv2.FONT_HERSHEY_SIMPLEX, 1, (0,255,0), 2)

            elif right_eye.x > 0.7:
                print("Looking Right")
                cv2.putText(frame, "Looking Right", (30,50),
                            cv2.FONT_HERSHEY_SIMPLEX, 1, (0,255,0), 2)

            else:
                print("Looking Center")
                cv2.putText(frame, "Looking Center", (30,50),
                            cv2.FONT_HERSHEY_SIMPLEX, 1, (0,255,0), 2)

    cv2.imshow("Eye Tracking", frame)

    if cv2.waitKey(1) & 0xFF == 27:
        break

cap.release()
cv2.destroyAllWindows()