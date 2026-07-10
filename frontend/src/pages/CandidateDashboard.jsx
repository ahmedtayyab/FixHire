import { useState, useEffect, useRef } from "react";
import { useAuth } from "../context/AuthContext";
import { api } from "../services/api";
import { 
  LogOut, User, FileText, Sparkles, AlertTriangle, Upload, 
  ChevronRight, CheckCircle, Copy, Check, Trash2, ArrowLeft, 
  ArrowUpRight, FileCheck, Brain, Plus, Loader2, Sparkle
} from "lucide-react";

export default function CandidateDashboard() {
  const { user, logout } = useAuth();
  
  // State variables
  const [history, setHistory] = useState([]);
  const [selectedAnalysis, setSelectedAnalysis] = useState(null);
  const [loading, setLoading] = useState(false);
  const [loadingStage, setLoadingStage] = useState("");
  const [error, setError] = useState(null);
  
  // Form fields
  const [jobTitle, setJobTitle] = useState("");
  const [jobDescription, setJobDescription] = useState("");
  const [file, setFile] = useState(null);
  const [dragActive, setDragActive] = useState(false);
  
  // Feedback states
  const [copiedField, setCopiedField] = useState(null);
  const fileInputRef = useRef(null);

  // Fetch history on component mount
  useEffect(() => {
    fetchHistory();
  }, []);

  async function fetchHistory() {
    try {
      const data = await api.analysis.getHistory();
      setHistory(data);
    } catch (err) {
      console.error("Failed to load analysis history:", err);
      // Don't set error on mount, just log it
    }
  }

  // Drag and Drop handlers
  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const droppedFile = e.dataTransfer.files[0];
      if (droppedFile.type === "application/pdf") {
        setFile(droppedFile);
        setError(null);
      } else {
        setError("Only PDF resumes are supported.");
      }
    }
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      if (selectedFile.type === "application/pdf") {
        setFile(selectedFile);
        setError(null);
      } else {
        setError("Only PDF resumes are supported.");
      }
    }
  };

  // Submit handler
  const handleAnalyze = async (e) => {
    e.preventDefault();
    if (!file) {
      setError("Please upload your resume PDF.");
      return;
    }
    if (!jobTitle.trim()) {
      setError("Please provide the job title.");
      return;
    }
    if (!jobDescription.trim()) {
      setError("Please provide the job description.");
      return;
    }

    setLoading(true);
    setError(null);

    // Dynamic loading stage prompts for a cool user experience
    const stages = [
      "Uploading resume PDF...",
      "Extracting text content...",
      "Analyzing against job requirements...",
      "Running ATS algorithms...",
      "Running AI comparison against the role...",
      "Generating cover letter & interview prep..."
    ];
    
    let stageIdx = 0;
    setLoadingStage(stages[0]);
    const stageInterval = setInterval(() => {
      stageIdx = (stageIdx + 1) % stages.length;
      setLoadingStage(stages[stageIdx]);
    }, 2500);

    try {
      const result = await api.analysis.analyze(jobTitle, jobDescription, file);
      setSelectedAnalysis(result);
      // Refresh history list
      fetchHistory();
      // Clear form inputs
      setFile(null);
      setJobTitle("");
      setJobDescription("");
    } catch (err) {
      setError(err.message || "Failed to complete resume analysis.");
    } finally {
      clearInterval(stageInterval);
      setLoading(false);
      setLoadingStage("");
    }
  };

  // Delete handler
  const handleDelete = async (id, e) => {
    e.stopPropagation(); // Prevent triggers when clicked in the history list
    if (!confirm("Are you sure you want to delete this analysis?")) return;

    try {
      await api.analysis.deleteAnalysis(id);
      setHistory(prev => prev.filter(item => item.id !== id));
      if (selectedAnalysis && selectedAnalysis.id === id) {
        setSelectedAnalysis(null);
      }
    } catch (err) {
      alert("Failed to delete analysis: " + err.message);
    }
  };

  // Copy helper
  const handleCopy = (text, fieldName) => {
    navigator.clipboard.writeText(text);
    setCopiedField(fieldName);
    setTimeout(() => setCopiedField(null), 2000);
  };

  // Formatting date
  const formatDate = (dateString) => {
    const options = { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  // Color logic for score
  const getScoreColor = (score) => {
    if (score >= 80) return "text-emerald-400 border-emerald-500/30 bg-emerald-500/5";
    if (score >= 50) return "text-amber-400 border-amber-500/30 bg-amber-500/5";
    return "text-rose-500 border-rose-500/30 bg-rose-500/5";
  };

  return (
    <div className="min-h-screen flex flex-col justify-between bg-dark-950">
      
      {/* Top Navbar */}
      <header className="border-b border-white/5 bg-dark-900/60 backdrop-blur-md sticky top-0 z-40">
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
      <main className="flex-grow max-w-7xl w-full mx-auto px-6 py-10 flex gap-8 relative">
        
        {/* Main Workspace (Left/Center Column) */}
        <div className="flex-grow flex flex-col min-w-0">
          
          {error && (
            <div className="p-4 mb-6 rounded-xl border border-rose-500/20 bg-rose-500/10 text-rose-300 text-sm flex items-start space-x-3">
              <AlertTriangle className="w-5 h-5 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold">Error occurred</p>
                <p className="mt-0.5">{error}</p>
              </div>
            </div>
          )}

          {/* Loading State */}
          {loading ? (
            <div className="glass-card flex-grow p-12 flex flex-col items-center justify-center text-center">
              <div className="relative mb-6">
                <div className="w-20 h-20 rounded-full border-4 border-brand/10 border-t-brand animate-spin" />
                <Brain className="w-8 h-8 text-brand absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 animate-pulse" />
              </div>
              <h3 className="text-xl font-bold text-white mb-2">Analyzing Resume</h3>
              <p className="text-gray-400 max-w-md text-sm mb-4">
                Our AI matching engine is processing your PDF and running calculations against the target job.
              </p>
              <div className="px-4 py-2 rounded-lg bg-white/5 border border-white/5 text-xs text-brand-light font-mono animate-pulse">
                {loadingStage}
              </div>
            </div>
          ) : selectedAnalysis ? (
            /* Results Screen */
            <div className="space-y-8 animate-fadeIn">
              
              {/* Results Header */}
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-6 border-b border-gray-800">
                <div className="flex items-center space-x-4">
                  <button 
                    onClick={() => setSelectedAnalysis(null)}
                    className="p-2 rounded-xl border border-gray-800 text-gray-400 hover:text-white hover:bg-dark-800 transition-all duration-200"
                    title="Back to Upload"
                  >
                    <ArrowLeft className="w-5 h-5" />
                  </button>
                  <div>
                    <span className="text-xs font-semibold uppercase tracking-wider text-brand-light">Optimization Report</span>
                    <h2 className="text-2xl font-extrabold text-white mt-0.5">{selectedAnalysis.job_title}</h2>
                    <p className="text-xs text-gray-500 mt-0.5">
                      Analyzed on {formatDate(selectedAnalysis.created_at)} &bull; {selectedAnalysis.resume_filename}
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center space-x-3">
                  <button
                    onClick={() => setSelectedAnalysis(null)}
                    className="btn-secondary py-2 px-4 text-sm"
                  >
                    <Plus className="w-4 h-4 mr-2 inline" />
                    New Scan
                  </button>
                  <button
                    onClick={(e) => handleDelete(selectedAnalysis.id, e)}
                    className="p-2.5 rounded-xl border border-rose-950/40 text-rose-400 hover:bg-rose-950/20 hover:text-rose-300 transition-all duration-200"
                    title="Delete Scan Record"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Main Score & Summary Matrix */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                
                {/* Compatibility Score Circle */}
                <div className="glass-card p-6 flex flex-col items-center justify-center text-center">
                  <span className="text-sm font-semibold text-gray-400 mb-4">ATS Compatibility</span>
                  <div className="relative w-36 h-36 flex items-center justify-center">
                    {/* SVG Circular Progress Bar */}
                    <svg className="w-full h-full transform -rotate-90">
                      <circle 
                        cx="72" cy="72" r="60" 
                        className="stroke-dark-800 fill-none" 
                        strokeWidth="10" 
                      />
                      <circle 
                        cx="72" cy="72" r="60" 
                        className={`fill-none transition-all duration-1000 ${
                          selectedAnalysis.compatibility_score >= 80 ? 'stroke-emerald-400' :
                          selectedAnalysis.compatibility_score >= 50 ? 'stroke-amber-400' :
                          'stroke-rose-500'
                        }`} 
                        strokeWidth="10" 
                        strokeDasharray={2 * Math.PI * 60}
                        strokeDashoffset={2 * Math.PI * 60 * (1 - selectedAnalysis.compatibility_score / 100)}
                        strokeLinecap="round"
                      />
                    </svg>
                    <span className="absolute text-3xl font-extrabold text-white">
                      {selectedAnalysis.compatibility_score}%
                    </span>
                  </div>
                  <span className={`mt-5 px-3 py-1 rounded-full text-xs font-semibold ${getScoreColor(selectedAnalysis.compatibility_score)}`}>
                    {selectedAnalysis.compatibility_score >= 80 ? 'Excellent Match' :
                     selectedAnalysis.compatibility_score >= 50 ? 'Needs Improvement' :
                     'Low Matching Match'}
                  </span>
                </div>

                {/* Score Explanation Card */}
                <div className="glass-card p-6 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg font-bold text-white flex items-center">
                        <Sparkles className="w-4 h-4 text-brand mr-2" />
                        Why this score?
                      </h3>
                      <span className="text-xs uppercase tracking-wider text-gray-500">Insights</span>
                    </div>
                    <p className="text-sm text-gray-400 leading-relaxed mb-5">
                      Your score is based on how closely your resume content aligns with the job, which keywords are missing, and how strong the experience descriptions are.
                    </p>
                    <div className="grid gap-3">
                      <div className="p-3 rounded-xl bg-dark-900 border border-white/5">
                        <div className="flex items-center justify-between text-sm text-gray-300">
                          <span>Missing keywords</span>
                          <span className="font-semibold text-white">{selectedAnalysis.analysis_results?.missing_skills?.length ?? 0}</span>
                        </div>
                        <p className="text-xs text-gray-500 mt-2">More missing keywords can reduce your match score.</p>
                      </div>
                      <div className="p-3 rounded-xl bg-dark-900 border border-white/5">
                        <div className="flex items-center justify-between text-sm text-gray-300">
                          <span>Improvement suggestions</span>
                          <span className="font-semibold text-white">{selectedAnalysis.analysis_results?.improvement_suggestions?.length ?? 0}</span>
                        </div>
                        <p className="text-xs text-gray-500 mt-2">These tips show where resume phrasing can be stronger.</p>
                      </div>
                      <div className="p-3 rounded-xl bg-dark-900 border border-white/5">
                        <div className="flex items-center justify-between text-sm text-gray-300">
                          <span>Resume relevance</span>
                          <span className="font-semibold text-white">{selectedAnalysis.compatibility_score >= 80 ? 'High' : selectedAnalysis.compatibility_score >= 50 ? 'Medium' : 'Low'}</span>
                        </div>
                        <p className="text-xs text-gray-500 mt-2">This reflects how well your profile fits the job requirements.</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Recruiter Summary Card */}
                <div className="glass-card p-6 md:col-span-2 flex flex-col justify-between">
                  <div>
                    <h3 className="text-lg font-bold text-white flex items-center mb-3">
                      <Sparkle className="w-4 h-4 text-brand mr-2" />
                      Recruiter Synopsis
                    </h3>
                    <p className="text-gray-300 text-sm leading-relaxed">
                      {selectedAnalysis.analysis_results?.recruiter_summary || "No summary generated."}
                    </p>
                  </div>
                  <div className="mt-4 pt-4 border-t border-white/5 flex justify-end">
                    <button
                      onClick={() => handleCopy(selectedAnalysis.analysis_results?.recruiter_summary, "summary")}
                      className="text-xs text-gray-400 hover:text-white flex items-center space-x-1"
                    >
                      {copiedField === "summary" ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-emerald-400" />
                          <span className="text-emerald-400 font-medium">Copied!</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5" />
                          <span>Copy Synopsis</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>

              </div>

              {/* Skills and Improvement Suggestions */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                
                {/* Missing Keywords & Skills */}
                <div className="glass-card p-6">
                  <h3 className="text-lg font-bold text-white mb-4 flex items-center">
                    <AlertTriangle className="w-4.5 h-4.5 text-amber-400 mr-2" />
                    Missing Keywords & Skills
                  </h3>
                  <p className="text-xs text-gray-400 mb-4 leading-relaxed">
                    ATS scanners prioritize keyword density. Adding these terms to your experience descriptions can boost compliance:
                  </p>
                  <div className="flex flex-wrap gap-2.5">
                    {selectedAnalysis.analysis_results?.missing_skills?.length > 0 ? (
                      selectedAnalysis.analysis_results.missing_skills.map((skill, idx) => (
                        <span 
                          key={idx}
                          className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-rose-500/5 text-rose-300 border border-rose-500/10 flex items-center"
                        >
                          <Plus className="w-3 h-3 mr-1 text-rose-400" />
                          {skill}
                        </span>
                      ))
                    ) : (
                      <div className="text-sm text-gray-500 py-6 text-center w-full">
                        <CheckCircle className="w-8 h-8 text-emerald-400 mx-auto mb-2" />
                        No missing keywords found! Excellent job.
                      </div>
                    )}
                  </div>
                </div>

                {/* Resume Improvement Suggestions */}
                <div className="glass-card p-6">
                  <h3 className="text-lg font-bold text-white mb-4 flex items-center">
                    <FileCheck className="w-4.5 h-4.5 text-emerald-400 mr-2" />
                    Improvement Checklist
                  </h3>
                  <p className="text-xs text-gray-400 mb-4 leading-relaxed">
                    Actionable adjustments to tailor your resume layout, credentials, or copy for this role:
                  </p>
                  <ul className="space-y-3">
                    {selectedAnalysis.analysis_results?.improvement_suggestions?.length > 0 ? (
                      selectedAnalysis.analysis_results.improvement_suggestions.map((tip, idx) => (
                        <li key={idx} className="flex items-start text-sm text-gray-300">
                          <span className="w-5 h-5 rounded-full bg-dark-800 border border-gray-700 flex-shrink-0 flex items-center justify-center mr-3 mt-0.5 text-xs text-brand font-bold">
                            {idx + 1}
                          </span>
                          <span className="leading-relaxed">{tip}</span>
                        </li>
                      ))
                    ) : (
                      <p className="text-sm text-gray-500 py-6 text-center">No improvements needed.</p>
                    )}
                  </ul>
                </div>

              </div>

              {/* STAR Format Bullet Point Rewriter */}
              <div className="glass-card p-6">
                <h3 className="text-lg font-bold text-white mb-2 flex items-center">
                  <Brain className="w-4.5 h-4.5 text-brand mr-2" />
                  STAR Bullet Points Rewriter
                </h3>
                <p className="text-xs text-gray-400 mb-6 leading-relaxed">
                  The STAR (Situation, Task, Action, Result) layout makes resume descriptions highly quantifiable. 
                  Replace passive items on your resume with these tailored replacements:
                </p>
                
                <div className="space-y-4">
                  {selectedAnalysis.analysis_results?.star_bullet_points?.length > 0 ? (
                    selectedAnalysis.analysis_results.star_bullet_points.map((bp, idx) => (
                      <div key={idx} className="p-4 rounded-xl bg-dark-950/40 border border-gray-800/60 text-sm space-y-3">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <span className="text-xs font-semibold text-rose-400 uppercase tracking-wider block mb-1">Original Line</span>
                            <p className="text-gray-400 italic">"{bp.original}"</p>
                          </div>
                          <div>
                            <div className="flex items-center justify-between mb-1">
                              <span className="text-xs font-semibold text-emerald-400 uppercase tracking-wider block">STAR Alternative</span>
                              <button
                                onClick={() => handleCopy(bp.rewritten, `star-${idx}`)}
                                className="text-xs text-gray-500 hover:text-white flex items-center space-x-1"
                              >
                                {copiedField === `star-${idx}` ? (
                                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                                ) : (
                                  <Copy className="w-3.5 h-3.5" />
                                )}
                              </button>
                            </div>
                            <p className="text-gray-200 font-medium">"{bp.rewritten}"</p>
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-gray-500 py-4 text-center">No bullet rewrites available.</p>
                  )}
                </div>
              </div>

              {/* Cover Letter Section */}
              <div className="glass-card p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-bold text-white flex items-center">
                    <FileText className="w-4.5 h-4.5 text-brand mr-2" />
                    AI-Generated Cover Letter
                  </h3>
                  <button
                    onClick={() => handleCopy(selectedAnalysis.analysis_results?.cover_letter, "cover")}
                    className="btn-secondary py-1.5 px-3 text-xs flex items-center"
                  >
                    {copiedField === "cover" ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-400 mr-1.5" />
                        <span className="text-emerald-400">Copied!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5 mr-1.5" />
                        <span>Copy Letter</span>
                      </>
                    )}
                  </button>
                </div>
                <div className="p-6 rounded-xl bg-dark-950/60 border border-gray-800 text-sm font-sans leading-relaxed text-gray-300 whitespace-pre-line shadow-inner max-h-[450px] overflow-y-auto">
                  {selectedAnalysis.analysis_results?.cover_letter || "Failed to generate cover letter."}
                </div>
              </div>

              {/* Personalized Interview Questions */}
              <div className="glass-card p-6">
                <h3 className="text-lg font-bold text-white mb-4 flex items-center">
                  <Sparkles className="w-4.5 h-4.5 text-accent mr-2" />
                  Tailored Interview Prep
                </h3>
                <p className="text-xs text-gray-400 mb-6 leading-relaxed">
                  These custom behavioral questions target potential gaps or specific qualifications on your resume:
                </p>

                <div className="space-y-4">
                  {selectedAnalysis.analysis_results?.interview_questions?.length > 0 ? (
                    selectedAnalysis.analysis_results.interview_questions.map((q, idx) => (
                      <div key={idx} className="p-4 rounded-xl bg-white/5 border border-white/5 space-y-2">
                        <h4 className="text-sm font-bold text-white flex items-start">
                          <span className="text-brand mr-2">Q{idx + 1}:</span>
                          <span>{q.question}</span>
                        </h4>
                        <p className="text-xs text-gray-400 leading-relaxed pl-6">
                          <strong className="text-gray-300">Answer Tip:</strong> {q.why_asked_or_tips}
                        </p>
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-gray-500 py-4 text-center">No interview questions generated.</p>
                  )}
                </div>
              </div>

            </div>
          ) : (
            /* Upload Scan Form Screen */
            <div className="space-y-8 animate-fadeIn">
              
              <div>
                <h1 className="text-3xl font-extrabold tracking-tight text-white flex items-center">
                  Resume Optimizer
                </h1>
                <p className="text-gray-400 mt-2 text-sm leading-relaxed">
                  Paste your target job specs, drag in your resume, and let our AI matching engine run a tailored comparison check.
                </p>
              </div>

              <form onSubmit={handleAnalyze} className="space-y-6">
                
                {/* Drag and Drop Uploader */}
                <div>
                  <label className="form-label">Resume PDF File</label>
                  <div
                    onDragEnter={handleDrag}
                    onDragOver={handleDrag}
                    onDragLeave={handleDrag}
                    onDrop={handleDrop}
                    onClick={() => fileInputRef.current?.click()}
                    className={`border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-all duration-300 ${
                      dragActive ? 'border-brand bg-brand/5 scale-[1.01]' :
                      file ? 'border-brand/40 bg-brand/5 hover:border-brand/60' :
                      'border-gray-800 hover:border-gray-700 bg-dark-900/40'
                    }`}
                  >
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept=".pdf"
                      onChange={handleFileChange}
                      className="hidden"
                    />
                    
                    {file ? (
                      <div className="space-y-3">
                        <div className="w-12 h-12 rounded-xl bg-brand/10 border border-brand/20 flex items-center justify-center text-brand mx-auto">
                          <FileCheck className="w-6 h-6 animate-pulse" />
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-white">{file.name}</p>
                          <p className="text-xs text-gray-500 mt-0.5">{(file.size / 1024 / 1024).toFixed(2)} MB &bull; Ready to process</p>
                        </div>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setFile(null);
                          }}
                          className="px-3 py-1 rounded-lg bg-dark-800 hover:bg-dark-700 border border-gray-700 text-xs text-gray-400 hover:text-white transition-all"
                        >
                          Change File
                        </button>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        <div className="w-12 h-12 rounded-xl bg-dark-800/80 border border-gray-800 flex items-center justify-center text-gray-400 mx-auto">
                          <Upload className="w-6 h-6" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-300">
                            Drag & drop your resume PDF here, or <span className="text-brand font-semibold">browse files</span>
                          </p>
                          <p className="text-xs text-gray-500 mt-1">Accepts PDF files only (Max 10MB)</p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Job Title and Description Form */}
                <div className="grid grid-cols-1 gap-6">
                  <div>
                    <label htmlFor="job-title" className="form-label">Job Title</label>
                    <input
                      id="job-title"
                      type="text"
                      className="form-input"
                      placeholder="e.g. Senior Frontend Engineer"
                      value={jobTitle}
                      onChange={(e) => setJobTitle(e.target.value)}
                    />
                  </div>

                  <div>
                    <label htmlFor="job-description" className="form-label">Job Description</label>
                    <textarea
                      id="job-description"
                      rows="8"
                      className="form-input resize-y font-sans text-sm leading-relaxed"
                      placeholder="Paste the full job responsibilities, skills, and qualifications details here..."
                      value={jobDescription}
                      onChange={(e) => setJobDescription(e.target.value)}
                    />
                  </div>
                </div>

                {/* Action button */}
                <div className="pt-2">
                  <button
                    type="submit"
                    className="w-full btn-primary flex items-center justify-center space-x-2 py-3.5"
                  >
                    <Sparkles className="w-5 h-5" />
                    <span>Run AI Diagnostics & Scoring</span>
                  </button>
                </div>

              </form>

            </div>
          )}

        </div>

        {/* Sidebar Column: Optimization History */}
        <aside className="w-80 flex-shrink-0 hidden lg:block">
          <div className="glass-card p-6 sticky top-28 max-h-[calc(100vh-160px)] flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-5">
                <h3 className="text-lg font-bold text-white">Scan History</h3>
                <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-dark-800 text-gray-400 border border-gray-700">
                  {history.length}
                </span>
              </div>
              
              <div className="space-y-3 overflow-y-auto max-h-[calc(100vh-270px)] pr-2">
                {history.length > 0 ? (
                  history.map((item) => (
                    <div
                      key={item.id}
                      onClick={() => setSelectedAnalysis(item)}
                      className={`p-3 rounded-xl border transition-all duration-200 cursor-pointer flex justify-between items-start text-left group ${
                        selectedAnalysis && selectedAnalysis.id === item.id 
                          ? 'border-brand/40 bg-brand/5' 
                          : 'border-gray-800 hover:border-gray-700 bg-dark-900/30'
                      }`}
                    >
                      <div className="min-w-0 pr-2">
                        <h4 className="text-xs font-bold text-white truncate group-hover:text-brand-light transition-colors">
                          {item.job_title}
                        </h4>
                        <p className="text-[10px] text-gray-500 truncate mt-1">
                          {item.resume_filename}
                        </p>
                        <p className="text-[9px] text-gray-600 mt-0.5">
                          {formatDate(item.created_at)}
                        </p>
                      </div>
                      
                      <div className="flex flex-col items-end space-y-2 flex-shrink-0">
                        <span className={`text-[10px] font-extrabold px-1.5 py-0.5 rounded ${
                          item.compatibility_score >= 80 ? 'bg-emerald-500/10 text-emerald-400' :
                          item.compatibility_score >= 50 ? 'bg-amber-500/10 text-amber-400' :
                          'bg-rose-500/10 text-rose-400'
                        }`}>
                          {item.compatibility_score}%
                        </span>
                        
                        <button
                          onClick={(e) => handleDelete(item.id, e)}
                          className="opacity-0 group-hover:opacity-100 hover:text-rose-400 text-gray-500 transition-all p-1"
                          title="Delete Scan"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-10 border border-dashed border-gray-800 rounded-xl">
                    <FileText className="w-8 h-8 text-gray-700 mx-auto mb-2" />
                    <p className="text-xs text-gray-500">No scans run yet.</p>
                  </div>
                )}
              </div>
            </div>
            
            {selectedAnalysis && (
              <div className="pt-4 border-t border-white/5 mt-4">
                <button
                  onClick={() => setSelectedAnalysis(null)}
                  className="w-full flex items-center justify-center py-2 rounded-xl text-xs font-medium border border-gray-800 text-gray-400 hover:text-white hover:bg-dark-800 transition-all"
                >
                  <Plus className="w-3.5 h-3.5 mr-1.5" />
                  Create New Scan
                </button>
              </div>
            )}
          </div>
        </aside>

      </main>

      {/* Footer */}
      <footer className="border-t border-white/5 py-6 bg-dark-950/20 z-10">
        <div className="max-w-7xl mx-auto px-6 text-center text-gray-600 text-xs">
          <p>&copy; {new Date().getFullYear()} FixHire Candidate Workspace.</p>
        </div>
      </footer>

    </div>
  );
}
