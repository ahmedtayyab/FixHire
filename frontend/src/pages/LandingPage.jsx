import { Link } from "react-router-dom";
import { ArrowRight, Sparkles, FileText, BarChart2, ShieldCheck, Briefcase, Zap, Github, Linkedin } from "lucide-react";
import { GITHUB_URL, LINKEDIN_URL } from "../config.js";

export default function LandingPage() {
  return (
    <div className="relative min-h-screen flex flex-col justify-between overflow-hidden">
      
      {/* Decorative Glow Elements */}
      <div className="absolute top-[10%] left-[5%] w-[400px] h-[400px] rounded-full bg-brand/10 blur-[100px] pointer-events-none" />
      <div className="absolute bottom-[20%] right-[5%] w-[500px] h-[500px] rounded-full bg-accent/5 blur-[120px] pointer-events-none" />

      {/* Header / Navbar */}
      <header className="sticky top-0 z-50 border-b border-white/5 bg-dark-950/70 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-brand to-accent flex items-center justify-center shadow-lg shadow-brand/20">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <span className="text-2xl font-extrabold tracking-tight bg-gradient-to-r from-white via-gray-200 to-gray-400 bg-clip-text text-transparent">
              FixHire
            </span>
          </div>

          <nav className="hidden md:flex items-center space-x-8 text-sm font-medium text-gray-400">
            <a href="#features" className="hover:text-white transition-colors">Features</a>
            <a href="#candidates" className="hover:text-white transition-colors">For Candidates</a>
            <a href="#recruiters" className="hover:text-white transition-colors">For Recruiters</a>
          </nav>

          <div className="flex items-center space-x-4">
            <Link to="/login" className="text-sm font-medium text-gray-300 hover:text-white transition-colors">
              Sign In
            </Link>
            <Link to="/register" className="btn-primary py-2 px-4 text-sm rounded-lg shadow-none">
              Get Started
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="flex-grow">
        <section className="relative pt-20 pb-24 md:pt-32 md:pb-36 max-w-7xl mx-auto px-6 text-center">
          <div className="inline-flex items-center space-x-2 px-3 py-1.5 rounded-full bg-brand-glow border border-brand/20 text-brand-light text-xs font-semibold uppercase tracking-wider mb-8 animate-pulse-slow">
            <Zap className="w-3.5 h-3.5" />
            <span>Next-Gen Recruitment with AI Matching</span>
          </div>

          <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight leading-none mb-8">
            <span className="bg-gradient-to-r from-white via-gray-200 to-gray-400 bg-clip-text text-transparent">
              Optimize Resumes.
            </span>
            <br />
            <span className="bg-gradient-to-r from-brand-light via-brand to-accent bg-clip-text text-transparent">
              Shortlist Top Candidates.
            </span>
          </h1>

          <p className="max-w-2xl mx-auto text-lg md:text-xl text-gray-400 mb-12 font-light leading-relaxed">
            FixHire is the dual-sided hiring platform helping applicants build standard ATS-compliant CVs and empowering recruiters to rank and filter candidates in minutes with AI-assisted insights.
          </p>

          <div className="flex flex-col sm:flex-row justify-center items-center gap-4">
            <Link to="/register" className="btn-primary w-full sm:w-auto flex items-center justify-center space-x-2">
              <span>Start Free Trial</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
            <a href="#features" className="btn-secondary w-full sm:w-auto">
              Explore Features
            </a>
          </div>

          {/* Glowing Platform Preview Card */}
          <div className="mt-20 relative rounded-2xl border border-white/5 bg-dark-900/40 p-4 shadow-2xl">
            <div className="absolute inset-0 bg-brand/5 blur-3xl rounded-3xl -z-10" />
            <div className="rounded-xl border border-white/5 bg-dark-950/80 overflow-hidden aspect-[16/9] flex items-center justify-center">
              <div className="text-center p-8">
                <div className="w-16 h-16 rounded-full bg-brand-glow border border-brand/20 flex items-center justify-center mx-auto mb-6">
                  <Sparkles className="w-8 h-8 text-brand" />
                </div>
                <h3 className="text-2xl font-bold mb-2">AI Matching Preview</h3>
                <p className="text-gray-400 max-w-md mx-auto text-sm">
                  Register or sign in to experience real-time resume parsing, automated ATS scoring, and recruiter ranking dashboards.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Portals Comparison Section */}
        <section id="features" className="py-24 bg-dark-900/20 border-y border-white/5">
          <div className="max-w-7xl mx-auto px-6">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-bold mb-4">Tailored Experience for Both Sides</h2>
              <p className="text-gray-400 max-w-xl mx-auto">
                Whether you're looking for your next dream role or hiring the perfect candidate, FixHire has you covered.
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-8">
              {/* Candidate Side */}
              <div id="candidates" className="glass-card p-8 md:p-10 flex flex-col justify-between hover:border-brand/20 transition-all duration-300">
                <div>
                  <div className="w-12 h-12 rounded-xl bg-brand/10 border border-brand/20 flex items-center justify-center text-brand mb-6">
                    <FileText className="w-6 h-6" />
                  </div>
                  <h3 className="text-2xl font-bold mb-4 text-white">For Candidates</h3>
                  <p className="text-gray-400 mb-6 font-light leading-relaxed">
                    Stop submitting resumes to a black hole. Parse your PDF, measure your compliance score against any job description, receive missing skill tips, and generate interview questions tailored for you.
                  </p>
                  <ul className="space-y-3 mb-8 text-sm text-gray-300">
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
              <div id="recruiters" className="glass-card p-8 md:p-10 flex flex-col justify-between hover:border-accent/20 transition-all duration-300">
                <div>
                  <div className="w-12 h-12 rounded-xl bg-accent/10 border border-accent/20 flex items-center justify-center text-accent mb-6">
                    <Briefcase className="w-6 h-6" />
                  </div>
                  <h3 className="text-2xl font-bold mb-4 text-white">For Recruiters</h3>
                  <p className="text-gray-400 mb-6 font-light leading-relaxed">
                    Skip manually scanning hundreds of resumes. Create job postings, upload applications in bulk, get precise candidate rankings based on compatibility, and view AI-assisted side-by-side matches.
                  </p>
                  <ul className="space-y-3 mb-8 text-sm text-gray-300">
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
                      <span>Company Knowledge Base Integration (RAG)</span>
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
        <section className="py-24 max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            <div className="text-center">
              <div className="text-4xl md:text-5xl font-extrabold text-white mb-2">95%</div>
              <div className="text-gray-400 text-sm">ATS Compatibility Rate</div>
            </div>
            <div className="text-center">
              <div className="text-4xl md:text-5xl font-extrabold text-brand-light mb-2">10x</div>
              <div className="text-gray-400 text-sm">Faster Screening Speed</div>
            </div>
            <div className="text-center">
              <div className="text-4xl md:text-5xl font-extrabold text-accent mb-2">&lt;3s</div>
              <div className="text-gray-400 text-sm">AI Response Speed</div>
            </div>
            <div className="text-center">
              <div className="text-4xl md:text-5xl font-extrabold text-white mb-2">100%</div>
              <div className="text-gray-400 text-sm">Data Privacy & Security</div>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-white/5 py-8 bg-dark-950">
        <div className="max-w-7xl mx-auto px-6 flex flex-col gap-6">
          <div className="flex flex-col md:flex-row items-center justify-between text-gray-500 text-sm">
            <p>&copy; {new Date().getFullYear()} FixHire. All rights reserved.</p>
            <div className="flex items-center gap-2 mt-4 md:mt-0 text-gray-400">
              <span>Built by</span>
              <span className="text-gray-300 font-medium">Ahmad Tayyab</span>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-2 border-t border-white/5">
            <p className="text-xs text-gray-500 uppercase tracking-wider">Connect with me</p>
            <div className="flex items-center gap-3">
              <a
                href={GITHUB_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 px-4 py-2 rounded-lg border border-white/10 bg-white/5 text-gray-300 hover:text-white hover:border-brand/30 hover:bg-brand/10 transition-all text-sm font-medium"
                aria-label="GitHub profile"
              >
                <Github className="w-4 h-4" />
                <span>GitHub</span>
              </a>
              <a
                href={LINKEDIN_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 px-4 py-2 rounded-lg border border-white/10 bg-white/5 text-gray-300 hover:text-white hover:border-accent/30 hover:bg-accent/10 transition-all text-sm font-medium"
                aria-label="LinkedIn profile"
              >
                <Linkedin className="w-4 h-4" />
                <span>LinkedIn</span>
              </a>
            </div>
          </div>
        </div>
      </footer>

    </div>
  );
}
