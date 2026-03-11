import { useEffect, useRef, useState } from "react";
import * as faceapi from "face-api.js";
import axios from "axios";
import Button from "./ui/Button";
import { Card, CardBody, CardHeader } from "./ui/Card";

function Proctoring() {
  const videoRef = useRef();
  const [warning, setWarning] = useState("");

  const [cheatCount, setCheatCount] = useState(0);
  const [emotion, setEmotion] = useState("Detecting...");
  const [emotionLog, setEmotionLog] = useState([]);

  useEffect(() => {
    startVideo();
    loadModels();
    detectFaces();

    document.addEventListener("visibilitychange", () => {
      if (document.hidden) {
        setWarning("⚠️ Tab switching detected");
      }
    });
  }, []);

  const startVideo = () => {
    navigator.mediaDevices.getUserMedia({ video: true }).then((stream) => {
      videoRef.current.srcObject = stream;
    });
  };

  const loadModels = async () => {
    await faceapi.nets.tinyFaceDetector.loadFromUri("/models");
    await faceapi.nets.faceLandmark68Net.loadFromUri("/models");
    await faceapi.nets.faceExpressionNet.loadFromUri("/models");
  };

  const detectFaces = () => {
    setInterval(async () => {
      if (!videoRef.current) return;

      const detections = await faceapi
        .detectAllFaces(videoRef.current, new faceapi.TinyFaceDetectorOptions())
        .withFaceLandmarks()
        .withFaceExpressions();

      if (detections.length === 0) {
        setWarning("No face detected");
        return;
      }

      if (detections.length > 1) {
        setWarning("multiple persons detected");
        return;
      }

      const landmarks = detections[0].landmarks;
      const leftEye = landmarks.getLeftEye();
      const rightEye = landmarks.getRightEye();
      const nose = landmarks.getNose();
      const expressions = detections[0].expressions;

      let dominantEmotion = Object.keys(expressions).reduce((a, b) =>
        expressions[a] > expressions[b] ? a : b,
      );
      setEmotion(dominantEmotion);
      setEmotionLog((prev) => [...prev, dominantEmotion]);

      const eyeDistance = Math.abs(leftEye[0].x - rightEye[3].x);

      if (eyeDistance < 40) {
        setWarning("look at the center");
        setCheatCount((prev) => prev + 1);
      } else {
        setWarning("");
      }

      if (nose[3].y > 260) {
        setWarning("foreign object detected");
        setCheatCount((prev) => prev + 1);
      }
    }, 3000);
  };

  const sendCheatData = async () => {
    await axios.post("http://localhost:8000/cheating_score", {
      warnings: cheatCount,
    });
  };

  return (
    <Card className="overflow-hidden">
      <CardHeader className="pb-4">
        <div className="cb-proctorHeaderRow">
          <div>
            <div className="cb-proctorTitle">AI proctoring</div>
            <div className="cb-proctorSubtitle">
              Face presence, multiple faces, and basic behavior signals.
            </div>
          </div>
          <Button onClick={sendCheatData} variant="secondary" size="sm">
            Send data
          </Button>
        </div>
      </CardHeader>
      <CardBody className="cb-stack-4">
        <div className="cb-proctorGrid">
          <div className="cb-proctorVideoCol">
            <div className="cb-videoFrame">
              <video
                ref={videoRef}
                autoPlay
                className="cb-videoEl"
              />
            </div>
          </div>
          <div className="cb-proctorMetaCol">
            {warning ? (
              <div className="cb-alertDanger">{warning}</div>
            ) : (
              <div className="cb-alertOk">No warnings detected.</div>
            )}

            <div className="cb-twoColStats">
              <div className="cb-stat">
                <div className="cb-statLabel">Emotion</div>
                <div className="cb-statValue">{emotion}</div>
              </div>
              <div className="cb-stat">
                <div className="cb-statLabel">Warnings</div>
                <div className="cb-statValue">{cheatCount}</div>
              </div>
            </div>

            <details className="cb-details">
              <summary className="cb-detailsSummary">Emotion log</summary>
              <div className="cb-detailsBody">
                {emotionLog?.length ? emotionLog.join(", ") : "No entries yet."}
              </div>
            </details>
          </div>
        </div>
      </CardBody>
    </Card>
  );
}

export default Proctoring;
