import React, { useEffect, useState } from "react";
import axiosClient from "../utils/axiosClient";
import { getUserSession } from "../utils/auth";
import Button from "../components/ui/Button";
import { Card, CardBody, CardHeader } from "../components/ui/Card";
import { motion, AnimatePresence } from "framer-motion";

function Reevaluate() {
  const session = getUserSession();
  const [pendingReevals, setPendingReevals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (session?.id) {
      loadPending();
    }
  }, [session?.id]);

  async function loadPending() {
    setLoading(true);
    try {
      const res = await axiosClient.get(`/reeval/pending/${session.id}`);
      setPendingReevals(res.data);
    } catch (err) {
      console.error("Failed to load pending re-evaluations:", err);
    } finally {
      setLoading(false);
    }
  }

  async function handleAction(reevalId, action) {
    setBusy(true);
    try {
      await axiosClient.post(`/reeval/${action}`, { reeval_id: reevalId });
      setPendingReevals(prev => prev.filter(r => r.id !== reevalId));
    } catch (err) {
      console.error(`Failed to ${action} re-evaluation:`, err);
    } finally {
      setBusy(false);
    }
  }

  if (loading) {
    return (
      <div className="cb-container py-20 flex flex-col items-center justify-center">
        <div className="w-12 h-12 border-4 border-blue-600/20 border-t-blue-600 rounded-full animate-spin mb-4" />
        <p className="text-sm font-bold text-slate-400 uppercase tracking-widest">Loading Requests...</p>
      </div>
    );
  }

  return (
    <div className="cb-container py-12 sm:py-16">
      <div className="mb-12">
        <h1 className="text-3xl font-black tracking-tight text-slate-900">
          Re-evaluation <span className="text-blue-600">Requests</span>
        </h1>
        <p className="text-slate-500 font-medium mt-2">
          Review and process interview re-evaluation requests from candidates.
        </p>
      </div>

      <div className="grid gap-6">
        {pendingReevals.length === 0 ? (
          <div className="py-20 text-center bg-white rounded-[2rem] border-2 border-dashed border-slate-200">
            <h3 className="text-lg font-bold text-slate-900">No pending requests</h3>
            <p className="text-sm text-slate-500 mt-1">All re-evaluation requests have been processed.</p>
          </div>
        ) : (
          <AnimatePresence>
            {pendingReevals.map((reeval) => (
              <motion.div
                key={reeval.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
              >
                <Card className="border-none shadow-sm ring-1 ring-slate-200 rounded-[2rem] overflow-hidden bg-white">
                  <CardBody className="p-8">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                      <div className="space-y-4 flex-grow">
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center font-bold text-sm ring-1 ring-blue-100">
                            {reeval.candidate_name.split(' ').map(n => n[0]).join('')}
                          </div>
                          <div>
                            <div className="font-black text-slate-900 text-lg">{reeval.candidate_name}</div>
                            <div className="text-xs text-slate-400 font-bold uppercase tracking-widest">{reeval.job_title}</div>
                          </div>
                        </div>
                        
                        <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                          <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Reason for Request</div>
                          <p className="text-sm text-slate-600 font-medium leading-relaxed italic">
                            "{reeval.reason}"
                          </p>
                        </div>
                      </div>

                      <div className="flex flex-row md:flex-col gap-3 min-w-[160px]">
                        <Button 
                          onClick={() => handleAction(reeval.id, 'accept')}
                          disabled={busy}
                          className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-lg shadow-emerald-500/20"
                        >
                          Accept
                        </Button>
                        <Button 
                          onClick={() => handleAction(reeval.id, 'reject')}
                          disabled={busy}
                          variant="secondary"
                          className="flex-1 border-slate-200 text-slate-600 font-bold rounded-xl hover:bg-rose-50 hover:text-rose-600 hover:border-rose-200 transition-all"
                        >
                          Reject
                        </Button>
                      </div>
                    </div>
                  </CardBody>
                </Card>
              </motion.div>
            ))}
          </AnimatePresence>
        )}
      </div>
    </div>
  );
}

export default Reevaluate;
