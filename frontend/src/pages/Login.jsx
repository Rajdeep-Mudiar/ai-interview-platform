import axios from "axios";
import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import Button from "../components/ui/Button";
import { Card, CardBody, CardHeader } from "../components/ui/Card";
import { Input, Label } from "../components/ui/Form";
import { saveUserSession, getUserSession } from "../utils/auth";

const API_BASE = "http://127.0.0.1:8000";

export default function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from?.pathname || "/";

  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [company, setCompany] = useState("");
  const [role, setRole] = useState("candidate");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  // If already logged in, redirect away from login page
  useEffect(() => {
    const session = getUserSession();
    if (session) {
      if (session.role === "recruiter") {
        navigate("/recruiter-dashboard", { replace: true });
      } else {
        navigate("/dashboard", { replace: true });
      }
    }
  }, [navigate]);

  async function onSubmit(e) {
    e.preventDefault();
    
    if (!email || !password || (isSignUp && !name)) {
      setError("Please fill in all required fields.");
      return;
    }
    
    setError("");
    setBusy(true);
    
    const endpoint = isSignUp ? "/auth/signup" : "/auth/signin";
    const payload = isSignUp 
      ? { email, name, password, role, company: role === "recruiter" ? company : "" }
      : { email, password, role };

    try {
      console.log(`Attempting ${isSignUp ? 'signup' : 'signin'} at ${API_BASE}${endpoint}`);
      console.log("Payload stringified:", JSON.stringify(payload));
      
      const res = await axios.post(`${API_BASE}${endpoint}`, payload);
      const user = res.data; 
      
      saveUserSession(user);
      console.log("Session saved successfully:", user);
      
      // Clear inputs
      setEmail("");
      setName("");
      setPassword("");
      setCompany("");
      setError("");
      
      // Trigger a storage event for Navbar to update if needed
      window.dispatchEvent(new Event("storage"));

      // Show success message briefly before redirecting if signing up
      if (isSignUp) {
        setError("Account created successfully! Redirecting...");
        setTimeout(() => {
          if (user.role === "recruiter") {
            navigate("/recruiter-dashboard", { replace: true });
          } else {
            navigate("/dashboard", { replace: true });
          }
        }, 1500);
      } else {
        if (location.state?.from) {
          navigate(from, { replace: true });
        } else if (user.role === "recruiter") {
          navigate("/recruiter-dashboard", { replace: true });
        } else {
          navigate("/dashboard", { replace: true });
        }
      }
    } catch (err) {
      console.error("Authentication error detailed:", err);
      
      let errorMsg = "An error occurred. Please check your credentials.";
      
      if (err.response?.data?.detail) {
        const detail = err.response.data.detail;
        if (typeof detail === "string") {
          errorMsg = detail;
        } else if (Array.isArray(detail)) {
          // FastAPI validation error list
          errorMsg = detail.map(d => `${d.loc.join('.')}: ${d.msg}`).join(", ");
        } else if (typeof detail === "object") {
          errorMsg = JSON.stringify(detail);
        }
      }
      
      setError(errorMsg);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <div className="mx-auto h-12 w-12 rounded-xl bg-blue-600 flex items-center justify-center text-white font-bold text-xl shadow-lg shadow-blue-200">
            CB
          </div>
          <h2 className="mt-6 text-3xl font-extrabold text-slate-900">
            {isSignUp ? "Create your account" : "Sign in to CareBridge"}
          </h2>
          <p className="mt-2 text-sm text-slate-600">
            {isSignUp 
              ? "Join the next generation of AI-powered hiring." 
              : "Welcome back! Please enter your details."}
          </p>
        </div>

        <Card className="border-none shadow-xl ring-1 ring-slate-200">
          <CardHeader className="border-b border-slate-100 pb-4">
            <div className="flex bg-slate-100 p-1 rounded-lg">
              <button
                onClick={() => { setIsSignUp(false); setError(""); }}
                className={`flex-1 py-2 text-sm font-medium rounded-md transition-all ${!isSignUp ? "bg-white text-blue-600 shadow-sm" : "text-slate-500 hover:text-slate-700"}`}
              >
                Sign In
              </button>
              <button
                onClick={() => { setIsSignUp(true); setError(""); }}
                className={`flex-1 py-2 text-sm font-medium rounded-md transition-all ${isSignUp ? "bg-white text-blue-600 shadow-sm" : "text-slate-500 hover:text-slate-700"}`}
              >
                Sign Up
              </button>
            </div>
          </CardHeader>
          <CardBody className="pt-6">
            <form className="space-y-5" onSubmit={onSubmit}>
              {isSignUp && (
                <div className="space-y-1">
                  <Label htmlFor="name">Full Name</Label>
                  <Input
                    id="name"
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Enter your full name"
                    className="block w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    required
                  />
                </div>
              )}

              <div className="space-y-1">
                <Label htmlFor="email">Email address</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@example.com"
                  className="block w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  required
                />
              </div>

              <div className="space-y-1">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="block w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  required
                />
              </div>

              <div className="space-y-1">
                <Label htmlFor="role">Role</Label>
                <select
                  id="role"
                  className="block w-full pl-3 pr-10 py-2 text-base border border-slate-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                >
                  <option value="candidate">I am a Candidate</option>
                  <option value="recruiter">I am a Recruiter</option>
                </select>
              </div>

              {isSignUp && role === "recruiter" && (
                <div className="space-y-1">
                  <Label htmlFor="company">Company Name</Label>
                  <Input
                    id="company"
                    type="text"
                    value={company}
                    onChange={(e) => setCompany(e.target.value)}
                    placeholder="Acme Inc."
                    className="block w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  />
                </div>
              )}

              {error && (
                <div className={`rounded-md p-3 ${error.includes("successfully") ? "bg-emerald-50" : "bg-red-50"}`}>
                  <div className="flex">
                    <div className="ml-3">
                      <p className={`text-sm font-medium ${error.includes("successfully") ? "text-emerald-800" : "text-red-800"}`}>
                        {error}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              <div>
                <Button
                  type="submit"
                  disabled={busy}
                  className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
                >
                  {busy ? (
                    <span className="flex items-center gap-2">
                      <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Processing...
                    </span>
                  ) : (
                    isSignUp ? "Create Account" : "Sign In"
                  )}
                </Button>
              </div>
            </form>
          </CardBody>
        </Card>
        
        <p className="text-center text-xs text-slate-500">
          By continuing, you agree to CareBridge's <span className="underline cursor-pointer">Terms of Service</span> and <span className="underline cursor-pointer">Privacy Policy</span>.
        </p>
      </div>
    </div>
  );
}
