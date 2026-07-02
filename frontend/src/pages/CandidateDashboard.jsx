import { useAuth } from "../context/AuthContext";
import { LogOut, User, FileText, Sparkles, AlertTriangle } from "lucide-react";

export default function CandidateDashboard() {
  const { user, logout } = useAuth();

  return (
    <div className="min-h-screen flex flex-col justify-between">
      
      {/* Top Navbar */}
      <header className="border-b border-white/5 bg-dark-900/60 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-brand to-accent flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <span className="text-2xl font-extrabold tracking-tight text-white">
              FixHire
            </span>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-brand/10 text-brand-light border border-brand/20">
              Candidate
            </span>
          </div>

          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-3 px-3 py-1.5 rounded-xl bg-dark-800/40 border border-gray-800">
              <User className="w-4 h-4 text-brand-light" />
              <span className="text-sm font-medium text-gray-300">{user?.full_name}</span>
            </div>
            <button
              onClick={logout}
              className="p-2.5 rounded-xl border border-gray-800 text-gray-400 hover:text-white hover:bg-dark-800 transition-all duration-200"
              title="Log Out"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-grow max-w-7xl w-full mx-auto px-6 py-12">
        <div className="mb-8">
          <h1 className="text-3xl font-extrabold tracking-tight text-white">
            Welcome back, {user?.full_name}!
          </h1>
          <p className="text-gray-400 mt-2">
            Upload your resume and parse it against target jobs to measure your ATS compliance.
          </p>
        </div>

        {/* Dashboard Cards Grid */}
        <div className="grid md:grid-cols-3 gap-8">
          
          {/* Main Action Card */}
          <div className="glass-card p-8 md:col-span-2 flex flex-col justify-between border-brand/10">
            <div>
              <div className="w-12 h-12 rounded-xl bg-brand/10 border border-brand/25 flex items-center justify-center text-brand mb-6 animate-pulse-slow">
                <FileText className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold mb-3 text-white">Optimize Your Resume</h3>
              <p className="text-gray-400 mb-6 text-sm leading-relaxed">
                In Phase 2, you'll be able to drag-and-drop your resume PDF here, paste any job description, and automatically get detailed matching feedback, including missing keywords and resume improvements.
              </p>
            </div>
            
            <div className="flex items-center justify-center p-12 border-2 border-dashed border-gray-800 rounded-xl bg-dark-950/40">
              <div className="text-center">
                <FileText className="w-10 h-10 text-gray-600 mx-auto mb-4" />
                <p className="text-gray-500 text-sm">Resume Parser and ATS Scoring module will unlock in Phase 2</p>
              </div>
            </div>
          </div>

          {/* Quick Stats / History Sidebar */}
          <div className="glass-card p-8">
            <h3 className="text-xl font-bold mb-6 text-white">History & Progress</h3>
            
            <div className="flex items-center justify-center py-20 border border-gray-800/60 rounded-xl bg-dark-950/20 text-center">
              <div className="px-4">
                <AlertTriangle className="w-8 h-8 text-gray-600 mx-auto mb-3" />
                <h4 className="text-sm font-semibold text-gray-400">No analyses yet</h4>
                <p className="text-xs text-gray-500 mt-1">Your past resume optimizations will appear here once you run them.</p>
              </div>
            </div>
          </div>

        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-white/5 py-6 bg-dark-950/20">
        <div className="max-w-7xl mx-auto px-6 text-center text-gray-600 text-xs">
          <p>&copy; {new Date().getFullYear()} FixHire Candidate Workspace.</p>
        </div>
      </footer>

    </div>
  );
}
