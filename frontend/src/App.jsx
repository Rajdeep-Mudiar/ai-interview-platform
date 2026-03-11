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
import ProtectedRoute from "./components/ProtectedRoute";
import InterviewFlow from "./pages/InterviewFlow";

import ResumeAnalysis from "./pages/ResumeAnalysis";
import VideoLanding from "./pages/VideoLanding";
import Jobs from "./pages/Jobs";

function App() {
  return (
    <BrowserRouter>
      <Navbar />
      <main className="min-h-[calc(100vh-4rem)]">
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route
            path="/*"
            element={
              <ProtectedRoute>
                <Routes>
                  <Route path="/" element={<VideoLanding />} />
                  <Route path="/home" element={<Home />} />
                  <Route path="/interview" element={<Interview />} />
                  <Route path="/interview-flow" element={<InterviewFlow />} />
                  <Route path="/dashboard" element={<Dashboard />} />
                  <Route
                    path="/recruiter-dashboard"
                    element={<RecruiterDashboard />}
                  />
                  <Route path="/jobs" element={<Jobs />} />
                  <Route path="/report" element={<Report />} />
                  <Route path="/voice-interview" element={<VoiceInterview />} />
                  <Route path="/resume-analysis" element={<ResumeAnalysis />} />
                </Routes>
              </ProtectedRoute>
            }
          />
        </Routes>
      </main>
      <Footer />
    </BrowserRouter>
  );
}

export default App;
