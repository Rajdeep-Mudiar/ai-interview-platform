import { useEffect, useRef, useState } from "react";
import * as faceapi from "face-api.js";
import axiosClient from "../utils/axiosClient";
import Button from "./ui/Button";
import { Card, CardBody, CardHeader } from "./ui/Card";

function Proctoring() {
  const videoRef = useRef();
  const [warning, setWarning] = useState("");
  const [cheatCount, setCheatCount] = useState(0);
  const [emotion, setEmotion] = useState("Initializing...");
  const [emotionLog, setEmotionLog] = useState([]);

  useEffect(() => {
    startVideo();
    loadModels();
    detectFaces();

    const handleVisibility = () => {
      if (document.hidden) {
        setWarning("⚠️ Tab switching detected");
        axiosClient.post("/monitoring/events", {
          session_id: "dev_session_local",
          device: "desktop",
          event: "tab_switch",
          confidence_score: 1.0,
        });
      }
    };

    document.addEventListener("visibilitychange", handleVisibility);
    return () => document.removeEventListener("visibilitychange", handleVisibility);
  }, []);

  const startVideo = () => {
    navigator.mediaDevices.getUserMedia({ video: true }).then((stream) => {
      if (videoRef.current) videoRef.current.srcObject = stream;
    }).catch(err => console.error("Camera access denied:", err));
  };

  const loadModels = async () => {
    try {
      await faceapi.nets.tinyFaceDetector.loadFromUri("/models");
      await faceapi.nets.faceLandmark68Net.loadFromUri("/models");
      await faceapi.nets.faceExpressionNet.loadFromUri("/models");
    } catch (err) {
      console.error("Failed to load face-api models:", err);
    }
  };

  const detectFaces = () => {
    const interval = setInterval(async () => {
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
        axiosClient.post("/monitoring/events", {
          session_id: "dev_session_local",
          device: "desktop_camera",
          event: "multiple_face_detected",
          confidence_score: 1.0,
        });
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
      setEmotionLog((prev) => [...prev, dominantEmotion].slice(-5));

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
    return () => clearInterval(interval);
  };

  return (
    <Card className="overflow-hidden border-none shadow-xl ring-1 ring-slate-100 rounded-3xl bg-white">
      <CardHeader className="p-6 pb-4 border-b border-slate-50">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-slate-900 flex items-center justify-center text-white">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
              </svg>
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-900 tracking-tight">AI Vision Guard</h2>
              <p className="text-[10px] text-slate-400 font-medium uppercase tracking-widest">Active Proctoring</p>
            </div>
          </div>
          <div className="px-2 py-1 rounded bg-rose-50 text-rose-600 text-[10px] font-bold border border-rose-100">
            LIVE
          </div>
        </div>
      </CardHeader>

      <CardBody className="p-6 space-y-6">
        <div className="relative group">
          <div className="aspect-video rounded-2xl bg-slate-900 overflow-hidden ring-1 ring-slate-200 relative shadow-inner">
            <video
              ref={videoRef}
              autoPlay
              muted
              className="h-full w-full object-cover grayscale-[30%] group-hover:grayscale-0 transition-all duration-500"
            />
            {warning && (
              <div className="absolute inset-0 bg-rose-600/20 backdrop-blur-[2px] flex items-center justify-center p-4">
                <div className="bg-white px-4 py-2 rounded-xl shadow-2xl border border-rose-100 animate-bounce">
                  <span className="text-xs font-bold text-rose-600">{warning}</span>
                </div>
              </div>
            )}
          </div>
          
          {/* Scanning Animation */}
          <div className="absolute inset-0 pointer-events-none overflow-hidden rounded-2xl">
            <div className="w-full h-[2px] bg-blue-500/40 absolute top-0 animate-[scan_3s_linear_infinite]"></div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="p-3 rounded-2xl bg-slate-50 border border-slate-100">
            <div className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-1">Emotion</div>
            <div className="text-xs font-bold text-slate-700 capitalize flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-blue-500"></span>
              {emotion}
            </div>
          </div>
          <div className="p-3 rounded-2xl bg-slate-50 border border-slate-100">
            <div className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-1">Incidents</div>
            <div className="text-xs font-bold text-slate-700 flex items-center gap-2">
              <span className={`w-1.5 h-1.5 rounded-full ${cheatCount > 5 ? 'bg-rose-500' : 'bg-emerald-500'}`}></span>
              {cheatCount} recorded
            </div>
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between px-1">
            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Signal History</span>
            <span className="text-[9px] font-bold text-slate-300">RECENT 5</span>
          </div>
          <div className="flex gap-1.5">
            {emotionLog.map((e, i) => (
              <div key={i} className="flex-1 h-1.5 rounded-full bg-blue-100 overflow-hidden">
                <div className="h-full bg-blue-500 w-full animate-in fade-in zoom-in duration-500"></div>
              </div>
            ))}
            {Array.from({ length: Math.max(0, 5 - emotionLog.length) }).map((_, i) => (
              <div key={i + 10} className="flex-1 h-1.5 rounded-full bg-slate-100"></div>
            ))}
          </div>
        </div>
      </CardBody>
    </Card>
  );
}

export default Proctoring;
