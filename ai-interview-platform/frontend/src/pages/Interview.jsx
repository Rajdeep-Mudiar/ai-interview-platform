import React, { useRef, useEffect, useState } from "react";
import axios from "axios";
import * as faceapi from "face-api.js";

function Interview(props) {
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const [questions, setQuestions] = useState([]);
  const [current, setCurrent] = useState(0);
  const [answer, setAnswer] = useState("");
  const [progress, setProgress] = useState(0);
  const [score, setScore] = useState(null);
  const [concepts, setConcepts] = useState([]);
  const [alert, setAlert] = useState("");
  const [integrity, setIntegrity] = useState(100);
  const [time, setTime] = useState(300);
  const [loading, setLoading] = useState(false);
  const [emotion, setEmotion] = useState(null);
  const [behavior, setBehavior] = useState(null);
  const [behaviorScore, setBehaviorScore] = useState(0);

  // Load questions from backend based on skills
  async function loadQuestions(skills) {
    setLoading(true);
    const res = await fetch("http://localhost:8000/generate-questions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ skills }),
    });
    const data = await res.json();
    setQuestions(data.questions);
    setCurrent(0);
    setProgress(0);
    setScore(null);
    setConcepts([]);
    setAnswer("");
    setLoading(false);
  }
  // Interview timer
  useEffect(() => {
    const timer = setInterval(() => {
      setTime((t) => (t > 0 ? t - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    async function loadModels() {
      await faceapi.nets.tinyFaceDetector.loadFromUri("/models");
      await faceapi.nets.faceLandmark68Net.loadFromUri("/models");
      await faceapi.nets.faceExpressionNet.loadFromUri("/models");
      startVideo();
    }
    async function startVideo() {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true,
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    }
    loadModels();
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
      }
    };
  }, []);

  // Real-time face detection
  useEffect(() => {
    let interval;
    async function detect() {
      if (!videoRef.current || videoRef.current.readyState !== 4) return;
      // Multiple faces
      const detections = await faceapi.detectAllFaces(
        videoRef.current,
        new faceapi.TinyFaceDetectorOptions(),
      );
      if (detections.length > 1) {
        setAlert("Multiple faces detected!");
        setIntegrity((prev) => Math.max(prev - 15, 0));
        return;
      }
      // No face
      if (detections.length === 0) {
        setAlert("No face detected");
        setIntegrity((prev) => Math.max(prev - 5, 0));
        return;
      }
      // Looking away & emotion detection
      const detection = await faceapi
        .detectSingleFace(
          videoRef.current,
          new faceapi.TinyFaceDetectorOptions(),
        )
        .withFaceLandmarks()
        .withFaceExpressions();
      if (detection && detection.landmarks) {
        // Simple head turn detection: compare nose position to center
        const nose = detection.landmarks.getNose();
        const leftEye = detection.landmarks.getLeftEye();
        const rightEye = detection.landmarks.getRightEye();
        if (nose && leftEye && rightEye) {
          const noseX = nose[3].x;
          const leftEyeX = leftEye[0].x;
          const rightEyeX = rightEye[3].x;
          const eyeDist = Math.abs(rightEyeX - leftEyeX);
          const center = (leftEyeX + rightEyeX) / 2;
          const headTurn = Math.abs(noseX - center) / eyeDist;
          if (headTurn > 0.25) {
            setAlert("Looking away from screen");
            setIntegrity((prev) => Math.max(prev - 5, 0));
            return;
          }
        }
      }
      // Emotion detection
      if (detection && detection.expressions) {
        const expressions = detection.expressions;
        let maxEmotion = "neutral";
        let maxValue = 0;
        for (const emotion in expressions) {
          if (expressions[emotion] > maxValue) {
            maxValue = expressions[emotion];
            maxEmotion = emotion;
          }
        }
        setEmotion(maxEmotion);
        // Behavioral insight
        function interpretEmotion(emotion) {
          if (emotion === "happy") return "Confident";
          if (emotion === "neutral") return "Calm";
          if (emotion === "fearful" || emotion === "sad") return "Nervous";
          return "Neutral";
        }
        setBehavior(interpretEmotion(maxEmotion));
        // Behavior score
        let score = 0;
        if (maxEmotion === "happy") score = 5;
        else if (maxEmotion === "neutral") score = 3;
        else if (maxEmotion === "fearful" || maxEmotion === "sad") score = 1;
        else score = 3;
        setBehaviorScore(score);
      }
      setAlert("");
    }
    interval = setInterval(detect, 2000);
    return () => clearInterval(interval);
  }, []);

  // Text-to-Speech
  function speak(text) {
    const speech = new window.SpeechSynthesisUtterance(text);
    speech.lang = "en-US";
    speech.rate = 1;
    speech.pitch = 1;
    window.speechSynthesis.speak(speech);
  }

  // Speak question when it loads
  useEffect(() => {
    if (questions.length > 0 && questions[current]) {
      speak(questions[current]);
    }
  }, [questions, current]);

  const sendGazeAlert = async () => {
    try {
      await axios.post("http://localhost:8000/alert", {
        type: "Eye Movement",
        message: "Candidate looking away",
      });
      console.log("Alert sent successfully");
    } catch (error) {
      console.error("Failed to send alert:", error);
    }
  };

  // Example: call with static skills for demo
  const generate = () => {
    loadQuestions(["python", "react", "sql"]);
  };

  // Expose loadQuestions for parent/other pages
  if (props && typeof props.onLoadQuestions === "function") {
    props.onLoadQuestions(loadQuestions);
  }

  // Voice Answer Recording
  function startRecording() {
    const recognition = new (
      window.SpeechRecognition || window.webkitSpeechRecognition
    )();
    recognition.continuous = false;
    recognition.lang = "en-US";
    recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript;
      setAnswer(transcript);
    };
    recognition.start();
  }

  // AI answer evaluation
  async function evaluateAnswer(question, answer) {
    const res = await fetch("http://localhost:8000/evaluate-answer", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ question, answer }),
    });
    const data = await res.json();
    setScore(data.score);
    // Optionally: setConcepts(data.concepts || []);
  }

  // Submit answer and get evaluation
  const submitAnswer = async () => {
    await evaluateAnswer(questions[current], answer);
    // Auto next question after short delay
    setTimeout(() => {
      nextQuestion();
    }, 1500);
  };

  // Ask next question
  const nextQuestion = async () => {
    if (current + 1 < questions.length) {
      setCurrent(current + 1);
      setAnswer("");
      setScore(null);
      setConcepts([]);
      setProgress(((current + 1 + 1) / questions.length) * 100);
    } else {
      // Interview finished
      setProgress(100);
    }
  };

  return (
    <div style={{ textAlign: "center", padding: "20px" }}>
      {/* AI Interviewer Avatar */}
      <div className="flex flex-col items-center">
        <img
          src="https://cdn-icons-png.flaticon.com/512/4712/4712027.png"
          width="120"
          alt="AI Interviewer"
        />
        <h2 className="text-xl mt-3">AI Interviewer</h2>
      </div>

      {/* Interview Timer */}
      <h2>Time Remaining: {time}s</h2>

      {/* Progress Bar */}
      <div
        className="w-full bg-gray-200 h-3 rounded"
        style={{ margin: "20px 0" }}
      >
        <div
          className="bg-blue-500 h-3 rounded"
          style={{
            width: `${((current + 1) / (questions.length || 1)) * 100}%`,
          }}
        ></div>
      </div>
      <div style={{ marginBottom: "10px" }}>
        Question {current + 1} / {questions.length || 1}
      </div>
      {/* Loading Indicator */}
      {loading && (
        <div className="animate-pulse" style={{ margin: "20px 0" }}>
          AI analyzing...
        </div>
      )}

      {/* Integrity Score */}
      <div style={{ marginBottom: "10px", fontWeight: "bold" }}>
        Integrity Score: {integrity}%
      </div>

      {/* Alert Box */}
      {alert && <div className="bg-red-500 text-white p-2 mt-2">⚠ {alert}</div>}

      {/* Video */}
      <div style={{ marginBottom: "20px" }}>
        <video
          ref={videoRef}
          autoPlay
          muted
          width="400"
          style={{
            maxWidth: "600px",
            borderRadius: "8px",
            border: "2px solid #333",
          }}
        />
      </div>

      <button
        onClick={sendGazeAlert}
        style={{
          padding: "10px 20px",
          backgroundColor: "#ff4d4f",
          color: "white",
          border: "none",
          borderRadius: "4px",
          cursor: "pointer",
        }}
      >
        Simulate "Looking Away" Alert
      </button>

      <button onClick={generate} style={{ marginTop: 20, marginLeft: 10 }}>
        Start Interview
      </button>

      {/* Emotion and Behavior UI */}
      {emotion && (
        <div className="bg-blue-500 text-white p-2 mt-3">
          Emotion Detected: {emotion}
        </div>
      )}
      {behavior && (
        <div className="bg-green-500 text-white p-2 mt-2">
          Behavior: {behavior}
        </div>
      )}
      {behaviorScore > 0 && (
        <div className="bg-gray-200 text-black p-2 mt-2">
          Behavior Score: {behaviorScore}
        </div>
      )}

      {/* Question and Answer UI */}
      {questions.length > 0 && (
        <div style={{ marginTop: 30 }}>
          {questions.map((q, index) => (
            <div
              key={index}
              style={{
                marginBottom: 20,
                borderBottom: "1px solid #eee",
                paddingBottom: 10,
              }}
            >
              <h3>Question {index + 1}</h3>
              <p>{q}</p>
              {index === current && (
                <>
                  <button onClick={() => speak(q)} style={{ marginRight: 10 }}>
                    🔊 Ask Question
                  </button>
                  <button onClick={startRecording} style={{ marginRight: 10 }}>
                    🎤 Start Answer
                  </button>
                  <button onClick={submitAnswer} style={{ marginRight: 10 }}>
                    Submit Answer
                  </button>
                  <div style={{ marginTop: 20 }}>
                    <b>Candidate Answer:</b>
                    <div>{answer}</div>
                  </div>
                  {/* AI Evaluation */}
                  {score !== null && (
                    <div className="mt-4">
                      <h2>AI Score: {score}/10</h2>
                    </div>
                  )}
                </>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export { Interview };
export default Interview;
