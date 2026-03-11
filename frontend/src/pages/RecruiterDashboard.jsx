import { useEffect, useState } from "react";
import axios from "axios";
import Button from "../components/ui/Button";
import { Card, CardBody, CardHeader } from "../components/ui/Card";
import { getUserSession } from "../utils/auth";
import Leaderboard from "../components/Leaderboard";

function RecruiterDashboard() {
  const [candidates, setCandidates] = useState([]);
  const [stats, setStats] = useState({
    candidatesJoined: 0,
    topCandidateName: "—"
  });

  const session = getUserSession();
  const recruiterName = session?.name || "Recruiter";
  const API_BASE = "http://127.0.0.1:8000";

  useEffect(() => {
    axios.get(`${API_BASE}/leaderboard`).then((res) => {
      setCandidates(res.data);
    });
    axios.get(`${API_BASE}/stats/recruiter`).then((res) => {
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
  const [jobQuestions, setJobQuestions] = useState([{ question: "", answer: "" }]);

  useEffect(() => {
    const fetchAlerts = () => {
      axios.get(`${API_BASE}/alerts`).then((res) => {
        setAlerts(res.data);
      });
    };

    fetchAlerts();
    const interval = setInterval(fetchAlerts, 3000); // Poll every 3 seconds for live dashboard
    
    if (session?.id) {
      axios
        .get(`${API_BASE}/jobs`, {
          params: { recruiter_id: session?.id },
        })
        .then((res) => setJobs(res.data));
    }

    return () => clearInterval(interval);
  }, [session]);

  const clearAlerts = async () => {
    try {
      await axios.delete(`${API_BASE}/alerts`);
      setAlerts([]);
    } catch (err) {
      console.error("Failed to clear alerts:", err);
    }
  };

  const getSeverityColor = (severity) => {
    switch (severity?.toLowerCase()) {
      case "high": return "bg-rose-50 ring-rose-200 text-rose-900";
      case "medium": return "bg-amber-50 ring-amber-200 text-amber-900";
      default: return "bg-blue-50 ring-blue-200 text-blue-900";
    }
  };

  const addQuestion = () => {
    setJobQuestions([...jobQuestions, { question: "", answer: "" }]);
  };

  const updateQuestion = (index, field, value) => {
    const newQuestions = [...jobQuestions];
    newQuestions[index][field] = value;
    setJobQuestions(newQuestions);
  };

  const removeQuestion = (index) => {
    if (jobQuestions.length > 1) {
      const newQuestions = jobQuestions.filter((_, i) => i !== index);
      setJobQuestions(newQuestions);
    }
  };

  const createJob = async (e) => {
    e.preventDefault();
    if (!jobTitle || !jobDescription) return;
    setBusy(true);
    try {
      // Filter empty strings
      const questionsList = jobQuestions.filter(q => q.question.trim());

      await axios.post(`${API_BASE}/jobs/`, {
        title: jobTitle,
        description: jobDescription,
        recruiter_id: session?.id,
        questions: questionsList
      });
      alert("Job created successfully!");
      setJobTitle("");
      setJobDescription("");
      setJobQuestions([{ question: "", answer: "" }]);
      // Refresh jobs list
      const res = await axios.get(`${API_BASE}/jobs/`, {
        params: { recruiter_id: session?.id },
      });
      setJobs(res.data);
    } catch (err) {
      console.error("Failed to create job:", err);
      alert("Failed to create job. Please try again.");
    } finally {
      setBusy(false);
    }
  };

  const generateHiringDecision = async (candidateId) => {
    setBusy(true);
    try {
      const res = await axios.post(`${API_BASE}/hiring-decision`, {
        candidate_id: candidateId,
      });
      setDecision(res.data.decision);
    } catch (err) {
      console.error("Decision failed:", err);
    } finally {
      setBusy(false);
    }
  };

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

      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-2">
        <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
          <div className="text-xs font-semibold uppercase tracking-wider text-slate-500">No of candidates joined</div>
          <div className="mt-2 text-3xl font-bold text-slate-900">{stats.candidatesJoined}</div>
        </div>
        <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
          <div className="text-xs font-semibold uppercase tracking-wider text-slate-500">Top candidate name</div>
          <div className="mt-2 text-3xl font-bold text-slate-900">{stats.topCandidateName}</div>
        </div>
      </div>

      <div className="mt-8">
        <Leaderboard candidates={candidates} />
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-12">
        <Card className="lg:col-span-4">
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between">
              <div className="text-sm font-semibold text-slate-900">
                Integrity Alerts
              </div>
              {alerts.length > 0 && (
                <button
                  onClick={clearAlerts}
                  className="text-xs font-medium text-rose-600 hover:text-rose-700"
                >
                  Clear All
                </button>
              )}
            </div>
            <div className="text-sm text-slate-600">
              Suspicious activity detected during interviews.
            </div>
          </CardHeader>
          <CardBody className="grid gap-3 max-h-[400px] overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-slate-200">
            {alerts.length > 0 ? (
              alerts.map((alert, idx) => (
                <div key={idx} className={`rounded-xl p-4 ring-1 ${getSeverityColor(alert.severity)} transition-all hover:scale-[1.02]`}>
                  <div className="flex justify-between items-start">
                    <div className="text-sm font-semibold">{alert.type.replace('_', ' ').toUpperCase()}</div>
                    <div className="text-[10px] opacity-60 font-mono">{alert.timestamp?.split(' ')[1]}</div>
                  </div>
                  <div className="text-xs mt-1">{alert.message}</div>
                  <div className="mt-2 flex items-center justify-between">
                    <div className={`text-[10px] font-bold uppercase tracking-wider ${alert.severity === 'high' ? 'text-rose-600' : 'text-amber-600'}`}>
                      {alert.severity} Risk
                    </div>
                    {alert.severity_score && (
                      <div className="text-[10px] text-slate-400 font-medium">
                        Score: {alert.severity_score.toFixed(1)}
                      </div>
                    )}
                  </div>
                </div>
              ))
            ) : (
              <div className="rounded-xl bg-slate-50 p-5 text-sm text-slate-600 ring-1 ring-slate-200">
                No active integrity alerts.
              </div>
            )}
          </CardBody>
        </Card>

        <div className="grid gap-6 lg:col-span-8">
          <Card>
            <CardHeader className="pb-4">
              <div className="text-sm font-semibold text-slate-900">
                Create New Job
              </div>
            </CardHeader>
            <CardBody className="grid gap-4">
              <form className="grid gap-3" onSubmit={createJob}>
                <div className="space-y-1">
                  <div className="text-xs font-medium text-slate-500">Job title</div>
                  <input
                    className="cb-input w-full p-2 border rounded-md"
                    value={jobTitle}
                    onChange={(e) => setJobTitle(e.target.value)}
                    placeholder="e.g. Senior React Engineer"
                  />
                </div>
                <div className="space-y-1">
                  <div className="text-xs font-medium text-slate-500">Job description</div>
                  <textarea
                    className="cb-input w-full p-2 border rounded-md min-h-[100px]"
                    value={jobDescription}
                    onChange={(e) => setJobDescription(e.target.value)}
                    placeholder="Describe the role requirements..."
                  />
                </div>
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <div className="text-xs font-medium text-slate-500">Interview Questions</div>
                    <button
                      type="button"
                      onClick={addQuestion}
                      className="text-xs font-medium text-blue-600 hover:text-blue-700"
                    >
                      + Add Question
                    </button>
                  </div>
                  <div className="space-y-2">
                    {jobQuestions.map((q, index) => (
                      <div key={index} className="flex flex-col gap-2 p-3 bg-slate-50 rounded-lg ring-1 ring-slate-200">
                        <div className="flex items-center justify-between">
                          <div className="text-[10px] font-bold uppercase text-slate-400">Question {index + 1}</div>
                          {jobQuestions.length > 1 && (
                            <button
                              type="button"
                              onClick={() => removeQuestion(index)}
                              className="text-rose-500 hover:text-rose-600"
                            >
                              ✕
                            </button>
                          )}
                        </div>
                        <input
                          className="cb-input w-full p-2 border rounded-md"
                          value={q.question}
                          onChange={(e) => updateQuestion(index, "question", e.target.value)}
                          placeholder="What is the technical question?"
                        />
                        <textarea
                          className="cb-input w-full p-2 border rounded-md min-h-[60px] text-xs"
                          value={q.answer}
                          onChange={(e) => updateQuestion(index, "answer", e.target.value)}
                          placeholder="Ideal technical answer (for AI scoring reference)..."
                        />
                      </div>
                    ))}
                  </div>
                </div>
                <Button type="submit" disabled={busy}>
                  {busy ? "Creating..." : "Post Job"}
                </Button>
              </form>
            </CardBody>
          </Card>
        </div>
      </div>
    </div>
  );
}

export default RecruiterDashboard;
