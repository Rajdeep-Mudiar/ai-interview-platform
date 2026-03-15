import React, { useRef, useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import axiosClient, { aiClient } from "../utils/axiosClient";

const MobileMonitoring = () => {
  const { sessionId } = useParams();
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const [status, setStatus] = useState("Initializing...");
  const [isCapturing, setIsCapturing] = useState(false);

  useEffect(() => {
    const startCamera = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: "environment" },
          audio: false,
        });
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          setIsCapturing(true);
          setStatus("Camera active. Monitoring in progress...");

          // Signal connection to backend
          const metadata = {
            userAgent: navigator.userAgent,
            platform: navigator.platform,
            screenResolution: `${window.screen.width}x${window.screen.height}`,
            timestamp: new Date().toISOString()
          };
          
          await axiosClient.post("/monitoring/mobile/connect", {
            session_id: sessionId,
            metadata: metadata
          });
        }
      } catch (err) {
        console.error("Error accessing camera:", err);
        setStatus("Error: Camera permission denied or not found.");
      }
    };

    startCamera();

    return () => {
      if (videoRef.current && videoRef.current.srcObject) {
        const tracks = videoRef.current.srcObject.getTracks();
        tracks.forEach((track) => track.stop());
      }
    };
  }, []);

  useEffect(() => {
    let interval;
    if (isCapturing) {
      interval = setInterval(() => {
        captureAndSendFrame();
      }, 1000); // Send 1 frame per second to avoid overloading
    }
    return () => clearInterval(interval);
  }, [isCapturing, sessionId]);

  const captureAndSendFrame = () => {
    if (!videoRef.current || !canvasRef.current) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const context = canvas.getContext("2d");

    // Match canvas size to video size
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    // Draw the current video frame onto the canvas
    context.drawImage(video, 0, 0, canvas.width, canvas.height);

    // Convert canvas to base64 image
    const imageData = canvas.toDataURL("image/jpeg", 0.6);

    // Send frame to AI service
    aiClient.post("/process_frame", {
      session_id: sessionId,
      image_data: imageData,
      device: "mobile"
    }).catch(err => {
      console.error("Error sending frame:", err);
    });
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-900 text-white p-4">
      <h1 className="text-2xl font-bold mb-4">Dual Monitoring - Mobile</h1>
      <div className="relative w-full max-w-md aspect-video bg-black rounded-lg overflow-hidden border-2 border-blue-500 shadow-lg shadow-blue-500/20">
        <video
          ref={videoRef}
          autoPlay
          playsInline
          className="w-full h-full object-cover"
        />
        <canvas ref={canvasRef} className="hidden" />
        <div className="absolute top-2 left-2 bg-blue-600/80 px-2 py-1 rounded text-xs font-mono">
          SESSION: {sessionId?.slice(0, 8)}...
        </div>
      </div>
      <p className="mt-6 text-center text-gray-400">
        {status}
      </p>
      <div className="mt-8 flex items-center space-x-2">
        <div className={`w-3 h-3 rounded-full ${isCapturing ? 'bg-red-500 animate-pulse' : 'bg-gray-500'}`} />
        <span className="text-sm uppercase tracking-widest">{isCapturing ? 'Live Feed' : 'Idle'}</span>
      </div>
    </div>
  );
};

export default MobileMonitoring;
