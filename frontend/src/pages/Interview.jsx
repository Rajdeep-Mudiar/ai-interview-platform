import React, { useRef, useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import axios from "axios";
import * as faceapi from "face-api.js";
import Button from "../components/ui/Button";
import { Card, CardBody, CardHeader } from "../components/ui/Card";
import { getUserSession } from "../utils/auth";

function Interview(props) {
  const location = useLocation();
  const navigate = useNavigate();
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
  const [backendAlerts, setBackendAlerts] = useState([]);
  const [reportUrl, setReportUrl] = useState(null);
  const [generatingReport, setGeneratingReport] = useState(false);
  const [interviewFinished, setInterviewFinished] = useState(false);
  const [totalScore, setTotalScore] = useState(0);
  const [scores, setScores] = useState([]);
  const [isRecording, setIsRecording] = useState(false);
  const [recognition, setRecognition] = useState(null);
  const [backendResult, setBackendResult] = useState(null);
  const [isInterviewStarted, setIsInterviewStarted] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);

  const API_BASE = "http://127.0.0.1:8000";
  const AI_SERVICE_BASE = "http://127.0.0.1:8001";

  // Control AI Proctoring Server
  const startAIProctoring = async () => {
    try {
      await axios.post(`${AI_SERVICE_BASE}/start`);
      console.log("AI Proctoring services started.");
    } catch (err) {
      console.warn("AI Proctoring server not reachable. Ensure 'python server.py' is running in ai-services folder.");
    }
  };

  const stopAIProctoring = async () => {
    try {
      await axios.post(`${AI_SERVICE_BASE}/stop`);
      console.log("AI Proctoring services stopped.");
    } catch (err) {
      console.error("Failed to stop AI Proctoring services:", err);
    }
  };

  // Polling for backend alerts from AI services
  useEffect(() => {
    const fetchAlerts = async () => {
      try {
        const res = await axios.get(`${API_BASE}/alerts`);
        if (res.data.length > backendAlerts.length) {
          const latestAlert = res.data[res.data.length - 1];
          setAlert(latestAlert.message || latestAlert.type);
          setBackendAlerts(res.data);
          // Decrease integrity for backend-detected cheating
          setIntegrity((prev) => Math.max(prev - 10, 0));
        }
      } catch (err) {
        console.error("Failed to fetch alerts:", err);
      }
    };
    const interval = setInterval(fetchAlerts, 5000);
    return () => clearInterval(interval);
  }, [backendAlerts]);

  // Load questions from backend based on skills
  async function loadQuestions(matched_skills, missing_skills = [], recruiterQuestions = []) {
    setLoading(true);
    try {
      // If recruiter provided questions, use them. Otherwise, generate AI questions.
      if (recruiterQuestions && recruiterQuestions.length > 0) {
        // Handle both string array and object array [{question, answer}]
        const qs = recruiterQuestions.map(q => typeof q === 'string' ? q : q.question);
        setQuestions(qs);
      } else {
        const res = await axios.post(`${API_BASE}/generate_questions`, {
          matched_skills: matched_skills,
          missing_skills: missing_skills,
        });
        setQuestions(res.data.questions);
      }
      setCurrent(0);
      setProgress(0);
      setScore(null);
      setConcepts([]);
      setAnswer("");
    } catch (err) {
      console.error("Failed to load questions:", err);
    } finally {
      setLoading(false);
    }
  }

  // Effect to load questions from location state if available
  useEffect(() => {
    if (location.state) {
      const { skills, missing_skills, jobQuestions } = location.state;
      if (skills || jobQuestions) {
        loadQuestions(skills || [], missing_skills || [], jobQuestions || []);
      }
    }
  }, [location.state]);
  // Interview timer
  useEffect(() => {
    const timer = setInterval(() => {
      setTime((t) => (t > 0 ? t - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Monitor integrity score to stop interview if it hits 0
  useEffect(() => {
    if (integrity <= 0 && !interviewFinished) {
      setAlert("Interview terminated due to multiple integrity violations.");
      setInterviewFinished(true);
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
      }
    }
  }, [integrity, interviewFinished]);

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
    if (!text) return;
    
    // Cancel any existing speech
    window.speechSynthesis.cancel();
    
    // If recording, stop it first
    if (isRecording) {
      recognition?.stop();
      setIsRecording(false);
    }

    const speech = new window.SpeechSynthesisUtterance(text);
    speech.lang = "en-US";
    speech.rate = 1;
    speech.pitch = 1;
    
    speech.onstart = () => setIsSpeaking(true);
    speech.onend = () => setIsSpeaking(false);
    speech.onerror = () => setIsSpeaking(false);
    
    window.speechSynthesis.speak(speech);
  }

  const startInterview = async () => {
    setIsInterviewStarted(true);
    await startAIProctoring();
  };

  // Speak question when it loads
  useEffect(() => {
    if (isInterviewStarted && questions.length > 0 && questions[current]) {
      speak(questions[current]);
    }
  }, [questions, current, isInterviewStarted]);

  const sendGazeAlert = async () => {
    try {
      await axios.post(`${API_BASE}/alert`, {
        type: "Eye Movement",
        message: "Candidate looking away",
      });
      console.log("Alert sent successfully");
    } catch (error) {
      console.error("Failed to send alert:", error);
    }
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
    
    // Stop any existing speech synthesis
    if (isSpeaking) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
    }
    
    if (isRecording) {
      try {
        recognition?.stop();
      } catch (err) {
        console.warn("Failed to stop recognition properly:", err);
      }
      setIsRecording(false);
      return;
    }

    try {
      const rec = new SpeechRecognition();
      rec.continuous = true;
      rec.interimResults = true;
      rec.lang = "en-US";
      
      rec.onstart = () => {
        setIsRecording(true);
      };

      rec.onresult = (event) => {
        let finalTranscript = "";
        for (let i = event.resultIndex; i < event.results.length; i++) {
          const transcript = event.results[i][0].transcript;
          if (event.results[i].isFinal) {
            finalTranscript += transcript;
          }
        }
        if (finalTranscript) {
          setAnswer(prev => {
            const trimmed = prev.trim();
            return (trimmed ? trimmed + " " : "") + finalTranscript.trim();
          });
        }
      };

      rec.onerror = (event) => {
        console.error("Speech recognition error:", event.error);
        if (event.error === 'not-allowed') {
          alert("Microphone access denied. Please enable it to use voice recording.");
        }
        setIsRecording(false);
      };

      rec.onend = () => {
        setIsRecording(false);
      };

      rec.start();
      setRecognition(rec);
    } catch (err) {
      console.error("Failed to start recording:", err);
      setIsRecording(false);
    }
  }

  // AI answer evaluation
  async function evaluateAnswer(question, answer) {
    try {
      const res = await axios.post(`${API_BASE}/evaluate_answer`, {
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
    // Stop any active audio
    window.speechSynthesis.cancel();
    setIsSpeaking(false);
    if (isRecording) {
      recognition?.stop();
      setIsRecording(false);
    }

    try {
      const res = await axios.post(`${API_BASE}/evaluate_answer`, {
        question: questions[current],
        answer: answer,
      });
      const newScore = res.data.score;
      setScore(newScore);
      setScores(prev => [...prev, newScore]);
      setTotalScore(prev => prev + newScore);
      
      // Auto next question after short delay
      setTimeout(() => {
        nextQuestion();
      }, 1500);
    } catch (err) {
      console.error("Evaluation failed:", err);
    }
  };

  // Ask next question
  const nextQuestion = async () => {
    // Stop any active audio
    window.speechSynthesis.cancel();
    setIsSpeaking(false);
    if (isRecording) {
      recognition?.stop();
      setIsRecording(false);
    }

    if (current + 1 < questions.length) {
      setCurrent(current + 1);
      setAnswer("");
      setScore(null);
      setConcepts([]);
      setProgress(((current + 1 + 1) / questions.length) * 100);
    } else {
      // Interview finished
      setProgress(100);
      setIsInterviewStarted(false);
      setInterviewFinished(true);
      await stopAIProctoring();
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
      }
    }
  };

  const generateReport = async () => {
    console.log("[REPORT] Starting report generation...");
    const session = getUserSession();
    if (!session) {
      console.error("[REPORT] No session found, cannot generate report.");
      return;
    }
    
    setGeneratingReport(true);
    try {
      const avgInterviewScore = scores.length > 0 ? (totalScore / scores.length) : 0;
      console.log("[REPORT] Calculated average interview score:", avgInterviewScore);
      
      const reportData = {
        name: session.name,
        email: session.email || "N/A",
        phone: session.phone || "N/A",
        job_title: location.state?.jobTitle || "AI Developer",
        resume_score: location.state?.resume_score || 85, 
        interview_score: avgInterviewScore,
        integrity_score: integrity,
        matched_skills: location.state?.skills || [],
        missing_skills: location.state?.missing_skills || [],
        job_id: location.state?.job_id || null
      };
      
      console.log("[REPORT] Sending data to backend:", reportData);

      const res = await axios.post(`${API_BASE}/reports/generate`, reportData);
      console.log("[REPORT] Backend response received:", res.data);
      
      setReportUrl(res.data.download_url);
      setBackendResult(res.data);
      console.log("[REPORT] State updated with report URL and backend results.");
    } catch (err) {
      console.error("[REPORT] Failed to generate report:", err);
      alert("Error generating report. Please check if the backend is running and try again.");
    } finally {
      setGeneratingReport(false);
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

              <div className="aspect-video overflow-hidden rounded-2xl bg-slate-900 ring-1 ring-slate-200 relative">
                <video
                  ref={videoRef}
                  autoPlay
                  muted
                  className="h-full w-full object-cover"
                />
                {!isInterviewStarted && !interviewFinished && (
                  <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-slate-900/60 p-6 text-center text-white backdrop-blur-sm">
                    <div className="mb-4 rounded-full bg-white/10 p-4 ring-1 ring-white/30">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                      </svg>
                    </div>
                    <h2 className="text-xl font-bold">Ready to start?</h2>
                    <p className="mt-2 text-sm text-slate-200">The AI proctoring services will activate once you click start.</p>
                    <Button onClick={startInterview} className="mt-6 bg-white text-slate-900 hover:bg-slate-100">
                      Start Proctored Interview
                    </Button>
                  </div>
                )}
                {interviewFinished && (
                  <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-slate-900/90 p-6 text-center text-white backdrop-blur-sm">
                    {integrity > 0 ? (
                      <>
                        <div className="mb-4 rounded-full bg-emerald-500/20 p-4 ring-2 ring-emerald-500/50">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                        </div>
                        <h2 className="text-xl font-bold sm:text-2xl">Interview Completed!</h2>
                    <p className="mt-2 text-sm text-slate-300">Your performance has been analyzed by our AI.</p>
                    
                    {backendResult && (
                      <div className="mt-6 p-4 bg-white/10 rounded-xl backdrop-blur-md border border-white/20 max-w-sm">
                        <div className="text-xs font-medium text-slate-400 uppercase tracking-wider">Final Assessment</div>
                        <div className="mt-2 flex items-center justify-between gap-8">
                          <div>
                            <div className="text-3xl font-bold text-white">{backendResult.overall_score}%</div>
                            <div className="text-[10px] text-slate-400">Overall Score</div>
                          </div>
                          <div className="text-right">
                            <div className={`text-lg font-bold ${
                              backendResult.recommendation === 'Strong Hire' ? 'text-emerald-400' : 
                              backendResult.recommendation === 'Consider' ? 'text-yellow-400' : 'text-rose-400'
                            }`}>
                              {backendResult.recommendation}
                            </div>
                            <div className="text-[10px] text-slate-400">Recommendation</div>
                          </div>
                        </div>
                      </div>
                    )}
                      </>
                    ) : (
                      <>
                        <div className="mb-4 rounded-full bg-rose-500/20 p-4 ring-2 ring-rose-500/50">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-rose-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </div>
                        <h2 className="text-xl font-bold sm:text-2xl text-rose-500">Interview Terminated</h2>
                        <p className="mt-2 text-sm text-slate-300">The session was closed due to multiple integrity alerts.</p>
                      </>
                    )}
                    
                    <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                      {integrity > 0 ? (
                        !reportUrl ? (
                          <Button 
                            onClick={generateReport} 
                            disabled={generatingReport}
                            className="bg-emerald-600 hover:bg-emerald-700"
                          >
                            {generatingReport ? "Generating Report..." : "Generate Final Report"}
                          </Button>
                        ) : (
                          <Button 
                            as="a" 
                            href={reportUrl} 
                            target="_blank"
                            rel="noopener noreferrer"
                            className="bg-blue-600 hover:bg-blue-700"
                          >
                            Download PDF Report
                          </Button>
                        )
                      ) : (
                        <div className="text-xs text-slate-400 italic">No report available for terminated sessions.</div>
                      )}
                      <Button onClick={() => navigate("/dashboard")} variant="secondary">
                        Go to Dashboard
                      </Button>
                    </div>
                  </div>
                )}
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
                      disabled={!isInterviewStarted || isRecording}
                      className={isSpeaking ? "animate-pulse ring-2 ring-emerald-500 bg-emerald-50" : ""}
                    >
                      {isSpeaking ? "Speaking..." : "Ask"}
                    </Button>
                    <Button
                      onClick={startRecording}
                      variant={isRecording ? "danger" : "secondary"}
                      size="sm"
                      className={isRecording ? "animate-pulse" : ""}
                      disabled={!isInterviewStarted || isSpeaking}
                    >
                      {isRecording ? "Stop Recording" : "Record"}
                    </Button>
                    <Button 
                      onClick={submitAnswer} 
                      size="sm"
                      disabled={!isInterviewStarted || !answer.trim() || isRecording}
                    >
                      Submit
                    </Button>
                    <Button 
                      onClick={nextQuestion} 
                      variant="ghost" 
                      size="sm"
                      disabled={!isInterviewStarted}
                    >
                      Next
                    </Button>
                  </div>

                  <div className="rounded-2xl bg-white p-4 ring-1 ring-slate-200">
                    <div className="text-xs font-medium text-slate-500">
                      Candidate answer
                    </div>
                    <textarea
                      className="mt-2 w-full min-h-[120px] p-3 text-sm text-slate-800 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-900 transition-all resize-none disabled:opacity-50"
                      value={answer}
                      onChange={(e) => setAnswer(e.target.value)}
                      placeholder={isInterviewStarted ? "Type your answer here or use the 'Record' option..." : "Click 'Start Proctored Interview' above to begin."}
                      disabled={!isInterviewStarted || isRecording}
                    />
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
                  {loading ? "Loading interview questions…" : "Start the interview to load questions."}
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
