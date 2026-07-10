import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { API_BASE_URL } from "../config.js";
import { Sparkles, AlertCircle, Loader2, User, Briefcase } from "lucide-react";

export default function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("candidate"); // default role is candidate
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleGoogleSignup = () => {
    window.location.href = `${API_BASE_URL}/auth/google/login?role=${role}`;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const user = await register(fullName, email, password, role);
      // Redirect based on the newly registered user's role
      if (user.role === "recruiter") {
        navigate("/recruiter");
      } else {
        navigate("/candidate");
      }
    } catch (err) {
      console.error(err);
      setError(err.message || "Failed to create account. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen flex items-center justify-center p-6 overflow-hidden">
      {/* Background glow meshes */}
      <div className="absolute top-[20%] left-[20%] w-[300px] h-[300px] rounded-full bg-brand/10 blur-[80px] pointer-events-none" />
      <div className="absolute bottom-[20%] right-[20%] w-[350px] h-[350px] rounded-full bg-accent/5 blur-[90px] pointer-events-none" />

      <div className="w-full max-w-lg z-10">
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center space-x-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-brand to-accent flex items-center justify-center shadow-lg shadow-brand/20">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <span className="text-2xl font-extrabold tracking-tight text-white">
              FixHire
            </span>
          </Link>
          <h2 className="text-3xl font-bold tracking-tight text-white">Get Started</h2>
          <p className="text-gray-400 mt-2 text-sm font-light">
            Create an account to unlock candidate tools or recruiter dashboards.
          </p>
        </div>

        <div className="glass-card p-8">
          {error && (
            <div className="mb-6 p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm flex items-start space-x-3">
              <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="form-label">Full Name</label>
              <input
                type="text"
                required
                className="form-input"
                placeholder="Alex Carter"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                disabled={loading}
              />
            </div>

            <div>
              <label className="form-label">Email Address</label>
              <input
                type="email"
                required
                className="form-input"
                placeholder="you@company.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={loading}
              />
            </div>

            <div>
              <label className="form-label">Password</label>
              <input
                type="password"
                required
                className="form-input"
                placeholder="Minimum 6 characters"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={loading}
              />
            </div>

            <div>
              <label className="form-label">Join As</label>
              <div className="grid grid-cols-2 gap-4">
                {/* Candidate Option */}
                <button
                  type="button"
                  onClick={() => setRole("candidate")}
                  className={`flex flex-col items-center justify-center p-4 rounded-xl border text-center transition-all duration-300 ${
                    role === "candidate"
                      ? "border-brand bg-brand-glow text-white"
                      : "border-gray-800 bg-dark-900/40 text-gray-400 hover:border-gray-700"
                  }`}
                  disabled={loading}
                >
                  <User className="w-6 h-6 mb-2" />
                  <span className="font-semibold text-sm">Candidate</span>
                  <span className="text-xs text-gray-500 mt-1">Optimize resume</span>
                </button>

                {/* Recruiter Option */}
                <button
                  type="button"
                  onClick={() => setRole("recruiter")}
                  className={`flex flex-col items-center justify-center p-4 rounded-xl border text-center transition-all duration-300 ${
                    role === "recruiter"
                      ? "border-brand bg-brand-glow text-white"
                      : "border-gray-800 bg-dark-900/40 text-gray-400 hover:border-gray-700"
                  }`}
                  disabled={loading}
                >
                  <Briefcase className="w-6 h-6 mb-2" />
                  <span className="font-semibold text-sm">Recruiter</span>
                  <span className="text-xs text-gray-500 mt-1">Evaluate resumes</span>
                </button>
              </div>
            </div>

            <button
              type="button"
              onClick={handleGoogleSignup}
              disabled={loading}
              className="w-full py-3 flex items-center justify-center space-x-3 rounded-2xl border border-white/10 bg-white/5 text-white hover:bg-white/10 transition-colors"
            >
              <span className="w-5 h-5 inline-flex items-center justify-center rounded-full border border-white/20 bg-white/10 text-[10px] font-semibold">
                G
              </span>
              <span>Sign up with Google</span>
            </button>

            <div className="relative my-6 text-center text-sm text-gray-400">
              <span className="bg-slate-950 px-3">or</span>
              <div className="absolute inset-x-0 top-1/2 border-t border-white/10" />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full py-3 flex items-center justify-center space-x-2"
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>Creating account...</span>
                </>
              ) : (
                <span>Register Account</span>
              )}
            </button>
          </form>

          <div className="mt-8 pt-6 border-t border-white/5 text-center text-sm text-gray-400">
            Already have an account?{" "}
            <Link to="/login" className="text-brand hover:text-brand-light font-medium transition-colors">
              Sign In
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
