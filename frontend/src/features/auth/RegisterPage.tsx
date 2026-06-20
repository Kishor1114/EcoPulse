import { useState } from "react";
import type { FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Leaf, UserPlus } from "lucide-react";
import { authApi, extractError } from "@/api";
import { useAuth } from "./AuthContext";
import { ErrorAlert } from "@/components/ui/Primitives";

export function RegisterPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const result = await authApi.register(name, email, password);
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
          <h1 className="page-title">Create your account</h1>
          <p className="text-slate-400 text-sm mt-1">Start understanding your carbon impact</p>
        </div>

        <form onSubmit={handleSubmit} className="card space-y-4" noValidate>
          {error && <ErrorAlert message={error} />}

          <div>
            <label htmlFor="name" className="label">Full name</label>
            <input
              id="name"
              type="text"
              required
              minLength={2}
              autoComplete="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="input"
              placeholder="Jordan Lee"
            />
          </div>

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
              minLength={8}
              autoComplete="new-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="input"
              placeholder="••••••••"
              aria-describedby="password-hint"
            />
            <p id="password-hint" className="text-xs text-slate-500 mt-1.5">
              At least 8 characters, with an uppercase letter and a number.
            </p>
          </div>

          <button type="submit" disabled={submitting} className="btn-primary w-full justify-center">
            <UserPlus size={18} aria-hidden="true" />
            {submitting ? "Creating account…" : "Sign up"}
          </button>
        </form>

        <p className="text-center text-sm text-slate-400 mt-6">
          Already have an account?{" "}
          <Link to="/login" className="text-forest-400 hover:text-forest-300 font-medium">
            Log in
          </Link>
        </p>
      </div>
    </div>
  );
}
