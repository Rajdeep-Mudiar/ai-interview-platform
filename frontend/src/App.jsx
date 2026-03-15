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
import ResumeAnalysis from "./pages/ResumeAnalysis";
import ResumeBuilder from "./pages/ResumeBuilder";
import MobileMonitoring from "./pages/MobileMonitoring";
import VideoLanding from "./pages/VideoLanding";
import Jobs from "./pages/Jobs";
import MyJobs from "./pages/MyJobs";
import Candidates from "./pages/Candidates";
import Reevaluate from "./pages/Reevaluate";

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
                  <Route
                    path="/resume-analysis"
                    element={
                      <ProtectedRoute role="candidate">
                        <ResumeAnalysis />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/dashboard"
                    element={
                      <ProtectedRoute role="candidate">
                        <Dashboard />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/resume-builder"
                    element={
                      <ProtectedRoute role="candidate">
                        <ResumeBuilder />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/interview"
                    element={
                      <ProtectedRoute role="candidate">
                        <Interview />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/recruiter-dashboard"
                    element={
                      <ProtectedRoute role="recruiter">
                        <RecruiterDashboard />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/my-jobs"
                    element={
                      <ProtectedRoute role="recruiter">
                        <MyJobs />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/candidates"
                    element={
                      <ProtectedRoute role="recruiter">
                        <Candidates />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/reevaluate"
                    element={
                      <ProtectedRoute role="recruiter">
                        <Reevaluate />
                      </ProtectedRoute>
                    }
                  />
                  <Route path="/jobs" element={<Jobs />} />
                  <Route path="/report" element={<Report />} />
                  <Route path="/voice-interview" element={<VoiceInterview />} />
                  <Route path="/mobile-monitoring/:sessionId" element={<MobileMonitoring />} />
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
