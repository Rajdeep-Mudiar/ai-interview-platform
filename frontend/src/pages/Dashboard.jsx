import { useEffect, useState } from "react";
import axiosClient from "../utils/axiosClient";
import jsPDF from "jspdf";
import Button from "../components/ui/Button";
import { Card, CardBody, CardHeader } from "../components/ui/Card";
import { getUserSession } from "../utils/auth";
import Leaderboard from "../components/Leaderboard";

function Dashboard() {
  const [candidates, setCandidates] = useState([]);

  const ArrowRightIcon = () => (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3" />
    </svg>
  );

  useEffect(() => {
    let isMounted = true;
    axiosClient.get("/leaderboard").then((res) => {
      if (isMounted) setCandidates(res.data);
    }).catch(err => {
      console.error("Leaderboard fetch failed:", err);
    });

    axiosClient.get("/jobs").then((res) => {
      if (isMounted) {
        // Filter jobs that have a deadline and are still active
        const activeWithDeadline = res.data.filter(j => {
          if (!j.deadline) return false;
          const diff = new Date(j.deadline) - new Date();
          return diff > 0 && diff < (7 * 24 * 60 * 60 * 1000); // 7 days
        });
        setUpcomingDeadlines(activeWithDeadline);
      }
    });

    return () => { isMounted = false; };
  }, []);

  const [upcomingDeadlines, setUpcomingDeadlines] = useState([]);
  const [result, setResult] = useState(null);
  const [explanation, setExplanation] = useState([]);
  const [busy, setBusy] = useState(false);
  const [userStats, setUserStats] = useState({
    status: "Not Started",
    percentile: "—",
    timeTaken: "—",
    lastScore: 0,
    history: []
  });
  const session = getUserSession();
  const displayName = session?.name || "Candidate";

  const ClockIcon = () => (
    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  );

  const TargetIcon = () => (
    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  );

  const ChartIcon = () => (
    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
    </svg>
  );

  const TimerIcon = () => (
    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  );

  const TrophyIcon = () => (
    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
    </svg>
  );

  useEffect(() => {
    if (session?.id) {
      const fetchStats = () => {
        axiosClient.get(`/stats/candidate/${session.id}`).then((res) => {
          setUserStats(res.data);
        }).catch(err => {
          console.error("Failed to fetch candidate stats:", err);
        });
      };
      
      fetchStats();
      // Only poll every 30 seconds if needed, but not immediately and repeatedly
      const interval = setInterval(fetchStats, 30000);
      return () => clearInterval(interval);
    }
  }, [session?.id]);

  const generateReport = async () => {
    if (!userStats.lastScore) {
      alert("No interview results found. Please complete an interview first.");
      return;
    }
    setBusy(true);
    try {
      const res = await axiosClient.post("/generate-report", {
        name: displayName,
        resume_score: userStats.lastScore,
        interview_score: userStats.lastScore, // Using lastScore for both for now
        integrity_score: 100,
        skills: [],
        missing_skills: [],
        recommendation: "Evaluation Pending",
      });
      alert(`Report generated: ${res.data.file}`);
    } catch (err) {
      console.error("Report generation failed:", err);
      alert("Failed to generate report.");
    } finally {
      setBusy(false);
    }
  };

  const generatePDF = () => {
    alert("PDF download started...");
  };

  const getExplanation = async () => {
    if (!userStats.lastScore) {
      alert("No interview results found.");
      return;
    }
    setBusy(true);
    try {
      const res = await axiosClient.post("/hiring-decision", {
        resume_score: userStats.lastScore,
        interview_score: userStats.lastScore,
        integrity_score: 100,
      });
      setExplanation([res.data.explanation]);
    } catch (err) {
      console.error("Explanation failed:", err);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="cb-container py-10 sm:py-14">
      {/* Header Section */}
      <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between border-b border-slate-100 pb-10 mb-10">
        <div className="space-y-2">
          <div className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-50 text-blue-700 ring-1 ring-blue-100 mb-2">
            Candidate Dashboard
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
            Welcome back, {displayName}
          </h1>
          <p className="text-slate-600 max-w-2xl">
            Track your interview performance, access your technical reports, and get AI-powered insights into your hiring decisions.
          </p>
        </div>
        
        <div className="flex flex-wrap gap-3">
          <Button onClick={generateReport} disabled={busy} className="h-11 px-6 bg-slate-900 text-white hover:bg-slate-800 transition-all shadow-sm">
            {busy ? "Generating..." : "Generate Report"}
          </Button>
          <Button onClick={getExplanation} variant="secondary" className="h-11 px-6 border-slate-200 hover:bg-slate-50 transition-all">
            Get AI Explanation
          </Button>
        </div>
      </div>

      {upcomingDeadlines.length > 0 && (
        <div className="mb-10 p-6 bg-amber-50 border border-amber-100 rounded-[2rem] flex flex-col sm:flex-row items-center gap-6 shadow-sm">
          <div className="w-14 h-14 rounded-2xl bg-amber-100 flex items-center justify-center text-amber-600 shrink-0 shadow-inner">
            <ClockIcon />
          </div>
          <div className="flex-grow text-center sm:text-left">
            <h4 className="text-lg font-bold text-amber-900">Opportunities Closing Soon</h4>
            <p className="text-sm text-amber-700 mt-1 font-medium">
              {upcomingDeadlines.length} job{upcomingDeadlines.length > 1 ? 's are' : ' is'} nearing the application deadline. Don't miss your chance!
            </p>
            <div className="flex flex-wrap gap-2 mt-3 justify-center sm:justify-start">
              {upcomingDeadlines.map(job => (
                <span key={job.id} className="px-3 py-1 bg-white rounded-full text-[10px] font-bold text-amber-600 border border-amber-100 uppercase tracking-wider">
                  {job.title}
                </span>
              ))}
            </div>
          </div>
          <Button 
            variant="secondary" 
            onClick={() => window.location.href='/jobs'} 
            className="bg-white text-amber-700 border-amber-200 hover:bg-amber-100 h-12 px-8 rounded-xl font-bold"
          >
            Apply Now
          </Button>
        </div>
      )}

      {/* Stats Grid */}
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4 mb-10">
        {[
          { label: "Overall Status", value: userStats.status, icon: <TargetIcon />, color: "blue" },
          { label: "Technical Percentile", value: userStats.percentile, icon: <ChartIcon />, color: "emerald" },
          { label: "Avg. Interview Time", value: userStats.timeTaken, icon: <TimerIcon />, color: "amber" },
          { label: "Latest Score", value: `${userStats.lastScore}%`, icon: <TrophyIcon />, color: "indigo" }
        ].map((stat, i) => (
          <div key={i} className="bg-white p-6 rounded-2xl shadow-sm ring-1 ring-slate-200 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-4">
              <div className={`w-10 h-10 rounded-xl bg-${stat.color}-50 text-${stat.color}-600 flex items-center justify-center`}>
                {stat.icon}
              </div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Live Metric</span>
            </div>
            <div className="text-2xl font-bold text-slate-900 mb-1">{stat.value}</div>
            <div className="text-sm text-slate-500 font-medium">{stat.label}</div>
          </div>
        ))}
      </div>

      <div className="grid gap-8 lg:grid-cols-12 items-start">
        {/* Main Content Area */}
        <div className="lg:col-span-8 space-y-8">
          <Card className="overflow-hidden border-none shadow-sm ring-1 ring-slate-200">
            <CardHeader className="bg-slate-50/50 border-b border-slate-100 p-6">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                </div>
                <div>
                  <h2 className="text-lg font-bold text-slate-900">Performance Leaderboard</h2>
                  <p className="text-sm text-slate-500">See how you rank against other top technical candidates.</p>
                </div>
              </div>
            </CardHeader>
            <CardBody className="p-0">
              <Leaderboard candidates={candidates} />
            </CardBody>
          </Card>

          <Card className="overflow-hidden border-none shadow-sm ring-1 ring-slate-200">
            <CardHeader className="bg-slate-50/50 border-b border-slate-100 p-6">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-emerald-600 flex items-center justify-center text-white">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div>
                  <h2 className="text-lg font-bold text-slate-900">Your Interview History</h2>
                  <p className="text-sm text-slate-500">Review your past performance and growth trends.</p>
                </div>
              </div>
            </CardHeader>
            <CardBody className="p-0">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-slate-100">
                  <thead className="bg-slate-50/30">
                    <tr className="text-left text-[10px] font-bold uppercase tracking-wider text-slate-400">
                      <th className="py-3 px-6">Attempt Date</th>
                      <th className="py-3 px-6 text-center">Score</th>
                      <th className="py-3 px-6 text-center">Time</th>
                      <th className="py-3 px-6 text-center">Integrity</th>
                      <th className="py-3 px-6">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {userStats.history.map((item) => (
                      <tr key={item.id} className="hover:bg-slate-50/50 transition-colors">
                        <td className="py-4 px-6 text-sm font-medium text-slate-700">{item.date}</td>
                        <td className="py-4 px-6 text-center">
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-slate-900 text-white">
                            {item.score}%
                          </span>
                        </td>
                        <td className="py-4 px-6 text-center text-sm text-slate-500">{item.time}</td>
                        <td className="py-4 px-6 text-center">
                          <span className={`text-xs font-bold ${item.integrity > 90 ? 'text-emerald-600' : 'text-amber-600'}`}>
                            {item.integrity}%
                          </span>
                        </td>
                        <td className="py-4 px-6">
                          <span className="inline-flex items-center rounded-md bg-blue-50 px-2 py-1 text-[10px] font-bold text-blue-700 ring-1 ring-inset ring-blue-700/10">
                            {item.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                    {userStats.history.length === 0 && (
                      <tr>
                        <td colSpan="5" className="py-10 text-center text-sm text-slate-400 italic">
                          No interview history found. Complete your first interview to see results here.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </CardBody>
          </Card>
        </div>

        {/* Sidebar Area */}
        <div className="lg:col-span-4 space-y-6">
          <Card className="border-none shadow-sm ring-1 ring-slate-200">
            <CardHeader className="p-6 pb-2">
              <h2 className="text-lg font-bold text-slate-900">AI Decision Insights</h2>
              <p className="text-sm text-slate-500 mt-1">Request an automated explanation of your latest evaluation results.</p>
            </CardHeader>
            <CardBody className="p-6 pt-2">
              {explanation.length > 0 ? (
                <div className="space-y-4">
                  {explanation.map((exp, i) => (
                    <div key={i} className="p-4 rounded-xl bg-blue-50 border border-blue-100 text-sm text-blue-800 leading-relaxed italic">
                      "{exp}"
                    </div>
                  ))}
                  <Button onClick={generatePDF} className="w-full h-10 text-sm font-medium border-slate-200 hover:bg-slate-50" variant="secondary">
                    Download PDF Report
                  </Button>
                </div>
              ) : (
                <div className="text-center py-10 px-6 border-2 border-dashed border-slate-100 rounded-2xl bg-slate-50/50">
                  <div className="w-12 h-12 rounded-full bg-white flex items-center justify-center mx-auto mb-4 shadow-sm">
                    <svg className="w-6 h-6 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <p className="text-sm text-slate-600 font-medium">No insights requested yet.</p>
                  <button onClick={getExplanation} className="mt-4 text-sm font-bold text-blue-600 hover:text-blue-500 transition-colors flex items-center justify-center gap-1 mx-auto">
                    Analyze my performance <ArrowRightIcon />
                  </button>
                </div>
              )}
            </CardBody>
          </Card>

          <div className="rounded-2xl bg-slate-900 p-8 text-white relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500 rounded-full filter blur-[64px] opacity-20 -translate-y-1/2 translate-x-1/2 group-hover:opacity-30 transition-opacity"></div>
            <h3 className="text-xl font-bold mb-3 relative z-10">Next Steps?</h3>
            <p className="text-sm text-slate-400 mb-6 relative z-10 leading-relaxed">
              Continue practicing with our AI interviewer to improve your technical score and climb the leaderboard.
            </p>
            <Button className="w-full bg-blue-600 hover:bg-blue-700 border-none h-11 font-bold relative z-10">
              Start New Practice
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Dashboard;
