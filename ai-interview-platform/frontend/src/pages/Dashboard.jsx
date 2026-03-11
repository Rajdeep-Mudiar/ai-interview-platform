import { useEffect, useState } from "react";
import axios from "axios";
import jsPDF from "jspdf";
import Button from "../components/ui/Button";
import { Card, CardBody, CardHeader } from "../components/ui/Card";
import { getUserSession } from "../utils/auth";

function Dashboard() {
  const [result, setResult] = useState(null);
  const [explanation, setExplanation] = useState([]);
  const [busy, setBusy] = useState(false);
  const session = getUserSession();
  const displayName = session?.name || "Candidate";

  useEffect(() => {
    if (!session) {
      window.location.href = "/login";
    }
  }, [session]);

  const generateReport = async () => {
    setBusy(true);
    try {
      const res = await axios.post("http://localhost:8000/final_score", {
        resume_score: 82,
        interview_score: 7.8,
        cheating_flags: 0,
      });
      setResult(res.data);
    } finally {
      setBusy(false);
    }
  };

  const generatePDF = () => {
    const doc = new jsPDF();
    doc.setFontSize(18);
    doc.text("AI Interview Evaluation Report", 20, 20);
    doc.setFontSize(12);
    doc.text("Candidate Name: John Doe", 20, 40);
    doc.text("Position: AI Engineer", 20, 50);
    doc.text("Resume Match Score: 82%", 20, 70);
    doc.text("Interview Score: 7.8 / 10", 20, 80);
    doc.text("Skill Coverage: 75%", 20, 90);
    doc.text("Cheating Risk: Low", 20, 100);
    doc.text("Final Recommendation: Strong Hire", 20, 120);
    doc.save("candidate_report.pdf");
  };

  const getExplanation = async () => {
    setBusy(true);
    try {
      const res = await axios.post("http://localhost:8000/explain_decision", {
        resume_score: 82,
        interview_score: 7.8,
        missing_skills: ["AWS"],
        cheating_risk: "Low",
      });
      setExplanation(res.data.explanation);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="cb-container py-10 sm:py-14">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-slate-900 sm:text-3xl">
            {displayName}'s dashboard
          </h1>
          <p className="mt-1 text-sm text-slate-600">
            Generate a final score, download a PDF, and request an explanation.
          </p>
        </div>
        <div className="text-xs text-slate-500">
          Demo values are currently hard-coded.
        </div>
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-12">
        <Card className="lg:col-span-5">
          <CardHeader className="pb-4">
            <div className="text-sm font-semibold text-slate-900">Actions</div>
            <div className="text-sm text-slate-600">
              Run scoring and generate artifacts.
            </div>
          </CardHeader>
          <CardBody className="grid gap-3">
            <Button onClick={generateReport} disabled={busy}>
              {busy ? "Working..." : "Generate final report"}
            </Button>
            <Button onClick={generatePDF} variant="secondary">
              Download interview PDF
            </Button>
            <Button onClick={getExplanation} variant="secondary" disabled={busy}>
              Explain AI decision
            </Button>
          </CardBody>
        </Card>

        <div className="grid gap-6 lg:col-span-7">
          <Card>
            <CardHeader className="pb-4">
              <div className="text-sm font-semibold text-slate-900">Summary</div>
              <div className="text-sm text-slate-600">
                Recommendation and final score.
              </div>
            </CardHeader>
            <CardBody>
              {result ? (
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="rounded-xl bg-slate-50 p-4 ring-1 ring-slate-200">
                    <div className="text-xs font-medium text-slate-500">
                      Final score
                    </div>
                    <div className="mt-1 text-2xl font-semibold text-slate-900">
                      {result.final_score}
                    </div>
                  </div>
                  <div className="rounded-xl bg-slate-50 p-4 ring-1 ring-slate-200">
                    <div className="text-xs font-medium text-slate-500">
                      Recommendation
                    </div>
                    <div className="mt-1 text-2xl font-semibold text-slate-900">
                      {result.recommendation}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="rounded-xl bg-slate-50 p-5 text-sm text-slate-600 ring-1 ring-slate-200">
                  Run “Generate final report” to see results here.
                </div>
              )}
            </CardBody>
          </Card>

          <Card>
            <CardHeader className="pb-4">
              <div className="text-sm font-semibold text-slate-900">
                Explanation
              </div>
              <div className="text-sm text-slate-600">
                Reasons behind the decision.
              </div>
            </CardHeader>
            <CardBody>
              {explanation?.length ? (
                <ul className="grid gap-2 text-sm text-slate-700">
                  {explanation.map((reason, i) => (
                    <li
                      key={i}
                      className="rounded-xl bg-white p-3 ring-1 ring-slate-200"
                    >
                      {reason}
                    </li>
                  ))}
                </ul>
              ) : (
                <div className="rounded-xl bg-slate-50 p-5 text-sm text-slate-600 ring-1 ring-slate-200">
                  Request an explanation to populate this section.
                </div>
              )}
            </CardBody>
          </Card>
        </div>
      </div>
    </div>
  );
}

export default Dashboard;
