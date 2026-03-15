import React from "react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import Button from "../components/ui/Button";
import { Card, CardBody } from "../components/ui/Card";
import { getUserSession } from "../utils/auth";

function Home() {
  const session = getUserSession();
  const isRecruiter = session?.role === "recruiter";

  const TargetIcon = ({ className = "w-6 h-6" }) => (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  );

  const RocketIcon = ({ className = "w-6 h-6" }) => (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
    </svg>
  );

  const SparklesIcon = ({ className = "w-6 h-6" }) => (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
    </svg>
  );

  const ShieldIcon = ({ className = "w-6 h-6" }) => (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
    </svg>
  );

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.15
      }
    }
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: { duration: 0.5, ease: "easeOut" }
    }
  };

  return (
    <div className="cb-container py-16 sm:py-24 relative overflow-hidden">
      {/* Background decorative elements */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full -z-10 opacity-30 pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-400 rounded-full blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-indigo-400 rounded-full blur-[120px]" />
      </div>

      <motion.div 
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="grid gap-12 lg:grid-cols-12 lg:items-center"
      >
        <div className="lg:col-span-7">
          <motion.div variants={itemVariants}>
            <span className="inline-flex items-center rounded-full bg-blue-50 px-3 py-1 text-xs font-bold text-blue-700 ring-1 ring-inset ring-blue-700/10 mb-6 gap-1.5">
              <SparklesIcon className="w-3.5 h-3.5" /> Next-Gen AI Hiring Platform
            </span>
            <h1 className="text-balance text-4xl font-extrabold tracking-tight text-slate-900 sm:text-5xl lg:text-6xl leading-[1.1]">
              Hire with <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600">Precision</span> and <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-purple-600">Integrity</span>.
            </h1>
          </motion.div>
          
          <motion.p variants={itemVariants} className="mt-6 max-w-2xl text-pretty text-lg text-slate-600 sm:text-xl leading-relaxed">
            Revolutionize your recruitment workflow. Our AI analyzes resumes, identifies critical skill gaps, and evaluates candidates with behavior-aware insights for confident hiring decisions.
          </motion.p>

          <motion.div variants={itemVariants} className="mt-10 flex flex-col gap-4 sm:flex-row sm:items-center">
            {isRecruiter ? (
              <>
                <Button as={Link} to="/recruiter-dashboard" size="lg" className="h-14 px-8 text-lg shadow-lg shadow-blue-500/20">
                  Recruiter Dashboard
                </Button>
                <Button as={Link} to="/candidates" variant="secondary" size="lg" className="h-14 px-8 text-lg">
                  Candidate Analytics
                </Button>
              </>
            ) : (
              <>
                <Button as={Link} to="/resume-analysis" size="lg" className="h-14 px-8 text-lg shadow-lg shadow-blue-500/20">
                  Start Resume Analysis
                </Button>
                <Button as={Link} to="/dashboard" variant="secondary" size="lg" className="h-14 px-8 text-lg">
                  Candidate Dashboard
                </Button>
              </>
            )}
          </motion.div>

          <motion.div variants={itemVariants} className="mt-10 flex flex-wrap gap-3 text-sm text-slate-500 font-medium">
            <div className="flex items-center gap-2 bg-white/80 backdrop-blur-sm px-4 py-2 rounded-2xl ring-1 ring-slate-200 shadow-sm">
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              FastAPI backend
            </div>
            <div className="flex items-center gap-2 bg-white/80 backdrop-blur-sm px-4 py-2 rounded-2xl ring-1 ring-slate-200 shadow-sm">
              <span className="w-2 h-2 rounded-full bg-blue-500" />
              React + Tailwind
            </div>
            <div className="flex items-center gap-2 bg-white/80 backdrop-blur-sm px-4 py-2 rounded-2xl ring-1 ring-slate-200 shadow-sm">
              <span className="w-2 h-2 rounded-full bg-purple-500" />
              AI Matching
            </div>
          </motion.div>
        </div>

        <motion.div variants={itemVariants} className="lg:col-span-5 relative">
          {/* Floating card effect */}
          <div className="absolute -inset-4 bg-gradient-to-tr from-blue-500 to-indigo-600 rounded-[2.5rem] opacity-10 blur-2xl -z-10" />
          
          <Card className="overflow-hidden border-none shadow-2xl rounded-[2rem] bg-white/90 backdrop-blur-md ring-1 ring-slate-200/50">
            <CardBody className="p-8 space-y-6">
              <div className="space-y-2">
                <div className="text-xs font-bold text-blue-600 uppercase tracking-widest">Capabilities</div>
                <h3 className="text-2xl font-bold text-slate-900">
                  Intelligent Workflow
                </h3>
                <p className="text-sm text-slate-500">
                  End-to-end automation from screening to final report.
                </p>
              </div>

              <div className="grid gap-4">
                {[
                  {
                    title: "Resume Matching",
                    desc: "TF-IDF & Semantic matching for high accuracy.",
                    icon: <TargetIcon />,
                    color: "bg-blue-50 text-blue-600"
                  },
                  {
                    title: "Skill Gap Insights",
                    desc: "Automatically identify and bridge technical gaps.",
                    icon: <RocketIcon />,
                    color: "bg-indigo-50 text-indigo-600"
                  },
                  {
                    title: "AI Optimization",
                    desc: "Built-in tools to improve resume scoring.",
                    icon: <SparklesIcon />,
                    color: "bg-purple-50 text-purple-600"
                  },
                  {
                    title: "Integrity Signals",
                    desc: "Emotion and behavior analysis during interviews.",
                    icon: <ShieldIcon />,
                    color: "bg-emerald-50 text-emerald-600"
                  },
                ].map((item) => (
                  <div
                    key={item.title}
                    className="group flex gap-4 p-4 rounded-2xl bg-slate-50/50 hover:bg-white transition-all hover:shadow-md hover:ring-1 hover:ring-slate-200"
                  >
                    <div className={`w-12 h-12 shrink-0 rounded-xl ${item.color} flex items-center justify-center shadow-sm`}>
                      {item.icon}
                    </div>
                    <div>
                      <div className="text-sm font-bold text-slate-900 group-hover:text-blue-600 transition-colors">
                        {item.title}
                      </div>
                      <div className="mt-1 text-xs text-slate-500 leading-relaxed">
                        {item.desc}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardBody>
          </Card>
        </motion.div>
      </motion.div>
    </div>
  );
}

export default Home;

