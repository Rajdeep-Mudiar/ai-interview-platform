import React, { useRef, useEffect, useState } from "react";
import axiosClient, { aiClient, secondaryAiClient } from "../utils/axiosClient";
import * as faceapi from "face-api.js";
import Button from "../components/ui/Button";
import { Card, CardBody, CardHeader } from "../components/ui/Card";
import DualMonitoring from "../components/DualMonitoring";
import TabFocusWarning from "../components/TabFocusWarning";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { Bar } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

function Interview(props) {
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const [sessionId, setSessionId] = useState("");
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
  const [terminated, setTerminated] = useState(false);

  // Start/Stop Python AI services
  async function startPythonAIServices() {
    try {
      // Start main proctoring server (Port 8001)
      await aiClient.post("/start", { user_id: "test_user" });
      // Start secondary device monitor (Port 8002)
      await secondaryAiClient.post("/start", { session_id: "dev_session_local" });
      console.log("Python AI Services started successfully.");
    } catch (err) {
      console.error("Failed to start Python AI services:", err);
    }
  }

  async function stopPythonAIServices() {
    try {
      await aiClient.post("/stop");
      await secondaryAiClient.post("/stop");
      console.log("Python AI Services stopped.");
    } catch (err) {
      console.error("Failed to stop Python AI services:", err);
    }
  }

  // Load questions from backend based on skills
  async function loadQuestions(skills) {
    setLoading(true);
    try {
      const res = await axiosClient.post("/generate-questions", {
        skills: skills,
      });
      setQuestions(res.data.questions);
      setCurrent(0);
      setProgress(0);
      setScore(null);
      setConcepts([]);
      setAnswer("");
      // Trigger Python AI services when questions are loaded (interview starts)
      startPythonAIServices();
    } catch (err) {
      console.error("Failed to load questions:", err);
    } finally {
      setLoading(false);
    }
  }
  // Interview timer
  useEffect(() => {
    if (integrity === 0) {
      stopPythonAIServices();
      setTerminated(true);
    }
  }, [integrity]);

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
        if (sessionId) {
          axios.post("http://localhost:8000/monitoring/events", {
            session_id: sessionId,
            device: "desktop",
            event: "multiple_person_detected",
            confidence_score: 1.0,
          });
        }
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
            if (sessionId) {
              axios.post("http://localhost:8000/monitoring/events", {
                session_id: sessionId,
                device: "desktop",
                event: "looking_away",
                confidence_score: 1.0,
              });
            }
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
      await axiosClient.post("/monitoring/events", {
        session_id: "dev_session_local",
        device: "desktop_camera",
        event: "looking_away",
        confidence_score: 1.0,
        metadata: { message: "Candidate looking away" }
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
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert("Speech recognition not supported in this browser.");
      return;
    }
    const recognition = new SpeechRecognition();
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
    try {
      const res = await axiosClient.post("/evaluate-answer", {
        question,
        answer,
      });
      setScore(res.data.score);
    } catch (err) {
      console.error("Evaluation failed:", err);
    }
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
      stopPythonAIServices();
    }
  };

  return (
    <div className="cb-container py-8 sm:py-12">
      <TabFocusWarning />
      {terminated && (
        <div style={styles.overlay}>
          <div style={styles.popup}>
            <h2 style={styles.title}>Interview Terminated</h2>
            <p style={styles.message}>Your interview has been terminated due to a low integrity score.</p>
          </div>
        </div>
      )}
      {/* Top Navigation / Status Bar */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-6 mb-8 pb-6 border-b border-slate-100">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-slate-900 rounded-2xl flex items-center justify-center text-white shadow-lg">
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.75 17L9 21h6l-.75-4M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900">AI Technical Interview</h1>
            <div className="flex items-center gap-2 mt-1">
              <span className="flex h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></span>
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Live Session Active</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="hidden sm:flex flex-col items-end px-4 border-r border-slate-200">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none mb-1">Time Remaining</span>
            <span className={`text-xl font-mono font-bold ${time < 60 ? 'text-rose-600' : 'text-slate-900'}`}>
              {Math.floor(time / 60)}:{(time % 60).toString().padStart(2, '0')}
            </span>
          </div>
          <Button onClick={generate} disabled={loading || questions.length > 0} className="h-11 px-6 bg-blue-600 hover:bg-blue-700 text-white font-bold shadow-md shadow-blue-500/20">
            {questions.length > 0 ? "Interview in Progress" : "Initialize Interview"}
          </Button>
        </div>
      </div>

      <div className="grid gap-8 lg:grid-cols-12 items-start">
        {/* Left Column: Video & Proctoring */}
        <div className="lg:col-span-5 space-y-6">
          <div className="relative group">
            <div className="aspect-video rounded-3xl bg-slate-900 overflow-hidden ring-4 ring-white shadow-2xl relative">
              <video
                ref={videoRef}
                autoPlay
                muted
                className="h-full w-full object-cover grayscale-[20%] group-hover:grayscale-0 transition-all duration-500"
              />
              
              {/* Overlay UI */}
              <div className="absolute top-4 left-4 flex flex-col gap-2">
                <div className="px-3 py-1.5 rounded-full bg-black/40 backdrop-blur-md border border-white/20 text-[10px] font-bold text-white uppercase tracking-wider flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse"></div>
                  REC 1080P
                </div>
              </div>

              <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between">
                <div className="px-3 py-1.5 rounded-xl bg-black/40 backdrop-blur-md border border-white/20">
                  <div className="text-[10px] font-bold text-white/60 uppercase mb-0.5">Emotion</div>
                  <div className="text-xs font-bold text-white flex items-center gap-2">
                    {emotion === "happy" ? "😊 Positive" : emotion === "neutral" ? "😐 Composed" : emotion === "fearful" ? "😨 Nervous" : "⌛ Analyzing..."}
                  </div>
                </div>
                <div className="px-3 py-1.5 rounded-xl bg-black/40 backdrop-blur-md border border-white/20 text-right">
                  <div className="text-[10px] font-bold text-white/60 uppercase mb-0.5">Focus</div>
                  <div className="text-xs font-bold text-white">
                    {integrity > 90 ? "🎯 Locked In" : "⚠️ Distracted"}
                  </div>
                </div>
              </div>
            </div>
            
            {/* Visual Signal Bars */}
            <div className="absolute -right-2 top-1/2 -translate-y-1/2 flex flex-col gap-1">
              {[1, 2, 3].map(i => (
                <div key={i} className={`w-1 h-8 rounded-full ${integrity > 80 ? 'bg-emerald-500' : 'bg-amber-500'} opacity-40 shadow-sm`}></div>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="bg-white p-5 rounded-2xl ring-1 ring-slate-200 shadow-sm">
              <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Integrity Score</div>
              <div className="flex items-end gap-2">
                <span className={`text-3xl font-bold ${integrity > 80 ? 'text-emerald-600' : 'text-amber-600'}`}>{integrity}%</span>
                <span className="text-xs text-slate-400 mb-1 font-medium">Global Avg: 88%</span>
              </div>
            </div>
            <div className="bg-white p-5 rounded-2xl ring-1 ring-slate-200 shadow-sm flex flex-col justify-center">
              <Button onClick={sendGazeAlert} variant="secondary" className="h-9 text-[10px] font-bold uppercase tracking-tight border-slate-200 text-slate-500 hover:bg-rose-50 hover:text-rose-600 hover:border-rose-200 transition-all">
                Test Gaze Alert
              </Button>
            </div>
          </div>

          <DualMonitoring sessionId={sessionId} setSessionId={setSessionId} />
        </div>

        {/* Right Column: Question & Interaction */}
        <div className="lg:col-span-7 space-y-6">
          <Card className="overflow-hidden border-none shadow-xl ring-1 ring-slate-200 rounded-3xl">
            <CardHeader className="bg-slate-50/50 p-8 border-b border-slate-100">
              <div className="flex items-center justify-between mb-6">
                <div className="px-4 py-1.5 rounded-full bg-slate-900 text-white text-[10px] font-bold uppercase tracking-widest">
                  Question {current + 1} of {questions.length || "?"}
                </div>
                <div className="flex gap-1">
                  {questions.map((_, i) => (
                    <div key={i} className={`h-1 w-6 rounded-full transition-all duration-500 ${i <= current ? 'bg-blue-600' : 'bg-slate-200'}`}></div>
                  ))}
                </div>
              </div>
              
              <h2 className="text-2xl font-bold text-slate-900 leading-tight">
                {questions.length > 0 ? questions[current] : "Initialize the interview to receive your first technical question."}
              </h2>
            </CardHeader>
            
            <CardBody className="p-8">
              {questions.length > 0 ? (
                <div className="space-y-6">
                  <div className="relative">
                    <textarea
                      className="w-full min-h-[200px] p-6 rounded-2xl bg-slate-50 ring-1 ring-slate-200 focus:ring-2 focus:ring-blue-600 outline-none transition-all text-lg font-medium text-slate-700 placeholder:text-slate-300 resize-none"
                      placeholder="Your answer will appear here via voice recognition..."
                      value={answer}
                      readOnly
                    />
                    <div className="absolute bottom-4 right-4 flex gap-2">
                      <Button onClick={startRecording} className="h-12 w-12 rounded-full bg-blue-600 text-white flex items-center justify-center shadow-lg shadow-blue-500/40 hover:scale-105 active:scale-95 transition-all">
                        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                        </svg>
                      </Button>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-4">
                    <div className="flex items-center gap-2">
                      {loading && <span className="text-sm font-bold text-blue-600 animate-pulse italic">AI Evaluating Response...</span>}
                      {score !== null && (
                        <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-50 border border-emerald-100">
                          <span className="text-xs font-bold text-emerald-700 uppercase tracking-wider">Evaluation Score:</span>
                          <span className="text-lg font-bold text-emerald-900">{score}/10</span>
                        </div>
                      )}
                    </div>
                    <Button onClick={submitAnswer} disabled={!answer || loading} className="h-12 px-8 bg-slate-900 text-white font-bold rounded-2xl hover:bg-slate-800 transition-all flex items-center gap-2">
                      Submit & Next
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3" />
                      </svg>
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="text-center py-12 px-10 border-2 border-dashed border-slate-100 rounded-3xl bg-slate-50/50">
                  <div className="w-16 h-16 rounded-2xl bg-white flex items-center justify-center mx-auto mb-6 shadow-sm text-slate-300">
                    <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-bold text-slate-900 mb-2">Ready to showcase your skills?</h3>
                  <p className="text-sm text-slate-500 leading-relaxed max-w-xs mx-auto">
                    Click the button above to start your AI-led technical assessment. Make sure your camera and microphone are properly configured.
                  </p>
                </div>
              )}
            </CardBody>
          </Card>

          {/* Behavior Chart */}
          <Card className="border-none shadow-sm ring-1 ring-slate-200 rounded-3xl overflow-hidden">
            <CardHeader className="p-6 pb-0">
              <h3 className="text-sm font-bold text-slate-900 uppercase tracking-widest">Behavioral Analytics</h3>
            </CardHeader>
            <CardBody className="p-6">
              <div className="h-[200px]">
                <Bar
                  data={{
                    labels: ['Joy', 'Neutral', 'Stress', 'Focus'],
                    datasets: [{
                      label: 'Emotion Probability',
                      data: [
                        emotion === 'happy' ? 0.9 : 0.1,
                        emotion === 'neutral' ? 0.8 : 0.2,
                        emotion === 'fearful' ? 0.7 : 0.1,
                        integrity / 100
                      ],
                      backgroundColor: ['#10b981', '#64748b', '#f43f5e', '#3b82f6'],
                      borderRadius: 12,
                    }]
                  }}
                  options={{
                    maintainAspectRatio: false,
                    plugins: { legend: { display: false } },
                    scales: { y: { beginAtZero: true, max: 1, display: false }, x: { grid: { display: false } } }
                  }}
                />
              </div>
            </CardBody>
          </Card>
        </div>
      </div>
    </div>
  );
}

export { Interview };
export default Interview;

const styles = {
  overlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 9999,
  },
  popup: {
    backgroundColor: 'white',
    padding: '2rem',
    borderRadius: '0.5rem',
    textAlign: 'center',
    maxWidth: '400px',
  },
  title: {
    fontSize: '1.5rem',
    fontWeight: 'bold',
    color: '#dc2626',
    marginBottom: '1rem',
  },
  message: {
    fontSize: '1rem',
    color: '#1f2937',
  },
};
