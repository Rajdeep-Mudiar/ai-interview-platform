import React from "react";
import { BrowserRouter, Routes, Route, Navigate, Outlet } from "react-router-dom";

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

import ErrorBoundary from "./components/ErrorBoundary";

// Layout component to keep things organized
const MainLayout = () => (
  <ErrorBoundary>
    <Navbar />
    <main className="min-h-[calc(100vh-4rem)] bg-slate-50">
      <Outlet />
    </main>
    <Footer />
  </ErrorBoundary>
);

function App() {
  return (
    <ErrorBoundary>
      <BrowserRouter>
        <Routes>
          {/* Auth Route - No Layout */}
          <Route path="/login" element={<Login />} />

          {/* Protected Routes with Layout */}
          <Route element={<MainLayout />}>
            <Route path="/" element={<ProtectedRoute><VideoLanding /></ProtectedRoute>} />
            <Route path="/home" element={<ProtectedRoute><Home /></ProtectedRoute>} />
            
            {/* Candidate Pipeline */}
            <Route path="/jobs" element={<ProtectedRoute><Jobs /></ProtectedRoute>} />
            <Route path="/resume-analysis" element={<ProtectedRoute><ResumeAnalysis /></ProtectedRoute>} />
            <Route path="/interview-flow" element={<ProtectedRoute><InterviewFlow /></ProtectedRoute>} />
            <Route path="/interview" element={<ProtectedRoute><Interview /></ProtectedRoute>} />
            <Route path="/voice-interview" element={<ProtectedRoute><VoiceInterview /></ProtectedRoute>} />
            <Route path="/report" element={<ProtectedRoute><Report /></ProtectedRoute>} />
            
            {/* Candidate Dashboard */}
            <Route 
              path="/dashboard" 
              element={
                <ProtectedRoute role="candidate">
                  <Dashboard />
                </ProtectedRoute>
              } 
            />

            {/* Recruiter Tools */}
            <Route
              path="/recruiter-dashboard"
              element={
                <ProtectedRoute role="recruiter">
                  <RecruiterDashboard />
                </ProtectedRoute>
              }
            />
          </Route>

          {/* Global Fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </ErrorBoundary>
  );
}

export default App;
