import { useState } from "react";
import axiosClient from "../utils/axiosClient";
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
    const res = await axiosClient.post("/evaluate-answer", {
      answer: answer,
      question: questions[current],
    });
    alert("Score: " + res.data.score + "\nFeedback: " + res.data.feedback);
  };

  return (
    <div className="cb-container py-10 sm:py-16">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-8 mb-12 pb-8 border-b border-slate-100">
        <div className="flex items-center gap-5">
          <div className="w-14 h-14 bg-indigo-600 rounded-2xl flex items-center justify-center text-white shadow-xl shadow-indigo-200 ring-4 ring-indigo-50">
            <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
            </svg>
          </div>
          <div>
            <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">AI Voice Interview</h1>
            <p className="text-slate-500 font-medium mt-1">Immersive audio-based technical assessment.</p>
          </div>
        </div>

        <div className="flex items-center gap-4 bg-white p-2 rounded-2xl shadow-sm ring-1 ring-slate-100">
          <div className="px-4 py-2 rounded-xl bg-slate-50 border border-slate-100 text-center min-w-[100px]">
            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none mb-1">Progress</div>
            <div className="text-sm font-bold text-slate-900">{current + 1} / {questions.length}</div>
          </div>
          <Button onClick={speakQuestion} className="h-10 bg-indigo-600 hover:bg-indigo-700 text-white font-bold px-5 rounded-xl shadow-lg shadow-indigo-200 transition-all flex items-center gap-2">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
            </svg>
            Play Question
          </Button>
        </div>
      </div>

      <div className="grid gap-10 lg:grid-cols-12 items-start">
        {/* Main Interaction Area */}
        <div className="lg:col-span-8 space-y-8">
          <Card className="overflow-hidden border-none shadow-2xl shadow-slate-200/50 ring-1 ring-slate-100 rounded-[2.5rem]">
            <CardHeader className="p-10 bg-gradient-to-br from-slate-50 to-white border-b border-slate-100 relative overflow-hidden">
              <div className="absolute -right-12 -top-12 w-48 h-48 bg-indigo-500 rounded-full filter blur-[80px] opacity-10"></div>
              
              <div className="inline-flex items-center px-3 py-1 rounded-full bg-indigo-50 text-indigo-700 text-[10px] font-bold uppercase tracking-widest mb-6 border border-indigo-100">
                Technical Query
              </div>
              <h2 className="text-3xl font-bold text-slate-900 leading-[1.2]">
                "{questions[current]}"
              </h2>
            </CardHeader>
            
            <CardBody className="p-10 space-y-8">
              <div className="relative group">
                <textarea
                  className="w-full min-h-[280px] p-8 rounded-[2rem] bg-slate-50 ring-1 ring-slate-200 focus:ring-4 focus:ring-indigo-100 focus:bg-white outline-none transition-all text-xl font-medium text-slate-700 placeholder:text-slate-300 resize-none leading-relaxed"
                  placeholder="The AI is listening for your response..."
                  value={answer}
                  readOnly
                />
                <div className="absolute bottom-6 right-6 flex gap-3">
                  <button 
                    onClick={startListening} 
                    className="h-16 w-16 rounded-3xl bg-indigo-600 text-white flex items-center justify-center shadow-xl shadow-indigo-200 hover:scale-105 active:scale-95 transition-all group-hover:bg-indigo-700"
                  >
                    <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                    </svg>
                  </button>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row items-center justify-between gap-6 pt-6">
                <div className="flex items-center gap-3">
                  <div className="h-3 w-3 rounded-full bg-emerald-500 animate-pulse"></div>
                  <span className="text-sm font-bold text-slate-500 uppercase tracking-wide">Mic Ready for Input</span>
                </div>
                
                <div className="flex items-center gap-3 w-full sm:w-auto">
                  <Button onClick={evaluateAnswer} disabled={!answer} className="flex-1 sm:flex-none h-14 px-10 bg-slate-900 text-white font-bold rounded-2xl hover:bg-slate-800 transition-all shadow-lg shadow-slate-200">
                    Submit Response
                  </Button>
                  <Button 
                    onClick={nextQuestion} 
                    disabled={current >= questions.length - 1} 
                    variant="secondary" 
                    className="h-14 px-8 border-slate-200 hover:bg-slate-50 rounded-2xl font-bold transition-all"
                  >
                    Next Question
                  </Button>
                </div>
              </div>
            </CardBody>
          </Card>
        </div>

        {/* Right Sidebar: Tips & Proctoring */}
        <div className="lg:col-span-4 space-y-8">
          <Card className="border-none shadow-xl shadow-slate-200/50 ring-1 ring-slate-100 rounded-[2rem] overflow-hidden">
            <CardHeader className="p-8 bg-indigo-900 text-white relative overflow-hidden">
              <div className="absolute right-0 bottom-0 w-32 h-32 bg-white/10 rounded-full -mb-12 -mr-12 filter blur-3xl"></div>
              <h3 className="text-lg font-bold relative z-10">Voice Tips</h3>
              <p className="text-indigo-200 text-xs mt-1 relative z-10">Maximize your performance score.</p>
            </CardHeader>
            <CardBody className="p-8 space-y-6 bg-white">
              <div className="space-y-4">
                {[
                  { title: "Speak Clearly", text: "Maintain a steady pace and articulate technical terms.", icon: "🗣️" },
                  { title: "Minimize Noise", text: "Ensure your environment is quiet for better accuracy.", icon: "🔇" },
                  { title: "Be Direct", text: "Focus on the core concept before detailing examples.", icon: "🎯" }
                ].map((tip, i) => (
                  <div key={i} className="flex gap-4 group">
                    <div className="w-10 h-10 shrink-0 rounded-xl bg-indigo-50 flex items-center justify-center text-lg group-hover:scale-110 transition-transform">{tip.icon}</div>
                    <div>
                      <h4 className="text-sm font-bold text-slate-900">{tip.title}</h4>
                      <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">{tip.text}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardBody>
          </Card>

          <Card className="border-none shadow-xl shadow-slate-200/50 ring-1 ring-slate-100 rounded-[2rem] overflow-hidden">
            <CardHeader className="p-8 pb-4">
              <h3 className="text-lg font-bold text-slate-900">Active Monitoring</h3>
            </CardHeader>
            <CardBody className="p-8 pt-0">
              <Proctoring />
            </CardBody>
          </Card>
        </div>
      </div>
    </div>
  );
}

export default VoiceInterview;
