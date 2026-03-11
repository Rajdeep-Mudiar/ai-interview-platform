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
  const [result, setResult] = useState(null);
  const [busy, setBusy] = useState(false);

  // If navigated from Jobs page with ?jobId=..., fetch job and prefill JD.
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const jobId = params.get("jobId");
    if (!jobId) return;
    async function loadJob() {
      try {
        const res = await fetch(`http://localhost:8000/jobs/${jobId}`);
        if (!res.ok) return;
        const job = await res.json();
        setJd(job.description || "");
      } catch {
        // ignore
      }
    }
    loadJob();
  }, []);

  async function analyze() {
    if (!file || !jd.trim()) return;
    setBusy(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("job_description", jd);
      const res = await axios.post("http://localhost:8000/analyze-resume", formData, {
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
                  <div className="text-xs font-medium text-slate-500">
                    Match score
                  </div>
                  <div className="mt-1 text-2xl font-semibold text-slate-900">
                    {result.score}%
                  </div>
                </div>
                <div className="rounded-xl bg-white p-4 ring-1 ring-slate-200">
                  <div className="text-xs font-medium text-slate-500">
                    Skills found
                  </div>
                  <div className="mt-1 text-sm text-slate-700">
                    {result.resume_skills?.length
                      ? result.resume_skills.join(", ")
                      : "None detected."}
                  </div>
                </div>
                <div className="rounded-xl bg-white p-4 ring-1 ring-slate-200">
                  <div className="text-xs font-medium text-slate-500">
                    Missing skills
                  </div>
                  <div className="mt-1 text-sm text-slate-700">
                    {result.missing_skills?.length
                      ? result.missing_skills.join(", ")
                      : "None detected."}
                  </div>
                </div>
                <Button 
                  onClick={() => navigate("/interview-flow", { state: { resume: result.resume_text || file?.name, jd: jd } })}
                  className="mt-2"
                >
                  Go to Interview Pipeline
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

