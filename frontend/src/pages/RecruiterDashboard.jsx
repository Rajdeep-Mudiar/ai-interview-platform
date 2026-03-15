import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import axiosClient from "../utils/axiosClient";
import Button from "../components/ui/Button";
import { Card, CardBody, CardHeader } from "../components/ui/Card";
import { getUserSession } from "../utils/auth";
import Leaderboard from "../components/Leaderboard";

function RecruiterDashboard() {
  const navigate = useNavigate();
  const session = getUserSession();
  const recruiterName = session?.name || "Recruiter";
  
  const [candidates, setCandidates] = useState([]);
  const [stats, setStats] = useState({
    activeJobs: 0,
    totalCandidates: 0,
    avgScore: "0%",
    integrityRisk: "—",
    integrityRate: "0% passing"
  });
  const [alerts, setAlerts] = useState([]);
  const [reportFile, setReportFile] = useState(null);
  const [decision, setDecision] = useState(null);
  const [busy, setBusy] = useState(false);
  const [jobs, setJobs] = useState([]);
  const [jobTitle, setJobTitle] = useState("");
  const [jobDescription, setJobDescription] = useState("");
  const [jobQuestions, setJobQuestions] = useState("");
  const [jobDeadline, setJobDeadline] = useState("");
  const [showCreateForm, setShowCreateForm] = useState(false);

  useEffect(() => {
    if (session?.id) {
      axiosClient.get("/leaderboard", {
        params: { recruiter_id: session.id }
      }).then((res) => {
        setCandidates(res.data);
      }).catch(err => console.error("Leaderboard fetch failed:", err));

      axiosClient.get("/stats/recruiter", {
        params: { recruiter_id: session.id }
      }).then((res) => {
        setStats(res.data);
      }).catch(err => console.error("Stats fetch failed:", err));

      axiosClient.get("/monitoring/activity-logs", {
        params: { recruiter_id: session.id }
      }).then((res) => {
        setAlerts(res.data);
      }).catch(err => console.error("Logs fetch failed:", err));

      axiosClient
        .get("/jobs", {
          params: { recruiter_id: session.id },
        })
        .then((res) => setJobs(res.data))
        .catch(err => console.error("Jobs fetch failed:", err));
    }
  }, [session?.id]);

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
        deadline: jobDeadline,
      });
      setJobs((prev) => [res.data, ...prev]);
      setJobTitle("");
      setJobDescription("");
      setJobQuestions("");
      setJobDeadline("");
      setShowCreateForm(false);
    } catch (err) {
      console.error("Job creation failed:", err);
    } finally {
      setBusy(false);
    }
  }

  const BriefcaseIcon = () => (
    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
    </svg>
  );

  const UsersIcon = () => (
    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
    </svg>
  );

  const ChartIcon = () => (
    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
    </svg>
  );

  const ShieldIcon = () => (
    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
    </svg>
  );

  const CheckIcon = () => (
    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  );

  const TrophyIcon = () => (
    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
    </svg>
  );

  const PlusIcon = () => (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
    </svg>
  );

  const CloseIcon = () => (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
    </svg>
  );

  const ArrowRightIcon = () => (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3" />
    </svg>
  );

  return (
    <div className="cb-container py-10 sm:py-14 bg-slate-50/30 min-h-screen">
      {/* Header Section */}
      <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between mb-12">
        <div className="space-y-1">
          <div className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-widest bg-blue-600 text-white mb-2">
            Admin Console
          </div>
          <h1 className="text-4xl font-black tracking-tight text-slate-900">
            Welcome, <span className="text-blue-600">{recruiterName}</span>
          </h1>
          <p className="text-slate-500 font-medium max-w-2xl">
            You have <span className="text-slate-900 font-bold">{stats.activeJobs} active positions</span> and <span className="text-slate-900 font-bold">{stats.totalCandidates} total applicants</span> to review today.
          </p>
        </div>
        
        <div className="flex flex-wrap gap-3">
          <Button 
            onClick={() => setShowCreateForm(!showCreateForm)} 
            className="h-12 px-6 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-2xl shadow-lg shadow-blue-500/20 transition-all flex items-center gap-2"
          >
            {showCreateForm ? <CloseIcon /> : <PlusIcon />}
            {showCreateForm ? 'Cancel' : 'Create New Job'}
          </Button>
          <Button 
            onClick={() => navigate('/candidates')} 
            variant="secondary" 
            className="h-12 px-6 bg-white border-slate-200 text-slate-700 font-bold rounded-2xl hover:bg-slate-50 transition-all shadow-sm"
          >
            View All Candidates
          </Button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-5 mb-12">
        {[
          { label: "Active Jobs", value: stats.activeJobs, icon: <BriefcaseIcon />, color: "bg-blue-50 text-blue-600" },
          { label: "Applicants", value: stats.totalCandidates, icon: <UsersIcon />, color: "bg-emerald-50 text-emerald-600" },
          { label: "Avg. Score", value: stats.avgScore, icon: <ChartIcon />, color: "bg-indigo-50 text-indigo-600" },
          { label: "Risk Level", value: stats.integrityRisk, icon: <ShieldIcon />, color: "bg-rose-50 text-rose-600" },
          { label: "Passing Rate", value: stats.integrityRate, icon: <CheckIcon />, color: "bg-amber-50 text-amber-600" }
        ].map((stat, i) => (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            key={i} 
            className="bg-white p-6 rounded-[2rem] shadow-sm ring-1 ring-slate-200/60 hover:shadow-xl hover:ring-blue-500/20 transition-all group"
          >
            <div className="flex items-center justify-between mb-4">
              <div className={`w-12 h-12 rounded-2xl ${stat.color} flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform`}>
                {stat.icon}
              </div>
              <div className="h-1.5 w-1.5 rounded-full bg-slate-300 group-hover:bg-blue-500 transition-colors"></div>
            </div>
            <div className="text-3xl font-black text-slate-900 mb-1">{stat.value}</div>
            <div className="text-[10px] font-black uppercase tracking-widest text-slate-400">{stat.label}</div>
          </motion.div>
        ))}
      </div>

      <div className="grid gap-8 lg:grid-cols-12 items-start">
        {/* Left Column */}
        <div className="lg:col-span-8 space-y-8">
          <AnimatePresence>
            {showCreateForm && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="overflow-hidden"
              >
                <Card className="border-none shadow-2xl ring-2 ring-blue-500/20 rounded-[2.5rem] bg-white overflow-hidden mb-8">
                  <CardHeader className="bg-blue-50/50 p-8 border-b border-blue-100">
                    <h2 className="text-2xl font-black text-slate-900">Configure New Position</h2>
                    <p className="text-sm text-blue-600 font-bold mt-1 uppercase tracking-wider">Step 1: Job Details & Interview Setup</p>
                  </CardHeader>
                  <CardBody className="p-8">
                    <form className="space-y-6" onSubmit={createJob}>
                      <div className="grid sm:grid-cols-2 gap-6">
                        <div className="space-y-2">
                          <label className="text-xs font-black uppercase tracking-widest text-slate-400 ml-1">Position Title</label>
                          <input
                            className="w-full h-14 px-5 rounded-2xl bg-slate-50 ring-1 ring-slate-200 focus:ring-2 focus:ring-blue-600 outline-none transition-all text-sm font-bold text-slate-700"
                            value={jobTitle}
                            onChange={(e) => setJobTitle(e.target.value)}
                            placeholder="e.g. Senior Product Designer"
                          />
                        </div>
                        <div className="space-y-2">
                          <label className="text-xs font-black uppercase tracking-widest text-slate-400 ml-1">Application Deadline</label>
                          <input
                            type="date"
                            className="w-full h-14 px-5 rounded-2xl bg-slate-50 ring-1 ring-slate-200 focus:ring-2 focus:ring-blue-600 outline-none transition-all text-sm font-bold text-slate-700"
                            value={jobDeadline}
                            onChange={(e) => setJobDeadline(e.target.value)}
                          />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <label className="text-xs font-black uppercase tracking-widest text-slate-400 ml-1">Brief Description</label>
                        <input
                          className="w-full h-14 px-5 rounded-2xl bg-slate-50 ring-1 ring-slate-200 focus:ring-2 focus:ring-blue-600 outline-none transition-all text-sm font-bold text-slate-700"
                          value={jobDescription}
                          onChange={(e) => setJobDescription(e.target.value)}
                          placeholder="Quick summary of the role and key requirements..."
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-xs font-black uppercase tracking-widest text-slate-400 ml-1">AI Interview Questions (one per line)</label>
                        <textarea
                          className="w-full min-h-[160px] p-5 rounded-2xl bg-slate-50 ring-1 ring-slate-200 focus:ring-2 focus:ring-blue-600 outline-none transition-all text-sm font-bold text-slate-700 resize-none leading-relaxed"
                          value={jobQuestions}
                          onChange={(e) => setJobQuestions(e.target.value)}
                          placeholder="1. How do you handle scalability in microservices?&#10;2. Describe your experience with React performance optimization..."
                        />
                      </div>
                      <div className="flex gap-4 pt-4">
                        <Button type="submit" disabled={busy} className="flex-1 h-14 bg-blue-600 hover:bg-blue-700 text-white font-black rounded-2xl shadow-lg shadow-blue-500/20">
                          {busy ? "Publishing..." : "Launch Position Now"}
                        </Button>
                        <Button type="button" variant="secondary" onClick={() => setShowCreateForm(false)} className="h-14 px-8 rounded-2xl font-bold">
                          Discard
                        </Button>
                      </div>
                    </form>
                  </CardBody>
                </Card>
              </motion.div>
            )}
          </AnimatePresence>

          <Card className="border-none shadow-sm ring-1 ring-slate-200/60 rounded-[2.5rem] bg-white overflow-hidden">
            <CardHeader className="bg-slate-50/50 p-8 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-slate-900 flex items-center justify-center text-white shadow-lg">
                  <BriefcaseIcon />
                </div>
                <div>
                  <h2 className="text-xl font-black text-slate-900">Active Pipelines</h2>
                  <p className="text-xs text-slate-500 font-bold uppercase tracking-widest">Job Management</p>
                </div>
              </div>
              <div className="px-4 py-2 rounded-xl bg-white border border-slate-200 text-[10px] font-black uppercase tracking-widest text-slate-400 shadow-sm">
                {jobs.length} Open Roles
              </div>
            </CardHeader>
            <CardBody className="p-8">
              <div className="grid gap-4 sm:grid-cols-2">
                {jobs.length === 0 ? (
                  <div className="sm:col-span-2 py-16 text-center bg-slate-50 rounded-[2rem] border-2 border-dashed border-slate-200">
                    <div className="text-4xl mb-4 text-slate-300">
                      <BriefcaseIcon />
                    </div>
                    <h3 className="text-lg font-bold text-slate-900">No active pipelines</h3>
                    <p className="text-sm text-slate-500 mt-1 max-w-xs mx-auto italic">Start by creating a job position to receive AI-vetted candidates.</p>
                    <Button variant="secondary" onClick={() => setShowCreateForm(true)} className="mt-6 rounded-xl">Create First Job</Button>
                  </div>
                ) : (
                  jobs.map((job) => (
                    <motion.div 
                      key={job.id} 
                      whileHover={{ scale: 1.02 }}
                      className="group bg-white p-6 rounded-[2rem] ring-1 ring-slate-200 hover:ring-blue-500/30 hover:shadow-xl transition-all cursor-pointer flex flex-col h-full"
                    >
                      <div className="flex items-start justify-between mb-4">
                        <div className="font-black text-lg text-slate-900 group-hover:text-blue-600 transition-colors line-clamp-1">{job.title}</div>
                        <span className="px-2.5 py-1 rounded-lg bg-blue-50 text-blue-600 text-[10px] font-black uppercase tracking-widest border border-blue-100">
                          {job.questions?.length ?? 0} Qs
                        </span>
                      </div>
                      <p className="text-sm text-slate-500 font-medium line-clamp-2 mb-6 flex-grow">{job.description}</p>
                      <div className="pt-4 border-t border-slate-100 flex items-center justify-between mt-auto">
                        <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Deadline: {job.deadline || "None"}</div>
                        <div className="text-blue-600 font-black text-xs flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                          Details <ArrowRightIcon />
                        </div>
                      </div>
                    </motion.div>
                  ))
                )}
              </div>
            </CardBody>
          </Card>

          <Card className="border-none shadow-sm ring-1 ring-slate-200/60 rounded-[2.5rem] bg-white overflow-hidden">
            <CardHeader className="bg-slate-50/50 p-8 border-b border-slate-100">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-emerald-600 flex items-center justify-center text-white shadow-lg shadow-emerald-500/20">
                  <TrophyIcon />
                </div>
                <div>
                  <h2 className="text-xl font-black text-slate-900">Performance Leaderboard</h2>
                  <p className="text-xs text-slate-500 font-bold uppercase tracking-widest">Global Candidate Ranking</p>
                </div>
              </div>
            </CardHeader>
            <CardBody className="p-0">
              <Leaderboard candidates={candidates} />
            </CardBody>
          </Card>
        </div>

        {/* Right Column */}
        <div className="lg:col-span-4 space-y-8">
          <Card className="border-none shadow-sm ring-1 ring-slate-200/60 rounded-[2.5rem] bg-white overflow-hidden">
            <CardHeader className="p-8 pb-2">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-black text-slate-900">Integrity Center</h2>
                <div className="flex h-3 w-3 rounded-full bg-rose-500 animate-pulse border-2 border-white shadow-sm shadow-rose-500/50"></div>
              </div>
              <p className="text-xs text-slate-500 font-bold uppercase tracking-widest mt-1">Real-time Proctoring Alerts</p>
            </CardHeader>
            <CardBody className="p-8 pt-4">
              <div className="space-y-4">
                {alerts?.length ? (
                  alerts.slice(0, 6).map((alert, i) => (
                    <motion.div
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.1 }}
                      key={i}
                      className="p-4 rounded-2xl bg-white ring-1 ring-slate-100 flex flex-col gap-2 border-l-4 border-rose-500 shadow-sm hover:shadow-md transition-all"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-black text-rose-600 uppercase tracking-widest bg-rose-50 px-2 py-0.5 rounded-lg">
                          {alert.event.replace("_", " ")}
                        </span>
                        <span className="text-[10px] text-slate-400 font-bold">
                          {new Date(alert.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                      <p className="text-xs text-slate-700 font-bold leading-relaxed">
                        {alert.metadata?.message ?? "Suspicious activity detected during live session."}
                      </p>
                    </motion.div>
                  ))
                ) : (
                  <div className="text-center py-16 px-6 border-2 border-dashed border-slate-100 rounded-[2rem] bg-slate-50/50">
                    <div className="w-14 h-14 rounded-full bg-white flex items-center justify-center mx-auto mb-4 shadow-sm text-slate-300">
                      <ShieldIcon />
                    </div>
                    <p className="text-xs text-slate-400 font-bold uppercase tracking-widest italic">All sessions secure</p>
                  </div>
                )}
              </div>
            </CardBody>
          </Card>

          <Card className="border-none shadow-2xl ring-1 ring-slate-900/5 rounded-[2.5rem] bg-slate-900 text-white overflow-hidden">
            <CardHeader className="p-8 pb-2">
              <h2 className="text-xl font-black text-white">AI Hiring Brain</h2>
              <p className="text-xs text-slate-400 font-bold uppercase tracking-widest mt-1">Automated Intelligence</p>
            </CardHeader>
            <CardBody className="p-8 pt-4 space-y-4">
              <Button onClick={generateReport} disabled={busy} className="w-full h-14 bg-white text-slate-900 hover:bg-slate-100 transition-all font-black rounded-2xl shadow-xl shadow-white/5">
                {busy ? "Analyzing..." : "Generate Technical Report"}
              </Button>
              <Button onClick={getDecision} variant="secondary" className="w-full h-14 bg-slate-800 border-none text-white hover:bg-slate-700 transition-all font-black rounded-2xl">
                Get AI Decision
              </Button>

              <AnimatePresence>
                {decision && (
                  <motion.div 
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="p-6 rounded-[2rem] bg-blue-600 text-white shadow-2xl shadow-blue-600/30 space-y-3"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-black uppercase tracking-widest text-blue-100">AI Recommendation</span>
                      <span className="px-3 py-1 rounded-full bg-white text-blue-600 text-[10px] font-black uppercase tracking-widest">
                        {decision.recommendation}
                      </span>
                    </div>
                    <div className="text-4xl font-black">{decision.final_score}%</div>
                    <p className="text-xs text-blue-50 leading-relaxed font-medium border-t border-blue-500/50 pt-3 mt-3 italic">
                      "{decision.explanation}"
                    </p>
                  </motion.div>
                )}
              </AnimatePresence>
            </CardBody>
          </Card>
        </div>
      </div>
    </div>
  );
}

export default RecruiterDashboard;
