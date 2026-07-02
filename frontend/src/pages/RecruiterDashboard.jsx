import { useAuth } from "../context/AuthContext";
import { LogOut, User, Sparkles, Briefcase, BarChart2, Users, AlertTriangle } from "lucide-react";

export default function RecruiterDashboard() {
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
            <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-accent/10 text-accent-light border border-accent/20">
              Recruiter
            </span>
          </div>

          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-3 px-3 py-1.5 rounded-xl bg-dark-800/40 border border-gray-800">
              <User className="w-4 h-4 text-accent-light" />
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
            Recruiter Dashboard
          </h1>
          <p className="text-gray-400 mt-2">
            Manage your open jobs, upload applicant PDFs, and let Gemini rank candidate matches automatically.
          </p>
        </div>

        {/* Overview Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
          <div className="glass-card p-6 flex items-center space-x-4">
            <div className="w-10 h-10 rounded-lg bg-brand/10 border border-brand/20 flex items-center justify-center text-brand">
              <Briefcase className="w-5 h-5" />
            </div>
            <div>
              <div className="text-2xl font-bold text-white">0</div>
              <div className="text-xs text-gray-500 font-medium uppercase tracking-wider mt-0.5">Active Job Postings</div>
            </div>
          </div>

          <div className="glass-card p-6 flex items-center space-x-4">
            <div className="w-10 h-10 rounded-lg bg-accent/10 border border-accent/20 flex items-center justify-center text-accent">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <div className="text-2xl font-bold text-white">0</div>
              <div className="text-xs text-gray-500 font-medium uppercase tracking-wider mt-0.5">Parsed Candidates</div>
            </div>
          </div>

          <div className="glass-card p-6 flex items-center space-x-4">
            <div className="w-10 h-10 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
              <BarChart2 className="w-5 h-5" />
            </div>
            <div>
              <div className="text-2xl font-bold text-white">0%</div>
              <div className="text-xs text-gray-500 font-medium uppercase tracking-wider mt-0.5">Avg Match Compatibility</div>
            </div>
          </div>
        </div>

        {/* Dashboard Grid */}
        <div className="grid md:grid-cols-3 gap-8">
          
          {/* Main Action Area */}
          <div className="glass-card p-8 md:col-span-2 flex flex-col justify-between border-accent/10">
            <div>
              <h3 className="text-xl font-bold mb-3 text-white">Job Postings & Screenings</h3>
              <p className="text-gray-400 mb-6 text-sm leading-relaxed">
                In Phase 4, you'll be able to create new job profiles, specify required skills and background experience, upload candidate profiles in bulk, and evaluate them side-by-side using real-time AI scoring matrices.
              </p>
            </div>
            
            <div className="flex items-center justify-center py-20 border border-gray-800/60 rounded-xl bg-dark-950/20 text-center">
              <div>
                <AlertTriangle className="w-8 h-8 text-gray-600 mx-auto mb-3" />
                <h4 className="text-sm font-semibold text-gray-400">No Job Postings Yet</h4>
                <p className="text-xs text-gray-500 mt-1">Recruiter job dashboard and matching tools will unlock in Phase 4.</p>
              </div>
            </div>
          </div>

          {/* RAG Information Sidebar */}
          <div className="glass-card p-8 flex flex-col justify-between">
            <div>
              <h3 className="text-xl font-bold mb-4 text-white">Company Context (RAG)</h3>
              <p className="text-gray-400 text-sm leading-relaxed mb-6">
                When enabled in Phase 5, you'll be able to upload internal knowledge books, HR policies, and values files. The AI will cross-reference this isolated context to screen candidates against your company's actual handbook values.
              </p>
            </div>
            <div className="p-4 rounded-xl bg-white/5 border border-white/5 text-xs text-gray-400">
              <span className="font-semibold text-gray-300 block mb-1">RAG Status</span>
              RAG features are optional and currently disabled. The system runs fully without vector search.
            </div>
          </div>

        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-white/5 py-6 bg-dark-950/20">
        <div className="max-w-7xl mx-auto px-6 text-center text-gray-600 text-xs">
          <p>&copy; {new Date().getFullYear()} FixHire Recruiter Workspace.</p>
        </div>
      </footer>

    </div>
  );
}
