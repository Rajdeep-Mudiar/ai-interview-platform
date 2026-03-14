import React, { useState, useEffect, useRef } from "react";
import { QRCodeSVG } from "qrcode.react";
import axiosClient from "../utils/axiosClient";
import { Card, CardHeader, CardBody } from "./ui/Card";

const DualMonitoring = ({ sessionId, setSessionId, jobId, onIntegrityChange }) => {
  const [mobileLink, setMobileLink] = useState("");
  const [alerts, setAlerts] = useState([]);
  const [isMobileConnected, setIsMobileConnected] = useState(false);
  const [sessionData, setSessionData] = useState(null);
  const socketRef = useRef(null);

  // Initialize session
  
  useEffect(() => {
    const initializeSession = async () => {
      try {
        const user = JSON.parse(localStorage.getItem("user") || "{}");
        const metadata = {
          userAgent: navigator.userAgent,
          platform: navigator.platform,
          screenResolution: `${window.screen.width}x${window.screen.height}`,
        };
        const response = await axiosClient.post("/monitoring/sessions", {
          candidate_email: user.name || "candidate@example.com",
          job_id: jobId,
          metadata: metadata
        });
        setSessionId(response.data.session_id);
        setMobileLink(response.data.mobile_link);
      } catch (err) {
        console.error("Error initializing session:", err);
      }
    };

    if (!sessionId) {
      initializeSession();
    }
  }, [sessionId, setSessionId, jobId]);

  // Fetch initial session data and logs
  useEffect(() => {
    if (sessionId) {
      const fetchData = async () => {
        try {
          const [sessionRes, logsRes] = await Promise.all([
            axiosClient.get(`/monitoring/sessions/${sessionId}`),
            axiosClient.get(`/monitoring/sessions/${sessionId}/logs`)
          ]);
          setSessionData(sessionRes.data);
          setIsMobileConnected(sessionRes.data.mobile_connected);
          setAlerts(logsRes.data.filter(log => log.event !== 'device_connected'));
          if (onIntegrityChange && sessionRes.data.integrity_score !== undefined) {
            onIntegrityChange(sessionRes.data.integrity_score);
          }
        } catch (err) {
          console.error("Error fetching session data:", err);
        }
      };
      fetchData();
    }
  }, [sessionId, onIntegrityChange]);

  // WebSocket for real-time alerts
  useEffect(() => {
    if (sessionId) {
      socketRef.current = new WebSocket(`ws://127.0.0.1:8000/monitoring/ws/${sessionId}`);

      socketRef.current.onmessage = (event) => {
        const data = JSON.parse(event.data);
        if (data.type === "suspicious_activity") {
          setAlerts((prev) => [data.payload, ...prev].slice(0, 10));
          // Refresh session data to get updated integrity score
          axiosClient.get(`/monitoring/sessions/${sessionId}`)
            .then(res => {
              setSessionData(res.data);
              if (onIntegrityChange) {
                onIntegrityChange(res.data.integrity_score);
              }
            });
          
          if (Notification.permission === "granted") {
            new Notification("Suspicious Activity", { body: data.payload.message });
          }
        } else if (data.type === "device_status") {
          if (data.payload.device === "mobile" && data.payload.status === "connected") {
            setIsMobileConnected(true);
          }
        }
      };

      socketRef.current.onopen = () => console.log("WebSocket connected");
      socketRef.current.onclose = () => console.log("WebSocket disconnected");

      return () => {
        if (socketRef.current) socketRef.current.close();
      };
    }
  }, [sessionId]);

  // Tab switching detection
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden && sessionId) {
        axiosClient.post("/monitoring/events", {
          session_id: sessionId,
          device: "desktop",
          event: "tab_switch",
          confidence_score: 1.0,
        });
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => document.removeEventListener("visibilitychange", handleVisibilityChange);
  }, [sessionId]);

  // Request notification permission
  useEffect(() => {
    if (Notification.permission === "default") {
      Notification.requestPermission();
    }
  }, []);

  return (
    <Card className="border-none shadow-xl shadow-slate-200/50 ring-1 ring-slate-100 rounded-3xl overflow-hidden bg-white">
      <CardHeader className="p-6 pb-4 border-b border-slate-50">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`w-2.5 h-2.5 rounded-full ${isMobileConnected ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.6)]' : 'bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.6)] animate-pulse'}`}></div>
            <h2 className="text-base font-bold text-slate-900 tracking-tight">Environmental Shield</h2>
          </div>
          {sessionData && (
            <div className="px-3 py-1 rounded-lg bg-slate-50 border border-slate-100 flex items-center gap-2">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Integrity</span>
              <span className={`text-sm font-bold ${sessionData.integrity_score < 70 ? 'text-rose-600' : 'text-emerald-600'}`}>
                {sessionData.integrity_score.toFixed(0)}%
              </span>
            </div>
          )}
        </div>
      </CardHeader>

      <CardBody className="p-6">
        <div className="grid gap-6">
          {/* Mobile Connection Section */}
          <div className="bg-slate-50 rounded-2xl p-6 border border-slate-100 flex flex-col items-center text-center">
            {!isMobileConnected ? (
              <>
                <div className="w-12 h-12 rounded-xl bg-white flex items-center justify-center shadow-sm mb-4">
                  <svg className="w-6 h-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v1m0 11v1m4-12h-1m-5 0H8m9 8h-1m-5 0H8m4-4a4 4 0 100 8 4 4 0 000-8z" />
                  </svg>
                </div>
                <h3 className="text-sm font-bold text-slate-900 mb-1">Connect Secondary Device</h3>
                <p className="text-xs text-slate-500 mb-6 max-w-[200px] leading-relaxed">
                  Scan to activate 360° mobile proctoring for this session.
                </p>
                {mobileLink ? (
                  <div className="bg-white p-4 rounded-2xl shadow-lg ring-1 ring-slate-100 hover:scale-105 transition-transform duration-300">
                    <QRCodeSVG value={mobileLink} size={140} fgColor="#0f172a" />
                  </div>
                ) : (
                  <div className="w-[140px] h-[140px] bg-slate-100 animate-pulse rounded-2xl"></div>
                )}
                <div className="mt-6 flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-50 text-[10px] font-bold text-blue-600 uppercase tracking-widest">
                  <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101" />
                  </svg>
                  Unique Session Key
                </div>
              </>
            ) : (
              <div className="py-6">
                <div className="w-20 h-20 bg-emerald-50 rounded-full flex items-center justify-center mx-auto mb-4 ring-8 ring-emerald-50/50">
                  <svg className="w-10 h-10 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
                  </svg>
                </div>
                <h3 className="text-lg font-bold text-slate-900">Mobile Secured</h3>
                <p className="text-sm text-emerald-600 font-medium mt-1">Secondary view is live and active.</p>
              </div>
            )}
          </div>

          {/* Activity Log Section */}
          <div className="space-y-4">
            <div className="flex items-center justify-between px-1">
              <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Live Security Feed</h3>
              <div className="text-[10px] font-bold text-blue-600 uppercase tracking-widest px-2 py-0.5 rounded bg-blue-50 border border-blue-100">
                {alerts.length} Incidents
              </div>
            </div>
            
            <div className="space-y-2 max-h-[220px] overflow-y-auto pr-1 custom-scrollbar">
              {alerts.length === 0 ? (
                <div className="text-center py-10 px-6 border border-dashed border-slate-100 rounded-2xl bg-slate-50/50">
                  <p className="text-xs text-slate-400 font-medium italic">No suspicious activity detected yet.</p>
                </div>
              ) : (
                alerts.map((alert, index) => (
                  <div
                    key={index}
                    className="group bg-white border border-slate-100 p-3 rounded-2xl flex items-start gap-3 shadow-sm hover:shadow-md hover:border-rose-100 transition-all animate-in fade-in slide-in-from-right-4"
                  >
                    <div className="w-8 h-8 rounded-xl bg-rose-50 flex items-center justify-center text-rose-500 shrink-0 group-hover:bg-rose-500 group-hover:text-white transition-colors">
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                      </svg>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-bold text-slate-800 leading-tight mb-0.5 truncate">
                        {alert.message}
                      </p>
                      <div className="flex items-center gap-2">
                        <span className="text-[9px] font-bold text-slate-400 uppercase tracking-tight">
                          {new Date(alert.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                        </span>
                        <span className="w-1 h-1 rounded-full bg-slate-200"></span>
                        <span className="text-[9px] font-bold text-slate-400 uppercase tracking-tight">
                          {alert.device.replace('_', ' ')}
                        </span>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </CardBody>

      <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
        <div className="flex flex-col gap-1">
          <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Desktop Cam</span>
          <div className="flex items-center gap-1.5">
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500"></div>
            <span className="text-[10px] font-bold text-slate-700">ONLINE</span>
          </div>
        </div>
        <div className="flex flex-col gap-1 text-right">
          <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Mobile Cam</span>
          <div className="flex items-center gap-1.5 justify-end">
            <div className={`w-1.5 h-1.5 rounded-full ${isMobileConnected ? 'bg-emerald-500' : 'bg-slate-300'}`}></div>
            <span className="text-[10px] font-bold text-slate-700">{isMobileConnected ? 'ONLINE' : 'OFFLINE'}</span>
          </div>
        </div>
      </div>
    </Card>
  );
};

export default DualMonitoring;
