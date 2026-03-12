import { useEffect, useState } from "react";
import axios from "axios";
import Button from "../components/ui/Button";
import { Card, CardBody, CardHeader } from "../components/ui/Card";
import { getUserSession } from "../utils/auth";
import Leaderboard from "../components/Leaderboard";

function RecruiterDashboard() {
  const [candidates, setCandidates] = useState([]);
  const [selectedCandidate, setSelectedCandidate] = useState(null);
  const [stats, setStats] = useState({
    candidatesJoined: 0,
    topCandidateName: "—",
  });

  const session = getUserSession();
  const recruiterName = session?.name || "Recruiter";
  const API_BASE = "http://127.0.0.1:8000";

  useEffect(() => {
    const refreshData = () => {
      axios.get(`${API_BASE}/leaderboard`).then((res) => {
        setCandidates(res.data);
        // If a candidate is selected, update their data too
        if (selectedCandidate) {
          const updated = res.data.find((c) => c.id === selectedCandidate.id);
          if (updated) setSelectedCandidate(updated);
        }
      });
      axios.get(`${API_BASE}/stats/recruiter`).then((res) => {
        setStats(res.data);
      });
    };

    refreshData();
    const interval = setInterval(refreshData, 60000); // Refresh leaderboard every 60s
    return () => clearInterval(interval);
  }, [selectedCandidate?.id]);

  const [reportFile, setReportFile] = useState(null);
  const [decision, setDecision] = useState(null);
  const [busy, setBusy] = useState(false);
  const [jobs, setJobs] = useState([]);
  const [jobTitle, setJobTitle] = useState("");
  const [jobDescription, setJobDescription] = useState("");
  const [jobQuestions, setJobQuestions] = useState([
    { question: "", answer: "" },
  ]);

  useEffect(() => {
    if (session?.id) {
      axios
        .get(`${API_BASE}/jobs/`, {
          params: { recruiter_id: session?.id },
        })
        .then((res) => setJobs(res.data));
    }
  }, [session]);

  const getSeverityColor = (severity) => {
    switch (severity?.toLowerCase()) {
      case "high":
        return "bg-rose-50 ring-rose-200 text-rose-900";
      case "medium":
        return "bg-amber-50 ring-amber-200 text-amber-900";
      default:
        return "bg-blue-50 ring-blue-200 text-blue-900";
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
      const questionsList = jobQuestions.filter((q) => q.question.trim());

      await axios.post(`${API_BASE}/jobs/`, {
        title: jobTitle,
        description: jobDescription,
        recruiter_id: session?.id,
        questions: questionsList,
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

  const generateHiringDecision = (candidate) => {
    if (!candidate) return;
    setBusy(true);
    // Use the existing recommendation calculated during report generation
    const rec = candidate.recommendation || "Pending Review";

    // Simulate a brief AI "thinking" time for UX
    setTimeout(() => {
      setDecision(
        `Based on technical scores, integrity compliance (${candidate.integrity_score}%), and proctoring signals (${candidate.proctoring_score}%), our AI recommendation for ${candidate.name} is: ${rec.toUpperCase()}.`,
      );
      setBusy(false);
    }, 1000);
  };

  const exportSelected = () => {
    window.open(`${API_BASE}/export/selected`, "_blank");
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
        <div className="flex gap-3 mt-4 sm:mt-0">
          <Button
            variant="secondary"
            size="sm"
            onClick={exportSelected}
            className="flex items-center gap-2"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-4 w-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
              />
            </svg>
            Export Selected
          </Button>
        </div>
      </div>

      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-2">
        <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
          <div className="text-xs font-semibold uppercase tracking-wider text-slate-500">
            No of candidates joined
          </div>
          <div className="mt-2 text-3xl font-bold text-slate-900">
            {stats.candidatesJoined}
          </div>
        </div>
        <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
          <div className="text-xs font-semibold uppercase tracking-wider text-slate-500">
            Top candidate name
          </div>
          <div className="mt-2 text-3xl font-bold text-slate-900">
            {stats.topCandidateName}
          </div>
        </div>
      </div>

      <div className="mt-8">
        <Leaderboard
          candidates={candidates}
          onSelectCandidate={(c) => {
            setSelectedCandidate(c);
            setDecision(null);
          }}
        />
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-12">
        {selectedCandidate ? (
          <Card className="lg:col-span-5">
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm font-semibold text-slate-900">
                    Proctoring Details: {selectedCandidate.name}
                  </div>
                  <div className="text-[10px] text-slate-500 uppercase tracking-tighter">
                    {selectedCandidate.job_title}
                  </div>
                </div>
                <button
                  onClick={() => setSelectedCandidate(null)}
                  className="text-xs font-medium text-slate-400 hover:text-slate-600"
                >
                  Close
                </button>
              </div>
            </CardHeader>
            <CardBody className="grid gap-3 max-h-[500px] overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-slate-200">
              <div className="grid grid-cols-3 gap-2 mb-2">
                <div className="p-3 bg-slate-50 rounded-xl ring-1 ring-slate-200">
                  <div className="text-[10px] font-bold text-slate-400 uppercase">
                    Integrity
                  </div>
                  <div className="text-lg font-bold text-slate-900">
                    {selectedCandidate.integrity_score}%
                  </div>
                </div>
                <div className="p-3 bg-slate-50 rounded-xl ring-1 ring-slate-200">
                  <div className="text-[10px] font-bold text-slate-400 uppercase">
                    Proctoring
                  </div>
                  <div className="text-lg font-bold text-slate-900">
                    {selectedCandidate.proctoring_score}%
                  </div>
                </div>
                <div className="p-3 bg-slate-50 rounded-xl ring-1 ring-slate-200">
                  <div className="text-[10px] font-bold text-slate-400 uppercase">
                    Recommendation
                  </div>
                  <div
                    className={`text-lg font-bold ${
                      selectedCandidate.recommendation === "ACCEPTED"
                        ? "text-emerald-500"
                        : selectedCandidate.recommendation === "Consider"
                          ? "text-amber-500"
                          : "text-rose-500"
                    }`}
                  >
                    {selectedCandidate.recommendation || "N/A"}
                  </div>
                </div>
              </div>

              <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mt-2 mb-1">
                Cheating Alerts (
                {selectedCandidate.proctoring_alerts?.length || 0})
              </div>

              {selectedCandidate.proctoring_alerts?.length > 0 ? (
                selectedCandidate.proctoring_alerts.map((alert, idx) => (
                  <div
                    key={idx}
                    className={`rounded-xl p-4 ring-1 ${getSeverityColor(alert.severity)} transition-all`}
                  >
                    <div className="flex justify-between items-start">
                      <div className="text-sm font-semibold">
                        {alert.type?.replace("_", " ").toUpperCase()}
                      </div>
                      <div className="text-[10px] opacity-60 font-mono">
                        {alert.timestamp?.split(" ")[1] || alert.timestamp}
                      </div>
                    </div>
                    <div className="text-xs mt-1">{alert.message}</div>
                    <div className="mt-2 flex items-center justify-between">
                      <div
                        className={`text-[10px] font-bold uppercase tracking-wider ${alert.severity === "high" ? "text-rose-600" : "text-amber-600"}`}
                      >
                        {alert.severity} Risk
                      </div>
                      {alert.severity_score && (
                        <div className="text-[10px] text-slate-400 font-medium">
                          Weight: {alert.severity_score.toFixed(1)}
                        </div>
                      )}
                    </div>
                  </div>
                ))
              ) : (
                <div className="rounded-xl bg-emerald-50 p-5 text-sm text-emerald-700 ring-1 ring-emerald-200">
                  No cheating caught for this candidate.
                </div>
              )}

              <div className="mt-4 pt-4 border-t border-slate-100 flex gap-2">
                <Button
                  size="sm"
                  className="flex-1"
                  onClick={() => generateHiringDecision(selectedCandidate)}
                  disabled={busy}
                >
                  AI Hiring Decision
                </Button>
                {selectedCandidate.report_file && (
                  <Button
                    variant="secondary"
                    size="sm"
                    as="a"
                    href={`${API_BASE}/reports/download/${selectedCandidate.report_file}`}
                    target="_blank"
                  >
                    View Report
                  </Button>
                )}
              </div>

              {decision && (
                <div className="mt-4 p-4 bg-blue-50 rounded-xl ring-1 ring-blue-200">
                  <div className="text-xs font-bold text-blue-700 uppercase mb-1">
                    AI Recommendation
                  </div>
                  <p className="text-sm text-blue-900 leading-relaxed italic">
                    "{decision}"
                  </p>
                </div>
              )}
            </CardBody>
          </Card>
        ) : (
          <Card className="lg:col-span-4 flex flex-col items-center justify-center p-12 text-center bg-slate-50/50 border-dashed border-2 border-slate-200 shadow-none">
            <div className="h-12 w-12 rounded-full bg-slate-100 flex items-center justify-center mb-4">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-6 w-6 text-slate-400"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                />
              </svg>
            </div>
            <div className="text-sm font-semibold text-slate-900">
              No Candidate Selected
            </div>
            <div className="text-xs text-slate-500 mt-1 max-w-[200px]">
              Select a candidate from the leaderboard above to view their
              detailed proctoring logs.
            </div>
          </Card>
        )}

        <div
          className={`grid gap-6 ${selectedCandidate ? "lg:col-span-7" : "lg:col-span-8"}`}
        >
          <Card>
            <CardHeader className="pb-4">
              <div className="text-sm font-semibold text-slate-900">
                Create New Job
              </div>
            </CardHeader>
            <CardBody className="grid gap-4">
              <form className="grid gap-3" onSubmit={createJob}>
                <div className="space-y-1">
                  <div className="text-xs font-medium text-slate-500">
                    Job title
                  </div>
                  <input
                    className="cb-input w-full p-2 border rounded-md"
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
                    className="cb-input w-full p-2 border rounded-md min-h-[100px]"
                    value={jobDescription}
                    onChange={(e) => setJobDescription(e.target.value)}
                    placeholder="Describe the role requirements..."
                  />
                </div>
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <div className="text-xs font-medium text-slate-500">
                      Interview Questions
                    </div>
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
                      <div
                        key={index}
                        className="flex flex-col gap-2 p-3 bg-slate-50 rounded-lg ring-1 ring-slate-200"
                      >
                        <div className="flex items-center justify-between">
                          <div className="text-[10px] font-bold uppercase text-slate-400">
                            Question {index + 1}
                          </div>
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
                          onChange={(e) =>
                            updateQuestion(index, "question", e.target.value)
                          }
                          placeholder="What is the technical question?"
                        />
                        <textarea
                          className="cb-input w-full p-2 border rounded-md min-h-[60px] text-xs"
                          value={q.answer}
                          onChange={(e) =>
                            updateQuestion(index, "answer", e.target.value)
                          }
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
