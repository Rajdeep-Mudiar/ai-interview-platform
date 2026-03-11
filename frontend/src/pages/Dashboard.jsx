import { useEffect, useState } from "react";
import axios from "axios";
import Button from "../components/ui/Button";
import { Card, CardBody, CardHeader } from "../components/ui/Card";
import { getUserSession } from "../utils/auth";
import Leaderboard from "../components/Leaderboard";

function Dashboard() {
  const [candidates, setCandidates] = useState([]);
  const [result, setResult] = useState(null);
  const [explanation, setExplanation] = useState([]);
  const [history, setHistory] = useState([]);
  const [busy, setBusy] = useState(false);
  const [userStats, setUserStats] = useState({
    status: "Not Started",
    percentile: "—",
    timeTaken: "—",
    lastScore: 0
  });
  
  const session = getUserSession();
  const displayName = session?.name || "Candidate";
  const API_BASE = "http://127.0.0.1:8000";

  useEffect(() => {
    axios.get(`${API_BASE}/leaderboard`).then((res) => {
      setCandidates(res.data);
    });
  }, []);

  useEffect(() => {
    if (session?.id) {
      console.log("Fetching stats for user:", session.id);
      axios.get(`${API_BASE}/stats/candidate/${session.id}`)
        .then((res) => {
          console.log("Stats response:", res.data);
          setUserStats(res.data);
        })
        .catch(err => console.error("Stats fetch error:", err));

      axios.get(`${API_BASE}/stats/candidate/${session.id}/history`)
        .then((res) => {
          console.log("History response:", res.data);
          setHistory(res.data.history || []);
        })
        .catch(err => console.error("History fetch error:", err));
    } else {
      console.warn("No user session ID found for stats/history fetch");
    }
  }, [session]);

  const generateReport = async () => {
    if (!history || history.length === 0) {
      alert("No interview results found in your history. Please complete an interview first.");
      return;
    }
    setBusy(true);
    try {
      // Use the most recent history item if no item is currently selected in 'result'
      const targetHistory = result?.id ? history.find(h => h.id === result.id) : history[0];
      
      if (!targetHistory) {
        alert("Could not find interview details. Please select an interview from your history list.");
        return;
      }

      const res = await axios.post(`${API_BASE}/reports/generate`, {
        user_id: session.id,
        name: displayName,
        email: session.email || "N/A",
        phone: session.phone || "N/A",
        job_title: targetHistory.job_title || "General Interview",
        resume_score: targetHistory.resume_score || 80,
        interview_score: targetHistory.interview_score || (targetHistory.overall_score / 1.2), // Derived fallback
        integrity_score: targetHistory.integrity_score || 100,
        matched_skills: targetHistory.matched_skills || [],
        missing_skills: targetHistory.missing_skills || [],
        job_id: targetHistory.job_id || null
      });
      
      setResult({
        id: targetHistory.id,
        final_score: res.data.overall_score,
        recommendation: res.data.recommendation,
        download_url: res.data.download_url
      });
      alert(`Report refreshed successfully!`);
    } catch (err) {
      console.error("Report generation failed:", err);
      alert("Failed to generate report.");
    } finally {
      setBusy(false);
    }
  };

  const generatePDF = async () => {
    if (result?.download_url) {
      window.open(result.download_url, "_blank");
      return;
    }
    
    if (history && history.length > 0) {
      const latest = history[0];
      if (latest.report_file) {
        window.open(`${API_BASE}/reports/download/${latest.report_file}`, "_blank");
        return;
      }
    }

    alert("No PDF found for your latest interview. Please click 'Generate final report' first.");
  };

  const getExplanation = async () => {
    const targetHistory = result?.id ? history.find(h => h.id === result.id) : history[0];
    
    if (!targetHistory) {
      alert("No interview results found. Please complete an interview first.");
      return;
    }

    setBusy(true);
    try {
      const res = await axios.post(`${API_BASE}/hiring-decision`, {
        resume_score: targetHistory.resume_score || 70,
        interview_score: targetHistory.interview_score || 70,
        integrity_score: targetHistory.integrity_score || 100,
      });
      setExplanation([res.data.explanation]);
    } catch (err) {
      console.error("Explanation failed:", err);
      alert("Failed to get AI explanation.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="cb-container py-10 sm:py-14">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-slate-900 sm:text-3xl">
            {displayName}'s dashboard
          </h1>
          <p className="mt-1 text-sm text-slate-600">
            Generate a final score, download a PDF, and request an explanation.
          </p>
        </div>
      </div>

      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
          <div className="text-xs font-semibold uppercase tracking-wider text-slate-500">Interview Status</div>
          <div className="mt-2 text-2xl font-bold text-slate-900">{userStats.status}</div>
          <div className="mt-2 flex items-center gap-2">
            <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
               <div className={`h-full ${userStats.status === 'Completed' ? 'bg-emerald-500' : 'bg-slate-300'} w-full`} style={{ width: userStats.status === 'Completed' ? '100%' : '0%' }} />
            </div>
            <span className={`text-xs ${userStats.status === 'Completed' ? 'text-emerald-600' : 'text-slate-400'} font-bold`}>{userStats.status === 'Completed' ? '100%' : '0%'}</span>
          </div>
        </div>
        <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
          <div className="text-xs font-semibold uppercase tracking-wider text-slate-500">Global Percentile</div>
          <div className="mt-2 text-2xl font-bold text-slate-900">{userStats.percentile}</div>
          <div className="mt-2 text-xs text-slate-500 font-medium">
            {userStats.betterThan > 0 ? `Better than ${userStats.betterThan} candidates` : 'No data yet'}
          </div>
        </div>
        <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
          <div className="text-xs font-semibold uppercase tracking-wider text-slate-500">Time Taken</div>
          <div className="mt-2 text-2xl font-bold text-slate-900">{userStats.timeTaken}</div>
          <div className="mt-2 text-xs text-slate-500 font-medium">Your latest attempt</div>
        </div>
      </div>

      <div className="mt-8">
        <Leaderboard candidates={candidates} />
      </div>

      <div className="mt-8">
        <h2 className="text-xl font-semibold text-slate-900 mb-4">Interview History</h2>
        {history.length > 0 ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {history.map((item) => (
              <Card key={item.id} className={`hover:ring-blue-300 transition-all cursor-pointer ${result?.id === item.id ? 'ring-2 ring-blue-500 shadow-md' : ''}`} onClick={() => {
                setResult({
                  id: item.id,
                  final_score: item.overall_score,
                  recommendation: item.recommendation,
                  download_url: item.report_file ? `${API_BASE}/reports/download/${item.report_file}` : null
                });
              }}>
                <CardBody className="p-5">
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="font-bold text-slate-900">{item.job_title}</h3>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                      item.overall_score > 70 ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'
                    }`}>
                      {item.overall_score}%
                    </span>
                  </div>
                  <div className="text-xs text-slate-500 mb-3">
                    {new Date(item.created_at).toLocaleDateString()} at {new Date(item.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </div>
                  <div className="text-xs font-medium text-slate-600 mb-1">Status: <span className="text-slate-900">{item.recommendation}</span></div>
                  <div className="mt-3 flex flex-wrap gap-1">
                    {item.matched_skills?.slice(0, 3).map(s => (
                      <span key={s} className="px-1.5 py-0.5 bg-blue-50 text-blue-600 rounded text-[10px] border border-blue-100">{s}</span>
                    ))}
                    {item.matched_skills?.length > 3 && <span className="text-[10px] text-slate-400">+{item.matched_skills.length - 3} more</span>}
                  </div>
                </CardBody>
              </Card>
            ))}
          </div>
        ) : (
          <div className="rounded-xl bg-slate-50 p-8 text-center text-sm text-slate-600 ring-1 ring-slate-200">
            No interview history found. Start your first interview to see results here!
          </div>
        )}
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-12">
        <Card className="lg:col-span-5">
          <CardHeader className="pb-4">
            <div className="text-sm font-semibold text-slate-900">Actions</div>
            <div className="text-sm text-slate-600">
              Run scoring and generate artifacts.
            </div>
          </CardHeader>
          <CardBody className="grid gap-3">
            <Button onClick={generateReport} disabled={busy}>
              {busy ? "Working..." : "Generate final report"}
            </Button>
            <Button onClick={generatePDF} variant="secondary">
              Download interview PDF
            </Button>
            <Button onClick={getExplanation} variant="secondary" disabled={busy}>
              Explain AI decision
            </Button>
          </CardBody>
        </Card>

        <div className="grid gap-6 lg:col-span-7">
          <Card>
            <CardHeader className="pb-4">
              <div className="text-sm font-semibold text-slate-900">Summary</div>
              <div className="text-sm text-slate-600">
                Recommendation and final score.
              </div>
            </CardHeader>
            <CardBody>
              {result ? (
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="rounded-xl bg-slate-50 p-4 ring-1 ring-slate-200">
                    <div className="text-xs font-medium text-slate-500">
                      Final score
                    </div>
                    <div className="mt-1 text-2xl font-semibold text-slate-900">
                      {result.final_score}
                    </div>
                  </div>
                  <div className="rounded-xl bg-slate-50 p-4 ring-1 ring-slate-200">
                    <div className="text-xs font-medium text-slate-500">
                      Recommendation
                    </div>
                    <div className="mt-1 text-2xl font-semibold text-slate-900">
                      {result.recommendation}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="rounded-xl bg-slate-50 p-5 text-sm text-slate-600 ring-1 ring-slate-200">
                  Run “Generate final report” to see results here.
                </div>
              )}
            </CardBody>
          </Card>

          <Card>
            <CardHeader className="pb-4">
              <div className="text-sm font-semibold text-slate-900">
                Explanation
              </div>
              <div className="text-sm text-slate-600">
                Reasons behind the decision.
              </div>
            </CardHeader>
            <CardBody>
              {explanation?.length ? (
                <ul className="grid gap-2 text-sm text-slate-700">
                  {explanation.map((reason, i) => (
                    <li
                      key={i}
                      className="rounded-xl bg-white p-3 ring-1 ring-slate-200"
                    >
                      {reason}
                    </li>
                  ))}
                </ul>
              ) : (
                <div className="rounded-xl bg-slate-50 p-5 text-sm text-slate-600 ring-1 ring-slate-200">
                  Request an explanation to populate this section.
                </div>
              )}
            </CardBody>
          </Card>
        </div>
      </div>
    </div>
  );
}

export default Dashboard;
