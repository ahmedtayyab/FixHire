import { useState, useEffect, useRef } from "react";
import { useAuth } from "../context/AuthContext";
import { api } from "../services/api";
import { 
  LogOut, 
  User, 
  Sparkles, 
  Briefcase, 
  BarChart2, 
  Users, 
  AlertTriangle, 
  Plus, 
  Trash2, 
  UploadCloud, 
  CheckCircle2, 
  XCircle, 
  HelpCircle, 
  FileText, 
  ChevronRight, 
  X, 
  Loader2, 
  MapPin, 
  Clock, 
  Check, 
  Search,
  Copy,
  ExternalLink
} from "lucide-react";

export default function RecruiterDashboard() {
  const { user, logout } = useAuth();
  
  // Dashboard States
  const [jobs, setJobs] = useState([]);
  const [selectedJob, setSelectedJob] = useState(null);
  const [selectedCandidate, setSelectedCandidate] = useState(null);
  
  // Loaders & Errors
  const [loadingJobs, setLoadingJobs] = useState(true);
  const [loadingJobDetail, setLoadingJobDetail] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState("");
  
  // Modals
  const [showPostJobModal, setShowPostJobModal] = useState(false);
  const [showResumeModal, setShowResumeModal] = useState(false);
  const [copied, setCopied] = useState(false);
  
  // Search & Filter States
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [scoreFilter, setScoreFilter] = useState("");
  
  const [newJob, setNewJob] = useState({
    title: "",
    location: "",
    requirements: "",
    description: ""
  });

  // Candidate Panel tab state
  const [activeTab, setActiveTab] = useState("overview");

  // File Upload Ref
  const fileInputRef = useRef(null);

  // Load recruiter jobs on mount
  useEffect(() => {
    fetchJobs();
  }, []);

  const fetchJobs = async (selectFirst = true) => {
    setLoadingJobs(true);
    setError("");
    try {
      const jobList = await api.jobs.list();
      setJobs(jobList);
      if (selectFirst && jobList.length > 0) {
        // Automatically fetch details of the first job
        fetchJobDetails(jobList[0].id);
      } else if (jobList.length === 0) {
        setSelectedJob(null);
        setSelectedCandidate(null);
      }
    } catch (err) {
      console.error(err);
      setError("Failed to fetch jobs listing.");
    } finally {
      setLoadingJobs(false);
    }
  };

  const fetchJobDetails = async (jobId) => {
    setLoadingJobDetail(true);
    setError("");
    
    // Reset search and filters on job change
    setSearchQuery("");
    setStatusFilter("");
    setScoreFilter("");
    
    try {
      const details = await api.jobs.get(jobId);
      setSelectedJob(details);
      
      // Auto-select first candidate screening if available
      if (details.screenings && details.screenings.length > 0) {
        // Sort screenings by compatibility score descending by default
        const sorted = [...details.screenings].sort((a, b) => b.compatibility_score - a.compatibility_score);
        setSelectedJob({ ...details, screenings: sorted });
        setSelectedCandidate(sorted[0]);
      } else {
        setSelectedCandidate(null);
      }
    } catch (err) {
      console.error(err);
      setError("Failed to load job details.");
    } finally {
      setLoadingJobDetail(false);
    }
  };

  const handlePostJob = async (e) => {
    e.preventDefault();
    if (!newJob.title || !newJob.description) {
      setError("Please fill out Job Title and Job Description.");
      return;
    }
    setActionLoading(true);
    setError("");
    try {
      const created = await api.jobs.create(newJob);
      setJobs(prev => [created, ...prev]);
      setShowPostJobModal(false);
      setNewJob({ title: "", location: "", requirements: "", description: "" });
      // Fetch details of the newly created job
      await fetchJobDetails(created.id);
    } catch (err) {
      console.error(err);
      setError("Failed to create job posting.");
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteJob = async (jobId) => {
    if (!window.confirm("Are you sure you want to delete this job posting? All candidate screening reports will be permanently lost.")) {
      return;
    }
    setActionLoading(true);
    setError("");
    try {
      await api.jobs.delete(jobId);
      await fetchJobs(true);
    } catch (err) {
      console.error(err);
      setError("Failed to delete job posting.");
    } finally {
      setActionLoading(false);
    }
  };

  const handleScreenFiles = async (files) => {
    if (!selectedJob) return;
    if (files.length === 0) return;
    
    setUploading(true);
    setError("");
    try {
      const uploadedScreenings = await api.jobs.screen(selectedJob.id, files);
      
      // Re-fetch job details to load fresh sorted screening list
      await fetchJobDetails(selectedJob.id);
      
      // Find the best new candidate from the freshly uploaded ones to auto-select
      if (uploadedScreenings.length > 0) {
        const bestNew = [...uploadedScreenings].sort((a, b) => b.compatibility_score - a.compatibility_score)[0];
        setSelectedCandidate(bestNew);
      }
    } catch (err) {
      console.error(err);
      setError(err.message || "Failed to screen resumes. Ensure they are valid PDF documents.");
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
  };

  const handleDrop = async (e) => {
    e.preventDefault();
    if (uploading) return;
    const files = Array.from(e.dataTransfer.files);
    await handleScreenFiles(files);
  };

  const handleFileSelectChange = async (e) => {
    if (uploading) return;
    const files = Array.from(e.target.files);
    await handleScreenFiles(files);
  };

  const handleDeleteScreening = async (screeningId, e) => {
    e.stopPropagation(); // Prevent row click from firing
    if (!window.confirm("Are you sure you want to delete this candidate screening?")) {
      return;
    }
    setActionLoading(true);
    setError("");
    try {
      await api.jobs.deleteScreening(screeningId);
      
      // Update local state directly to avoid full reload flicker
      const updatedScreenings = selectedJob.screenings.filter(s => s.id !== screeningId);
      setSelectedJob(prev => ({ ...prev, screenings: updatedScreenings }));
      
      if (selectedCandidate && selectedCandidate.id === screeningId) {
        setSelectedCandidate(updatedScreenings.length > 0 ? updatedScreenings[0] : null);
      }
    } catch (err) {
      console.error(err);
      setError("Failed to delete candidate screening.");
    } finally {
      setActionLoading(false);
    }
  };

  // Helper to color-code compatibility score
  const getScoreColor = (score) => {
    if (score >= 80) return "text-emerald-400 border-emerald-500/20 bg-emerald-500/5";
    if (score >= 50) return "text-amber-400 border-amber-500/20 bg-amber-500/5";
    return "text-rose-400 border-rose-500/20 bg-rose-500/5";
  };

  const getScoreRingColor = (score) => {
    if (score >= 80) return "stroke-emerald-400";
    if (score >= 50) return "stroke-amber-400";
    return "stroke-rose-500";
  };

  const getScoreBadgeClass = (score) => {
    if (score >= 80) return "bg-emerald-500/10 text-emerald-400 border-emerald-500/20";
    if (score >= 50) return "bg-amber-500/10 text-amber-400 border-amber-500/20";
    return "bg-rose-500/10 text-rose-400 border-rose-500/20";
  };

  const getRecommendationBadgeColor = (rec) => {
    const r = rec?.toLowerCase() || "";
    if (r.includes("strong") || r.includes("hire")) {
      return "bg-emerald-500/20 text-emerald-300 border-emerald-500/30";
    }
    if (r.includes("proceed") || r.includes("interview")) {
      return "bg-amber-500/20 text-amber-300 border-amber-500/30";
    }
    if (r.includes("hold")) {
      return "bg-orange-500/20 text-orange-300 border-orange-500/30";
    }
    return "bg-rose-500/20 text-rose-300 border-rose-500/30";
  };

  const handleCopyLink = () => {
    if (!selectedJob) return;
    const url = `${window.location.origin}/apply/${selectedJob.id}`;
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const getFilteredScreenings = () => {
    if (!selectedJob || !selectedJob.screenings) return [];
    
    return selectedJob.screenings.filter(scr => {
      const query = searchQuery.toLowerCase().trim();
      const nameMatch = scr.candidate_name.toLowerCase().includes(query);
      const textMatch = (scr.resume_text || "").toLowerCase().includes(query);
      const searchMatch = !query || nameMatch || textMatch;
      
      const recommendation = (scr.analysis_results.decision_recommendation || "").toLowerCase();
      let statusMatch = true;
      if (statusFilter) {
        statusMatch = recommendation.includes(statusFilter.toLowerCase());
      }
      
      let scoreMatch = true;
      if (scoreFilter) {
        const score = scr.compatibility_score;
        if (scoreFilter === "high") {
          scoreMatch = score >= 80;
        } else if (scoreFilter === "mid") {
          scoreMatch = score >= 50 && score < 80;
        } else if (scoreFilter === "low") {
          scoreMatch = score < 50;
        }
      }
      
      return searchMatch && statusMatch && scoreMatch;
    });
  };

  const filteredScreenings = getFilteredScreenings();

  // Stats calculation
  const totalScreenings = selectedJob?.screenings?.length || 0;
  const avgScore = totalScreenings > 0 
    ? Math.round(selectedJob.screenings.reduce((sum, s) => sum + s.compatibility_score, 0) / totalScreenings) 
    : 0;
  const strongHires = selectedJob?.screenings?.filter(s => 
    (s.analysis_results.decision_recommendation || "").toLowerCase().includes("strong")
  ).length || 0;

  return (
    <div className="min-h-screen flex flex-col justify-between text-gray-100 selection:bg-brand selection:text-white">
      
      {/* Top Navbar */}
      <header className="border-b border-white/5 bg-dark-900/60 backdrop-blur-md sticky top-0 z-30">
        <div className="max-w-[1536px] mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-brand to-accent flex items-center justify-center shadow-lg shadow-brand/10">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <span className="text-2xl font-extrabold tracking-tight text-white bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-300">
              FixHire
            </span>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-brand/10 text-brand-light border border-brand/20">
              Recruiter Workspace
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

      {/* Main Workspace Layout */}
      <main className="flex-grow flex w-full max-w-[1536px] mx-auto px-6 py-8 gap-8 overflow-hidden">
        
        {/* Left Column: Job Postings Sidebar */}
        <section className="w-64 shrink-0 flex flex-col gap-4 max-h-[calc(100vh-12rem)]">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <Briefcase className="w-4 h-4 text-brand" />
              Active Jobs
            </h2>
            <button
              onClick={() => setShowPostJobModal(true)}
              className="p-1.5 rounded-lg bg-brand/10 border border-brand/20 text-brand hover:bg-brand/20 transition-all duration-200"
              title="Post New Job"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>

          <div className="flex-grow overflow-y-auto pr-2 flex flex-col gap-3">
            {loadingJobs ? (
              <div className="flex flex-col items-center justify-center py-10 gap-2">
                <Loader2 className="w-6 h-6 animate-spin text-brand" />
                <span className="text-xs text-gray-500">Loading jobs...</span>
              </div>
            ) : jobs.length === 0 ? (
              <div className="text-center py-8 px-4 rounded-xl border border-gray-800/50 bg-dark-900/20">
                <AlertTriangle className="w-6 h-6 text-gray-600 mx-auto mb-2" />
                <p className="text-xs text-gray-400">No jobs posted yet.</p>
                <button
                  onClick={() => setShowPostJobModal(true)}
                  className="mt-3 px-3 py-1.5 rounded-lg bg-brand text-white text-xs font-medium hover:bg-brand-dark transition-all duration-200"
                >
                  Create One Now
                </button>
              </div>
            ) : (
              jobs.map(job => (
                <div
                  key={job.id}
                  onClick={() => fetchJobDetails(job.id)}
                  className={`p-4 rounded-xl border transition-all duration-200 cursor-pointer text-left ${
                    selectedJob?.id === job.id
                      ? "border-brand/40 bg-brand/5 shadow-md shadow-brand/5"
                      : "border-gray-800/80 bg-dark-900/30 hover:border-gray-700 hover:bg-dark-900/50"
                  }`}
                >
                  <h3 className="font-semibold text-sm text-white truncate">{job.title}</h3>
                  <div className="flex items-center gap-1 text-[11px] text-gray-500 mt-2">
                    <MapPin className="w-3 h-3" />
                    <span>{job.location || "Remote"}</span>
                  </div>
                  <div className="flex items-center justify-between mt-3 pt-2 border-t border-white/5">
                    <span className="text-[10px] text-gray-600">
                      {new Date(job.created_at).toLocaleDateString()}
                    </span>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteJob(job.id);
                      }}
                      className="text-gray-600 hover:text-rose-400 transition-colors p-1"
                      title="Delete Job"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </section>

        {/* Center & Right Column: Details & Evaluation Workspace */}
        <section className="flex-grow flex gap-8 max-h-[calc(100vh-12rem)]">
          {selectedJob ? (
            <>
              {/* Center Panel: Upload CVs & Matrix Table */}
              <div className="w-[65%] flex flex-col gap-6 overflow-hidden pr-2">
                
                {/* Selected Job Meta */}
                <div className="glass-card p-6 border-brand/10">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <h1 className="text-xl font-extrabold text-white">{selectedJob.title}</h1>
                      <div className="flex gap-4 mt-2">
                        <span className="text-xs text-gray-400 flex items-center gap-1">
                          <MapPin className="w-3.5 h-3.5 text-brand" /> {selectedJob.location || "Remote"}
                        </span>
                        <span className="text-xs text-gray-400 flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5 text-brand" /> Posted {new Date(selectedJob.created_at).toLocaleDateString()}
                        </span>
                      </div>
                    </div>

                    <button
                      onClick={handleCopyLink}
                      className="btn-secondary text-xs px-3 py-1.5 flex items-center gap-1.5 border-brand/20 text-brand-light hover:bg-brand/10 shrink-0"
                    >
                      {copied ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-emerald-400" /> Copied!
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5" /> Copy Apply Link
                        </>
                      )}
                    </button>
                  </div>

                  {selectedJob.requirements && (
                    <div className="mt-4 flex flex-wrap gap-1.5">
                      {selectedJob.requirements.split(',').map((req, idx) => (
                        <span key={idx} className="px-2 py-0.5 rounded bg-white/5 border border-white/5 text-[10px] text-gray-400">
                          {req.trim()}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                {/* Stats & Resume Upload Row */}
                <div className="grid grid-cols-1 xl:grid-cols-12 gap-4">
                  {/* Job Stats Cards */}
                  <div className="xl:col-span-7 grid grid-cols-3 gap-3">
                    <div className="glass-card p-3 flex flex-col justify-center items-center text-center gap-1.5 h-full">
                      <div className="w-8 h-8 rounded-lg bg-brand/10 border border-brand/20 flex items-center justify-center text-brand shrink-0">
                        <Users className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="text-base font-extrabold text-white">{totalScreenings}</div>
                        <div className="text-[9px] text-gray-500 uppercase tracking-wider font-semibold">Applicants</div>
                      </div>
                    </div>

                    <div className="glass-card p-3 flex flex-col justify-center items-center text-center gap-1.5 h-full">
                      <div className="w-8 h-8 rounded-lg bg-accent/10 border border-accent/20 flex items-center justify-center text-accent shrink-0">
                        <BarChart2 className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="text-base font-extrabold text-white">{avgScore}%</div>
                        <div className="text-[9px] text-gray-500 uppercase tracking-wider font-semibold">Avg Match</div>
                      </div>
                    </div>

                    <div className="glass-card p-3 flex flex-col justify-center items-center text-center gap-1.5 h-full">
                      <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 shrink-0">
                        <CheckCircle2 className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="text-base font-extrabold text-white">{strongHires}</div>
                        <div className="text-[9px] text-gray-500 uppercase tracking-wider font-semibold">Strong Fits</div>
                      </div>
                    </div>
                  </div>

                  {/* Compact Resume Dropzone */}
                  <div className="xl:col-span-5">
                    <div
                      onDragOver={handleDragOver}
                      onDrop={handleDrop}
                      onClick={() => fileInputRef.current?.click()}
                      className={`glass-card p-3 border-dashed border-2 flex flex-col items-center justify-center text-center cursor-pointer transition-all duration-300 h-full min-h-[110px] ${
                        uploading
                          ? "border-brand bg-brand/5 pointer-events-none"
                          : "border-gray-800 hover:border-brand/40 hover:bg-dark-900/40"
                      }`}
                    >
                      <input
                        type="file"
                        ref={fileInputRef}
                        multiple
                        accept=".pdf"
                        onChange={handleFileSelectChange}
                        className="hidden"
                      />
                      {uploading ? (
                        <div className="py-1">
                          <Loader2 className="w-6 h-6 animate-spin text-brand mx-auto mb-2" />
                          <h4 className="text-xs font-semibold text-white">Analyzing Candidates...</h4>
                          <p className="text-[9px] text-gray-400 mt-0.5">Extracting resume details with AI.</p>
                        </div>
                      ) : (
                        <>
                          <div className="w-8 h-8 rounded-lg bg-brand/10 flex items-center justify-center text-brand mb-1.5 shrink-0">
                            <UploadCloud className="w-4 h-4" />
                          </div>
                          <h4 className="text-xs font-semibold text-white">Upload Applicant Resumes</h4>
                          <p className="text-[9px] text-gray-400 mt-0.5">Drag & drop PDFs or click to browse</p>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                {/* Candidate Screenings Matrix Table */}
                <div className="glass-card overflow-hidden flex flex-col flex-grow min-h-0">
                  <div className="px-6 py-4 border-b border-white/5 flex items-center justify-between">
                    <h3 className="text-sm font-bold text-white">Screening Matrix</h3>
                    <span className="text-[11px] text-gray-500">Sorted by match score</span>
                  </div>

                  {/* Filters Bar */}
                  {selectedJob.screenings && selectedJob.screenings.length > 0 && (
                    <div className="px-6 py-3 bg-white/2 border-b border-white/5 flex flex-col md:flex-row gap-3">
                      {/* Search Input */}
                      <div className="relative flex-grow">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-500">
                          <Search className="w-4 h-4" />
                        </div>
                        <input
                          type="text"
                          placeholder="Search by name or keyword..."
                          value={searchQuery}
                          onChange={e => setSearchQuery(e.target.value)}
                          className="form-input pl-9 text-xs py-2 w-full bg-dark-950/60 border-white/5 focus:border-brand/40"
                        />
                      </div>

                      {/* Status Filter */}
                      <select
                        value={statusFilter}
                        onChange={e => setStatusFilter(e.target.value)}
                        className="form-input text-xs py-2 px-3 bg-dark-950/60 border-white/5 focus:border-brand/40 md:w-36"
                      >
                        <option value="">All Recommendations</option>
                        <option value="strong">Strong Hire</option>
                        <option value="proceed">Proceed</option>
                        <option value="hold">Hold</option>
                        <option value="no match">No Match</option>
                      </select>

                      {/* Score Filter */}
                      <select
                        value={scoreFilter}
                        onChange={e => setScoreFilter(e.target.value)}
                        className="form-input text-xs py-2 px-3 bg-dark-950/60 border-white/5 focus:border-brand/40 md:w-36"
                      >
                        <option value="">All Match Scores</option>
                        <option value="high">{"Excellent (>= 80%)"}</option>
                        <option value="mid">{"Average (50-80%)"}</option>
                        <option value="low">{"Low (< 50%)"}</option>
                      </select>
                    </div>
                  )}

                  {loadingJobDetail ? (
                    <div className="flex flex-col items-center justify-center py-16 gap-3">
                      <Loader2 className="w-8 h-8 animate-spin text-brand" />
                      <span className="text-xs text-gray-400">Loading screening list...</span>
                    </div>
                  ) : !selectedJob.screenings || selectedJob.screenings.length === 0 ? (
                    <div className="text-center py-16 px-4">
                      <AlertTriangle className="w-8 h-8 text-gray-700 mx-auto mb-3" />
                      <h4 className="text-sm font-semibold text-gray-400">No Screened Candidates Yet</h4>
                      <p className="text-xs text-gray-500 mt-1 max-w-xs mx-auto">
                        Upload some applicant PDF resumes above to evaluate them side-by-side with AI insights.
                      </p>
                    </div>
                  ) : filteredScreenings.length === 0 ? (
                    <div className="text-center py-16 px-4">
                      <Search className="w-8 h-8 text-gray-700 mx-auto mb-3" />
                      <h4 className="text-sm font-semibold text-gray-400">No Matches Found</h4>
                      <p className="text-xs text-gray-500 mt-1 max-w-xs mx-auto">
                        Adjust your search queries or change your status and score filters to see candidates.
                      </p>
                    </div>
                  ) : (
                    <div className="overflow-auto flex-grow min-h-0">
                      <table className="w-full text-left border-collapse">
                        <thead>
                          <tr className="border-b border-white/5 bg-white/2">
                            <th className="px-6 py-3.5 text-xs font-semibold text-gray-400 uppercase tracking-wider">Candidate</th>
                            <th className="px-6 py-3.5 text-xs font-semibold text-gray-400 uppercase tracking-wider text-center">Score</th>
                            <th className="px-6 py-3.5 text-xs font-semibold text-gray-400 uppercase tracking-wider">Fit Recommendation</th>
                            <th className="px-6 py-3.5 text-xs font-semibold text-gray-400 uppercase tracking-wider text-right"></th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                          {filteredScreenings.map(scr => (
                            <tr
                              key={scr.id}
                              onClick={() => setSelectedCandidate(scr)}
                              className={`group cursor-pointer transition-colors duration-150 ${
                                selectedCandidate?.id === scr.id
                                  ? "bg-brand/5 hover:bg-brand/10"
                                  : "hover:bg-white/2"
                              }`}
                            >
                              <td className="px-6 py-4">
                                <div className="flex items-center gap-2">
                                  <span className="font-semibold text-sm text-white group-hover:text-brand-light transition-colors">
                                    {scr.candidate_name}
                                  </span>
                                  <a
                                    href={`http://localhost:8000/api/jobs/screenings/${scr.id}/pdf?token=${localStorage.getItem("fixhire_token")}`}
                                    target="_blank"
                                    rel="noreferrer"
                                    onClick={(e) => e.stopPropagation()}
                                    className="p-1 text-gray-400 hover:text-brand hover:bg-brand/10 rounded transition-all"
                                    title="Open original PDF resume in a new tab"
                                  >
                                    <ExternalLink className="w-3.5 h-3.5" />
                                  </a>
                                </div>
                                <div className="text-[11px] text-gray-500 flex items-center gap-1.5 mt-1">
                                  <FileText className="w-3 h-3" />
                                  <span className="truncate max-w-[150px]" title={scr.resume_filename}>
                                    {scr.resume_filename}
                                  </span>
                                </div>
                              </td>
                              <td className="px-6 py-4 text-center">
                                <span className={`inline-block px-2.5 py-1 rounded-lg text-xs font-extrabold border ${getScoreBadgeClass(scr.compatibility_score)}`}>
                                  {scr.compatibility_score}%
                                </span>
                              </td>
                              <td className="px-6 py-4">
                                <span className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-semibold border ${getRecommendationBadgeColor(scr.analysis_results.decision_recommendation)}`}>
                                  {scr.analysis_results.decision_recommendation || "Needs Review"}
                                </span>
                              </td>
                              <td className="px-6 py-4 text-right">
                                <button
                                  onClick={(e) => handleDeleteScreening(scr.id, e)}
                                  className="text-gray-600 hover:text-rose-400 transition-colors p-1 opacity-0 group-hover:opacity-100 focus:opacity-100"
                                  title="Delete screening report"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>

              </div>

              {/* Right Panel: Side-by-side Gemini Screening Dossier */}
              <div className="w-[35%] flex flex-col gap-4 max-h-[calc(100vh-12rem)] overflow-y-auto pr-2">
                {selectedCandidate ? (
                  <div className="glass-card flex-grow flex flex-col overflow-hidden border-accent/10">
                    
                    {/* Candidate Top Header */}
                    <div className="p-6 border-b border-white/5 bg-gradient-to-br from-dark-900/80 to-dark-950/40 relative">
                      <div className="flex items-start justify-between">
                        <div>
                          <h3 className="text-lg font-bold text-white">{selectedCandidate.candidate_name}</h3>
                          <p className="text-xs text-gray-400 mt-1 flex items-center gap-1.5">
                            <FileText className="w-3.5 h-3.5 text-accent" /> {selectedCandidate.resume_filename}
                          </p>
                          <div className="flex items-center gap-3 mt-2">
                            <button
                              onClick={() => setShowResumeModal(true)}
                              className="text-[10px] text-accent hover:text-accent-light flex items-center gap-1 font-semibold underline"
                            >
                              <FileText className="w-3.5 h-3.5" /> View Resume Text
                            </button>
                            <span className="text-[10px] text-gray-700">|</span>
                            <a
                              href={`http://localhost:8000/api/jobs/screenings/${selectedCandidate.id}/pdf?token=${localStorage.getItem("fixhire_token")}`}
                              target="_blank"
                              rel="noreferrer"
                              className="text-[10px] text-accent hover:text-accent-light flex items-center gap-1 font-semibold underline"
                            >
                              <ExternalLink className="w-3.5 h-3.5" /> Open Original PDF
                            </a>
                          </div>
                        </div>
                        
                        <span className={`inline-flex px-3 py-1 rounded-full text-xs font-bold border ${getRecommendationBadgeColor(selectedCandidate.analysis_results.decision_recommendation)}`}>
                          {selectedCandidate.analysis_results.decision_recommendation}
                        </span>
                      </div>

                      {/* Summary Score Ring */}
                      <div className="flex items-center gap-4 mt-6">
                        <div className="relative w-16 h-16 flex items-center justify-center">
                          <svg className="w-full h-full transform -rotate-90">
                            <circle cx="32" cy="32" r="26" className="stroke-dark-800 fill-none" strokeWidth="5" />
                            <circle 
                              cx="32" cy="32" r="26" 
                              className={`fill-none transition-all duration-1000 ${getScoreRingColor(selectedCandidate.compatibility_score)}`} 
                              strokeWidth="5" 
                              strokeDasharray={2 * Math.PI * 26}
                              strokeDashoffset={2 * Math.PI * 26 * (1 - selectedCandidate.compatibility_score / 100)}
                              strokeLinecap="round"
                            />
                          </svg>
                          <span className="absolute text-sm font-extrabold text-white">
                            {selectedCandidate.compatibility_score}%
                          </span>
                        </div>
                        <div className="flex-grow">
                          <span className="text-[10px] text-gray-500 uppercase font-semibold">AI Compatibility Match</span>
                          <p className="text-xs text-gray-300 font-medium leading-relaxed mt-0.5">
                            {selectedCandidate.analysis_results.fit_summary}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Navigation Tabs */}
                    <div className="flex border-b border-white/5 text-xs font-semibold bg-dark-950/40">
                      {[
                        { id: "overview", label: "Fit Synopsis" },
                        { id: "skills", label: "Strengths & Gaps" },
                        { id: "experience", label: "Key Matches" },
                        { id: "questions", label: "Interview Prep" }
                      ].map(tab => (
                        <button
                          key={tab.id}
                          onClick={() => setActiveTab(tab.id)}
                          className={`flex-1 py-3 border-b-2 text-center transition-all ${
                            activeTab === tab.id
                              ? "border-accent text-accent bg-accent/5"
                              : "border-transparent text-gray-500 hover:text-gray-300"
                          }`}
                        >
                          {tab.label}
                        </button>
                      ))}
                    </div>

                    {/* Tab Contents */}
                    <div className="p-6 overflow-y-auto flex-grow max-h-[calc(100vh-28rem)]">
                      
                      {activeTab === "overview" && (
                        <div className="flex flex-col gap-4 text-left">
                          <div>
                            <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Recommendation Summary</h4>
                            <div className="p-4 rounded-xl bg-dark-950/40 border border-gray-800 text-sm leading-relaxed text-gray-300">
                              {selectedCandidate.analysis_results.fit_summary}
                            </div>
                          </div>

                          <div>
                            <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Details</h4>
                            <ul className="text-xs text-gray-400 space-y-2.5">
                              <li className="flex justify-between py-1.5 border-b border-white/2">
                                <span>Filename</span>
                                <span className="font-medium text-gray-300 truncate max-w-[200px]">{selectedCandidate.resume_filename}</span>
                              </li>
                              <li className="flex justify-between py-1.5 border-b border-white/2">
                                <span>Processed On</span>
                                <span className="font-medium text-gray-300">{new Date(selectedCandidate.created_at).toLocaleString()}</span>
                              </li>
                              <li className="flex justify-between py-1.5 border-b border-white/2">
                                <span>Status</span>
                                <span className="font-medium text-emerald-400">Analysis complete</span>
                              </li>
                            </ul>
                          </div>
                        </div>
                      )}

                      {activeTab === "skills" && (
                        <div className="flex flex-col gap-5 text-left">
                          <div>
                            <h4 className="text-xs font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-1.5 mb-3">
                              <CheckCircle2 className="w-4 h-4" /> Core Strengths
                            </h4>
                            <ul className="space-y-2">
                              {selectedCandidate.analysis_results.strengths?.map((str, idx) => (
                                <li key={idx} className="flex items-start gap-2.5 p-3 rounded-lg bg-emerald-500/5 border border-emerald-500/10 text-xs text-gray-300 leading-relaxed">
                                  <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                                  <span>{str}</span>
                                </li>
                              )) || <li className="text-xs text-gray-500">No strengths identified</li>}
                            </ul>
                          </div>

                          <div>
                            <h4 className="text-xs font-bold text-rose-400 uppercase tracking-wider flex items-center gap-1.5 mb-3">
                              <XCircle className="w-4 h-4" /> Critical Gaps
                            </h4>
                            <ul className="space-y-2">
                              {selectedCandidate.analysis_results.gaps?.map((gap, idx) => (
                                <li key={idx} className="flex items-start gap-2.5 p-3 rounded-lg bg-rose-500/5 border border-rose-500/10 text-xs text-gray-300 leading-relaxed">
                                  <AlertTriangle className="w-3.5 h-3.5 text-rose-400 shrink-0 mt-0.5" />
                                  <span>{gap}</span>
                                </li>
                              )) || <li className="text-xs text-gray-500">No major gaps identified</li>}
                            </ul>
                          </div>
                        </div>
                      )}

                      {activeTab === "experience" && (
                        <div className="flex flex-col gap-4 text-left">
                          <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Requirements Cross-Reference</h4>
                          {selectedCandidate.analysis_results.experience_matches?.map((match, idx) => (
                            <div key={idx} className="p-4 rounded-xl bg-dark-950/40 border border-gray-800/80 flex flex-col gap-2.5">
                              <div className="flex items-start gap-2 text-xs font-semibold text-white">
                                <CheckCircle2 className="w-4 h-4 text-brand shrink-0 mt-0.5" />
                                <span>{match.achievement}</span>
                              </div>
                              <p className="text-[11px] text-gray-400 leading-relaxed pl-6 border-l border-brand/20">
                                <span className="font-semibold text-brand-light">Relevance:</span> {match.relevance}
                              </p>
                            </div>
                          )) || (
                            <div className="text-center py-6 text-xs text-gray-500 border border-dashed border-gray-800 rounded-xl">
                              No experience matches listed.
                            </div>
                          )}
                        </div>
                      )}

                      {activeTab === "questions" && (
                        <div className="flex flex-col gap-4 text-left">
                          <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Tailored Interview Guide</h4>
                          {selectedCandidate.analysis_results.interview_questions?.map((q, idx) => (
                            <div key={idx} className="p-4 rounded-xl bg-dark-950/40 border border-gray-800/80 flex flex-col gap-3">
                              <div className="text-xs font-bold text-white flex gap-1.5">
                                <span className="text-accent">Q{idx+1}:</span>
                                <span>{q.question}</span>
                              </div>
                              
                              <div className="pl-5">
                                <span className="text-[10px] text-gray-500 uppercase tracking-wider block mb-1.5 font-semibold">Listen for:</span>
                                <div className="flex flex-wrap gap-1.5">
                                  {q.expected_answer_points?.map((pt, pIdx) => (
                                    <span key={pIdx} className="px-2 py-0.5 rounded bg-accent/5 border border-accent/15 text-[10px] text-accent-light">
                                      {pt}
                                    </span>
                                  )) || <span className="text-xs text-gray-500">General stack comprehension</span>}
                                </div>
                              </div>
                            </div>
                          )) || (
                            <div className="text-center py-6 text-xs text-gray-500 border border-dashed border-gray-800 rounded-xl">
                              No questions generated.
                            </div>
                          )}
                        </div>
                      )}

                    </div>
                  </div>
                ) : (
                  <div className="glass-card flex-grow flex items-center justify-center text-center p-8 border-dashed">
                    <div>
                      <HelpCircle className="w-12 h-12 text-gray-700 mx-auto mb-3" />
                      <h4 className="text-sm font-semibold text-gray-400">No Candidate Selected</h4>
                      <p className="text-xs text-gray-500 mt-1 max-w-xs">
                        Select an applicant from the matrix table to view their complete AI match details, gaps analysis, and interview guide.
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="flex-grow flex items-center justify-center text-center p-12 border border-dashed border-gray-800 rounded-2xl bg-dark-950/10">
              <div className="max-w-md">
                <Briefcase className="w-12 h-12 text-gray-700 mx-auto mb-4" />
                <h3 className="text-lg font-bold text-white">Create a Job Posting to Begin</h3>
                <p className="text-sm text-gray-400 mt-2 leading-relaxed">
                  Post a new job profile detailing your required skill stack and description, then upload candidate PDFs in bulk to compute AI matching scores instantly.
                </p>
                <button
                  onClick={() => setShowPostJobModal(true)}
                  className="btn-primary mt-6 flex items-center gap-2 mx-auto"
                >
                  <Plus className="w-4 h-4" /> Post New Job
                </button>
              </div>
            </div>
          )}
        </section>

      </main>

      {/* Global Error Banner */}
      {error && (
        <div className="fixed bottom-6 right-6 p-4 rounded-xl bg-rose-500/90 text-white font-medium text-xs shadow-2xl flex items-center gap-3 backdrop-blur border border-rose-400/20 max-w-md animate-bounce z-50">
          <AlertTriangle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
          <button onClick={() => setError("")} className="ml-auto hover:text-gray-200">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Post New Job Modal */}
      {showPostJobModal && (
        <div className="fixed inset-0 bg-dark-950/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="glass-card w-full max-w-lg overflow-hidden border-brand/20 shadow-brand/10">
            
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-white/5 flex items-center justify-between bg-dark-900/60">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Briefcase className="w-4 h-4 text-brand" /> Create New Job Posting
              </h3>
              <button 
                onClick={() => setShowPostJobModal(false)}
                className="text-gray-400 hover:text-white transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handlePostJob} className="p-6 flex flex-col gap-4 text-left">
              <div>
                <label className="form-label text-xs font-bold uppercase tracking-wider">Job Title *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Senior Full Stack Engineer"
                  value={newJob.title}
                  onChange={e => setNewJob(prev => ({ ...prev, title: e.target.value }))}
                  className="form-input text-sm"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="form-label text-xs font-bold uppercase tracking-wider">Location</label>
                  <input
                    type="text"
                    placeholder="e.g. San Francisco / Remote"
                    value={newJob.location}
                    onChange={e => setNewJob(prev => ({ ...prev, location: e.target.value }))}
                    className="form-input text-sm"
                  />
                </div>
                <div>
                  <label className="form-label text-xs font-bold uppercase tracking-wider">Required Skills (Comma separated)</label>
                  <input
                    type="text"
                    placeholder="e.g. React, FastAPI, Docker"
                    value={newJob.requirements}
                    onChange={e => setNewJob(prev => ({ ...prev, requirements: e.target.value }))}
                    className="form-input text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="form-label text-xs font-bold uppercase tracking-wider">Job Description *</label>
                <textarea
                  required
                  rows="4"
                  placeholder="Provide a comprehensive job description. This detailed description helps AI match against candidate resumes..."
                  value={newJob.description}
                  onChange={e => setNewJob(prev => ({ ...prev, description: e.target.value }))}
                  className="form-input text-sm resize-none font-sans"
                />
              </div>

              <div className="flex gap-3 justify-end mt-4 pt-4 border-t border-white/5">
                <button
                  type="button"
                  onClick={() => setShowPostJobModal(false)}
                  className="btn-secondary text-xs px-4 py-2"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="btn-primary text-xs px-4 py-2 flex items-center gap-1.5"
                >
                  {actionLoading ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" /> Saving...
                    </>
                  ) : (
                    "Create Job"
                  )}
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

      {/* Extracted Resume Text Modal */}
      {showResumeModal && selectedCandidate && (
        <div className="fixed inset-0 bg-dark-950/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="glass-card w-full max-w-2xl overflow-hidden border-accent/25 shadow-accent/10 flex flex-col max-h-[85vh]">
            
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-white/5 flex items-center justify-between bg-dark-900/60 shrink-0">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <FileText className="w-4 h-4 text-accent" /> Extracted Resume: {selectedCandidate.candidate_name}
              </h3>
              <button 
                onClick={() => setShowResumeModal(false)}
                className="text-gray-400 hover:text-white transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6 overflow-y-auto bg-dark-950/40 text-left">
              <div className="text-xs text-gray-400 bg-white/2 border border-white/5 p-4 rounded-xl font-mono whitespace-pre-wrap leading-relaxed">
                {selectedCandidate.resume_text || "No resume text was extracted."}
              </div>
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-4 border-t border-white/5 flex justify-end bg-dark-900/40 shrink-0">
              <button
                type="button"
                onClick={() => setShowResumeModal(false)}
                className="btn-secondary text-xs px-4 py-2"
              >
                Close
              </button>
            </div>

          </div>
        </div>
      )}

      {/* Footer */}
      <footer className="border-t border-white/5 py-4 bg-dark-950/20">
        <div className="max-w-[1536px] mx-auto px-6 flex items-center justify-between text-gray-600 text-xs">
          <p>&copy; {new Date().getFullYear()} FixHire. All rights reserved.</p>
          <div className="flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block"></span>
            <span>FastAPI Backend & AI Matching Systems Online</span>
          </div>
        </div>
      </footer>

    </div>
  );
}
