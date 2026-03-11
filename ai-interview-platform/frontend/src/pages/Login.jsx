import axios from "axios";
import Button from "../components/ui/Button";
import { Card, CardBody, CardHeader } from "../components/ui/Card";
import { HelperText, Input, Label } from "../components/ui/Form";
import { useState } from "react";
import { saveUserSession } from "../utils/auth";

const API_BASE = "http://localhost:8000";

function Login() {
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
      const res = await axios.post(`${API_BASE}/auth/signin`, {
        name,
        password,
        role,
      });

      const user = res.data; // { id, name, role }
      saveUserSession(user);

      if (user.role === "recruiter") {
        window.location.href = "/recruiter-dashboard";
      } else {
        window.location.href = "/dashboard";
      }
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="cb-container py-10 sm:py-14">
      <div className="mx-auto grid max-w-xl gap-6">
        <div className="space-y-2 text-center">
          <h1 className="text-2xl font-semibold tracking-tight text-slate-900 sm:text-3xl">
            Sign in
          </h1>
          <p className="text-sm text-slate-600">
            Enter your name and password, then choose whether you are a candidate
            or a recruiter.
          </p>
        </div>

        <Card>
          <CardHeader className="pb-4">
            <div className="text-sm font-semibold text-slate-900">
              Account details
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
                {busy ? "Signing in..." : "Continue"}
              </Button>

              <HelperText>
                This is a simple sign-in UI. We can later connect it to MongoDB
                and show role-based dashboards.
              </HelperText>
            </form>
          </CardBody>
        </Card>
      </div>
    </div>
  );
}

export default Login;
