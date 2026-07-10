import { useState, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { Sparkles, AlertCircle, Loader2, Briefcase, User, ArrowLeft } from "lucide-react";

const ROLES = [
  {
    key: "recruiter",
    icon: Briefcase,
    label: "Recruiter",
    description: "Post jobs, screen resumes & manage candidates",
    gradient: "from-violet-500 to-brand",
    glow: "shadow-violet-500/20",
    border: "border-violet-500/40",
    bg: "bg-violet-500/10",
    activeBg: "bg-violet-500/20",
  },
  {
    key: "candidate",
    icon: User,
    label: "Candidate",
    description: "Discover opportunities & optimize your resume",
    gradient: "from-cyan-500 to-accent",
    glow: "shadow-cyan-500/20",
    border: "border-cyan-500/40",
    bg: "bg-cyan-500/10",
    activeBg: "bg-cyan-500/20",
  },
];

export default function Login() {
  const { login, loginWithGoogleToken, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // Step 1: role selection, Step 2: credentials form
  const [step, setStep] = useState(1);
  const [selectedRole, setSelectedRole] = useState(null);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const googleToken = params.get("google_token");
    if (googleToken) {
      const role = params.get("role");
      setLoading(true);
      loginWithGoogleToken(googleToken)
        .then((user) => {
          if (user?.role === "recruiter") {
            navigate("/recruiter", { replace: true });
          } else {
            navigate("/candidate", { replace: true });
          }
        })
        .catch((err) => {
          console.error("Google login failed:", err);
          setError(err.message || "Google login failed. Please try again.");
        })
        .finally(() => {
          setLoading(false);
          window.history.replaceState({}, document.title, location.pathname);
        });
    }
  }, [location.search, loginWithGoogleToken, navigate, location.pathname]);

  const handleRoleSelect = (roleKey) => {
    setSelectedRole(roleKey);
    setError("");
    setStep(2);
  };

  const handleBack = () => {
    setStep(1);
    setSelectedRole(null);
    setError("");
  };

  const handleGoogleLogin = () => {
    if (!selectedRole) {
      setError("Please select Candidate or Recruiter before signing in with Google.");
      return;
    }
    window.location.href = `http://127.0.0.1:8000/api/auth/google/login?role=${selectedRole}`;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const user = await login(email, password);

      // If the selected role doesn't match the account's actual role, reject the login
      if (user.role !== selectedRole) {
        // Log out immediately so no token is kept for the wrong portal
        logout();
        setError(
          `This account is registered as a ${user.role}. Please go back and select "${user.role === "recruiter" ? "Recruiter" : "Candidate"}" to sign in.`
        );
        return;
      }

      if (user.role === "recruiter") {
        navigate("/recruiter");
      } else {
        navigate("/candidate");
      }
    } catch (err) {
      console.error(err);
      setError(err.message || "Failed to log in. Please check your credentials.");
    } finally {
      setLoading(false);
    }
  };

  const roleConfig = ROLES.find((r) => r.key === selectedRole);

  return (
    <div className="relative min-h-screen flex items-center justify-center p-6 overflow-hidden">
      {/* Background glow meshes */}
      <div className="absolute top-[20%] left-[20%] w-[300px] h-[300px] rounded-full bg-brand/10 blur-[80px] pointer-events-none" />
      <div className="absolute bottom-[20%] right-[20%] w-[350px] h-[350px] rounded-full bg-accent/5 blur-[90px] pointer-events-none" />

      <div className="w-full max-w-md z-10">
        {/* Logo */}
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center space-x-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-brand to-accent flex items-center justify-center shadow-lg shadow-brand/20">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <span className="text-2xl font-extrabold tracking-tight text-white">FixHire</span>
          </Link>

          {step === 1 ? (
            <>
              <h2 className="text-3xl font-bold tracking-tight text-white">Welcome Back</h2>
              <p className="text-gray-400 mt-2 text-sm font-light">
                Choose how you'd like to sign in
              </p>
            </>
          ) : (
            <>
              <h2 className="text-3xl font-bold tracking-tight text-white">Sign In</h2>
              <p className="text-gray-400 mt-2 text-sm font-light">
                Continuing as a{" "}
                <span
                  className={`font-semibold bg-gradient-to-r ${roleConfig?.gradient} bg-clip-text text-transparent`}
                >
                  {roleConfig?.label}
                </span>
              </p>
            </>
          )}
        </div>

        {/* ── STEP 1: Role Selector ── */}
        {step === 1 && (
          <div className="space-y-4">
            {ROLES.map((role) => {
              const Icon = role.icon;
              return (
                <button
                  key={role.key}
                  id={`role-select-${role.key}`}
                  onClick={() => handleRoleSelect(role.key)}
                  className={`w-full group glass-card p-6 text-left flex items-center space-x-5 transition-all duration-300 hover:scale-[1.02] hover:${role.border} hover:shadow-xl hover:${role.glow} cursor-pointer border border-white/5`}
                >
                  <div
                    className={`w-14 h-14 rounded-2xl ${role.bg} border ${role.border} flex items-center justify-center shrink-0 shadow-lg ${role.glow} group-hover:${role.activeBg} transition-colors duration-300`}
                  >
                    <div
                      className={`w-7 h-7 bg-gradient-to-br ${role.gradient} rounded-lg flex items-center justify-center`}
                    >
                      <Icon className="w-4 h-4 text-white" />
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-white font-semibold text-base">{role.label}</p>
                    <p className="text-gray-400 text-sm mt-0.5 leading-snug">{role.description}</p>
                  </div>
                  <div
                    className={`w-6 h-6 rounded-full border-2 border-white/20 group-hover:border-transparent group-hover:bg-gradient-to-br group-hover:${role.gradient} transition-all duration-300 shrink-0`}
                  />
                </button>
              );
            })}

            <div className="pt-4 text-center text-sm text-gray-400">
              Don't have an account?{" "}
              <Link to="/register" className="text-brand hover:text-brand-light font-medium transition-colors">
                Create one
              </Link>
            </div>
          </div>
        )}

        {/* ── STEP 2: Login Form ── */}
        {step === 2 && (
          <div className="glass-card p-8">
            {/* Role badge */}
            <div className="flex items-center justify-between mb-6">
              <button
                onClick={handleBack}
                className="flex items-center space-x-1.5 text-gray-400 hover:text-white text-sm transition-colors group"
              >
                <ArrowLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
                <span>Change role</span>
              </button>
              <span
                className={`inline-flex items-center space-x-1.5 px-3 py-1 rounded-full text-xs font-semibold border ${roleConfig?.border} ${roleConfig?.bg}`}
              >
                {roleConfig && <roleConfig.icon className="w-3 h-3" style={{ color: "white" }} />}
                <span
                  className={`bg-gradient-to-r ${roleConfig?.gradient} bg-clip-text text-transparent`}
                >
                  {roleConfig?.label}
                </span>
              </span>
            </div>

            {error && (
              <div className="mb-6 p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm flex items-start space-x-3">
                <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="form-label">Email Address</label>
                <input
                  id="login-email"
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
                <label className="text-sm font-medium text-gray-400 block mb-2">Password</label>
                <input
                  id="login-password"
                  type="password"
                  required
                  className="form-input"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={loading}
                />
              </div>

              <button
                id="login-submit"
                type="submit"
                disabled={loading}
                className="btn-primary w-full py-3 flex items-center justify-center space-x-2"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span>Signing in...</span>
                  </>
                ) : (
                  <span>Sign In as {roleConfig?.label}</span>
                )}
              </button>
            </form>

            <button
              type="button"
              onClick={handleGoogleLogin}
              disabled={loading}
              className="mt-4 w-full py-3 rounded-xl border border-white/10 bg-white/5 text-white hover:bg-white/10 transition-colors flex items-center justify-center gap-3"
            >
              <img src="https://www.svgrepo.com/show/475656/google-color.svg" alt="Google" className="w-5 h-5" />
              <span>Sign in with Google</span>
            </button>

            <div className="mt-8 pt-6 border-t border-white/5 text-center text-sm text-gray-400">
              Don't have an account?{" "}
              <Link to="/register" className="text-brand hover:text-brand-light font-medium transition-colors">
                Create an account
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
