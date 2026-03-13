import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import Button from "../components/ui/Button";
import { Card, CardBody, CardHeader } from "../components/ui/Card";
import { Input, Label, Textarea } from "../components/ui/Form";

export default function ResumeAnalysis() {
  const navigate = useNavigate();
  const [file, setFile] = useState(null);
  const [jd, setJd] = useState("");
  const [result, setResult] = useState(null);
  const [busy, setBusy] = useState(false);
  const [jobs, setJobs] = useState([]);

  useEffect(() => {
    async function loadJobs() {
      try {
        const res = await axios.get(`http://localhost:8000/jobs`);
        setJobs(res.data);
      } catch {}
    }
    loadJobs();

    const params = new URLSearchParams(window.location.search);
    const jobId = params.get("jobId");
    if (!jobId) return;
    async function loadJob() {
      try {
        const res = await fetch(`http://localhost:8000/jobs/${jobId}`);
        if (!res.ok) return;
        const job = await res.json();
        setJd(job.description || "");
      } catch {}
    }
    loadJob();
  }, []);

  async function analyze(jobDescription) {
    if (!file) return;
    setBusy(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("job_description", jobDescription);
      const res = await axios.post("http://localhost:8000/analyze-resume", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      setResult(res.data);
    } catch (err) {
      console.error("Analysis failed:", err);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="cb-container py-10 sm:py-14">
      <div className="mx-auto max-w-3xl text-center">
        <h1 className="text-3xl font-semibold tracking-tight text-slate-900 sm:text-4xl">
          Resume Analyzer
        </h1>
        <p className="mt-2 text-base text-slate-600">
          Upload your resume, select a job, and get an instant match analysis.
        </p>
      </div>

      <div className="mt-10 grid grid-cols-1 gap-8 lg:grid-cols-12">
        {/* Left Column: Inputs */}
        <div className="lg:col-span-4">
          <Card className="p-6">
            <h3 className="text-lg font-semibold text-slate-900">Your Resume</h3>
            <div className="mt-4 space-y-2">
              <Label htmlFor="resumeFile">Upload your resume file</Label>
              <Input id="resumeFile" type="file" onChange={(e) => setFile(e.target.files?.[0] ?? null)} />
              {file && <p className="text-xs text-slate-500">Selected: {file.name}</p>}
            </div>
          </Card>
        </div>

        {/* Middle Column: Job Listings */}
        <div className="lg:col-span-4">
          <Card className="p-6">
            <h3 className="text-lg font-semibold text-slate-900">Available Jobs</h3>
            <div className="mt-4 space-y-3 h-96 overflow-y-auto pr-2">
              {jobs.map((job) => (
                <div key={job.id} className="p-4 rounded-lg border border-slate-200 bg-white">
                  <h4 className="font-semibold text-sm text-slate-800">{job.title}</h4>
                  <p className="text-xs text-slate-500 mt-1 line-clamp-2">{job.description}</p>
                  <Button onClick={() => analyze(job.description)} disabled={!file || busy} size="sm" className="mt-3 w-full">
                    {busy ? "Analyzing..." : "Analyze Match"}
                  </Button>
                </div>
              ))}
            </div>
          </Card>
        </div>

        {/* Right Column: Results */}
        <div className="lg:col-span-4">
          <Card className="p-6 sticky top-24">
            <h3 className="text-lg font-semibold text-slate-900">Analysis Results</h3>
            {result ? (
              <div className="mt-4 space-y-4">
                <div className="text-center">
                  <p className="text-sm text-slate-500">Match Score</p>
                  <p className="text-5xl font-bold text-indigo-600">{result.score}%</p>
                </div>
                <div>
                  <h4 className="font-semibold text-sm text-slate-800">Skills Found</h4>
                  <p className="text-xs text-slate-600 mt-1">{result.resume_skills?.join(", ") || "None"}</p>
                </div>
                <div>
                  <h4 className="font-semibold text-sm text-slate-800">Missing Skills</h4>
                  <p className="text-xs text-slate-600 mt-1">{result.missing_skills?.join(", ") || "None"}</p>
                </div>
                <Button onClick={() => navigate("/interview-flow")} className="w-full mt-4">
                  Start Interview Pipeline
                </Button>
              </div>
            ) : (
              <div className="mt-4 text-center py-10 px-6 bg-slate-50 rounded-lg">
                <p className="text-sm text-slate-500">Your analysis results will appear here.</p>
              </div>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}
