import { useState } from "react";
import axios from "axios";
import Proctoring from "../components/Proctoring";
import Button from "../components/ui/Button";
import { Card, CardBody, CardHeader } from "../components/ui/Card";

function VoiceInterview() {
  const questions = [
    "Explain how Docker works",
    "What is AWS EC2",
    "What is gradient descent",
    "How do you optimize SQL queries",
    "What are Python decorators",
  ];

  const [current, setCurrent] = useState(0);
  const [answer, setAnswer] = useState("");

  const speakQuestion = () => {
    const speech = new SpeechSynthesisUtterance(questions[current]);

    speech.lang = "en-US";

    window.speechSynthesis.speak(speech);
  };

  const startListening = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert("Speech recognition not supported in this browser.");
      return;
    }
    const recognition = new SpeechRecognition();
    recognition.lang = "en-US";
    recognition.start();

    recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript;
      setAnswer(transcript);
    };
  };

  const nextQuestion = () => {
    setCurrent(current + 1);

    setAnswer("");
  };

  const evaluateAnswer = async () => {
    const res = await axios.post("http://localhost:8000/evaluate_answer", {
      answer: answer,
      question: questions[current],
    });
    alert("Score: " + res.data.score + "\nFeedback: " + res.data.feedback);
  };

  return (
    <div className="cb-container py-10 sm:py-14">
      <div className="grid gap-6 lg:grid-cols-12">
        <div className="lg:col-span-7">
          <div className="space-y-2">
            <h1 className="text-2xl font-semibold tracking-tight text-slate-900 sm:text-3xl">
              Voice interview
            </h1>
            <p className="text-sm text-slate-600">
              Ask the question, record an answer, and evaluate it.
            </p>
          </div>

          <Card className="mt-6">
            <CardHeader className="pb-4">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="text-sm font-semibold text-slate-900">
                    Question {current + 1} of {questions.length}
                  </div>
                  <div className="mt-1 text-sm text-slate-600">
                    {questions[current]}
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardBody className="grid gap-4">
              <div className="flex flex-col gap-3 sm:flex-row">
                <Button onClick={speakQuestion} variant="secondary">
                  Ask question
                </Button>
                <Button onClick={startListening} variant="secondary">
                  Record answer
                </Button>
                <Button onClick={evaluateAnswer}>Evaluate</Button>
                <Button
                  onClick={nextQuestion}
                  variant="ghost"
                  disabled={current >= questions.length - 1}
                >
                  Next
                </Button>
              </div>

              <div className="rounded-xl bg-slate-50 p-4 ring-1 ring-slate-200">
                <div className="text-xs font-medium text-slate-500">
                  Candidate answer
                </div>
                <div className="mt-1 whitespace-pre-wrap text-sm text-slate-800">
                  {answer || "No answer recorded yet."}
                </div>
              </div>
            </CardBody>
          </Card>
        </div>

        <div className="lg:col-span-5">
          <div className="lg:sticky lg:top-20">
            <Proctoring />
          </div>
        </div>
      </div>
    </div>
  );
}

export default VoiceInterview;
