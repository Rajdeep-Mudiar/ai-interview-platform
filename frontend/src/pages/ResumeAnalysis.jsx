import { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import axiosClient from "../utils/axiosClient";
import { getUserSession } from "../utils/auth";
import Button from "../components/ui/Button";
import { Card, CardBody, CardHeader } from "../components/ui/Card";
import { Input, Label, Textarea } from "../components/ui/Form";

function ResumeAnalysis() {
  const navigate = useNavigate();
  const location = useLocation();
  const [resumeFile, setResumeFile] = useState(null);
  const [resumeText, setResumeText] = useState("");
  const [jd, setJd] = useState("");
  const [jobs, setJobs] = useState([]);
  const [selectedJob, setSelectedJob] = useState(null);

  const CheckIcon = () => (
    <svg className="w-10 h-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
    </svg>
  );

  const ArrowRightIcon = () => (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3" />
    </svg>
  );

  useEffect(() => {
    async function loadJobs() {
      try {
        const res = await axiosClient.get("/jobs");
        setJobs(res.data);
      } catch (err) {
        console.error("Failed to load jobs:", err);
      }
    }
    loadJobs();

    if (location.state?.jd) {
      setJd(location.state.jd);
    }
  }, [location.state]);

  const [match, setMatch] = useState(null);
  const [suggestions, setSuggestions] = useState([]);
  const [busy, setBusy] = useState(false);
  const [parsing, setParsing] = useState(false);
  const [timer, setTimer] = useState(0);
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  useEffect(() => {
    let interval;
    if (isTimerRunning) {
      interval = setInterval(() => {
        setTimer((prev) => prev + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isTimerRunning]);

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}m ${secs}s`;
  };

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setResumeFile(file);
    
    setParsing(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await axiosClient.post("/parse_resume", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      setResumeText(res.data.text);
    } catch (err) {
      console.error("Failed to parse resume:", err);
      alert("Failed to parse resume.");
    } finally {
      setParsing(false);
    }
  };

  const analyzeForJob = async (job) => {
    if (!resumeText) {
      alert("Please upload and parse your resume first.");
      return;
    }
    setSelectedJob(job);
    setJd(job.description);
    setBusy(true);
    setTimer(0);
    setIsTimerRunning(true);
    try {
      const res = await axiosClient.post("/match_jd", {
        resume: resumeText,
        jd: job.description,
      });
      setMatch(res.data);
      
      const suggRes = await axiosClient.post("/resume_suggestions", {
        missing_skills: res.data.missing_skills,
        resume: resumeText,
      });
      setSuggestions(suggRes.data.suggestions);
    } catch (err) {
      console.error("Analysis failed:", err);
    } finally {
      setBusy(false);
      setIsTimerRunning(false);
    }
  };

  const saveInterview = async () => {
    if (!match || !selectedJob) return;
    const session = getUserSession();
    if (!session) return;

    setBusy(true);
    try {
      const timeTakenMinutes = Math.max(1, Math.round(timer / 60));
      const interviewData = {
        user_id: session.id,
        name: session.name,
        resume: resumeText,
        jd: selectedJob.description,
        job_id: selectedJob.id,
        fit_score: Math.round(match.fit_score),
        overallScore: Math.round(match.fit_score), 
        timeTaken: timeTakenMinutes, 
        integrity: 100, 
        missing_skills: match.missing_skills,
        questions: [], 
        suggestions: suggestions,
      };
      
      await axiosClient.post("/interview", interviewData);
      setShowSuccess(true);
      setTimeout(() => {
        navigate(`/interview?jobId=${selectedJob.id}`, {
          state: {
            skills: match.matched_skills || [],
            jobTitle: selectedJob.title
          }
        });
      }, 3000);
    } catch (err) {
      console.error("Failed to save analysis:", err);
      alert("Failed to save analysis results.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="cb-container py-10 sm:py-14 relative">
      {showSuccess && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
          <motion.div 
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white rounded-[2.5rem] p-10 max-w-sm w-full text-center shadow-2xl"
          >
            <div className="w-20 h-20 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckIcon />
            </div>
            <h2 className="text-2xl font-bold text-slate-900 mb-2">Analysis Complete!</h2>
            <p className="text-slate-500 mb-8">Your analysis is ready. Starting your AI technical interview now...</p>
            <div className="flex flex-col gap-2">
              <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                <motion.div 
                  initial={{ width: 0 }}
                  animate={{ width: "100%" }}
                  transition={{ duration: 3 }}
                  className="h-full bg-blue-600"
                />
              </div>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Entering Interview Room</span>
            </div>
          </motion.div>
        </div>
      )}

      <div className="mx-auto max-w-3xl text-center mb-10">
        <h1 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
          AI Resume Analysis
        </h1>
        <p className="mt-2 text-base text-slate-600">
          Upload your resume and select a target job to get an instant match analysis and optimization suggestions.
        </p>
      </div>

      <div className="grid gap-8 lg:grid-cols-12">
        {/* Left Column: Resume Upload */}
        <div className="lg:col-span-4 space-y-6">
          <Card className="p-6">
            <h3 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
              <span className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white text-sm">1</span>
              Upload Resume
            </h3>
            <div className="space-y-4">
              <div className="p-4 border-2 border-dashed border-slate-200 rounded-xl bg-slate-50/50 hover:border-blue-400 transition-colors group">
                <input 
                  type="file" 
                  id="resume-upload" 
                  className="hidden" 
                  accept=".pdf" 
                  onChange={handleFileChange} 
                />
                <label htmlFor="resume-upload" className="cursor-pointer flex flex-col items-center text-center">
                  <svg className="w-8 h-8 text-slate-400 group-hover:text-blue-500 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                  </svg>
                  <span className="text-sm font-medium text-slate-600">
                    {resumeFile ? resumeFile.name : "Click to upload PDF"}
                  </span>
                </label>
              </div>
              {parsing && <div className="text-xs text-blue-600 animate-pulse text-center">Parsing content...</div>}
              {resumeText && !parsing && (
                <div className="text-xs text-emerald-600 font-bold flex items-center justify-center gap-1.5">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" />
                  </svg>
                  Content Ready
                </div>
              )}
            </div>
          </Card>

          {match && (
            <Card className="p-6 bg-slate-900 text-white border-none shadow-xl">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-bold">Analysis Status</h3>
                {isTimerRunning && (
                  <div className="flex items-center gap-2 px-3 py-1 bg-slate-800 rounded-full border border-slate-700">
                    <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
                    <span className="text-[10px] font-mono font-bold text-slate-300">{formatTime(timer)}</span>
                  </div>
                )}
              </div>
              <div className="space-y-4">
                <div className="flex flex-col mb-4">
                  <span className="text-slate-400 text-xs uppercase tracking-widest mb-1">Targeting Job</span>
                  <span className="text-blue-400 font-bold text-lg leading-tight">{selectedJob?.title}</span>
                </div>
                <div className="flex justify-between items-end">
                  <span className="text-slate-400 text-sm">Match Score</span>
                  <span className="text-3xl font-bold text-blue-400">{Math.round(match.fit_score)}%</span>
                </div>
                <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
                  <div className="h-full bg-blue-500 transition-all duration-1000" style={{ width: `${match.fit_score}%` }}></div>
                </div>

                <div className="grid grid-cols-2 gap-2 pt-2">
                  <div className="bg-slate-800/50 p-2 rounded-lg border border-slate-700">
                    <div className="text-[10px] text-slate-400 uppercase font-bold">Skill Match</div>
                    <div className="text-sm font-bold text-blue-300">{match.skill_match_ratio}%</div>
                  </div>
                  <div className="bg-slate-800/50 p-2 rounded-lg border border-slate-700">
                    <div className="text-[10px] text-slate-400 uppercase font-bold">Time Spent</div>
                    <div className="text-sm font-bold text-blue-300">{formatTime(timer)}</div>
                  </div>
                </div>

                <Button 
                  onClick={saveInterview} 
                  disabled={busy} 
                  className="w-full bg-blue-600 hover:bg-blue-700 h-12 font-bold mt-2"
                >
                  {busy ? "Processing..." : "Proceed to Interview"}
                </Button>
              </div>
            </Card>
          )}
        </div>

        {/* Middle Column: Job Selection */}
        <div className="lg:col-span-4 space-y-4">
          <h3 className="text-lg font-bold text-slate-900 px-1 flex items-center gap-2">
            <span className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white text-sm">2</span>
            Select Job
          </h3>
          <div className="space-y-3 max-h-[600px] overflow-y-auto pr-2">
            {jobs.map((job) => (
              <div 
                key={job.id} 
                className={`p-4 rounded-2xl border transition-all cursor-pointer hover:shadow-md ${
                  selectedJob?.id === job.id 
                  ? 'bg-blue-50 border-blue-200 ring-1 ring-blue-200' 
                  : 'bg-white border-slate-200 hover:border-blue-300'
                }`}
                onClick={() => analyzeForJob(job)}
              >
                <h4 className="font-bold text-slate-900">{job.title}</h4>
                <p className="text-xs text-slate-500 mt-1 line-clamp-2">{job.description}</p>
                <div className="mt-4 flex items-center justify-between">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Available Now</span>
                  <div className="text-blue-600 text-xs font-bold flex items-center gap-1">
                    Analyze Match <ArrowRightIcon />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right Column: AI Insights */}
        <div className="lg:col-span-4 space-y-6">
          <h3 className="text-lg font-bold text-slate-900 px-1 flex items-center gap-2">
            <span className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white text-sm">3</span>
            AI Insights
          </h3>
          
          <Card className="border-none shadow-sm ring-1 ring-slate-200 min-h-[200px]">
            <CardHeader className="pb-2">
              <div className="text-sm font-bold text-slate-900">Skill Gap Analysis</div>
            </CardHeader>
            <CardBody>
              {match ? (
                <div className="space-y-4">
                  <div>
                    <Label className="text-[10px] uppercase tracking-widest text-slate-400 mb-2 block">Missing from Resume</Label>
                    <div className="flex flex-wrap gap-2">
                      {match.missing_skills?.length > 0 ? (
                        match.missing_skills.map((skill, i) => (
                          <span key={i} className="px-2.5 py-1 bg-rose-50 text-rose-700 text-xs font-bold rounded-lg border border-rose-100">
                            {skill}
                          </span>
                        ))
                      ) : (
                        <span className="text-xs text-emerald-600 font-bold italic">No gaps detected! Perfect match.</span>
                      )}
                    </div>
                  </div>
                  
                  <div className="pt-4 border-t border-slate-100">
                    <Label className="text-[10px] uppercase tracking-widest text-slate-400 mb-2 block">Optimization Suggestions</Label>
                    <div className="space-y-2">
                      {suggestions.map((s, i) => (
                        <div key={i} className="text-xs text-slate-600 bg-slate-50 p-3 rounded-xl border border-slate-100 leading-relaxed">
                          {s}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-10 text-center">
                  <div className="w-12 h-12 rounded-full bg-slate-50 flex items-center justify-center mb-3">
                    <svg className="w-6 h-6 text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <p className="text-xs text-slate-400 italic px-6">
                    Select a job from the list to see personalized AI improvement suggestions.
                  </p>
                </div>
              )}
            </CardBody>
          </Card>
        </div>
      </div>
    </div>
  );
}

export default ResumeAnalysis;
