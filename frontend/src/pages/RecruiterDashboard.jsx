import React, { useEffect, useState } from "react";
import axios from "axios";
import Button from "../components/ui/Button";
import { Card, CardBody, CardHeader } from "../components/ui/Card";
import { getUserSession } from "../utils/auth";
import Leaderboard from "../components/Leaderboard";

function RecruiterDashboard() {
  const [candidates, setCandidates] = useState([]);

  useEffect(() => {
    axios.get("http://localhost:8000/leaderboard").then((res) => {
      setCandidates(res.data);
    });
  }, []);
  const [alerts, setAlerts] = useState([]);
  const [reportFile, setReportFile] = useState(null);
  const [decision, setDecision] = useState(null);
  const [busy, setBusy] = useState(false);
  const [jobs, setJobs] = useState([]);
  const [jobTitle, setJobTitle] = useState("");
  const [jobDescription, setJobDescription] = useState("");
  const [jobQuestions, setJobQuestions] = useState("");
  const session = getUserSession();
  const recruiterName = session?.name || "Recruiter";

  useEffect(() => {
    if (!session) {
      window.location.href = "/login";
      return;
    }
    axios.get("http://localhost:8000/alerts").then((res) => {
      setAlerts(res.data);
    });
    axios
      .get("http://localhost:8000/jobs", {
        params: { recruiter_id: session.id },
      })
      .then((res) => setJobs(res.data));
  }, [session]);

  async function generateReport() {
    setBusy(true);
    try {
      const res = await axios.post("http://localhost:8000/generate-report", {
        name: "Alex Johnson",
        resume_score: 82,
        interview_score: 86,
        integrity_score: 91,
        skills: ["Python", "React", "SQL"],
        missing_skills: ["Docker", "AWS"],
        recommendation: "Strong Hire",
      });
      setReportFile(res.data.file);
    } catch (err) {
      console.error("Report generation failed:", err);
    } finally {
      setBusy(false);
    }
  }

  async function getDecision() {
    setBusy(true);
    try {
      const res = await axios.post("http://localhost:8000/hiring-decision", {
        resume_score: 82,
        interview_score: 86,
        integrity_score: 91,
      });
      setDecision(res.data);
    } catch (err) {
      console.error("Hiring decision failed:", err);
    } finally {
      setBusy(false);
    }
  }

  async function createJob(e) {
    e.preventDefault();
    if (!session) return;
    if (!jobTitle.trim() || !jobDescription.trim()) return;
    const questions = jobQuestions
      .split("\n")
      .map((q) => q.trim())
      .filter(Boolean);
    setBusy(true);
    try {
      const res = await axios.post("http://localhost:8000/jobs/", {
        recruiter_id: session.id,
        title: jobTitle,
        description: jobDescription,
        questions,
      });
      setJobs((prev) => [res.data, ...prev]);
      setJobTitle("");
      setJobDescription("");
      setJobQuestions("");
    } catch (err) {
      console.error("Job creation failed:", err);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="cb-container py-10 sm:py-14">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-slate-900 sm:text-3xl">
            {recruiterName}'s recruiter dashboard
          </h1>
          <p className="mt-1 text-sm text-slate-600">
            Review integrity alerts, generate reports, and request a hiring
            decision.
          </p>
        </div>
      </div>

      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
          <div className="text-xs font-semibold uppercase tracking-wider text-slate-500">Active Jobs</div>
          <div className="mt-2 text-3xl font-bold text-slate-900">12</div>
          <div className="mt-2 text-xs text-emerald-600 font-medium">+2 from last week</div>
        </div>
        <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
          <div className="text-xs font-semibold uppercase tracking-wider text-slate-500">Candidates</div>
          <div className="mt-2 text-3xl font-bold text-slate-900">48</div>
          <div className="mt-2 text-xs text-emerald-600 font-medium">+15% conversion</div>
        </div>
        <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
          <div className="text-xs font-semibold uppercase tracking-wider text-slate-500">Avg. Score</div>
          <div className="mt-2 text-3xl font-bold text-slate-900">74%</div>
          <div className="mt-2 text-xs text-amber-600 font-medium">-3% from benchmark</div>
        </div>
        <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
          <div className="text-xs font-semibold uppercase tracking-wider text-slate-500">Integrity Risk</div>
          <div className="mt-2 text-3xl font-bold text-slate-900">Low</div>
          <div className="mt-2 text-xs text-emerald-600 font-medium">98% passing</div>
        </div>
      </div>

      <div className="mt-8">
        <Leaderboard candidates={candidates} />
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-12">
        <Card className="lg:col-span-4">
          <CardHeader className="pb-4">
            <div className="text-sm font-semibold text-slate-900">
              Candidate snapshot
            </div>
            <div className="text-sm text-slate-600">
              Example candidate summary.
            </div>
          </CardHeader>
          <CardBody className="grid gap-3">
            <div className="rounded-xl bg-slate-50 p-4 ring-1 ring-slate-200">
              <div className="text-sm font-semibold text-slate-900">
                Alex Johnson
              </div>
              <div className="mt-2 grid gap-1 text-sm text-slate-700">
                <div className="flex items-center justify-between">
                  <span className="text-slate-600">Resume</span>
                  <span className="font-medium">82%</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-600">Interview</span>
                  <span className="font-medium">86%</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-600">Integrity</span>
                  <span className="font-medium">91%</span>
                </div>
              </div>
            </div>

            <div className="grid gap-2">
              <Button onClick={generateReport} disabled={busy}>
                {busy ? "Working..." : "Generate interview report"}
              </Button>
              <Button onClick={getDecision} variant="secondary" disabled={busy}>
                Get hiring decision
              </Button>
              {reportFile && (
                <Button
                  as="a"
                  href={`http://localhost:8000/reports/${reportFile}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  variant="secondary"
                >
                  Download report
                </Button>
              )}
            </div>
          </CardBody>
        </Card>

        <div className="grid gap-6 lg:col-span-8">
          <Card>
            <CardHeader className="pb-4">
              <div className="text-sm font-semibold text-slate-900">
                Jobs and interview questions
              </div>
              <div className="text-sm text-slate-600">
                Create jobs with predefined interview questions.
              </div>
            </CardHeader>
            <CardBody className="grid gap-4">
              <form className="grid gap-3" onSubmit={createJob}>
                <div className="space-y-1">
                  <div className="text-xs font-medium text-slate-500">
                    Job title
                  </div>
                  <input
                    className="cb-input"
                    value={jobTitle}
                    onChange={(e) => setJobTitle(e.target.value)}
                    placeholder="e.g. Senior React Engineer"
                  />
                </div>
                <div className="space-y-1">
                  <div className="text-xs font-medium text-slate-500">
                    Job description
                  </div>
                  <textarea
                    className="cb-textarea min-h-28"
                    value={jobDescription}
                    onChange={(e) => setJobDescription(e.target.value)}
                    placeholder="Short description of the role…"
                  />
                </div>
                <div className="space-y-1">
                  <div className="text-xs font-medium text-slate-500">
                    Interview questions (one per line)
                  </div>
                  <textarea
                    className="cb-textarea min-h-28"
                    value={jobQuestions}
                    onChange={(e) => setJobQuestions(e.target.value)}
                    placeholder="What experience do you have with React?\nHow do you structure a scalable frontend?"
                  />
                </div>
                <Button type="submit" disabled={busy}>
                  {busy ? "Saving…" : "Create job"}
                </Button>
              </form>

              <div className="mt-4">
                {jobs.length === 0 ? (
                  <div className="rounded-xl bg-slate-50 p-4 text-sm text-slate-600 ring-1 ring-slate-200">
                    No jobs created yet.
                  </div>
                ) : (
                  <ul className="grid gap-2 text-sm text-slate-700">
                    {jobs.map((job) => (
                      <li
                        key={job.id}
                        className="rounded-xl bg-white p-3 ring-1 ring-slate-200"
                      >
                        <div className="font-semibold text-slate-900">
                          {job.title}
                        </div>
                        <div className="mt-1 text-xs text-slate-500">
                          Questions: {job.questions?.length ?? 0}
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </CardBody>
          </Card>

          <Card>
            <CardHeader className="pb-4">
              <div className="text-sm font-semibold text-slate-900">
                Integrity alerts
              </div>
              <div className="text-sm text-slate-600">
                Alerts posted during interview/proctoring.
              </div>
            </CardHeader>
            <CardBody>
              {alerts?.length ? (
                <ul className="grid gap-2 text-sm text-slate-700">
                  {alerts.map((alert, i) => (
                    <li
                      key={i}
                      className="flex items-start justify-between gap-4 rounded-xl bg-white p-3 ring-1 ring-slate-200"
                    >
                      <span>{alert.message ?? JSON.stringify(alert)}</span>
                      <span className="text-xs text-slate-500">
                        {alert.type ?? "alert"}
                      </span>
                    </li>
                  ))}
                </ul>
              ) : (
                <div className="rounded-xl bg-slate-50 p-5 text-sm text-slate-600 ring-1 ring-slate-200">
                  No alerts received yet.
                </div>
              )}
            </CardBody>
          </Card>

          <Card>
            <CardHeader className="pb-4">
              <div className="text-sm font-semibold text-slate-900">
                Decision
              </div>
              <div className="text-sm text-slate-600">
                Final score and recommendation.
              </div>
            </CardHeader>
            <CardBody>
              {decision ? (
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="rounded-xl bg-slate-50 p-4 ring-1 ring-slate-200">
                    <div className="text-xs font-medium text-slate-500">
                      Final score
                    </div>
                    <div className="mt-1 text-2xl font-semibold text-slate-900">
                      {decision.final_score}
                    </div>
                  </div>
                  <div className="rounded-xl bg-slate-50 p-4 ring-1 ring-slate-200">
                    <div className="text-xs font-medium text-slate-500">
                      Recommendation
                    </div>
                    <div className="mt-1 text-2xl font-semibold text-slate-900">
                      {decision.decision}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="rounded-xl bg-slate-50 p-5 text-sm text-slate-600 ring-1 ring-slate-200">
                  Request a hiring decision to see results here.
                </div>
              )}
            </CardBody>
          </Card>
        </div>
      </div>
    </div>
  );
}

export default RecruiterDashboard;
