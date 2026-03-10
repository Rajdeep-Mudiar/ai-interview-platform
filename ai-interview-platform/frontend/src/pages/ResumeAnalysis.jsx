import { useState, useRef } from "react";
import { Interview } from "./Interview";

export default function ResumeAnalysis() {
  const [file, setFile] = useState(null);
  const [jd, setJd] = useState("");
  const [result, setResult] = useState(null);
  const loadQuestionsRef = useRef(null);

  async function analyze() {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("job_description", jd);
    const res = await fetch("http://localhost:8000/analyze-resume", {
      method: "POST",
      body: formData,
    });
    const data = await res.json();
    setResult(data);
    // After analysis, call Interview's loadQuestions with resume_skills
    if (data && data.resume_skills && loadQuestionsRef.current) {
      loadQuestionsRef.current(data.resume_skills);
    }
  }

  return (
    <div style={{ maxWidth: 600, margin: "auto", padding: 20 }}>
      <h1>AI Resume–Job Matching</h1>
      <input type="file" onChange={(e) => setFile(e.target.files[0])} />
      <br />
      <textarea
        placeholder="Paste job description"
        onChange={(e) => setJd(e.target.value)}
        style={{ width: "100%", minHeight: 80, marginTop: 10 }}
      />
      <br />
      <button onClick={analyze} style={{ marginTop: 10 }}>
        Analyze Resume
      </button>
      {result && (
        <div style={{ marginTop: 30 }}>
          <h2>Match Score: {result.score}%</h2>
          <h3>Skills Found</h3>
          <p>{result.resume_skills.join(", ")}</p>
          <h3>Missing Skills</h3>
          <p>{result.missing_skills.join(", ")}</p>
        </div>
      )}
      {/* Hidden Interview component to expose loadQuestions */}
      <Interview onLoadQuestions={(fn) => (loadQuestionsRef.current = fn)} />
    </div>
  );
}
