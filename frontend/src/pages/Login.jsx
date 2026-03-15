import axiosClient from "../utils/axiosClient";
import Button from "../components/ui/Button";
import { Card, CardBody, CardHeader } from "../components/ui/Card";
import { HelperText, Input, Label } from "../components/ui/Form";
import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { saveUserSession } from "../utils/auth";

const API_BASE = "http://127.0.0.1:8000";

function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from?.pathname || "/";

  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("candidate");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function onSubmit(e) {
    e.preventDefault();
    if (!name || !password) {
      setError("Please enter a name and password.");
      return;
    }
    setError("");
    setBusy(true);
    try {
      const res = await axiosClient.post(`/auth/signin`, {
        name,
        password,
        role,
      });

      const user = res.data; // { id, name, role }
      saveUserSession(user);

      // If there was a redirect source, go there.
      // Otherwise, go to default dashboard based on role.
      if (location.state?.from) {
        navigate(from, { replace: true });
      } else if (user.role === "recruiter") {
        navigate("/recruiter-dashboard", { replace: true });
      } else {
        navigate("/dashboard", { replace: true });
      }
    } catch (err) {
      // Try to surface the most useful error message possible
      // 1) Backend-provided detail
      const backendDetail =
        err.response?.data?.detail ??
        (typeof err.response?.data === "string"
          ? err.response.data
          : null);

      // 2) Network/connectivity issue
      if (!err.response) {
        setError(
          "Cannot reach the server. Please make sure the backend is running at " +
            API_BASE +
            ".",
        );
      } else if (backendDetail) {
        setError(backendDetail);
      } else {
        setError("An error occurred during sign in.");
      }
      // Helpful for debugging in the browser
      // eslint-disable-next-line no-console
      console.error("Auth error:", err);
    } finally {
      setBusy(false);
    }
  }

  const title = "Sign in / Sign up";
  const description =
    "Enter your name and password, then choose whether you are a candidate or a recruiter. If you don't have an account, one will be created for you automatically.";

  return (
    <div className="min-h-[calc(100vh-64px)] flex flex-col lg:flex-row">
      {/* Left Side: Branding & Info */}
      <div className="hidden lg:flex lg:w-1/2 bg-slate-900 p-12 flex-col justify-between text-white relative overflow-hidden">
        <div className="absolute inset-0 opacity-20">
          <div className="absolute top-0 left-0 w-96 h-96 bg-blue-500 rounded-full filter blur-[128px] -translate-x-1/2 -translate-y-1/2"></div>
          <div className="absolute bottom-0 right-0 w-96 h-96 bg-indigo-500 rounded-full filter blur-[128px] translate-x-1/2 translate-y-1/2"></div>
        </div>
        
        <div className="relative z-10">
          <div className="flex items-center gap-2 mb-12">
            <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center font-bold text-xl shadow-lg shadow-blue-500/20">C</div>
            <span className="text-2xl font-bold tracking-tight">CareBridge AI</span>
          </div>
          
          <div className="space-y-8 max-w-md">
            <h2 className="text-4xl font-bold leading-tight">
              The next generation of <span className="text-blue-400">AI-powered</span> recruitment.
            </h2>
            <p className="text-lg text-slate-400">
              Streamline your hiring process with automated technical interviews, real-time proctoring, and data-driven candidate evaluation.
            </p>
            
            <ul className="space-y-4">
              {[
                "AI-driven technical question generation",
                "Real-time dual-device proctoring",
                "Automated resume analysis & matching",
                "Instant technical score evaluation"
              ].map((item, i) => (
                <li key={i} className="flex items-center gap-3 text-slate-300">
                  <div className="w-5 h-5 rounded-full bg-blue-500/10 flex items-center justify-center text-blue-400">
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  {item}
                </li>
              ))}
            </ul>
          </div>
        </div>
        
        <div className="relative z-10 pt-12 border-t border-slate-800">
          <div className="flex items-center gap-4">
            <div className="flex -space-x-2">
              {["JD", "AS", "MK", "RL"].map((initials, i) => (
                <div key={i} className="w-8 h-8 rounded-full border-2 border-slate-900 bg-slate-800 flex items-center justify-center text-[10px] font-bold text-slate-400">
                   {initials}
                </div>
              ))}
            </div>
            <p className="text-sm text-slate-400">
              Trusted by <span className="text-white font-medium">500+</span> recruiters worldwide.
            </p>
          </div>
        </div>
      </div>

      {/* Right Side: Form */}
      <div className="flex-1 flex flex-col items-center justify-center p-6 sm:p-12 bg-slate-50">
        <div className="w-full max-w-md space-y-8">
          <div className="lg:hidden flex items-center justify-center gap-2 mb-8">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center font-bold text-lg text-white">C</div>
            <span className="text-xl font-bold text-slate-900">CareBridge AI</span>
          </div>

          <div className="space-y-2">
            <h1 className="text-3xl font-bold tracking-tight text-slate-900">
              {title}
            </h1>
            <p className="text-slate-500">
              {description}
            </p>
          </div>

          <div className="bg-white p-8 rounded-2xl shadow-sm ring-1 ring-slate-200">
            <form onSubmit={onSubmit} className="space-y-6">
              <div className="space-y-1.5">
                <Label htmlFor="name">Full Name / Username</Label>
                <Input
                  id="name"
                  placeholder="Alex Johnson"
                  value={name}
                  className="h-11"
                  onChange={(e) => setName(e.target.value)}
                />
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password">Password</Label>
                  <button type="button" className="text-xs font-medium text-blue-600 hover:text-blue-500">
                    Forgot password?
                  </button>
                </div>
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  className="h-11"
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="role">I am a...</Label>
                <div className="grid grid-cols-2 gap-3">
                  {["candidate", "recruiter"].map(r => (
                    <button
                      key={r}
                      type="button"
                      onClick={() => setRole(r)}
                      className={`h-11 px-4 rounded-lg text-sm font-medium transition-all ring-1 flex items-center justify-center capitalize ${
                        role === r 
                          ? "bg-blue-600 text-white ring-blue-600 shadow-md shadow-blue-500/20" 
                          : "bg-white text-slate-600 ring-slate-200 hover:bg-slate-50"
                      }`}
                    >
                      {r}
                    </button>
                  ))}
                </div>
              </div>

              {error && (
                <div className="p-3 rounded-lg bg-rose-50 border border-rose-100 flex items-center gap-3 text-rose-600 text-sm">
                   <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                     <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                   </svg>
                   {error}
                </div>
              )}

              <Button type="submit" className="w-full h-11 text-base font-semibold bg-blue-600 hover:bg-blue-700 transition-colors" disabled={busy}>
                {busy ? (
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    Authenticating...
                  </div>
                ) : (
                  "Continue"
                )}
              </Button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Login;
