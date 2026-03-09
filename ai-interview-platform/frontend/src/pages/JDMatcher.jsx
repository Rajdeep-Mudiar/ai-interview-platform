import axios from "axios";
import { useState } from "react";

function JDMatcher() {
  const [resume, setResume] = useState("");
  const [jd, setJd] = useState("");
  const [result, setResult] = useState(null);

  const analyze = async () => {
    const res = await axios.post("http://localhost:8000/match_jd", {
      resume: resume,
      jd: jd,
    });
    setResult(res.data);
  };

  return (
    <div>
      <h2>JD vs CV Matching</h2>
      <textarea
        placeholder="Paste Resume"
        onChange={(e) => setResume(e.target.value)}
      />
      <textarea
        placeholder="Paste Job Description"
        onChange={(e) => setJd(e.target.value)}
      />
      <button onClick={analyze}>Analyze</button>
      {result && (
        <div>
          <p>Fit Score: {result.fit_score}%</p>
          <p>Matched Skills: {result.matched_skills.join(", ")}</p>
          <p>Missing Skills: {result.missing_skills.join(", ")}</p>
        </div>
      )}
    </div>
  );
}

export default JDMatcher;
