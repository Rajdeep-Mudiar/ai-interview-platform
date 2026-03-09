import { useEffect, useRef, useState } from "react";
import * as faceapi from "face-api.js";
import axios from "axios";
import styles from "../styles/Proctoring.module.css";

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
        setWarning("⚠️ No face detected");
        return;
      }

      if (detections.length > 1) {
        setWarning("⚠️ Multiple faces detected");
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
        setWarning("⚠️ Looking away from screen");
        setCheatCount((prev) => prev + 1);
      } else {
        setWarning("");
      }

      if (nose[3].y > 260) {
        setWarning("⚠️ Possible phone usage detected");
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
    <div className={styles.proctorContainer}>
      <h3 className={styles.header}>AI Proctoring System</h3>
      <video ref={videoRef} autoPlay className={styles.video} />
      <p className={styles.warning}>{warning}</p>
      <p className={styles.emotion}>Candidate Emotion: {emotion}</p>
      <p className={styles.cheatCount}>Cheating Warnings: {cheatCount}</p>
      <button onClick={sendCheatData}>Send Cheating Data</button>
    </div>
  );
}

export default Proctoring;
