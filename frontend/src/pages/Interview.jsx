import React, { useRef, useEffect, useState } from "react";
import axios from "axios";
import * as faceapi from "face-api.js";
import Button from "../components/ui/Button";
import { Card, CardBody, CardHeader } from "../components/ui/Card";

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
    <div className="cb-container py-10 sm:py-14">
      <div className="grid gap-6 lg:grid-cols-12 lg:items-start">
        <div className="grid gap-6 lg:col-span-7">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="grid h-12 w-12 place-items-center rounded-2xl bg-slate-900 text-white">
                <span className="text-sm font-semibold">AI</span>
              </div>
              <div>
                <h1 className="text-2xl font-semibold tracking-tight text-slate-900 sm:text-3xl">
                  AI interview
                </h1>
                <p className="mt-1 text-sm text-slate-600">
                  Timed interview with integrity and behavior signals.
                </p>
              </div>
            </div>
            <Button onClick={generate} variant="secondary">
              Start interview
            </Button>
          </div>

          <Card>
            <CardHeader className="pb-4">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="text-sm font-semibold text-slate-900">
                  Progress
                </div>
                <div className="text-sm text-slate-600">
                  Time remaining: <span className="font-medium">{time}s</span>
                </div>
              </div>
              <div className="mt-4">
                <div className="h-2 w-full rounded-full bg-slate-100">
                  <div
                    className="h-2 rounded-full bg-slate-900 transition-all"
                    style={{
                      width: `${((current + 1) / (questions.length || 1)) * 100}%`,
                    }}
                  />
                </div>
                <div className="mt-2 text-xs text-slate-500">
                  Question {current + 1} / {questions.length || 1}
                </div>
              </div>
            </CardHeader>
            <CardBody className="grid gap-4">
              {loading && (
                <div className="rounded-xl bg-slate-50 p-3 text-sm text-slate-600 ring-1 ring-slate-200">
                  <span className="animate-pulse">AI analyzing…</span>
                </div>
              )}

              <div className="grid gap-3 sm:grid-cols-2">
                <div className="rounded-xl bg-slate-50 p-4 ring-1 ring-slate-200">
                  <div className="text-xs font-medium text-slate-500">
                    Integrity score
                  </div>
                  <div className="mt-1 text-2xl font-semibold text-slate-900">
                    {integrity}%
                  </div>
                </div>
                <div className="grid gap-2">
                  {alert ? (
                    <div className="rounded-xl bg-rose-50 p-3 text-sm text-rose-700 ring-1 ring-rose-200">
                      {alert}
                    </div>
                  ) : (
                    <div className="rounded-xl bg-emerald-50 p-3 text-sm text-emerald-700 ring-1 ring-emerald-200">
                      No integrity alerts.
                    </div>
                  )}
                  <Button onClick={sendGazeAlert} variant="danger">
                    Simulate looking-away alert
                  </Button>
                </div>
              </div>

              <div className="aspect-video overflow-hidden rounded-2xl bg-slate-900 ring-1 ring-slate-200">
                <video
                  ref={videoRef}
                  autoPlay
                  muted
                  className="h-full w-full object-cover"
                />
              </div>

              <div className="grid gap-2 sm:grid-cols-3">
                <div className="rounded-xl bg-white p-3 ring-1 ring-slate-200">
                  <div className="text-xs font-medium text-slate-500">Emotion</div>
                  <div className="mt-1 text-sm font-semibold text-slate-900">
                    {emotion ?? "—"}
                  </div>
                </div>
                <div className="rounded-xl bg-white p-3 ring-1 ring-slate-200">
                  <div className="text-xs font-medium text-slate-500">
                    Behavior
                  </div>
                  <div className="mt-1 text-sm font-semibold text-slate-900">
                    {behavior ?? "—"}
                  </div>
                </div>
                <div className="rounded-xl bg-white p-3 ring-1 ring-slate-200">
                  <div className="text-xs font-medium text-slate-500">
                    Behavior score
                  </div>
                  <div className="mt-1 text-sm font-semibold text-slate-900">
                    {behaviorScore || "—"}
                  </div>
                </div>
              </div>
            </CardBody>
          </Card>
        </div>

        <div className="grid gap-6 lg:col-span-5">
          <Card>
            <CardHeader className="pb-4">
              <div className="text-sm font-semibold text-slate-900">
                Interview Q&A
              </div>
              <div className="text-sm text-slate-600">
                Answer the current question and submit for scoring.
              </div>
            </CardHeader>
            <CardBody className="grid gap-4">
              {questions.length > 0 ? (
                <>
                  <div className="rounded-2xl bg-slate-50 p-4 ring-1 ring-slate-200">
                    <div className="text-xs font-medium text-slate-500">
                      Current question
                    </div>
                    <div className="mt-1 text-sm font-semibold text-slate-900">
                      {questions[current]}
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <Button
                      onClick={() => speak(questions[current])}
                      variant="secondary"
                      size="sm"
                    >
                      Ask
                    </Button>
                    <Button onClick={startRecording} variant="secondary" size="sm">
                      Record
                    </Button>
                    <Button onClick={submitAnswer} size="sm">
                      Submit
                    </Button>
                    <Button onClick={nextQuestion} variant="ghost" size="sm">
                      Next
                    </Button>
                  </div>

                  <div className="rounded-2xl bg-white p-4 ring-1 ring-slate-200">
                    <div className="text-xs font-medium text-slate-500">
                      Candidate answer
                    </div>
                    <div className="mt-1 whitespace-pre-wrap text-sm text-slate-800">
                      {answer || "No answer captured yet."}
                    </div>
                  </div>

                  {score !== null && (
                    <div className="rounded-2xl bg-emerald-50 p-4 ring-1 ring-emerald-200">
                      <div className="text-xs font-medium text-emerald-700">
                        AI score
                      </div>
                      <div className="mt-1 text-2xl font-semibold text-emerald-900">
                        {score}/10
                      </div>
                    </div>
                  )}
                </>
              ) : (
                <div className="rounded-2xl bg-slate-50 p-5 text-sm text-slate-600 ring-1 ring-slate-200">
                  Start the interview to load questions.
                </div>
              )}
            </CardBody>
          </Card>

          {questions.length > 0 && (
            <Card>
              <CardHeader className="pb-4">
                <div className="text-sm font-semibold text-slate-900">
                  Question list
                </div>
                <div className="text-sm text-slate-600">
                  Track what’s coming next.
                </div>
              </CardHeader>
              <CardBody>
                <ol className="grid gap-2 text-sm text-slate-700">
                  {questions.map((q, index) => (
                    <li
                      key={index}
                      className={`rounded-xl p-3 ring-1 ${
                        index === current
                          ? "bg-slate-900 text-white ring-slate-900"
                          : "bg-white ring-slate-200"
                      }`}
                    >
                      <span className="font-medium">Q{index + 1}.</span> {q}
                    </li>
                  ))}
                </ol>
              </CardBody>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}

export { Interview };
export default Interview;
