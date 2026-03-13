import { useState } from "react";
import axiosClient from "../utils/axiosClient";
import Button from "../components/ui/Button";
import { Card, CardBody, CardHeader } from "../components/ui/Card";
import { Input, Label, Textarea } from "../components/ui/Form";

function JDMatcher() {
  const [resumeFile, setResumeFile] = useState(null);
  const [resumeText, setResumeText] = useState("");
  const [jd, setJd] = useState("");
  const [result, setResult] = useState(null);
  const [busy, setBusy] = useState(false);
  const [parsing, setParsing] = useState(false);

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setResumeFile(file);
    
    setParsing(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await axiosClient.post("/parse_resume", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });
      setResumeText(res.data.text);
    } catch (err) {
      console.error("Failed to parse resume:", err);
      alert("Failed to parse resume. Please try again.");
    } finally {
      setParsing(false);
    }
  };

  const analyze = async () => {
    setBusy(true);
    try {
      const res = await axiosClient.post("/match_jd", {
        resume: resumeText,
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
            Upload a resume and paste a job description to compute fit and skills gap.
          </p>
        </div>
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-12">
        <Card className="lg:col-span-7">
          <CardHeader className="pb-4">
            <div className="text-sm font-semibold text-slate-900">Inputs</div>
            <div className="text-sm text-slate-600">
              Provide the resume file and job description.
            </div>
          </CardHeader>
          <CardBody className="grid gap-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Resume (PDF)</Label>
                <div className="flex flex-col gap-2">
                  <Input type="file" accept=".pdf" onChange={handleFileChange} />
                  {parsing && <span className="text-xs text-blue-600 animate-pulse">Parsing resume...</span>}
                  {resumeText && !parsing && <span className="text-xs text-emerald-600 font-medium">✓ Resume parsed successfully</span>}
                </div>
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
                disabled={!resumeText.trim() || !jd.trim() || busy || parsing}
                className="bg-blue-600 hover:bg-blue-700"
              >
                {busy ? "Analyzing..." : "Analyze"}
              </Button>
              <Button
                variant="secondary"
                onClick={() => {
                  setResumeFile(null);
                  setResumeText("");
                  setJd("");
                  setResult(null);
                }}
                disabled={busy}
              >
                Clear
              </Button>
            </div>
          </CardBody>
          {resumeText && (
            <CardBody className="border-t border-slate-100 pt-4">
              <Label className="text-xs text-slate-500 uppercase tracking-wider">Parsed Resume Text Preview</Label>
              <div className="mt-2 max-h-40 overflow-y-auto text-xs text-slate-600 bg-slate-50 p-3 rounded-lg border border-slate-200 whitespace-pre-wrap">
                {resumeText}
              </div>
            </CardBody>
          )}
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
                
                <div className="space-y-4">
                  <div>
                    <div className="text-xs font-medium text-slate-500 mb-2 uppercase tracking-wider">Matched Skills</div>
                    <div className="flex flex-wrap gap-2">
                      {result.matched_skills?.length > 0 ? (
                        result.matched_skills.map((s, i) => (
                          <span key={i} className="px-2 py-1 rounded-md bg-emerald-50 text-emerald-700 text-xs font-medium border border-emerald-100">
                            {s}
                          </span>
                        ))
                      ) : (
                        <span className="text-xs text-slate-400 italic">No matches detected.</span>
                      )}
                    </div>
                  </div>

                  <div>
                    <div className="text-xs font-medium text-slate-500 mb-2 uppercase tracking-wider">Missing Skills</div>
                    <div className="flex flex-wrap gap-2">
                      {result.missing_skills?.length > 0 ? (
                        result.missing_skills.map((s, i) => (
                          <span key={i} className="px-2 py-1 rounded-md bg-rose-50 text-rose-700 text-xs font-medium border border-rose-100">
                            {s}
                          </span>
                        ))
                      ) : (
                        <span className="text-xs text-emerald-600 font-medium">✓ Perfect match! No missing skills.</span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="rounded-xl bg-slate-50 p-5 text-sm text-slate-600 ring-1 ring-slate-200 text-center">
                <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center mx-auto mb-3 shadow-sm">
                  <svg className="w-6 h-6 text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                </div>
                Provide inputs to see the comparison results.
              </div>
            )}
          </CardBody>
        </Card>
      </div>
    </div>
  );
}

export default JDMatcher;
