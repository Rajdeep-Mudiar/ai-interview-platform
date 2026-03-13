import React, { useEffect, useState } from "react";
import axiosClient from "../utils/axiosClient";
import Button from "../components/ui/Button";
import { Card, CardBody, CardHeader } from "../components/ui/Card";
import { getUserSession } from "../utils/auth";
import Leaderboard from "../components/Leaderboard";

function RecruiterDashboard() {
  const [candidates, setCandidates] = useState([]);
  const [stats, setStats] = useState({
    activeJobs: 0,
    totalCandidates: 0,
    avgScore: "0%",
    integrityRisk: "—",
    integrityRate: "0% passing"
  });

  useEffect(() => {
    axiosClient.get("/leaderboard").then((res) => {
      setCandidates(res.data);
    });
    axiosClient.get("/stats/recruiter").then((res) => {
      setStats(res.data);
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
    axiosClient.get("/monitoring/activity-logs").then((res) => {
      setAlerts(res.data);
    });
    axiosClient
      .get("/jobs", {
        params: { recruiter_id: session?.id },
      })
      .then((res) => setJobs(res.data));
  }, [session]);

  async function generateReport() {
    setBusy(true);
    try {
      const res = await axiosClient.post("/generate-report", {
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
      const res = await axiosClient.post("/hiring-decision", {
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
      const res = await axiosClient.post("/jobs/", {
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
      {/* Header Section */}
      <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between border-b border-slate-100 pb-10 mb-10">
        <div className="space-y-2">
          <div className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-50 text-blue-700 ring-1 ring-blue-100 mb-2">
            Recruiter Dashboard
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
            Welcome, {recruiterName}
          </h1>
          <p className="text-slate-600 max-w-2xl">
            Manage your open positions, review candidate performance, and monitor real-time proctoring alerts across all active interviews.
          </p>
        </div>
        
        <div className="flex flex-wrap gap-3">
          <Button onClick={() => window.location.href='/jobs'} className="h-11 px-6 bg-slate-900 text-white hover:bg-slate-800 transition-all shadow-sm">
            Manage All Jobs
          </Button>
          <Button onClick={() => window.location.href='/candidates'} variant="secondary" className="h-11 px-6 border-slate-200 hover:bg-slate-50 transition-all">
            View All Candidates
          </Button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-5 mb-10">
        {[
          { label: "Active Jobs", value: stats.activeJobs, icon: "💼", color: "blue" },
          { label: "Total Candidates", value: stats.totalCandidates, icon: "👥", color: "emerald" },
          { label: "Avg. Tech Score", value: stats.avgScore, icon: "📈", color: "indigo" },
          { label: "Integrity Risk", value: stats.integrityRisk, icon: "🛡️", color: "rose" },
          { label: "Integrity Rate", value: stats.integrityRate, icon: "✅", color: "amber" }
        ].map((stat, i) => (
          <div key={i} className="bg-white p-6 rounded-2xl shadow-sm ring-1 ring-slate-200 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-4">
              <div className={`w-10 h-10 rounded-xl bg-${stat.color}-50 flex items-center justify-center text-xl`}>
                {stat.icon}
              </div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Live</span>
            </div>
            <div className="text-2xl font-bold text-slate-900 mb-1">{stat.value}</div>
            <div className="text-sm text-slate-500 font-medium">{stat.label}</div>
          </div>
        ))}
      </div>

      <div className="grid gap-8 lg:grid-cols-12 items-start">
        {/* Left: Job Management & Questions */}
        <div className="lg:col-span-8 space-y-8">
          <Card className="overflow-hidden border-none shadow-sm ring-1 ring-slate-200">
            <CardHeader className="bg-slate-50/50 border-b border-slate-100 p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white">
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <h2 className="text-lg font-bold text-slate-900">Job Positions & Questions</h2>
                </div>
                <div className="text-xs font-medium text-slate-500 bg-white px-2 py-1 rounded border border-slate-100 shadow-sm">
                  {jobs.length} Active Positions
                </div>
              </div>
            </CardHeader>
            <CardBody className="p-6 space-y-8">
              {/* Create Job Form */}
              <form className="bg-slate-50/50 p-6 rounded-2xl ring-1 ring-slate-100 space-y-4" onSubmit={createJob}>
                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold uppercase tracking-wider text-slate-500 ml-1">Job Title</label>
                    <input
                      className="w-full h-11 px-4 rounded-xl bg-white ring-1 ring-slate-200 focus:ring-2 focus:ring-blue-600 outline-none transition-all text-sm"
                      value={jobTitle}
                      onChange={(e) => setJobTitle(e.target.value)}
                      placeholder="e.g. Senior Software Engineer"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold uppercase tracking-wider text-slate-500 ml-1">Description</label>
                    <input
                      className="w-full h-11 px-4 rounded-xl bg-white ring-1 ring-slate-200 focus:ring-2 focus:ring-blue-600 outline-none transition-all text-sm"
                      value={jobDescription}
                      onChange={(e) => setJobDescription(e.target.value)}
                      placeholder="Brief role overview..."
                    />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-500 ml-1">Interview Questions (one per line)</label>
                  <textarea
                    className="w-full min-h-[120px] p-4 rounded-xl bg-white ring-1 ring-slate-200 focus:ring-2 focus:ring-blue-600 outline-none transition-all text-sm resize-none"
                    value={jobQuestions}
                    onChange={(e) => setJobQuestions(e.target.value)}
                    placeholder="Enter the questions candidates will be asked..."
                  />
                </div>
                <Button type="submit" disabled={busy} className="w-full h-11 bg-blue-600 hover:bg-blue-700 font-bold">
                  {busy ? "Saving Position..." : "Publish Job Position"}
                </Button>
              </form>

              {/* Job List */}
              <div className="space-y-3">
                <h3 className="text-sm font-bold text-slate-900 px-1">Recent Positions</h3>
                <div className="grid gap-3 sm:grid-cols-2">
                  {jobs.length === 0 ? (
                    <div className="sm:col-span-2 text-center py-8 text-sm text-slate-500 bg-slate-50 rounded-xl border border-dashed border-slate-200">
                      No jobs created yet. Start by creating your first position.
                    </div>
                  ) : (
                    jobs.map((job) => (
                      <div key={job.id} className="group bg-white p-4 rounded-xl ring-1 ring-slate-200 hover:ring-blue-300 hover:shadow-md transition-all cursor-pointer">
                        <div className="flex items-start justify-between">
                          <div className="font-bold text-slate-900 group-hover:text-blue-600 transition-colors">{job.title}</div>
                          <div className="px-2 py-0.5 rounded bg-slate-50 text-[10px] font-bold text-slate-500 border border-slate-100 uppercase">
                            {job.questions?.length ?? 0} Qs
                          </div>
                        </div>
                        <div className="mt-1 text-xs text-slate-500 line-clamp-1">{job.description}</div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </CardBody>
          </Card>

          <Card className="overflow-hidden border-none shadow-sm ring-1 ring-slate-200">
            <CardHeader className="bg-slate-50/50 border-b border-slate-100 p-6">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-emerald-600 flex items-center justify-center text-white">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                </div>
                <h2 className="text-lg font-bold text-slate-900">Candidate Performance</h2>
              </div>
            </CardHeader>
            <CardBody className="p-0">
              <Leaderboard candidates={candidates} />
            </CardBody>
          </Card>
        </div>

        {/* Right: Monitoring & Decisions */}
        <div className="lg:col-span-4 space-y-6">
          <Card className="border-none shadow-sm ring-1 ring-slate-200">
            <CardHeader className="p-6 pb-2">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-bold text-slate-900">Integrity Center</h2>
                <div className="flex h-2 w-2 rounded-full bg-rose-500 animate-pulse"></div>
              </div>
              <p className="text-sm text-slate-500 mt-1">Real-time alerts from desktop and mobile proctoring services.</p>
            </CardHeader>
            <CardBody className="p-6 pt-2">
              <div className="space-y-3">
                {alerts?.length ? (
                  alerts.slice(0, 8).map((alert, i) => (
                    <div
                      key={i}
                      className="p-3 rounded-xl bg-white ring-1 ring-slate-100 flex flex-col gap-1 border-l-4 border-rose-500 shadow-sm"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-bold text-rose-600 uppercase tracking-wider">
                          {alert.event.replace("_", " ")}
                        </span>
                        <span className="text-[10px] text-slate-400">
                          {new Date(alert.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                      <p className="text-xs text-slate-700 font-medium">
                        {alert.metadata?.message ?? "Suspicious activity detected."}
                      </p>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-12 px-6 border-2 border-dashed border-slate-100 rounded-2xl bg-slate-50/50">
                    <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center mx-auto mb-3 shadow-sm text-slate-300">
                      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                      </svg>
                    </div>
                    <p className="text-xs text-slate-500 font-medium italic">No security incidents detected.</p>
                  </div>
                )}
              </div>
            </CardBody>
          </Card>

          <Card className="border-none shadow-sm ring-1 ring-slate-200">
            <CardHeader className="p-6 pb-2">
              <h2 className="text-lg font-bold text-slate-900">AI Hiring Assistant</h2>
              <p className="text-sm text-slate-500 mt-1">Get automated hiring recommendations and technical reports.</p>
            </CardHeader>
            <CardBody className="p-6 pt-2 space-y-4">
              <Button onClick={generateReport} disabled={busy} className="w-full h-11 bg-slate-900 text-white hover:bg-slate-800 transition-all font-bold">
                {busy ? "Analyzing..." : "Generate Technical Report"}
              </Button>
              <Button onClick={getDecision} variant="secondary" className="w-full h-11 border-slate-200 hover:bg-slate-50 transition-all font-bold">
                Get AI Decision
              </Button>

              {decision && (
                <div className="p-4 rounded-xl bg-blue-50 border border-blue-100 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-blue-900 uppercase">AI Recommendation</span>
                    <span className="px-2 py-0.5 rounded bg-blue-600 text-[10px] font-bold text-white uppercase tracking-wider">
                      {decision.recommendation}
                    </span>
                  </div>
                  <div className="text-2xl font-bold text-blue-900">{decision.final_score}%</div>
                  <p className="text-xs text-blue-700 leading-relaxed italic border-t border-blue-100 pt-2 mt-2">
                    "{decision.explanation}"
                  </p>
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
