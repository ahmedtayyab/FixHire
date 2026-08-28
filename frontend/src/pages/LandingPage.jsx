import { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowRight, Sparkles, FileText, Briefcase, User, LogOut } from "lucide-react";
import { GITHUB_URL, LINKEDIN_URL } from "../config.js";
import { useAuth } from "../context/AuthContext";

function GitHubIcon({ className }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0 0 24 12c0-6.63-5.37-12-12-12z" />
    </svg>
  );
}

function LinkedInIcon({ className }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 1 1 0-4.124 2.062 2.062 0 0 1 0 4.124zM7.119 20.452H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
    </svg>
  );
}

export default function LandingPage() {
  const { user, isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();
  const videoFrameRef = useRef(null);
  const [videoStyle, setVideoStyle] = useState({
    transform: "perspective(1200px) scale(1) translateY(0px)",
    opacity: 1,
  });

  const dashboardPath = user?.role === "recruiter" ? "/recruiter" : "/candidate";

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  // Scroll-linked zoom / depth on the hero video preview.
  useEffect(() => {
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduceMotion) return undefined;

    let frameId = 0;

    const updateVideoDepth = () => {
      const el = videoFrameRef.current;
      if (!el) return;

      const rect = el.getBoundingClientRect();
      const viewport = window.innerHeight || 1;
      const elementCenter = rect.top + rect.height / 2;
      const viewportCenter = viewport * 0.48;

      // -1 = still below (approaching), 0 = centered (peak zoom), +1 = scrolled past
      const raw = (viewportCenter - elementCenter) / (viewport * 0.72);
      const t = Math.max(-1, Math.min(1, raw));
      // 1 at center, falls toward 0 as you approach or leave
      const focus = 1 - Math.abs(t);

      // Zoom in toward center, zoom out after scrolling past
      const scale = 0.92 + focus * 0.16;
      const translateY = t * 28;
      const rotateX = t * -5;
      const opacity = 0.78 + focus * 0.22;

      setVideoStyle({
        transform: `perspective(1200px) scale(${scale}) translateY(${translateY}px) rotateX(${rotateX}deg)`,
        opacity,
      });
    };

    const onScroll = () => {
      cancelAnimationFrame(frameId);
      frameId = requestAnimationFrame(updateVideoDepth);
    };

    updateVideoDepth();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);

    return () => {
      cancelAnimationFrame(frameId);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, []);

  // Soft reveal + scale-in for lower sections.
  useEffect(() => {
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduceMotion) return undefined;

    const nodes = document.querySelectorAll("[data-scroll-zoom]");
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-inview");
          }
        });
      },
      { threshold: 0.18, rootMargin: "0px 0px -8% 0px" }
    );

    nodes.forEach((node) => observer.observe(node));
    return () => observer.disconnect();
  }, []);

  return (
    <div className="landing-page flex flex-col justify-between overflow-hidden">

      {/* Header / Navbar */}
      <header className="landing-nav relative z-10">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="logo-mark">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <span className="text-lg font-semibold tracking-[-0.02em] text-white">
              FixHire
            </span>
          </div>

          <nav className="hidden md:flex items-center space-x-8">
            <a href="#features" className="text-xs font-medium uppercase tracking-wider text-zinc-400 hover:text-zinc-200 transition-colors">Features</a>
            <a href="#candidates" className="text-xs font-medium uppercase tracking-wider text-zinc-400 hover:text-zinc-200 transition-colors">For Candidates</a>
            <a href="#recruiters" className="text-xs font-medium uppercase tracking-wider text-zinc-400 hover:text-zinc-200 transition-colors">For Recruiters</a>
          </nav>

          <div className="flex items-center space-x-4">
            <div className="hidden sm:flex items-center gap-2 mr-1">
              <a
                href={GITHUB_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="p-2 rounded-lg text-zinc-400 hover:text-white hover:bg-white/5 transition-colors"
                aria-label="GitHub profile"
                title="GitHub"
              >
                <GitHubIcon className="w-4 h-4" />
              </a>
              <a
                href={LINKEDIN_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="p-2 rounded-lg text-zinc-400 hover:text-white hover:bg-white/5 transition-colors"
                aria-label="LinkedIn profile"
                title="LinkedIn"
              >
                <LinkedInIcon className="w-4 h-4" />
              </a>
            </div>

            {isAuthenticated ? (
              <>
                <div className="avatar-chip">
                  <User className="w-4 h-4 text-brand-light" />
                  <span className="font-medium">{user?.full_name}</span>
                </div>
                <Link to={dashboardPath} className="btn-hero-primary py-2 px-4">
                  Go to Dashboard
                </Link>
                <button
                  onClick={handleLogout}
                  className="btn-ghost p-2.5 rounded-lg border border-white/[0.08]"
                  title="Log Out"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </>
            ) : (
              <>
                <Link to="/login" className="text-sm font-medium text-zinc-400 hover:text-white transition-colors">
                  Sign In
                </Link>
                <Link to="/register" className="btn-hero-primary py-2 px-4">
                  Get Started
                </Link>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="flex-grow relative z-10">
        <section className="relative pt-16 pb-24 md:pt-28 md:pb-32 max-w-6xl mx-auto px-6 text-center">
          <div className="landing-micro-pill mb-6">
            <span className="relative flex h-2 w-2 shrink-0">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-50" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
            </span>
            <span>Next-Gen Recruitment with AI Matching</span>
          </div>

          <h1 className="landing-hero-title">
            Optimize Resumes.
            <br />
            Shortlist Top Candidates.
          </h1>

          <p className="max-w-xl mx-auto text-base md:text-lg text-zinc-400 font-normal leading-relaxed mb-10">
            FixHire is the dual-sided hiring platform helping applicants build standard ATS-compliant CVs and empowering recruiters to rank and filter candidates in minutes with AI-assisted insights.
          </p>

          <div className="flex flex-col sm:flex-row justify-center items-center gap-3">
            {isAuthenticated ? (
              <Link to={dashboardPath} className="btn-hero-primary w-full sm:w-auto">
                <span>Go to Dashboard</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            ) : (
              <Link to="/register" className="btn-hero-primary w-full sm:w-auto">
                <span>Start Free Trial</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            )}
            <a href="#features" className="btn-hero-secondary w-full sm:w-auto">
              Explore Features
            </a>
          </div>

          {/* Glowing Platform Preview Card — scroll-linked zoom depth */}
          <div
            ref={videoFrameRef}
            className="mt-16 relative glass-card p-3 shadow-2xl will-change-transform border-zinc-800/80"
            style={{
              transform: videoStyle.transform,
              opacity: videoStyle.opacity,
              transformOrigin: "center top",
              transition: "transform 80ms linear, opacity 80ms linear",
            }}
          >
            <div className="rounded-lg border border-zinc-800 bg-zinc-950/90 overflow-hidden aspect-[16/9] flex items-center justify-center relative group">
              <video
                src="/ai_matching_preview.mp4"
                className="w-full h-full object-cover scale-[1.02]"
                autoPlay
                loop
                muted
                playsInline
              />
              <div className="absolute inset-0 bg-gradient-to-t from-zinc-950/70 via-transparent to-transparent pointer-events-none" />
            </div>
          </div>
        </section>

        {/* Portals Comparison Section */}
        <section id="features" className="py-24 border-y border-white/[0.06] relative z-10">
          <div className="max-w-6xl mx-auto px-6">
            <div className="text-center mb-16" data-scroll-zoom>
              <h2 className="text-3xl md:text-4xl font-semibold tracking-[-0.03em] mb-4 text-zinc-50">Tailored Experience for Both Sides</h2>
              <p className="text-zinc-400 max-w-xl mx-auto">
                Whether you're looking for your next dream role or hiring the perfect candidate, FixHire has you covered.
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-8">
              {/* Candidate Side */}
              <div
                id="candidates"
                data-scroll-zoom
                className="glass-card glass-card-hover p-8 md:p-10 flex flex-col justify-between"
              >
                <div>
                  <div className="w-12 h-12 rounded-xl bg-brand/10 border border-brand/20 flex items-center justify-center text-brand mb-6">
                    <FileText className="w-6 h-6" />
                  </div>
                  <h3 className="text-2xl font-bold mb-4 text-white">For Candidates</h3>
                  <p className="text-zinc-400 mb-6 font-light leading-relaxed">
                    Stop submitting resumes to a black hole. Parse your PDF, measure your compliance score against any job description, receive missing skill tips, and generate interview questions tailored for you.
                  </p>
                  <ul className="space-y-3 mb-8 text-sm text-zinc-300">
                    <li className="flex items-center space-x-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-brand" />
                      <span>Instant ATS Compatibility Score</span>
                    </li>
                    <li className="flex items-center space-x-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-brand" />
                      <span>Missing Skill & Keyword Detection</span>
                    </li>
                    <li className="flex items-center space-x-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-brand" />
                      <span>STAR Bullet Point Rewriter & Cover Letter Generator</span>
                    </li>
                  </ul>
                </div>
                <Link to="/register" className="btn-secondary w-full text-center hover:bg-brand hover:border-brand">
                  Optimize My Resume
                </Link>
              </div>

              {/* Recruiter Side */}
              <div
                id="recruiters"
                data-scroll-zoom
                className="glass-card glass-card-hover p-8 md:p-10 flex flex-col justify-between"
                style={{ transitionDelay: "80ms" }}
              >
                <div>
                  <div className="w-12 h-12 rounded-xl bg-accent/10 border border-accent/20 flex items-center justify-center text-accent mb-6">
                    <Briefcase className="w-6 h-6" />
                  </div>
                  <h3 className="text-2xl font-bold mb-4 text-white">For Recruiters</h3>
                  <p className="text-zinc-400 mb-6 font-light leading-relaxed">
                    Skip manually scanning hundreds of resumes. Create job postings, upload applications in bulk, get precise candidate rankings based on compatibility, and view AI-assisted side-by-side matches.
                  </p>
                  <ul className="space-y-3 mb-8 text-sm text-zinc-300">
                    <li className="flex items-center space-x-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-accent" />
                      <span>Fast Multilingual PDF Parsing</span>
                    </li>
                    <li className="flex items-center space-x-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-accent" />
                      <span>Automated Ranking & Comparison Matrix</span>
                    </li>
                    <li className="flex items-center space-x-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-accent" />
                      <span>Shareable Apply Links & Instant AI Screening</span>
                    </li>
                  </ul>
                </div>
                <Link to="/register" className="btn-secondary w-full text-center hover:bg-accent hover:border-accent">
                  Access Recruiter Suite
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* Stats Section */}
        <section className="py-24 max-w-6xl mx-auto px-6 relative z-10" data-scroll-zoom>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="text-4xl md:text-5xl font-semibold tracking-[-0.03em] text-zinc-50 mb-2">95%</div>
              <div className="text-zinc-500 text-sm">ATS Compatibility Rate</div>
            </div>
            <div className="text-center">
              <div className="text-4xl md:text-5xl font-semibold tracking-[-0.03em] text-zinc-50 mb-2">10x</div>
              <div className="text-zinc-500 text-sm">Faster Screening Speed</div>
            </div>
            <div className="text-center col-span-2 md:col-span-1">
              <div className="text-4xl md:text-5xl font-semibold tracking-[-0.03em] text-zinc-50 mb-2">100%</div>
              <div className="text-zinc-500 text-sm">Data Privacy & Security</div>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-white/[0.06] py-8 bg-zinc-950 relative z-10">
        <div className="max-w-6xl mx-auto px-6 flex flex-col gap-6">
          <div className="flex flex-col md:flex-row items-center justify-between text-zinc-500 text-sm">
            <p>&copy; {new Date().getFullYear()} FixHire. All rights reserved.</p>
            <div className="flex items-center gap-2 mt-4 md:mt-0 text-zinc-400">
              <span>Built by</span>
              <span className="text-zinc-300 font-medium">Ahmad Tayyab</span>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-2 border-t border-white/5">
            <p className="text-xs text-zinc-500 uppercase tracking-wider">Connect with me</p>
            <div className="flex items-center gap-3">
              <a
                href={GITHUB_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 px-4 py-2 rounded-lg border border-white/10 bg-white/5 text-zinc-300 hover:text-white hover:border-brand/30 hover:bg-brand/10 transition-all text-sm font-medium"
                aria-label="GitHub profile"
              >
                <GitHubIcon className="w-4 h-4" />
                <span>GitHub</span>
              </a>
              <a
                href={LINKEDIN_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 px-4 py-2 rounded-lg border border-white/10 bg-white/5 text-zinc-300 hover:text-white hover:border-accent/30 hover:bg-accent/10 transition-all text-sm font-medium"
                aria-label="LinkedIn profile"
              >
                <LinkedInIcon className="w-4 h-4" />
                <span>LinkedIn</span>
              </a>
            </div>
          </div>
        </div>
      </footer>

    </div>
  );
}
