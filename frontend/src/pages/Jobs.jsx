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
  const [selectedJob, setSelectedJob] = useState(null);
  const session = getUserSession();
  const isRecruiter = session?.role === "recruiter";

  const LocationIcon = () => (
    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
  );

  const CurrencyIcon = () => (
    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  );

  const BuildingIcon = () => (
    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
    </svg>
  );

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

  const ArrowRightIcon = () => (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3" />
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
                onClick={() => setSelectedJob(job)}
              >
                <Card className="group h-full hover:shadow-xl hover:ring-blue-500/30 transition-all duration-300 rounded-[2rem] overflow-hidden flex flex-col cursor-pointer">
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
                      <div className="flex flex-col gap-2 mt-2">
                        {job.company && (
                          <div className="flex items-center gap-2 text-xs text-slate-500 font-bold">
                            <BuildingIcon /> {job.company}
                          </div>
                        )}
                        <div className="flex items-center gap-4">
                          {job.location && (
                            <div className="flex items-center gap-2 text-[10px] text-slate-400 font-medium">
                              <LocationIcon /> {job.location}
                            </div>
                          )}
                          {job.salary && (
                            <div className="flex items-center gap-2 text-[10px] text-slate-400 font-medium">
                              <CurrencyIcon /> {job.salary}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="mt-6 pt-6 border-t border-slate-100 flex items-center justify-between">
                      <div className="text-[10px] font-black text-blue-600 uppercase tracking-widest flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                        View Details <ArrowRightIcon />
                      </div>
                      <div className="text-[10px] font-bold text-slate-400">
                        {job.questions?.length ?? 0} Questions
                      </div>
                    </div>
                  </CardBody>
                </Card>
              </motion.div>
            );
          })}
        </motion.div>
      </AnimatePresence>

      <AnimatePresence>
        {selectedJob && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 overflow-hidden">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedJob(null)}
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-4xl max-h-[90vh] bg-white rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col"
            >
              <div className="p-8 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-black text-slate-900">{selectedJob.title}</h2>
                  <div className="flex flex-wrap gap-4 mt-2">
                    {selectedJob.company && <span className="text-xs font-bold text-blue-600 flex items-center gap-1.5"><BuildingIcon /> {selectedJob.company}</span>}
                    {selectedJob.location && <span className="text-xs font-bold text-slate-500 flex items-center gap-1.5"><LocationIcon /> {selectedJob.location}</span>}
                    {selectedJob.salary && <span className="text-xs font-bold text-slate-500 flex items-center gap-1.5"><CurrencyIcon /> {selectedJob.salary}</span>}
                  </div>
                </div>
                <button 
                  onClick={() => setSelectedJob(null)}
                  className="h-10 w-10 rounded-full bg-white shadow-sm ring-1 ring-slate-200 flex items-center justify-center text-slate-400 hover:text-slate-600 transition-colors"
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <div className="flex-grow overflow-y-auto p-8 custom-scrollbar space-y-8">
                <div className="grid md:grid-cols-2 gap-8">
                  <div className="space-y-6">
                    <section>
                      <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-blue-600 mb-3">Job Description</h3>
                      <p className="text-sm text-slate-600 leading-relaxed font-medium">{selectedJob.description}</p>
                    </section>
                    {selectedJob.key_responsibilities && (
                      <section>
                        <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-blue-600 mb-3">Key Responsibilities</h3>
                        <p className="text-sm text-slate-600 leading-relaxed font-medium whitespace-pre-line">{selectedJob.key_responsibilities}</p>
                      </section>
                    )}
                  </div>
                  <div className="space-y-6">
                    {selectedJob.requirements && (
                      <section>
                        <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-blue-600 mb-3">Requirements / Skills</h3>
                        <p className="text-sm text-slate-600 leading-relaxed font-medium whitespace-pre-line">{selectedJob.requirements}</p>
                      </section>
                    )}
                    <div className="grid grid-cols-2 gap-4">
                      {selectedJob.qualification && (
                        <div className="p-4 rounded-2xl bg-slate-50 ring-1 ring-slate-200/60">
                          <h4 className="text-[9px] font-black uppercase tracking-wider text-slate-400 mb-1">Qualification</h4>
                          <p className="text-xs font-bold text-slate-700">{selectedJob.qualification}</p>
                        </div>
                      )}
                      {selectedJob.work_experience && (
                        <div className="p-4 rounded-2xl bg-slate-50 ring-1 ring-slate-200/60">
                          <h4 className="text-[9px] font-black uppercase tracking-wider text-slate-400 mb-1">Experience</h4>
                          <p className="text-xs font-bold text-slate-700">{selectedJob.work_experience}</p>
                        </div>
                      )}
                    </div>
                    {selectedJob.benefits && (
                      <section>
                        <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-blue-600 mb-3">Benefits</h3>
                        <p className="text-sm text-slate-600 leading-relaxed font-medium">{selectedJob.benefits}</p>
                      </section>
                    )}
                  </div>
                </div>
              </div>

              <div className="p-8 border-t border-slate-100 bg-slate-50/50 flex gap-4">
                <Button
                  as={Link}
                  to={`/resume-analysis?jobId=${selectedJob.id}`}
                  variant="secondary"
                  className="flex-1 h-14 rounded-2xl font-black text-sm border-slate-200"
                >
                  Step 1: Analyze Resume Fit
                </Button>
                <Button
                  as={Link}
                  to={`/interview?jobId=${selectedJob.id}`}
                  className="flex-1 h-14 rounded-2xl font-black text-sm bg-blue-600 hover:bg-blue-700 text-white shadow-xl shadow-blue-500/20"
                >
                  Step 2: Start AI Interview
                </Button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
