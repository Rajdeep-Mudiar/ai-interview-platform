import { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import Button from "../components/ui/Button";
import { Card, CardBody, CardHeader } from "../components/ui/Card";
import { Input, Label, Textarea } from "../components/ui/Form";

export default function ResumeAnalysis() {
  const navigate = useNavigate();
  const [file, setFile] = useState(null);
  const [jd, setJd] = useState("");
  const [jobQuestions, setJobQuestions] = useState([]);
  const [jobId, setJobId] = useState(null);
  const [result, setResult] = useState(null);
  const [busy, setBusy] = useState(false);

  // If navigated from Jobs page with ?jobId=..., fetch job and prefill JD.
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const jId = params.get("jobId");
    if (!jId) return;
    setJobId(jId);
    const API_BASE = "http://127.0.0.1:8000";
    async function loadJob() {
      try {
        const res = await fetch(`${API_BASE}/jobs/${jId}`);
        if (!res.ok) return;
        const job = await res.json();
        setJd(job.description || "");
        setJobQuestions(job.questions || []);
      } catch {
        // ignore
      }
    }
    loadJob();
  }, []);

  async function analyze() {
    if (!file || !jd.trim()) return;
    setBusy(true);
    const API_BASE = "http://127.0.0.1:8000";
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("job_description", jd);
      const res = await axios.post(`${API_BASE}/analyze-resume`, formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });
      setResult(res.data);
      
      // Instead of navigating immediately, we show results here.
      // If the user wants to start an interview, they can click a button below.
    } catch (err) {
      console.error("Analysis failed:", err);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="cb-container py-10 sm:py-14">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-slate-900 sm:text-3xl">
            Resume analysis
          </h1>
          <p className="mt-1 text-sm text-slate-600">
            Upload a resume and paste a job description to compute fit and gaps.
          </p>
        </div>
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-12">
        <Card className="lg:col-span-7">
          <CardHeader className="pb-4">
            <div className="text-sm font-semibold text-slate-900">Inputs</div>
            <div className="text-sm text-slate-600">
              Resume file and job description.
            </div>
          </CardHeader>
          <CardBody className="grid gap-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="resumeFile">Resume file</Label>
                <Input
                  id="resumeFile"
                  type="file"
                  onChange={(e) => setFile(e.target.files?.[0] ?? null)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="jd">Job description</Label>
                <Textarea
                  id="jd"
                  placeholder="Paste job description…"
                  value={jd}
                  onChange={(e) => setJd(e.target.value)}
                  className="min-h-28"
                />
              </div>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="text-sm text-slate-600">
                {file ? (
                  <>
                    Selected:{" "}
                    <span className="font-medium text-slate-900">{file.name}</span>
                  </>
                ) : (
                  "No resume file selected."
                )}
              </div>
              <Button onClick={analyze} disabled={!file || !jd.trim() || busy}>
                {busy ? "Analyzing..." : "Analyze"}
              </Button>
            </div>
          </CardBody>
        </Card>

        <Card className="lg:col-span-5">
          <CardHeader className="pb-4">
            <div className="text-sm font-semibold text-slate-900">Results</div>
            <div className="text-sm text-slate-600">
              Match score, extracted skills, and missing skills.
            </div>
          </CardHeader>
          <CardBody>
            {result ? (
              <div className="grid gap-4">
                <div className="rounded-xl bg-slate-50 p-4 ring-1 ring-slate-200">
                  <div className="flex justify-between items-center">
                    <div className="text-xs font-medium text-slate-500">Overall Match Score</div>
                    <div className="text-2xl font-bold text-slate-900">{result.score}%</div>
                  </div>
                  <div className="mt-3 space-y-2">
                    <div className="flex justify-between text-xs">
                      <span className="text-slate-600">Text Similarity</span>
                      <span className="font-semibold text-slate-900">{result.metrics?.text_similarity}%</span>
                    </div>
                    <div className="w-full bg-slate-200 rounded-full h-1.5">
                      <div className="bg-blue-600 h-1.5 rounded-full" style={{ width: `${result.metrics?.text_similarity}%` }}></div>
                    </div>
                    <div className="flex justify-between text-xs pt-1">
                      <span className="text-slate-600">Skill Match Rate</span>
                      <span className="font-semibold text-slate-900">{result.metrics?.skill_match_rate}%</span>
                    </div>
                    <div className="w-full bg-slate-200 rounded-full h-1.5">
                      <div className="bg-emerald-500 h-1.5 rounded-full" style={{ width: `${result.metrics?.skill_match_rate}%` }}></div>
                    </div>
                  </div>
                </div>

                <div className="rounded-xl bg-white p-4 ring-1 ring-slate-200">
                  <div className="text-xs font-medium text-slate-500 mb-2">Skills Analysis</div>
                  <div className="space-y-3">
                    {Object.entries(result.resume_skills || {}).map(([category, skills]) => (
                      <div key={category}>
                        <div className="text-[10px] uppercase tracking-wider font-bold text-slate-400 mb-1">{category}</div>
                        <div className="flex flex-wrap gap-1.5">
                          {skills.map(skill => (
                            <span key={skill} className="px-2 py-0.5 bg-blue-50 text-blue-700 rounded-md text-[11px] font-medium border border-blue-100">
                              {skill}
                            </span>
                          ))}
                        </div>
                      </div>
                    ))}
                    {!Object.keys(result.resume_skills || {}).length && <div className="text-sm text-slate-500">No categorized skills detected.</div>}
                  </div>
                </div>

                {result.missing_skills?.length > 0 && (
                  <div className="rounded-xl bg-amber-50 p-4 ring-1 ring-amber-200">
                    <div className="text-xs font-medium text-amber-700 mb-2">Missing Critical Skills</div>
                    <div className="flex flex-wrap gap-1.5">
                      {result.missing_skills.map(skill => (
                        <span key={skill} className="px-2 py-0.5 bg-white text-amber-700 rounded-md text-[11px] font-medium border border-amber-200">
                          {skill}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {result.suggestions?.length > 0 && (
                  <div className="rounded-xl bg-white p-4 ring-1 ring-slate-200 border-l-4 border-l-blue-500">
                    <div className="text-xs font-medium text-slate-500 mb-2">AI Suggestions</div>
                    <ul className="list-disc list-inside space-y-1.5">
                      {result.suggestions.map((suggestion, idx) => (
                        <li key={idx} className="text-xs text-slate-700 leading-relaxed">
                          {suggestion}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                <Button 
                  onClick={() => {
                    // Extract all skills from result.resume_skills
                    const allSkills = Object.values(result.resume_skills || {}).flat();
                    navigate("/interview", { 
                      state: { 
                        skills: allSkills,
                        missing_skills: result.missing_skills || [],
                        jobQuestions: jobQuestions,
                        resume_score: result.score,
                        jobTitle: jd.split("\n")[0].substring(0, 30), // Simple job title extraction
                        job_id: jobId
                      } 
                    });
                  }}
                  className="mt-2 w-full"
                >
                  Proceed to Video Interview
                </Button>
              </div>
            ) : (
              <div className="rounded-xl bg-slate-50 p-5 text-sm text-slate-600 ring-1 ring-slate-200">
                Analyze a resume to see results here.
              </div>
            )}
          </CardBody>
        </Card>
      </div>
    </div>
  );
}

