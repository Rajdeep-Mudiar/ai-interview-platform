import axios from "axios";
import { useState } from "react";
import Button from "../components/ui/Button";
import { Card, CardBody, CardHeader } from "../components/ui/Card";
import { Label, Textarea } from "../components/ui/Form";

function JDMatcher() {
  const [resume, setResume] = useState("");
  const [jd, setJd] = useState("");
  const [result, setResult] = useState(null);
  const [busy, setBusy] = useState(false);

  const analyze = async () => {
    setBusy(true);
    try {
      const res = await axios.post("http://localhost:8000/match_jd", {
        resume: resume,
        jd: jd,
      });
      setResult(res.data);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="cb-container py-10 sm:py-14">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-slate-900 sm:text-3xl">
            JD vs CV matching
          </h1>
          <p className="mt-1 text-sm text-slate-600">
            Compare resume and job description to compute fit and skills gap.
          </p>
        </div>
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-12">
        <Card className="lg:col-span-7">
          <CardHeader className="pb-4">
            <div className="text-sm font-semibold text-slate-900">Inputs</div>
            <div className="text-sm text-slate-600">
              Paste both texts to analyze.
            </div>
          </CardHeader>
          <CardBody className="grid gap-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Resume</Label>
                <Textarea
                  placeholder="Paste resume…"
                  value={resume}
                  onChange={(e) => setResume(e.target.value)}
                  className="min-h-44"
                />
              </div>
              <div className="space-y-2">
                <Label>Job description</Label>
                <Textarea
                  placeholder="Paste job description…"
                  value={jd}
                  onChange={(e) => setJd(e.target.value)}
                  className="min-h-44"
                />
              </div>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <Button
                onClick={analyze}
                disabled={!resume.trim() || !jd.trim() || busy}
              >
                {busy ? "Analyzing..." : "Analyze"}
              </Button>
              <Button
                variant="secondary"
                onClick={() => {
                  setResume("");
                  setJd("");
                  setResult(null);
                }}
                disabled={busy}
              >
                Clear
              </Button>
            </div>
          </CardBody>
        </Card>

        <Card className="lg:col-span-5">
          <CardHeader className="pb-4">
            <div className="text-sm font-semibold text-slate-900">Results</div>
            <div className="text-sm text-slate-600">Fit and skill lists.</div>
          </CardHeader>
          <CardBody>
            {result ? (
              <div className="grid gap-4">
                <div className="rounded-xl bg-slate-50 p-4 ring-1 ring-slate-200">
                  <div className="text-xs font-medium text-slate-500">
                    Fit score
                  </div>
                  <div className="mt-1 text-2xl font-semibold text-slate-900">
                    {result.fit_score}%
                  </div>
                </div>
                <div className="rounded-xl bg-white p-4 ring-1 ring-slate-200">
                  <div className="text-xs font-medium text-slate-500">
                    Matched skills
                  </div>
                  <div className="mt-1 text-sm text-slate-700">
                    {result.matched_skills?.length
                      ? result.matched_skills.join(", ")
                      : "None detected."}
                  </div>
                </div>
                <div className="rounded-xl bg-white p-4 ring-1 ring-slate-200">
                  <div className="text-xs font-medium text-slate-500">
                    Missing skills
                  </div>
                  <div className="mt-1 text-sm text-slate-700">
                    {result.missing_skills?.length
                      ? result.missing_skills.join(", ")
                      : "None detected."}
                  </div>
                </div>
              </div>
            ) : (
              <div className="rounded-xl bg-slate-50 p-5 text-sm text-slate-600 ring-1 ring-slate-200">
                Run an analysis to view results.
              </div>
            )}
          </CardBody>
        </Card>
      </div>
    </div>
  );
}

export default JDMatcher;
