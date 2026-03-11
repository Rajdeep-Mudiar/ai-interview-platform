import { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import axios from "axios";
import { getUserSession } from "../utils/auth";
import Button from "../components/ui/Button";
import { Card, CardBody, CardHeader } from "../components/ui/Card";
import { Label, Textarea } from "../components/ui/Form";

const API_BASE = "http://localhost:8000";

function InterviewFlow() {
  const location = useLocation();
  const [resume, setResume] = useState("");
  const [jd, setJd] = useState("");

  useEffect(() => {
    if (location.state) {
      setResume(location.state.resume || "");
      setJd(location.state.jd || "");
    }
  }, [location.state]);
  const [match, setMatch] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [suggestions, setSuggestions] = useState([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const analyzeResume = async () => {
    setBusy(true);
    setError("");
    try {
      const res = await axios.post(`${API_BASE}/match_jd`, {
        resume: resume,
        jd: jd,
      });
      setMatch(res.data);
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error("Match analysis failed:", err);
      setError(
        "Unable to analyze resume and job description. Please try again.",
      );
    } finally {
      setBusy(false);
    }
  };

  const generateQuestions = async () => {
    if (!match) return;
    setBusy(true);
    setError("");
    try {
      // Primary: use AI-powered question generator.
      const res = await axios.post(`${API_BASE}/generate_ai_questions`, {
        resume: resume,
        jd: jd,
        missing_skills: match.missing_skills,
      });
      setQuestions(res.data.questions || []);
    } catch (err) {
      // If AI questions fail (e.g. missing model), fall back to simpler generator.
      // eslint-disable-next-line no-console
      console.error("AI question generation failed, falling back:", err);
      try {
        const fallback = await axios.post(
          `${API_BASE}/generate-questions`,
          {
            skills: match.missing_skills?.length
              ? match.missing_skills
              : match.matched_skills || [],
          },
        );
        setQuestions(fallback.data.questions || []);
      } catch (fallbackErr) {
        // eslint-disable-next-line no-console
        console.error("Fallback question generation failed:", fallbackErr);
        setError(
          "Unable to generate interview questions right now. Please try again.",
        );
      }
    } finally {
      setBusy(false);
    }
  };

  const getSuggestions = async () => {
    if (!match) return;
    setBusy(true);
    setError("");
    try {
      const res = await axios.post(`${API_BASE}/resume_suggestions`, {
        missing_skills: match.missing_skills,
        resume: resume,
      });
      setSuggestions(res.data.suggestions || []);
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error("Resume suggestion generation failed:", err);
      setError(
        "Unable to generate resume suggestions right now. Please try again.",
      );
    } finally {
      setBusy(false);
    }
  };

  const saveInterview = async () => {
    if (!match || !questions.length || !suggestions.length) return;
    const session = getUserSession();
    if (!session) return;

    setBusy(true);
    try {
      await axios.post("http://localhost:8000/interview", {
        user_id: session.id,
        name: session.name,
        resume: resume,
        jd: jd,
        fit_score: match.fit_score,
        overallScore: match.fit_score, // Using fit_score as demo overallScore for now
        timeTaken: Math.floor(Math.random() * 15) + 15, // random demo time
        integrity: 100, // demo integrity
        missing_skills: match.missing_skills,
        questions: questions,
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
            Paste a resume and job description to generate questions and
            improvements.
          </p>
        </div>
        {error && (
          <div className="rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700 ring-1 ring-rose-200">
            {error}
          </div>
        )}
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-12">
        <Card className="lg:col-span-7">
          <CardHeader className="pb-4">
            <div className="text-sm font-semibold text-slate-900">Inputs</div>
            <div className="text-sm text-slate-600">
              Provide the resume text and job description.
            </div>
          </CardHeader>
          <CardBody className="grid gap-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Resume</Label>
                <Textarea
                  placeholder="Paste resume text…"
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
                onClick={analyzeResume}
                disabled={!resume.trim() || !jd.trim() || busy}
              >
                {busy ? "Analyzing..." : "Analyze resume"}
              </Button>
              <Button
                onClick={generateQuestions}
                variant="secondary"
                disabled={!match || busy}
              >
                Generate interview questions
              </Button>
              <Button
                onClick={getSuggestions}
                variant="secondary"
                disabled={!match || busy}
              >
                Get resume suggestions
              </Button>
              <Button
                onClick={saveInterview}
                variant="secondary"
                disabled={!match || !questions.length || !suggestions.length || busy}
              >
                Save interview
              </Button>
            </div>
          </CardBody>
        </Card>

        <div className="grid gap-6 lg:col-span-5">
          <Card>
            <CardHeader className="pb-4">
              <div className="text-sm font-semibold text-slate-900">Match</div>
              <div className="text-sm text-slate-600">Fit score and gaps.</div>
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
                  Analyze the inputs to see the match results.
                </div>
              )}
            </CardBody>
          </Card>

          <Card>
            <CardHeader className="pb-4">
              <div className="text-sm font-semibold text-slate-900">
                Outputs
              </div>
              <div className="text-sm text-slate-600">
                Suggestions and generated questions.
              </div>
            </CardHeader>
            <CardBody className="grid gap-4">
              <div className="space-y-2">
                <div className="text-xs font-medium text-slate-500">
                  Resume suggestions
                </div>
                {suggestions?.length ? (
                  <ul className="grid gap-2 text-sm text-slate-700">
                    {suggestions.map((s, i) => (
                      <li
                        key={i}
                        className="rounded-xl bg-white p-3 ring-1 ring-slate-200"
                      >
                        {s}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <div className="rounded-xl bg-slate-50 p-4 text-sm text-slate-600 ring-1 ring-slate-200">
                    No suggestions yet.
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <div className="text-xs font-medium text-slate-500">
                  Interview questions
                </div>
                {questions?.length ? (
                  <ol className="grid gap-2 text-sm text-slate-700">
                    {questions.map((q, i) => (
                      <li
                        key={i}
                        className="rounded-xl bg-white p-3 ring-1 ring-slate-200"
                      >
                        <span className="font-medium text-slate-900">
                          Q{i + 1}.
                        </span>{" "}
                        {q}
                      </li>
                    ))}
                  </ol>
                ) : (
                  <div className="rounded-xl bg-slate-50 p-4 text-sm text-slate-600 ring-1 ring-slate-200">
                    No questions generated yet.
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
