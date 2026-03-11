import axios from "axios";
import Button from "../components/ui/Button";
import { Card, CardBody, CardHeader } from "../components/ui/Card";
import { HelperText, Input, Label } from "../components/ui/Form";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { saveUserSession } from "../utils/auth";

const API_BASE = "http://localhost:8000";

function Login() {
  const navigate = useNavigate();

  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("candidate");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [mode, setMode] = useState("signin"); // "signin" | "signup"

  async function onSubmit(e) {
    e.preventDefault();
    if (!name || !password) {
      setError("Please enter a name and password.");
      return;
    }
    setError("");
    setBusy(true);
    try {
      let res;
      if (mode === "signin") {
        res = await axios.post(`${API_BASE}/auth/signin`, {
          name,
          password,
          role,
        });
      } else {
        const signupPath =
          role === "recruiter"
            ? `${API_BASE}/auth/signup/recruiter`
            : `${API_BASE}/auth/signup/candidate`;
        res = await axios.post(signupPath, {
          name,
          password,
        });
      }

      const user = res.data; // { id, name, role }
      saveUserSession(user);

      if (user.role === "recruiter") {
        // Explicitly send recruiters to the recruiter dashboard URL
        window.location.href = "http://localhost:5173/recruiter-dashboard";
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
      } else if (mode === "signin") {
        setError("An error occurred during sign in.");
      } else {
        setError("An error occurred during sign up.");
      }
      // Helpful for debugging in the browser
      // eslint-disable-next-line no-console
      console.error("Auth error:", err);
    } finally {
      setBusy(false);
    }
  }

  const title = mode === "signin" ? "Sign in" : "Sign up";
  const description =
    mode === "signin"
      ? "Enter your name and password, then choose whether you are a candidate or a recruiter."
      : "Create a new account as a candidate or recruiter. You can use this account to sign in later.";

  return (
    <div className="cb-container py-10 sm:py-14">
      <div className="mx-auto grid max-w-xl gap-6">
        <div className="space-y-2 text-center">
          <h1 className="text-2xl font-semibold tracking-tight text-slate-900 sm:text-3xl">
            {title}
          </h1>
          <p className="text-sm text-slate-600">{description}</p>
        </div>

        <Card>
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between">
              <div className="text-sm font-semibold text-slate-900">
                Account details
              </div>
              <div className="flex items-center gap-2 text-xs">
                <span className="text-slate-500">
                  {mode === "signin"
                    ? "New here?"
                    : "Already have an account?"}
                </span>
                <button
                  type="button"
                  className="font-medium text-indigo-600 hover:text-indigo-500"
                  onClick={() => {
                    setMode((m) => (m === "signin" ? "signup" : "signin"));
                    setError("");
                  }}
                >
                  {mode === "signin" ? "Sign up" : "Sign in"}
                </button>
              </div>
            </div>
          </CardHeader>
          <CardBody>
            <form className="space-y-4" onSubmit={onSubmit}>
              <div className="space-y-2">
                <Label htmlFor="name">Name</Label>
                <Input
                  id="name"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Enter your name"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="role">Role</Label>
                <select
                  id="role"
                  className="cb-input"
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                >
                  <option value="candidate">Candidate</option>
                  <option value="recruiter">Recruiter</option>
                </select>
              </div>

              {error && (
                <p className="text-sm text-rose-600">
                  {error}
                </p>
              )}

              <Button type="submit" disabled={busy}>
                {busy
                  ? mode === "signin"
                    ? "Signing in..."
                    : "Signing up..."
                  : mode === "signin"
                    ? "Continue"
                    : "Create account"}
              </Button>

              <HelperText>
                You can use the same account to sign in again later. Choose
                whether you are a candidate or recruiter so we can show the
                right dashboard.
              </HelperText>
            </form>
          </CardBody>
        </Card>
      </div>
    </div>
  );
}

export default Login;
