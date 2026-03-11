import { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import Button from "../components/ui/Button";
import { Card, CardBody, CardHeader } from "../components/ui/Card";
import { Input, Label, Textarea } from "../components/ui/Form";

export default function ResumeAnalysis() {
  const navigate = useNavigate();
  const [file, setFile] = useState(null);
  const [files, setFiles] = useState([]); // For folder/multiple uploads
  const [jd, setJd] = useState("");
  const [jobQuestions, setJobQuestions] = useState([]);
  const [jobId, setJobId] = useState(null);
  const [result, setResult] = useState(null);
  const [matches, setMatches] = useState([]);
  const [parsedSkills, setParsedSkills] = useState(null);
  const [analyzed, setAnalyzed] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);

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
    const targetFile = file || files[0];
    if (!targetFile) return;
    
    setBusy(true);
    setAnalyzed(false);
    setError(null);
    const API_BASE = "http://127.0.0.1:8000";
    
    try {
      const formData = new FormData();
      formData.append("file", targetFile);
      
      console.log("Starting analysis for file:", targetFile.name);
      
      if (jd.trim()) {
        // Specific JD analysis
        formData.append("job_description", jd);
        const res = await axios.post(`${API_BASE}/analyze-resume`, formData, {
          headers: { "Content-Type": "multipart/form-data" },
        });
        console.log("Analyze-resume response:", res.data);
        setResult(res.data);
        setParsedSkills(res.data.resume_skills || null);
        setMatches([]);
      } else {
        // Match against all jobs
        console.log("Matching against all jobs...");
        const res = await axios.post(`${API_BASE}/match-jobs`, formData, {
          headers: { "Content-Type": "multipart/form-data" },
        });
        console.log("Match-jobs response:", res.data);
        setMatches(res.data.matches || []);
        setParsedSkills(res.data.resume_skills || null);
        setResult(null);
      }
      setAnalyzed(true);
    } catch (err) {
      console.error("Analysis failed:", err);
      const msg = err.response?.data?.detail || err.message || "An unknown error occurred during analysis.";
      setError(msg);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="cb-container py-10 sm:py-14">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-slate-900 sm:text-3xl">
            AI interview pipeline
          </h1>
          <p className="mt-1 text-sm text-slate-600">
            Upload a resume folder or file to compute fit and find matching jobs.
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
                <Label htmlFor="resumeFile">Resume upload</Label>
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
              </div>
              <div className="space-y-2">
                <Label htmlFor="jd">Job description (Optional)</Label>
                <Textarea
                  id="jd"
                  placeholder="Paste JD or leave empty to match all jobs…"
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
              <Button onClick={analyze} disabled={(!file && files.length === 0) || busy}>
                {busy ? "Analyzing..." : (jd.trim() ? "Analyze Specific Job" : "Find Matching Jobs")}
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
            {error && (
              <div className="mb-4 rounded-xl bg-rose-50 p-4 ring-1 ring-rose-200 text-rose-700 text-sm">
                <div className="font-bold mb-1">Analysis Error</div>
                {error}
              </div>
            )}
            
            {parsedSkills && (
              <div className="mb-6 rounded-xl bg-blue-50/50 p-4 ring-1 ring-blue-100 shadow-sm">
                <div className="text-xs font-bold text-blue-900 mb-3 flex items-center gap-2">
                  <span className="flex h-5 w-5 items-center justify-center rounded-full bg-blue-600 text-[10px] text-white font-bold">1</span>
                  Resume Parser: Extracted Skills
                </div>
                <div className="space-y-3">
                  {Object.entries(parsedSkills).map(([category, skills]) => (
                    <div key={category}>
                      <div className="text-[10px] uppercase tracking-wider font-bold text-slate-400 mb-1">{category}</div>
                      <div className="flex flex-wrap gap-1.5">
                        {skills.map(skill => (
                          <span key={skill} className="px-2 py-0.5 bg-white text-blue-700 rounded-md text-[11px] font-medium border border-blue-200">
                            {skill}
                          </span>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {matches.length > 0 ? (
              <div className="grid gap-4">
                <div className="text-sm font-semibold text-slate-900 mb-2 flex items-center gap-2">
                  <span className="flex h-5 w-5 items-center justify-center rounded-full bg-slate-900 text-[10px] text-white font-bold">2</span>
                  Matching Jobs Found ({matches.length})
                </div>
                {matches.map((match) => (
                  <div key={match.job_id} className="rounded-xl bg-white p-4 ring-1 ring-slate-200 hover:ring-blue-300 transition-all shadow-sm border-l-4 border-l-blue-500">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <h3 className="text-sm font-bold text-slate-900">{match.title}</h3>
                        <p className="text-[11px] text-slate-500">{match.company}</p>
                      </div>
                      <div className="flex flex-col items-end">
                        <span className={`text-sm font-bold ${match.score > 70 ? 'text-emerald-600' : match.score > 40 ? 'text-amber-600' : 'text-slate-600'}`}>
                          {match.score}% Match
                        </span>
                      </div>
                    </div>
                    
                    <p className="text-xs text-slate-600 line-clamp-2 mb-3">
                      {match.description_preview}
                    </p>
                    
                    <Button 
                       size="sm"
                       className="w-full text-xs py-1.5"
                       onClick={() => {
                         navigate("/interview", { 
                           state: { 
                             skills: match.matched_skills || [],
                             missing_skills: match.missing_skills || [],
                             jobQuestions: match.questions || [],
                             resume_score: match.score,
                             jobTitle: match.title,
                             job_id: match.job_id
                           } 
                         });
                       }}
                     >
                       Start Interview
                     </Button>
                  </div>
                ))}
              </div>
            ) : analyzed && !result ? (
              <div className="rounded-xl bg-amber-50 p-5 text-sm text-amber-700 ring-1 ring-amber-200 text-center">
                <div className="font-bold mb-1">No matching jobs found.</div>
                <p className="text-xs">Try uploading a different resume or adjusting your profile skills.</p>
              </div>
            ) : result ? (
              <div className="grid gap-4">
                <div className="text-sm font-semibold text-slate-900 mb-2 flex items-center gap-2">
                  <span className="flex h-5 w-5 items-center justify-center rounded-full bg-slate-900 text-[10px] text-white font-bold">2</span>
                  Job Analysis Result
                </div>
                <div className="rounded-xl bg-slate-50 p-4 ring-1 ring-slate-200 border-l-4 border-l-emerald-500">
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

