import React from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";

import Home from "./pages/Home";
import Login from "./pages/Login";
import Interview from "./pages/Interview";
import RecruiterDashboard from "./pages/RecruiterDashboard";
import Report from "./pages/Report";
import VoiceInterview from "./pages/VoiceInterview";
import Dashboard from "./pages/Dashboard";
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import InterviewFlow from "./pages/InterviewFlow";

import ResumeAnalysis from "./pages/ResumeAnalysis";

function App() {
  return (
    <BrowserRouter>
      <Navbar />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/interview" element={<Interview />} />
        <Route path="/interview-flow" element={<InterviewFlow />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/recruiter-dashboard" element={<RecruiterDashboard />} />
        <Route path="/report" element={<Report />} />
        <Route path="/voice-interview" element={<VoiceInterview />} />
        <Route path="/resume-analysis" element={<ResumeAnalysis />} />
      </Routes>
      <Footer />
    </BrowserRouter>
  );
}

export default App;
