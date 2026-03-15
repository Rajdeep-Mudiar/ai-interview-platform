import { useEffect, useState } from "react";
import axios from "axios";
import Button from "../components/ui/Button";
import { Card, CardBody, CardHeader } from "../components/ui/Card";
import { getUserSession } from "../utils/auth";

const API_BASE = "http://127.0.0.1:8000";

export default function MyJobs() {
  const session = getUserSession();
  const recruiterName = session?.name || "Recruiter";

  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const [jobTitle, setJobTitle] = useState("");
  const [jobDescription, setJobDescription] = useState("");
  const [jobQuestions, setJobQuestions] = useState("");

  useEffect(() => {
    async function loadJobs() {
      if (!session?.id) {
        setLoading(false);
        return;
      }
      try {
        const res = await axios.get(`${API_BASE}/jobs`, {
          params: { recruiter_id: session.id },
        });
        setJobs(res.data);
      } catch (err) {
        // eslint-disable-next-line no-console
        console.error("Failed to load jobs:", err);
        setError("Unable to load your jobs. Please try again.");
      } finally {
        setLoading(false);
      }
    }
    loadJobs();
  }, [session]);

  async function handleCreateJob(e) {
    e.preventDefault();
    if (!session?.id) return;
    if (!jobTitle.trim() || !jobDescription.trim()) {
      setError("Please provide a job title and description.");
      return;
    }

    const questions = jobQuestions
      .split("\n")
      .map((q) => q.trim())
      .filter(Boolean);

    setBusy(true);
    setError("");
    try {
      const res = await axios.post(`${API_BASE}/jobs/`, {
        recruiter_id: session.id,
        title: jobTitle,
        description: jobDescription,
        questions,
      });
      setJobs((prev) => [res.data, ...prev]);
      setJobTitle("");
      setJobDescription("");
      setJobQuestions("");
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error("Job creation failed:", err);
      setError("Unable to create job. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  if (!session) {
    return null;
  }

  return (
    <div className="cb-container py-10 sm:py-14">
      <div className="space-y-2">
        <h1 className="text-2xl font-semibold tracking-tight text-slate-900 sm:text-3xl">
          {recruiterName}'s jobs
        </h1>
        <p className="text-sm text-slate-600">
          Create and manage the jobs you publish. Candidates will see these in
          the Jobs page.
        </p>
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-12">
        <Card className="lg:col-span-5">
          <CardHeader className="pb-4">
            <div className="text-sm font-semibold text-slate-900">
              Create a new job
            </div>
            <div className="text-sm text-slate-600">
              Fill in the details and interview questions. Saved jobs appear
              below and on the candidate Jobs page.
            </div>
          </CardHeader>
          <CardBody className="grid gap-4">
            <form className="grid gap-3" onSubmit={handleCreateJob}>
              <div className="space-y-1">
                <div className="text-xs font-medium text-slate-500">
                  Job title
                </div>
                <input
                  className="cb-input"
                  value={jobTitle}
                  onChange={(e) => setJobTitle(e.target.value)}
                  placeholder="e.g. Senior React Engineer"
                />
              </div>

              <div className="space-y-1">
                <div className="text-xs font-medium text-slate-500">
                  Job description
                </div>
                <textarea
                  className="cb-textarea min-h-28"
                  value={jobDescription}
                  onChange={(e) => setJobDescription(e.target.value)}
                  placeholder="Short description of the role…"
                />
              </div>

              <div className="space-y-1">
                <div className="text-xs font-medium text-slate-500">
                  Interview questions (one per line)
                </div>
                <textarea
                  className="cb-textarea min-h-28"
                  value={jobQuestions}
                  onChange={(e) => setJobQuestions(e.target.value)}
                  placeholder={
                    "What experience do you have with React?\nHow do you structure a scalable frontend?"
                  }
                />
              </div>

              {error && (
                <p className="text-sm text-rose-600">
                  {error}
                </p>
              )}

              <Button type="submit" disabled={busy}>
                {busy ? "Saving…" : "Create job"}
              </Button>
            </form>
          </CardBody>
        </Card>

        <Card className="lg:col-span-7">
          <CardHeader className="pb-4">
            <div className="text-sm font-semibold text-slate-900">
              Your jobs
            </div>
            <div className="text-sm text-slate-600">
              These jobs are visible to candidates on the Jobs page.
            </div>
          </CardHeader>
          <CardBody>
            {loading ? (
              <div className="rounded-xl bg-slate-50 p-5 text-sm text-slate-600 ring-1 ring-slate-200">
                Loading your jobs…
              </div>
            ) : jobs.length === 0 ? (
              <div className="rounded-xl bg-slate-50 p-5 text-sm text-slate-600 ring-1 ring-slate-200">
                You haven&apos;t created any jobs yet.
              </div>
            ) : (
              <ul className="grid gap-3 text-sm text-slate-700">
                {jobs.map((job) => (
                  <li
                    key={job.id}
                    className="rounded-xl bg-white p-4 ring-1 ring-slate-200"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <div className="font-semibold text-slate-900">
                          {job.title}
                        </div>
                        <p className="mt-1 text-xs text-slate-600 line-clamp-3">
                          {job.description}
                        </p>
                      </div>
                      <div className="text-xs text-slate-500">
                        Questions: {job.questions?.length ?? 0}
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </CardBody>
        </Card>
      </div>
    </div>
  );
}

