import React, { useRef, useEffect, useState } from "react";
import axios from "axios";

function Interview() {
  const videoRef = useRef(null);
  const streamRef = useRef(null); // Keep track of the stream for cleanup
  const [questions, setQuestions] = useState([]);

  useEffect(() => {
    // 1. Request access to camera and microphone
    navigator.mediaDevices
      .getUserMedia({
        video: true,
        audio: true,
      })
      .then((stream) => {
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      })
      .catch((err) => {
        console.error("Error accessing media devices:", err);
      });

    // 2. Cleanup function to stop tracks when component is destroyed
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
      }
    };
  }, []);

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

  const generate = async () => {
    const res = await axios.post("http://localhost:8000/generate_questions", {
      matched_skills: ["python", "sql"],
      missing_skills: ["docker", "aws"],
    });
    setQuestions(res.data.questions);
  };

  return (
    <div style={{ textAlign: "center", padding: "20px" }}>
      <h2>Interview Session</h2>

      <div style={{ marginBottom: "20px" }}>
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted // Muted locally to prevent feedback loops
          style={{
            width: "100%",
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
      <button onClick={generate} style={{ marginTop: 20 }}>
        Generate Questions
      </button>
      <ul>
        {questions.map((q, i) => (
          <li key={i}>{q}</li>
        ))}
      </ul>
    </div>
  );
}

export default Interview;
