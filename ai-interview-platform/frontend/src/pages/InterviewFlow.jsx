import { useState } from "react";
import axios from "axios";
import styles from "../styles/InterviewFlow.module.css";

function InterviewFlow() {
  const [resume, setResume] = useState("");
  const [jd, setJd] = useState("");
  const [match, setMatch] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [suggestions, setSuggestions] = useState([]);

  const analyzeResume = async () => {
    const res = await axios.post("http://localhost:8000/match_jd", {
      resume: resume,
      jd: jd,
    });

    setMatch(res.data);
  };

  const generateQuestions = async () => {
    const res = await axios.post(
      "http://localhost:8000/generate_ai_questions",
      {
        resume: resume,
        jd: jd,
        missing_skills: match.missing_skills,
      },
    );
    setQuestions(res.data.questions);
  };

  const getSuggestions = async () => {
    const res = await axios.post("http://localhost:8000/resume_suggestions", {
      missing_skills: match.missing_skills,
      resume: resume,
    });
    setSuggestions(res.data.suggestions);
  };

  return (
    <div className={styles.pipelineContainer}>
      <h2 className={styles.header}>AI Interview Pipeline</h2>
      <textarea
        placeholder="Paste Resume"
        onChange={(e) => setResume(e.target.value)}
        className={styles.textarea}
      />
      <textarea
        placeholder="Paste Job Description"
        onChange={(e) => setJd(e.target.value)}
        className={styles.textarea}
      />
      <button onClick={analyzeResume} className={styles.button}>
        Analyze Resume
      </button>
      {match && (
        <div>
          <h3>Match Score: {match.fit_score}%</h3>
          <button onClick={generateQuestions} className={styles.button}>
            Generate Interview Questions
          </button>
          <button onClick={getSuggestions} className={styles.button}>
            Get Resume Suggestions
          </button>
        </div>
      )}
      {match && (
        <ul className={styles.list}>
          {suggestions.map((s, i) => (
            <li key={i}>{s}</li>
          ))}
        </ul>
      )}
      <ul className={styles.list}>
        {questions.map((q, i) => (
          <li key={i}>{q}</li>
        ))}
      </ul>
    </div>
  );
}

export default InterviewFlow;
