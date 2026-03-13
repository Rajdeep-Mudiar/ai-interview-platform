import React, { useState, useEffect } from "react";
import axios from "axios";
import { Card, CardHeader, CardBody } from "../components/ui/Card";
import Button from "../components/ui/Button";

function Report() {
  const [sessions, setSessions] = useState([]);
  const [selectedSession, setSelectedSession] = useState(null);
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSessions = async () => {
      try {
        // In a real app, we'd have a route to list all sessions
        // For now, let's assume we can fetch sessions from a new endpoint
        const res = await axios.get("http://localhost:8000/monitoring/sessions/list");
        setSessions(res.data);
      } catch (err) {
        console.error("Error fetching sessions:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchSessions();
  }, []);

  const viewLogs = async (sessionId) => {
    try {
      const [sessionRes, logsRes] = await Promise.all([
        axios.get(`http://localhost:8000/monitoring/sessions/${sessionId}`),
        axios.get(`http://localhost:8000/monitoring/sessions/${sessionId}/logs`)
      ]);
      setSelectedSession(sessionRes.data);
      setLogs(logsRes.data);
    } catch (err) {
      console.error("Error fetching logs:", err);
    }
  };

  return (
    <div className="cb-container py-10 sm:py-14">
      <div className="mb-8">
        <h1 className="text-2xl font-semibold tracking-tight text-slate-900 sm:text-3xl">
          Interview Proctoring Reports
        </h1>
        <p className="mt-1 text-sm text-slate-600">
          Review integrity logs and session details for all candidates.
        </p>
      </div>

      <div className="grid gap-8 lg:grid-cols-12">
        {/* Sessions List */}
        <div className="lg:col-span-4 space-y-4">
          <h2 className="text-lg font-bold text-slate-800 px-1">Recent Sessions</h2>
          {loading ? (
            <div className="animate-pulse space-y-3">
              {[1, 2, 3].map(i => <div key={i} className="h-20 bg-slate-100 rounded-xl"></div>)}
            </div>
          ) : sessions.length === 0 ? (
            <div className="p-8 text-center bg-slate-50 rounded-2xl border-2 border-dashed border-slate-200 text-slate-400 italic">
              No sessions found
            </div>
          ) : (
            sessions.map((session) => (
              <div 
                key={session.session_id}
                onClick={() => viewLogs(session.session_id)}
                className={`p-4 rounded-xl border transition-all cursor-pointer hover:shadow-md ${
                  selectedSession?.session_id === session.session_id 
                  ? 'bg-blue-50 border-blue-200 ring-1 ring-blue-200' 
                  : 'bg-white border-slate-200 hover:border-blue-300'
                }`}
              >
                <div className="flex justify-between items-start">
                  <div>
                    <p className="font-semibold text-slate-900">{session.candidate_email}</p>
                    <p className="text-[10px] text-slate-500 font-mono mt-1">{session.session_id.slice(0, 8)}...</p>
                  </div>
                  <div className={`text-xs font-bold px-2 py-1 rounded ${
                    session.integrity_score > 80 ? 'bg-emerald-100 text-emerald-700' : 
                    session.integrity_score > 50 ? 'bg-amber-100 text-amber-700' : 'bg-rose-100 text-rose-700'
                  }`}>
                    {session.integrity_score.toFixed(0)}%
                  </div>
                </div>
                <div className="mt-3 flex items-center gap-2 text-[10px] text-slate-400">
                  <span className="material-icons text-xs">calendar_today</span>
                  {new Date(session.start_time).toLocaleDateString()}
                  <span className="ml-auto flex items-center gap-1">
                    <div className={`w-1.5 h-1.5 rounded-full ${session.mobile_connected ? 'bg-green-500' : 'bg-slate-300'}`}></div>
                    Mobile
                  </span>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Session Details & Logs */}
        <div className="lg:col-span-8">
          {selectedSession ? (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4">
              <Card>
                <CardHeader>
                  <div className="flex justify-between items-center">
                    <h3 className="font-bold text-slate-900">Session Analysis</h3>
                    <div className="flex gap-2">
                      <Button variant="secondary" size="sm">Export PDF</Button>
                    </div>
                  </div>
                </CardHeader>
                <CardBody>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                    <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                      <p className="text-[10px] text-slate-500 uppercase font-bold">Integrity Score</p>
                      <p className={`text-2xl font-black ${
                        selectedSession.integrity_score > 80 ? 'text-emerald-600' : 'text-rose-600'
                      }`}>{selectedSession.integrity_score.toFixed(1)}%</p>
                    </div>
                    <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                      <p className="text-[10px] text-slate-500 uppercase font-bold">Mobile Device</p>
                      <p className="text-sm font-semibold text-slate-800 mt-1">
                        {selectedSession.mobile_metadata?.platform || "Not Connected"}
                      </p>
                    </div>
                    <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                      <p className="text-[10px] text-slate-500 uppercase font-bold">Desktop Browser</p>
                      <p className="text-sm font-semibold text-slate-800 mt-1 truncate">
                        {selectedSession.desktop_metadata?.userAgent?.split(') ')[1] || "Chrome"}
                      </p>
                    </div>
                  </div>

                  <h4 className="text-sm font-bold text-slate-700 mb-4 flex items-center gap-2">
                    <span className="material-icons text-sm">history</span>
                    Activity Timeline
                  </h4>
                  <div className="space-y-3">
                    {logs.length === 0 ? (
                      <p className="text-center py-8 text-slate-400 italic text-sm">No activities recorded</p>
                    ) : (
                      logs.map((log, idx) => (
                        <div key={idx} className="flex gap-4 p-3 rounded-lg bg-white border border-slate-100 hover:shadow-sm transition-shadow">
                          <div className={`mt-1 w-2 h-2 rounded-full shrink-0 ${
                            log.event === 'device_connected' ? 'bg-blue-500' :
                            log.event === 'looking_away' ? 'bg-amber-500' : 'bg-rose-500'
                          }`}></div>
                          <div className="flex-1">
                            <div className="flex justify-between">
                              <p className="text-sm font-bold text-slate-800">
                                {log.event.replace(/_/g, ' ').toUpperCase()}
                              </p>
                              <p className="text-[10px] text-slate-400 font-mono">
                                {new Date(log.timestamp).toLocaleTimeString()}
                              </p>
                            </div>
                            <p className="text-xs text-slate-500 mt-0.5">
                              Detected on <span className="font-semibold">{log.device}</span>
                              {log.confidence_score < 1 && ` • Confidence: ${(log.confidence_score * 100).toFixed(0)}%`}
                            </p>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </CardBody>
              </Card>
            </div>
          ) : (
            <div className="h-full min-h-[400px] flex flex-col items-center justify-center bg-slate-50 rounded-3xl border-2 border-dashed border-slate-200">
              <div className="bg-white p-6 rounded-full shadow-sm mb-4">
                <span className="material-icons text-5xl text-slate-200">assignment</span>
              </div>
              <p className="text-slate-400 font-medium">Select a session to view detailed proctoring report</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default Report;
