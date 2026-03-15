import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import axiosClient from "../utils/axiosClient";
import { getUserSession } from "../utils/auth";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  PointElement,
  LineElement,
} from 'chart.js';
import { Bar, Line } from 'react-chartjs-2';
import { Card, CardHeader, CardBody } from "../components/ui/Card";
import Button from "../components/ui/Button";

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

function Candidates() {
  const [candidates, setCandidates] = useState([]);
  const [selectedLogs, setSelectedLogs] = useState(null);
  const [loading, setLoading] = useState(true);
  const session = getUserSession();

  const ShieldIcon = () => (
    <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
    </svg>
  );

  const MobileIcon = () => (
    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
    </svg>
  );

  const LaptopIcon = () => (
    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
    </svg>
  );

  const ChartIcon = () => (
    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
    </svg>
  );

  const UsersIcon = () => (
    <svg className="w-12 h-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
    </svg>
  );

  const fetchLogs = async (sessionId) => {
    try {
      const res = await axiosClient.get(`/monitoring/sessions/${sessionId}/logs`);
      setSelectedLogs(res.data);
    } catch (err) {
      console.error("Error fetching logs:", err);
    }
  };

  useEffect(() => {
    const fetchCandidates = async () => {
      try {
        const res = await axiosClient.get("/monitoring/sessions/list", {
          params: { recruiter_id: session?.id }
        });
        setCandidates(res.data);
      } catch (err) {
        console.error("Error fetching candidates:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchCandidates();
  }, [session?.id]);

  const chartData = {
    labels: candidates.map(c => c.candidate_email.split('@')[0]),
    datasets: [
      {
        label: 'Integrity Score',
        data: candidates.map(c => c.integrity_score),
        backgroundColor: 'rgba(59, 130, 246, 0.8)',
        borderColor: 'rgb(59, 130, 246)',
        borderRadius: 12,
        borderWidth: 0,
        barThickness: 40,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      title: { display: false },
      tooltip: {
        backgroundColor: '#1e293b',
        padding: 12,
        titleFont: { size: 14, weight: 'bold' },
        bodyFont: { size: 12 },
        cornerRadius: 12,
        displayColors: false
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        max: 100,
        grid: { color: '#f1f5f9' },
        ticks: { font: { weight: 'bold' }, color: '#94a3b8' }
      },
      x: {
        grid: { display: false },
        ticks: { font: { weight: 'bold' }, color: '#64748b' }
      },
    },
  };

  return (
    <div className="cb-container py-10 sm:py-14 bg-slate-50/30 min-h-screen">
      <AnimatePresence>
        {selectedLogs && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-md p-4">
            <motion.div 
              initial={{ scale: 0.95, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 20 }}
              className="max-w-2xl w-full max-h-[85vh] flex flex-col overflow-hidden rounded-[2.5rem] bg-white shadow-2xl ring-1 ring-slate-200"
            >
              <CardHeader className="flex justify-between items-center border-b p-8 bg-slate-50/50">
                <div>
                  <h3 className="text-2xl font-black text-slate-900">Activity Timeline</h3>
                  <p className="text-xs text-blue-600 font-black uppercase tracking-widest mt-1">Audit Trail & Proctoring Logs</p>
                </div>
                <button 
                  onClick={() => setSelectedLogs(null)} 
                  className="w-10 h-10 rounded-full bg-white border border-slate-200 flex items-center justify-center hover:bg-rose-50 hover:text-rose-600 hover:border-rose-200 transition-all shadow-sm font-bold"
                >
                  ✕
                </button>
              </CardHeader>
              <CardBody className="overflow-y-auto p-8 space-y-4">
                {selectedLogs.length === 0 ? (
                  <div className="text-center py-20 text-slate-400 italic">
                    <div className="flex justify-center mb-4 opacity-20">
                      <ShieldIcon />
                    </div>
                    No suspicious events detected during this session.
                  </div>
                ) : (
                  selectedLogs.map((log, i) => (
                    <motion.div 
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.05 }}
                      key={i} 
                      className="flex gap-5 p-5 rounded-[1.5rem] bg-white ring-1 ring-slate-100 hover:ring-blue-500/20 hover:shadow-md transition-all border-l-4 border-slate-900"
                      style={{ borderLeftColor: log.event.includes('person') ? '#f43f5e' : '#f59e0b' }}
                    >
                      <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 shadow-inner ${
                        log.event.includes('person') ? 'bg-rose-50 text-rose-600' : 'bg-amber-50 text-amber-600'
                      }`}>
                        {log.device === 'mobile' ? <MobileIcon /> : <LaptopIcon />}
                      </div>
                      <div className="flex-grow">
                        <div className="flex items-center justify-between mb-1">
                          <div className="text-sm font-black text-slate-900 uppercase tracking-tight">
                            {log.event.replace(/_/g, ' ')}
                          </div>
                          <div className="text-[10px] font-black text-slate-400 bg-slate-50 px-2 py-0.5 rounded-full border border-slate-100 uppercase tracking-widest">
                            {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                          </div>
                        </div>
                        <div className="text-xs text-slate-500 font-bold">
                          Detected via <span className="text-slate-900 font-black">{log.device}</span> • Confidence: <span className="text-blue-600 font-black">{(log.confidence_score * 100).toFixed(0)}%</span>
                        </div>
                        <div className="text-[10px] text-slate-400 mt-2 font-medium italic">
                          {new Date(log.timestamp).toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                        </div>
                      </div>
                    </motion.div>
                  ))
                )}
              </CardBody>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
        <div className="space-y-1">
          <div className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-widest bg-emerald-600 text-white mb-2">
            Analytics Engine
          </div>
          <h1 className="text-4xl font-black tracking-tight text-slate-900">
            Candidate <span className="text-blue-600">Intelligence</span>
          </h1>
          <p className="text-slate-500 font-medium max-w-2xl">
            Deep-dive into performance metrics, integrity audits, and behavioral patterns across your talent pool.
          </p>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => window.print()} variant="secondary" className="h-11 px-5 bg-white border-slate-200 text-slate-600 font-bold rounded-xl shadow-sm hover:bg-slate-50 transition-all">
            Export Report
          </Button>
        </div>
      </div>

      {candidates.length > 0 && (
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-12"
        >
          <Card className="border-none shadow-sm ring-1 ring-slate-200/60 rounded-[2.5rem] bg-white overflow-hidden">
            <CardHeader className="bg-slate-50/50 p-8 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h2 className="text-xl font-black text-slate-800">Global Integrity Distribution</h2>
                <p className="text-xs text-slate-400 font-bold uppercase tracking-widest mt-1">Cross-Session Comparison</p>
              </div>
              <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-lg shadow-blue-500/20">
                <ChartIcon />
              </div>
            </CardHeader>
            <CardBody className="p-8">
              <div className="h-[350px]">
                <Bar data={chartData} options={chartOptions} />
              </div>
            </CardBody>
          </Card>
        </motion.div>
      )}

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {loading ? (
          Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-64 bg-white ring-1 ring-slate-100 animate-pulse rounded-[2.5rem]"></div>
          ))
        ) : candidates.length === 0 ? (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="col-span-full py-24 text-center bg-slate-50 rounded-[3rem] border-2 border-dashed border-slate-200 text-slate-400"
          >
            <div className="flex justify-center mb-6 opacity-20">
              <UsersIcon />
            </div>
            <h3 className="text-xl font-black text-slate-900">No candidate data available</h3>
            <p className="text-sm font-medium mt-2 max-w-xs mx-auto italic">Invite candidates to your jobs to start seeing their performance analytics here.</p>
          </motion.div>
        ) : (
          candidates.map((candidate, i) => (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: i * 0.05 }}
              key={i}
            >
              <Card className="group h-full hover:shadow-2xl hover:ring-blue-500/20 transition-all duration-500 rounded-[2.5rem] bg-white overflow-hidden flex flex-col border-none ring-1 ring-slate-200/60">
                <CardBody className="p-8 flex flex-col h-full">
                  <div className="flex justify-between items-start mb-6">
                    <div className="space-y-1">
                      <div className="text-lg font-black text-slate-900 group-hover:text-blue-600 transition-colors">
                        {candidate.candidate_email.split('@')[0]}
                      </div>
                      <div className="text-[10px] text-blue-600 font-black uppercase tracking-widest bg-blue-50 px-2 py-0.5 rounded-lg inline-block">
                        {candidate.job_title}
                      </div>
                    </div>
                    <div className={`text-xl font-black px-3 py-1.5 rounded-2xl shadow-sm ${
                      candidate.integrity_score > 80 ? 'bg-emerald-50 text-emerald-600 ring-1 ring-emerald-100' : 'bg-rose-50 text-rose-600 ring-1 ring-rose-100'
                    }`}>
                      {candidate.integrity_score.toFixed(0)}%
                    </div>
                  </div>

                  <div className="space-y-6 flex-grow">
                    <div>
                      <div className="flex justify-between text-[10px] text-slate-400 mb-2 uppercase font-black tracking-widest">
                        <span>Trust Signal</span>
                        <span className="text-slate-900">{candidate.integrity_score.toFixed(0)}%</span>
                      </div>
                      <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden shadow-inner">
                        <motion.div 
                          initial={{ width: 0 }}
                          animate={{ width: `${candidate.integrity_score}%` }}
                          transition={{ duration: 1, ease: "easeOut" }}
                          className={`h-full transition-all duration-500 rounded-full ${
                            candidate.integrity_score > 80 ? 'bg-emerald-500' : 
                            candidate.integrity_score > 50 ? 'bg-amber-500' : 'bg-rose-500'
                          }`}
                        ></motion.div>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div className="p-3 rounded-2xl bg-slate-50 border border-slate-100">
                        <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Session ID</div>
                        <div className="text-xs font-bold text-slate-700 font-mono">#{candidate.session_id.slice(0, 8)}</div>
                      </div>
                      <div className="p-3 rounded-2xl bg-slate-50 border border-slate-100">
                        <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Status</div>
                        <div className="flex items-center gap-1.5">
                          <div className={`w-1.5 h-1.5 rounded-full ${candidate.status === 'active' ? 'bg-blue-500 animate-pulse' : 'bg-emerald-500'}`}></div>
                          <div className="text-xs font-bold text-slate-700 capitalize">{candidate.status}</div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="pt-6 mt-6 border-t border-slate-50 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="flex flex-col">
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Date</span>
                        <span className="text-xs font-bold text-slate-700">{new Date(candidate.start_time).toLocaleDateString()}</span>
                      </div>
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center ${candidate.mobile_connected ? 'text-emerald-500' : 'text-slate-200 opacity-50'}`}>
                        {candidate.mobile_connected ? <ShieldIcon /> : <LaptopIcon />}
                      </div>
                    </div>
                    <Button 
                      size="sm" 
                      onClick={() => fetchLogs(candidate.session_id)}
                      className="h-10 px-5 bg-slate-900 hover:bg-blue-600 text-white text-[10px] font-black uppercase tracking-widest rounded-xl shadow-lg shadow-slate-900/10 transition-all active:scale-95"
                    >
                      Audit Logs
                    </Button>
                  </div>
                </CardBody>
              </Card>
            </motion.div>
          ))
        )}
      </div>
    </div>
  );
}

export default Candidates;
