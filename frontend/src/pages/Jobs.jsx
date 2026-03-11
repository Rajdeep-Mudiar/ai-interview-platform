import { useEffect, useState } from "react";
import axios from "axios";
import Button from "../components/ui/Button";

const API_BASE = "http://127.0.0.1:8000";

export default function Jobs() {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadJobs() {
      try {
        const res = await axios.get(`${API_BASE}/jobs`);
        setJobs(res.data);
      } finally {
        setLoading(false);
      }
    }
    loadJobs();
  }, []);

  if (loading) {
    return (
      <div className="cb-container py-10 sm:py-14">
        <p className="text-sm text-slate-600">Loading jobs…</p>
      </div>
    );
  }

  return (
    <div className="cb-container py-10 sm:py-14">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-slate-900 sm:text-3xl">
          Available jobs
        </h1>
        <p className="mt-1 text-sm text-slate-600">
          Choose a job to start the AI interview and resume analysis.
        </p>
      </div>

      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {jobs.length === 0 && (
          <p className="text-sm text-slate-600">
            No jobs have been published yet.
          </p>
        )}
        {jobs.map((job) => (
          <div
            key={job.id}
            className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200 flex flex-col gap-3"
          >
            <div>
              <div className="text-sm font-semibold text-slate-900">
                {job.title}
              </div>
              <p className="mt-1 text-sm text-slate-600 line-clamp-3">
                {job.description}
              </p>
            </div>

            <div className="mt-auto space-y-1 text-xs text-slate-500">
              <div>Questions: {job.questions?.length ?? 0}</div>
            </div>

            <Button
              as="a"
              href={`/resume-analysis?jobId=${job.id}`}
              size="sm"
            >
              Start interview
            </Button>
          </div>
        ))}
      </div>
    </div>
  );
}

