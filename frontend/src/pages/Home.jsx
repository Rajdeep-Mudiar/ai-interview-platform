import React from "react";
import { motion } from "framer-motion";
import Button from "../components/ui/Button";
import { Card, CardBody } from "../components/ui/Card";
import { getUserSession } from "../utils/auth";

function Home() {
  const session = getUserSession();
  const isRecruiter = session?.role === "recruiter";

  return (
    <div className="cb-container py-10 sm:py-14">
      <div className="grid gap-10 lg:grid-cols-12 lg:items-center">
        <div className="lg:col-span-7">
          <motion.h1
            initial={{ opacity: 0, y: -18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-balance text-3xl font-semibold tracking-tight text-slate-900 sm:text-4xl lg:text-5xl"
          >
            Professional, integrity-aware hiring—powered by AI.
          </motion.h1>
          <p className="mt-4 max-w-2xl text-pretty text-base text-slate-600 sm:text-lg">
            Screen resumes faster, generate role-aligned interview questions,
            evaluate answers consistently, and surface integrity signals for
            confident decisions.
          </p>

          <div className="mt-7 flex flex-col gap-3 sm:flex-row sm:items-center">
            <Button as="a" href="/interview-flow" size="lg">
              Start interview pipeline
            </Button>
            {isRecruiter && (
              <Button as="a" href="/recruiter-dashboard" variant="secondary" size="lg">
                Open recruiter dashboard
              </Button>
            )}
          </div>

          <div className="mt-6 flex flex-wrap gap-2 text-xs text-slate-500">
            <span className="rounded-full bg-white px-3 py-1 ring-1 ring-slate-200">
              FastAPI backend
            </span>
            <span className="rounded-full bg-white px-3 py-1 ring-1 ring-slate-200">
              React + Vite frontend
            </span>
            <span className="rounded-full bg-white px-3 py-1 ring-1 ring-slate-200">
              Tailwind responsive UI
            </span>
          </div>
        </div>

        <div className="lg:col-span-5">
          <Card className="overflow-hidden">
            <CardBody className="space-y-5">
              <div className="space-y-1">
                <div className="text-sm font-semibold text-slate-900">
                  What you can do
                </div>
                <div className="text-sm text-slate-600">
                  End-to-end workflow with clean reporting.
                </div>
              </div>

              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1">
                {[
                  {
                    title: "Resume + JD Matching",
                    desc: "Extract skills, measure fit, and identify gaps.",
                  },
                  {
                    title: "AI Interview Questions",
                    desc: "Generate role-aligned questions from missing skills.",
                  },
                  {
                    title: "Answer Evaluation",
                    desc: "Score consistently with concise feedback.",
                  },
                  {
                    title: "Integrity Signals",
                    desc: "Track behavior/emotion and surface risk indicators.",
                  },
                ].map((item) => (
                  <div
                    key={item.title}
                    className="rounded-xl bg-slate-50 p-4 ring-1 ring-slate-200"
                  >
                    <div className="text-sm font-semibold text-slate-900">
                      {item.title}
                    </div>
                    <div className="mt-1 text-sm text-slate-600">
                      {item.desc}
                    </div>
                  </div>
                ))}
              </div>
            </CardBody>
          </Card>
        </div>
      </div>
    </div>
  );
}

export default Home;
