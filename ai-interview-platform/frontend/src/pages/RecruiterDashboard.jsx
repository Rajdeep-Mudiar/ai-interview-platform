import React, { useEffect, useState } from "react";
import axios from "axios";

function RecruiterDashboard() {
  const [alerts, setAlerts] = useState([]);
  const [reportFile, setReportFile] = useState(null);
  const [decision, setDecision] = useState(null);

  useEffect(() => {
    axios.get("http://localhost:8000/alerts").then((res) => {
      setAlerts(res.data);
    });
  }, []);

  async function generateReport() {
    const res = await fetch("http://localhost:8000/generate-report", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: "Alex Johnson",
        resume_score: 82,
        interview_score: 86,
        integrity_score: 91,
        skills: ["Python", "React", "SQL"],
        missing_skills: ["Docker", "AWS"],
        recommendation: "Strong Hire",
      }),
    });
    const data = await res.json();
    setReportFile(data.file);
  }

  async function getDecision() {
    const res = await fetch("http://localhost:8000/hiring-decision", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        resume_score: 82,
        interview_score: 86,
        integrity_score: 91,
      }),
    });
    const data = await res.json();
    setDecision(data);
  }

  return (
    <div>
      <h1>Recruiter Dashboard</h1>

      {/* Candidate Summary Card */}
      <div
        className="bg-white shadow p-4 rounded"
        style={{ maxWidth: 400, margin: "20px auto" }}
      >
        <h2 className="text-xl font-bold">Alex Johnson</h2>
        <p>Resume Score: 82%</p>
        <p>Interview Score: 86%</p>
        <p>Integrity Score: 91%</p>
      </div>

      {alerts.map((alert, i) => (
        <p key={i}>{alert.message}</p>
      ))}

      <button onClick={generateReport} style={{ marginTop: 20 }}>
        Generate Interview Report
      </button>

      {reportFile && (
        <div style={{ marginTop: 20 }}>
          <a
            href={`http://localhost:8000/reports/${reportFile}`}
            target="_blank"
            rel="noopener noreferrer"
          >
            Download Report
          </a>
        </div>
      )}

      <button onClick={getDecision} style={{ marginTop: 20 }}>
        Get Hiring Decision
      </button>

      {decision && (
        <div className="mt-4">
          <h2>Final Score: {decision.final_score}</h2>
          <h1 className="text-2xl font-bold">
            Recommendation: {decision.decision}
          </h1>
        </div>
      )}
    </div>
  );
}

export default RecruiterDashboard;
