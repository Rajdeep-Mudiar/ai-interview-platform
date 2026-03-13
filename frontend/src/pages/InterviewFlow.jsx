import { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import axiosClient from "../utils/axiosClient";
import { getUserSession } from "../utils/auth";
import Button from "../components/ui/Button";
import { Card, CardBody, CardHeader } from "../components/ui/Card";
import { Input, Label, Textarea } from "../components/ui/Form";

function InterviewFlow() {
  const location = useLocation();
  const [resumeFile, setResumeFile] = useState(null);
  const [resumeText, setResumeText] = useState("");
  const [jd, setJd] = useState("");

  useEffect(() => {
    if (location.state) {
      setJd(location.state.jd || "");
    }
  }, [location.state]);

  const [match, setMatch] = useState(null);
  const [suggestions, setSuggestions] = useState([]);
  const [busy, setBusy] = useState(false);
  const [parsing, setParsing] = useState(false);

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setResumeFile(file);
    
    // Auto-parse on file selection
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

  const analyzeResume = async () => {
    setBusy(true);
    try {
      const res = await axiosClient.post("/match_jd", {
        resume: resumeText,
        jd: jd,
      });
      setMatch(res.data);
      
      // Auto-get suggestions after analysis
      const suggRes = await axiosClient.post("/resume_suggestions", {
        missing_skills: res.data.missing_skills,
        resume: resumeText,
      });
      setSuggestions(suggRes.data.suggestions);
    } finally {
      setBusy(false);
    }
  };

  const saveInterview = async () => {
    if (!match || !suggestions.length) return;
    const session = getUserSession();
    if (!session) return;

    setBusy(true);
    try {
      await axiosClient.post("/interview", {
        user_id: session.id,
        name: session.name,
        resume: resumeText,
        jd: jd,
        fit_score: match.fit_score,
        overallScore: match.fit_score, 
        timeTaken: Math.floor(Math.random() * 15) + 15, 
        integrity: 100, 
        missing_skills: match.missing_skills,
        questions: [], // No questions required
        suggestions: suggestions,
      });
      alert("Interview results saved to database!");
    } catch (err) {
      console.error("Failed to save interview:", err);
      alert("Failed to save interview results.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="cb-container py-10 sm:py-14">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-slate-900 sm:text-3xl">
            AI interview pipeline
          </h1>
          <p className="mt-1 text-sm text-slate-600">
            Upload a resume and paste a job description to get instant feedback and improvements.
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
                onClick={analyzeResume}
                disabled={!resumeText.trim() || !jd.trim() || busy || parsing}
                className="bg-blue-600 hover:bg-blue-700"
              >
                {busy ? "Analyzing..." : "Analyze & Get Suggestions"}
              </Button>
              <Button
                onClick={saveInterview}
                variant="secondary"
                disabled={!match || !suggestions.length || busy}
              >
                Save results
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

        <div className="grid gap-6 lg:col-span-5">
          <Card>
            <CardHeader className="pb-4">
              <div className="text-sm font-semibold text-slate-900">Analysis Results</div>
              <div className="text-sm text-slate-600">Match score and skill gaps.</div>
            </CardHeader>
            <CardBody>
              {match ? (
                <div className="grid gap-3">
                  <div className="rounded-xl bg-slate-50 p-4 ring-1 ring-slate-200">
                    <div className="text-xs font-medium text-slate-500">
                      Fit score
                    </div>
                    <div className="mt-1 text-2xl font-semibold text-slate-900">
                      {match.fit_score}%
                    </div>
                  </div>
                  <div className="rounded-xl bg-white p-4 ring-1 ring-slate-200">
                    <div className="text-xs font-medium text-slate-500">
                      Missing skills
                    </div>
                    <div className="mt-1 text-sm text-slate-700">
                      {match.missing_skills?.length
                        ? match.missing_skills.join(", ")
                        : "None detected."}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="rounded-xl bg-slate-50 p-5 text-sm text-slate-600 ring-1 ring-slate-200">
                  Upload a resume and provide a JD to see analysis.
                </div>
              )}
            </CardBody>
          </Card>

          <Card>
            <CardHeader className="pb-4">
              <div className="text-sm font-semibold text-slate-900">
                AI Suggestions
              </div>
              <div className="text-sm text-slate-600">
                How to improve the resume for this role.
              </div>
            </CardHeader>
            <CardBody className="grid gap-4">
              <div className="space-y-2">
                {suggestions?.length ? (
                  <ul className="grid gap-2 text-sm text-slate-700">
                    {suggestions.map((s, i) => (
                      <li
                        key={i}
                        className="rounded-xl bg-white p-3 ring-1 ring-slate-200 flex gap-2"
                      >
                        <span className="text-blue-600 font-bold">•</span>
                        {s}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <div className="rounded-xl bg-slate-50 p-4 text-sm text-slate-600 ring-1 ring-slate-200">
                    Run analysis to see suggestions.
                  </div>
                )}
              </div>
            </CardBody>
          </Card>
        </div>
      </div>
    </div>
  );
}

export default InterviewFlow;
