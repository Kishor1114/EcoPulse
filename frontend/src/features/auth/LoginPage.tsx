import { useState } from "react";
import type { FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Leaf, LogIn } from "lucide-react";
import { authApi, extractError } from "@/api";
import { useAuth } from "./AuthContext";
import { ErrorAlert } from "@/components/ui/Primitives";

export function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const result = await authApi.login(email, password);
      login(result.token, result.user);
      navigate("/dashboard");
    } catch (err) {
      setError(extractError(err));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="flex flex-col items-center mb-8">
          <div className="w-12 h-12 rounded-2xl bg-forest-500/15 flex items-center justify-center mb-3">
            <Leaf size={26} className="text-forest-400" aria-hidden="true" />
          </div>
          <h1 className="page-title">Welcome back</h1>
          <p className="text-slate-400 text-sm mt-1">Log in to track your carbon footprint</p>
        </div>

        <form onSubmit={handleSubmit} className="card space-y-4" noValidate>
          {error && <ErrorAlert message={error} />}

          <div>
            <label htmlFor="email" className="label">Email</label>
            <input
              id="email"
              type="email"
              required
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="input"
              placeholder="you@example.com"
            />
          </div>

          <div>
            <label htmlFor="password" className="label">Password</label>
            <input
              id="password"
              type="password"
              required
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="input"
              placeholder="••••••••"
            />
          </div>

          <button type="submit" disabled={submitting} className="btn-primary w-full justify-center">
            <LogIn size={18} aria-hidden="true" />
            {submitting ? "Logging in…" : "Log in"}
          </button>
        </form>

        <p className="text-center text-sm text-slate-400 mt-6">
          Don't have an account?{" "}
          <Link to="/register" className="text-forest-400 hover:text-forest-300 font-medium">
            Sign up
          </Link>
        </p>
      </div>
    </div>
  );
}
