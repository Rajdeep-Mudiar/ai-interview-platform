import React, { useRef, useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import axios from "axios";
import axiosClient, {
  AI_BASE_URL,
  API_BASE_URL,
  aiClient,
} from "../utils/axiosClient";

const MobileMonitoring = () => {
  const { sessionId } = useParams();
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const [status, setStatus] = useState("Initializing...");
  const [isCapturing, setIsCapturing] = useState(false);
  const [isStarting, setIsStarting] = useState(false);
  const isMobileDevice = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
  const searchParams = new URLSearchParams(window.location.search);
  const apiBaseUrl = searchParams.get("api") || API_BASE_URL;
  const aiBaseUrl = searchParams.get("ai") || AI_BASE_URL;
  const monitoringApiClient = axios.create({
    baseURL: apiBaseUrl,
    headers: {
      "Content-Type": "application/json",
    },
  });
  const mobileAiClient = axios.create({
    baseURL: aiBaseUrl,
    headers: {
      "Content-Type": "application/json",
    },
  });

  const waitForVideoMetadata = (videoElement) =>
    new Promise((resolve, reject) => {
      if (!videoElement) {
        reject(new Error("Video element unavailable"));
        return;
      }

      if (videoElement.readyState >= 1) {
        resolve();
        return;
      }

      const onLoaded = () => {
        cleanup();
        resolve();
      };

      const onError = () => {
        cleanup();
        reject(new Error("Failed to load video metadata"));
      };

      const cleanup = () => {
        videoElement.removeEventListener("loadedmetadata", onLoaded);
        videoElement.removeEventListener("error", onError);
      };

      videoElement.addEventListener("loadedmetadata", onLoaded);
      videoElement.addEventListener("error", onError);
    });

  const stopCurrentStream = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const tracks = videoRef.current.srcObject.getTracks();
      tracks.forEach((track) => track.stop());
      videoRef.current.srcObject = null;
    }
  };

  const getCameraErrorMessage = (err) => {
    if (!window.isSecureContext) {
      return "Camera requires HTTPS on mobile. Open the app using https:// or localhost.";
    }
    if (err?.name === "NotAllowedError" || err?.name === "SecurityError") {
      return "Camera access is blocked for this site. Enable Camera permission in browser/site settings, then tap Start Camera again.";
    }
    if (err?.name === "NotFoundError" || err?.name === "OverconstrainedError") {
      return "No compatible camera found with current settings. Please retry camera.";
    }
    if (err?.name === "NotReadableError") {
      return "Camera is being used by another app. Close other camera apps and retry.";
    }
    return "Error: Unable to access camera on this device.";
  };

  const startCamera = async () => {
    if (isStarting) return;
    setIsStarting(true);
    setStatus("Requesting camera permission...");

    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        setStatus("Camera API is not supported in this browser.");
        return;
      }

      stopCurrentStream();

      const constraintsList = [
        { video: { facingMode: { exact: "environment" } }, audio: false },
        { video: { facingMode: { ideal: "environment" } }, audio: false },
        { video: { facingMode: { ideal: "user" } }, audio: false },
        { video: true, audio: false },
      ];

      let stream = null;
      let lastError = null;

      for (const constraints of constraintsList) {
        try {
          stream = await navigator.mediaDevices.getUserMedia(constraints);
          break;
        } catch (err) {
          lastError = err;
        }
      }

      if (!stream) {
        throw lastError || new Error("Camera stream not available");
      }

      if (videoRef.current) {
        videoRef.current.setAttribute("playsinline", "true");
        videoRef.current.setAttribute("webkit-playsinline", "true");
        videoRef.current.muted = true;
        videoRef.current.srcObject = stream;
        await waitForVideoMetadata(videoRef.current);
        await videoRef.current.play();
      }

      setIsCapturing(true);
      setStatus("Camera active. Monitoring in progress...");

      // Signal connection to backend. Keep camera active even if this request fails.
      try {
        const metadata = {
          userAgent: navigator.userAgent,
          platform: navigator.platform,
          screenResolution: `${window.screen.width}x${window.screen.height}`,
          timestamp: new Date().toISOString(),
        };

        await monitoringApiClient.post("/monitoring/mobile/connect", {
          session_id: sessionId,
          metadata,
        });
      } catch (connectErr) {
        console.error("Mobile connect event failed:", connectErr);
        setStatus(
          "Camera active, but website sync failed. Check backend/API URL reachability from mobile.",
        );
      }
    } catch (err) {
      console.error("Error accessing camera:", err);
      setIsCapturing(false);
      setStatus(getCameraErrorMessage(err));
    } finally {
      setIsStarting(false);
    }
  };

  useEffect(() => {
    if (isMobileDevice) {
      setStatus("Tap Start Camera to grant permission and begin monitoring.");
    } else {
      startCamera();
    }

    return () => {
      stopCurrentStream();
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
    mobileAiClient
      .post("/process_frame", {
        session_id: sessionId,
        image_data: imageData,
        device: "mobile",
      })
      .catch((err) => {
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
          muted
          playsInline
          className="w-full h-full object-cover"
        />
        <canvas ref={canvasRef} className="hidden" />
        <div className="absolute top-2 left-2 bg-blue-600/80 px-2 py-1 rounded text-xs font-mono">
          SESSION: {sessionId?.slice(0, 8)}...
        </div>
      </div>
      <p className="mt-6 text-center text-gray-400">{status}</p>
      {!window.isSecureContext && (
        <p className="mt-2 max-w-md text-center text-xs text-amber-300">
          This page is not in a secure context. On mobile, camera access usually
          requires HTTPS (or localhost).
        </p>
      )}
      <div className="mt-8 flex items-center space-x-2">
        <div
          className={`w-3 h-3 rounded-full ${isCapturing ? "bg-red-500 animate-pulse" : "bg-gray-500"}`}
        />
        <span className="text-sm uppercase tracking-widest">
          {isCapturing ? "Live Feed" : "Idle"}
        </span>
      </div>

      {!isCapturing && (
        <button
          type="button"
          onClick={startCamera}
          disabled={isStarting}
          className="mt-4 rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isStarting ? "Starting Camera..." : "Start Camera"}
        </button>
      )}
    </div>
  );
};

export default MobileMonitoring;
