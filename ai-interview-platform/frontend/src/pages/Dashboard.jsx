import { useState } from "react";
import axios from "axios";
import jsPDF from "jspdf";
import styles from "../styles/Dashboard.module.css";

function Dashboard() {
  const [result, setResult] = useState(null);
  const [explanation, setExplanation] = useState([]);

  const generateReport = async () => {
    const res = await axios.post("http://localhost:8000/final_score", {
      resume_score: 82,
      interview_score: 7.8,
      cheating_flags: 0,
    });

    setResult(res.data);
  };

  const generatePDF = () => {
    const doc = new jsPDF();
    doc.setFontSize(18);
    doc.text("AI Interview Evaluation Report", 20, 20);
    doc.setFontSize(12);
    doc.text("Candidate Name: John Doe", 20, 40);
    doc.text("Position: AI Engineer", 20, 50);
    doc.text("Resume Match Score: 82%", 20, 70);
    doc.text("Interview Score: 7.8 / 10", 20, 80);
    doc.text("Skill Coverage: 75%", 20, 90);
    doc.text("Cheating Risk: Low", 20, 100);
    doc.text("Final Recommendation: Strong Hire", 20, 120);
    doc.save("candidate_report.pdf");
  };

  const getExplanation = async () => {
    const res = await axios.post("http://localhost:8000/explain_decision", {
      resume_score: 82,
      interview_score: 7.8,
      missing_skills: ["AWS"],
      cheating_risk: "Low",
    });
    setExplanation(res.data.explanation);
  };

  return (
    <div className={styles.dashboardContainer}>
      <h2 className={styles.header}>Candidate Evaluation Dashboard</h2>
      <div className={styles.section}>
        <button onClick={generateReport} className={styles.button}>
          Generate Final Report
        </button>
        <button onClick={generatePDF} className={styles.button}>
          Download Interview Report
        </button>
        <button onClick={getExplanation} className={styles.button}>
          Explain AI Decision
        </button>
      </div>
      {result && (
        <div className={styles.section}>
          <h3>Final Score: {result.final_score}</h3>
          <h3>Recommendation: {result.recommendation}</h3>
          <ul className={styles.explanationList}>
            {explanation.map((reason, i) => (
              <li key={i}>{reason}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

export default Dashboard;
