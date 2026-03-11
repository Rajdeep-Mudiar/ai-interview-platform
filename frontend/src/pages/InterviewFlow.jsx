import { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import axios from "axios";
import { getUserSession } from "../utils/auth";
import Button from "../components/ui/Button";
import { Card, CardBody, CardHeader } from "../components/ui/Card";
import { Label, Textarea } from "../components/ui/Form";

function InterviewFlow() {
  const location = useLocation();
  const navigate = useNavigate();
  const [file, setFile] = useState(null);
  const [files, setFiles] = useState([]);
  const [resume, setResume] = useState("");
  const [jd, setJd] = useState("");
  const [matches, setMatches] = useState([]);
  const [parsedSkills, setParsedSkills] = useState(null);

  useEffect(() => {
    if (location.state) {
      setResume(location.state.resume || "");
      setJd(location.state.jd || "");
    }
  }, [location.state]);
  const [match, setMatch] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [suggestions, setSuggestions] = useState([]);
  const [busy, setBusy] = useState(false);

  const analyzeResume = async () => {
    const targetFile = file || files[0];
    const API_BASE = "http://127.0.0.1:8000";
    setBusy(true);

    try {
      if (targetFile) {
        // Use resume parser
        const formData = new FormData();
        formData.append("file", targetFile);
        
        if (jd.trim()) {
          const res = await axios.post(`${API_BASE}/analyze-resume`, formData, {
            headers: { "Content-Type": "multipart/form-data" },
          });
          setMatch(res.data);
          setParsedSkills(res.data.resume_skills || null);
          setMatches([]);
        } else {
          const res = await axios.post(`${API_BASE}/match-jobs`, formData, {
            headers: { "Content-Type": "multipart/form-data" },
          });
          setMatches(res.data.matches || []);
          setParsedSkills(res.data.resume_skills || null);
          setMatch(null);
        }
      } else if (resume.trim() && jd.trim()) {
        // Legacy text analysis
        const res = await axios.post(`${API_BASE}/match_jd`, {
          resume: resume,
          jd: jd,
        });
        setMatch(res.data);
      }
    } catch (err) {
      console.error("Analysis failed:", err);
    } finally {
      setBusy(false);
    }
  };

  const generateQuestions = async () => {
    if (!match) return;
    setBusy(true);
    try {
      const res = await axios.post(
        "http://localhost:8000/generate_ai_questions",
        {
          resume: resume,
          jd: jd,
          missing_skills: match.missing_skills,
        },
      );
      setQuestions(res.data.questions);
    } finally {
      setBusy(false);
    }
  };

  const getSuggestions = async () => {
    if (!match) return;
    setBusy(true);
    try {
      const res = await axios.post("http://localhost:8000/resume_suggestions", {
        missing_skills: match.missing_skills,
        resume: resume,
      });
      setSuggestions(res.data.suggestions);
    } finally {
      setBusy(false);
    }
  };

  const saveInterview = async () => {
    if (!match || !questions.length || !suggestions.length) return;
    const session = getUserSession();
    if (!session) return;

    setBusy(true);
    try {
      await axios.post("http://localhost:8000/interview", {
        user_id: session.id,
        name: session.name,
        resume: resume,
        jd: jd,
        fit_score: match.fit_score,
        overallScore: match.fit_score, // Using fit_score as demo overallScore for now
        timeTaken: Math.floor(Math.random() * 15) + 15, // random demo time
        integrity: 100, // demo integrity
        missing_skills: match.missing_skills,
        questions: questions,
        suggestions: suggestions,
      });
      alert("Interview results saved to database!");
    } catch (err) {
      console.error("Failed to save interview:", err);
      alert("Failed to save interview results.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="cb-container py-10 sm:py-14">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-slate-900 sm:text-3xl">
            AI interview pipeline
          </h1>
          <p className="mt-1 text-sm text-slate-600">
            Paste a resume and job description to generate questions and
            improvements.
          </p>
        </div>
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-12">
        <Card className="lg:col-span-7">
          <CardHeader className="pb-4">
            <div className="text-sm font-semibold text-slate-900">Inputs</div>
            <div className="text-sm text-slate-600">
              Provide the resume text and job description.
            </div>
          </CardHeader>
          <CardBody className="grid gap-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Resume upload</Label>
                <div className="flex flex-col gap-2">
                  <div className="flex items-center gap-2">
                    <input
                      id="resumeFile"
                      type="file"
                      className="hidden"
                      onChange={(e) => {
                        const selected = e.target.files?.[0];
                        if (selected) {
                          setFile(selected);
                          setFiles([]);
                        }
                      }}
                    />
                    <Button 
                      variant="secondary" 
                      size="sm"
                      onClick={() => document.getElementById('resumeFile').click()}
                    >
                      Choose File
                    </Button>
                    <input
                      id="resumeFolder"
                      type="file"
                      webkitdirectory="true"
                      directory="true"
                      className="hidden"
                      onChange={(e) => {
                        const selectedFiles = Array.from(e.target.files || []).filter(f => f.name.endsWith('.pdf'));
                        if (selectedFiles.length > 0) {
                          setFiles(selectedFiles);
                          setFile(null);
                        }
                      }}
                    />
                    <Button 
                      variant="secondary" 
                      size="sm"
                      onClick={() => document.getElementById('resumeFolder').click()}
                    >
                      Upload Folder
                    </Button>
                  </div>
                  <div className="text-[11px] text-slate-500">
                    {file ? `File: ${file.name}` : files.length > 0 ? `${files.length} PDF(s) found in folder` : "No files selected"}
                  </div>
                </div>
                <div className="pt-2">
                  <Label>Or Paste Resume</Label>
                  <Textarea
                    placeholder="Paste resume text…"
                    value={resume}
                    onChange={(e) => {
                      setResume(e.target.value);
                      setFile(null);
                      setFiles([]);
                    }}
                    className="min-h-24"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Job description (Optional)</Label>
                <Textarea
                  placeholder="Paste job description or leave empty to match all jobs…"
                  value={jd}
                  onChange={(e) => setJd(e.target.value)}
                  className="min-h-44"
                />
              </div>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <Button
                onClick={analyzeResume}
                disabled={(!resume.trim() && !file && !files.length) || busy}
              >
                {busy ? "Analyzing..." : "Analyze resume"}
              </Button>
              <Button
                onClick={generateQuestions}
                variant="secondary"
                disabled={!match || busy}
              >
                Generate interview questions
              </Button>
              <Button
                onClick={getSuggestions}
                variant="secondary"
                disabled={!match || busy}
              >
                Get resume suggestions
              </Button>
              <Button
                onClick={saveInterview}
                variant="secondary"
                disabled={!match || !questions.length || !suggestions.length || busy}
              >
                Save interview
              </Button>
            </div>
          </CardBody>
        </Card>

        <div className="grid gap-6 lg:col-span-5">
          <Card>
            <CardHeader className="pb-4">
              <div className="text-sm font-semibold text-slate-900">1. Resume Parser</div>
              <div className="text-sm text-slate-600">Extracted skills from your resume.</div>
            </CardHeader>
            <CardBody>
              {parsedSkills ? (
                <div className="grid gap-3">
                  {Object.entries(parsedSkills).map(([category, skills]) => (
                    <div key={category} className="space-y-1">
                      <div className="text-[10px] uppercase font-bold text-slate-400">{category}</div>
                      <div className="flex flex-wrap gap-1">
                        {skills.map(skill => (
                          <span key={skill} className="px-2 py-0.5 bg-blue-50 text-blue-600 rounded text-[10px] border border-blue-100">
                            {skill}
                          </span>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="rounded-xl bg-slate-50 p-5 text-sm text-slate-600 ring-1 ring-slate-200 text-center">
                  Upload a resume to see parsed skills.
                </div>
              )}
            </CardBody>
          </Card>

          <Card>
            <CardHeader className="pb-4">
              <div className="text-sm font-semibold text-slate-900">2. Job Match</div>
              <div className="text-sm text-slate-600">Best fits for your profile.</div>
            </CardHeader>
            <CardBody>
              {matches.length > 0 ? (
                <div className="grid gap-3 max-h-[400px] overflow-y-auto pr-1">
                  {matches.map((job) => (
                    <div key={job.job_id} className="rounded-xl bg-white p-3 ring-1 ring-slate-200 hover:ring-blue-300 transition-all shadow-sm border-l-4 border-l-blue-500">
                      <div className="flex justify-between items-start mb-1">
                        <div>
                          <h4 className="text-sm font-bold text-slate-900">{job.title}</h4>
                          <p className="text-[10px] text-slate-500">{job.company}</p>
                        </div>
                        <span className={`text-xs font-bold ${job.score > 70 ? 'text-emerald-600' : job.score > 40 ? 'text-amber-600' : 'text-slate-600'}`}>
                          {job.score}% Match
                        </span>
                      </div>
                      <p className="text-[10px] text-slate-600 line-clamp-2 mb-2">{job.description_preview}</p>
                      <Button 
                        size="sm" 
                        className="w-full text-[10px] py-1 h-7"
                        onClick={() => {
                          navigate("/interview", { 
                            state: { 
                              skills: job.matched_skills || [],
                              missing_skills: job.missing_skills || [],
                              jobQuestions: job.questions || [],
                              resume_score: job.score,
                              jobTitle: job.title,
                              job_id: job.job_id
                            } 
                          });
                        }}
                      >
                        Start Interview
                      </Button>
                    </div>
                  ))}
                </div>
              ) : match ? (
                <div className="grid gap-3">
                  <div className="rounded-xl bg-slate-50 p-4 ring-1 ring-slate-200 border-l-4 border-l-emerald-500">
                    <div className="text-xs font-medium text-slate-500">
                      Overall Match Score
                    </div>
                    <div className="mt-1 text-2xl font-semibold text-slate-900">
                      {match.score || match.fit_score}%
                    </div>
                  </div>
                  <div className="rounded-xl bg-white p-4 ring-1 ring-slate-200">
                    <div className="text-xs font-medium text-slate-500 mb-2">
                      Missing Critical Skills
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {match.missing_skills?.length
                        ? match.missing_skills.map(s => (
                            <span key={s} className="px-2 py-0.5 bg-rose-50 text-rose-600 rounded text-[10px] border border-rose-100">{s}</span>
                          ))
                        : "None detected."}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="rounded-xl bg-slate-50 p-5 text-sm text-slate-600 ring-1 ring-slate-200 text-center">
                  Analyze the inputs to see the match results.
                </div>
              )}
            </CardBody>
          </Card>

          <Card>
            <CardHeader className="pb-4">
              <div className="text-sm font-semibold text-slate-900">
                Outputs
              </div>
              <div className="text-sm text-slate-600">
                Suggestions and generated questions.
              </div>
            </CardHeader>
            <CardBody className="grid gap-4">
              <div className="space-y-2">
                <div className="text-xs font-medium text-slate-500">
                  Resume suggestions
                </div>
                {suggestions?.length ? (
                  <ul className="grid gap-2 text-sm text-slate-700">
                    {suggestions.map((s, i) => (
                      <li
                        key={i}
                        className="rounded-xl bg-white p-3 ring-1 ring-slate-200"
                      >
                        {s}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <div className="rounded-xl bg-slate-50 p-4 text-sm text-slate-600 ring-1 ring-slate-200">
                    No suggestions yet.
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <div className="text-xs font-medium text-slate-500">
                  Interview questions
                </div>
                {questions?.length ? (
                  <ol className="grid gap-2 text-sm text-slate-700">
                    {questions.map((q, i) => (
                      <li
                        key={i}
                        className="rounded-xl bg-white p-3 ring-1 ring-slate-200"
                      >
                        <span className="font-medium text-slate-900">
                          Q{i + 1}.
                        </span>{" "}
                        {q}
                      </li>
                    ))}
                  </ol>
                ) : (
                  <div className="rounded-xl bg-slate-50 p-4 text-sm text-slate-600 ring-1 ring-slate-200">
                    No questions generated yet.
                  </div>
                )}
              </div>
            </CardBody>
          </Card>
        </div>
      </div>
    </div>
  );
}

export default InterviewFlow;
