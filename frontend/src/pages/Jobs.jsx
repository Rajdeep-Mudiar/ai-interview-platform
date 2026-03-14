import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import axiosClient from "../utils/axiosClient";
import { getUserSession } from "../utils/auth";
import Button from "../components/ui/Button";
import { Card, CardBody } from "../components/ui/Card";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "../components/ui/cn";

const getDeadlineInfo = (deadline) => {
  if (!deadline) return null;
  const target = new Date(deadline);
  const now = new Date();
  const diff = target - now;
  const days = Math.ceil(diff / (1000 * 60 * 60 * 24));
  
  if (days < 0) return { label: "Expired", color: "text-rose-600 bg-rose-50 border-rose-100" };
  if (days === 0) return { label: "Ends Today", color: "text-amber-600 bg-amber-50 border-amber-100" };
  return { label: `${days} days left`, color: "text-blue-600 bg-blue-50 border-blue-100" };
};

export default function Jobs() {
  const [jobs, setJobs] = useState([]);
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const session = getUserSession();
  const isRecruiter = session?.role === "recruiter";

  const SearchIcon = () => (
    <svg className="w-8 h-8 text-slate-400 group-hover:text-blue-500 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
    </svg>
  );

  const BriefcaseIcon = () => (
    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
    </svg>
  );

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      try {
        const params = isRecruiter ? { recruiter_id: session?.id } : {};
        
        // Load jobs - handle independently to prevent blocking
        const jobsPromise = axiosClient.get("/jobs", { params })
          .then(res => {
            console.log("Jobs fetched successfully:", res.data);
            setJobs(res.data || []);
          })
          .catch(err => {
            console.error("Error fetching jobs:", err);
            setJobs([]);
          });

        // Load candidate results - handle independently
        const resultsPromise = (!isRecruiter && session?.id) 
          ? axiosClient.get(`/stats/candidate/${session.id}`)
              .then(res => {
                setResults(res.data.history || []);
              })
              .catch(err => {
                console.error("Error fetching candidate stats:", err);
                setResults([]);
              })
          : Promise.resolve().then(() => setResults([]));

        await Promise.all([jobsPromise, resultsPromise]);
      } catch (err) {
        console.error("Unexpected error in loadData:", err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [isRecruiter, session?.id]);

  const filteredJobs = jobs.filter(job => 
    job.title.toLowerCase().includes(search.toLowerCase()) ||
    job.description.toLowerCase().includes(search.toLowerCase())
  );

  if (loading) {
    return (
      <div className="cb-container py-20 flex flex-col items-center justify-center">
        <div className="w-12 h-12 border-4 border-blue-600/20 border-t-blue-600 rounded-full animate-spin mb-4" />
        <p className="text-sm font-bold text-slate-400 uppercase tracking-widest">Loading Opportunities...</p>
      </div>
    );
  }

  return (
    <div className="cb-container py-12 sm:py-16">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
        <div className="max-w-2xl">
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl">
            Explore <span className="text-blue-600">Opportunities</span>
          </h1>
          <p className="mt-3 text-lg text-slate-600">
            Find the perfect role and get instant AI-powered feedback on your fit.
          </p>
        </div>
        
        <div className="relative w-full md:w-80">
          <input
            type="text"
            placeholder="Search roles or skills..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full h-12 pl-11 pr-4 rounded-2xl bg-white border-none ring-1 ring-slate-200 focus:ring-2 focus:ring-blue-500 transition-all text-sm font-medium shadow-sm"
          />
          <svg className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>
      </div>

      <AnimatePresence mode="popLayout">
        <motion.div 
          layout
          className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3"
        >
          {filteredJobs.length === 0 && (
            <motion.div 
              key="no-jobs"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="col-span-full py-20 text-center bg-slate-50 rounded-[2rem] border-2 border-dashed border-slate-200"
            >
              <div className="flex justify-center text-slate-300">
                <SearchIcon />
              </div>
              <h3 className="text-lg font-bold text-slate-900">No matching jobs found</h3>
              <p className="text-sm text-slate-500 mt-1">Try adjusting your search criteria or browse all roles.</p>
              <Button variant="secondary" onClick={() => setSearch("")} className="mt-6">
                Clear Search
              </Button>
            </motion.div>
          )}
          
          {filteredJobs.map((job, index) => {
            const deadlineInfo = getDeadlineInfo(job.deadline);
            const userResult = results.find(r => r.job_id === job.id);
            const statusLabel = userResult ? userResult.status : "Active";
            const statusColor = statusLabel === "terminated" ? "bg-rose-50 text-rose-700 border-rose-100" : 
                               statusLabel === "completed" ? "bg-emerald-50 text-emerald-700 border-emerald-100" : 
                               "bg-emerald-50 text-emerald-700 border-emerald-100";
            
            return (
              <motion.div
                key={job.id}
                layout
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <Card className="group h-full hover:shadow-xl hover:ring-blue-500/30 transition-all duration-300 rounded-[2rem] overflow-hidden flex flex-col">
                  <CardBody className="p-6 flex flex-col h-full">
                    <div className="flex items-start justify-between mb-4">
                      <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform duration-300">
                        <BriefcaseIcon />
                      </div>
                      <div className="flex flex-col items-end gap-2">
                        <span className={cn("px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider border", statusColor)}>
                          {statusLabel === "terminated" ? "Interview Terminated" : statusLabel}
                        </span>
                        {deadlineInfo && (
                          <span className={cn("px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider border", deadlineInfo.color)}>
                            {deadlineInfo.label}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex-grow">
                      <h3 className="text-lg font-bold text-slate-900 group-hover:text-blue-600 transition-colors line-clamp-1">
                        {job.title}
                      </h3>
                      <p className="mt-3 text-sm text-slate-500 leading-relaxed line-clamp-3">
                        {job.description}
                      </p>
                    </div>

                    <div className="mt-6 pt-6 border-t border-slate-100 flex flex-wrap gap-2 mb-6">
                      <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-50 text-slate-600 text-xs font-medium border border-slate-100">
                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        {job.questions?.length ?? 0} Questions
                      </div>
                      <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-50 text-slate-600 text-xs font-medium border border-slate-100">
                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
                        </svg>
                        AI Powered
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <Button
                        as={Link}
                        to={`/resume-analysis?jobId=${job.id}`}
                        variant="secondary"
                        className="flex-1 text-xs font-bold"
                      >
                        {userResult ? "Re-analyze" : "Analyze Fit"}
                      </Button>
                      <Button
                        as={Link}
                        to={`/interview?jobId=${job.id}`}
                        className={cn(
                          "flex-1 text-xs font-bold shadow-md",
                          userResult ? "bg-emerald-600 hover:bg-emerald-700 shadow-emerald-500/10" : "bg-blue-600 hover:bg-blue-700 shadow-blue-500/10"
                        )}
                      >
                        {userResult ? "Reapply" : "Start Interview"}
                      </Button>
                    </div>
                  </CardBody>
                </Card>
              </motion.div>
            );
          })}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
