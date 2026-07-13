import { useState, useEffect, useRef } from "react";
import { useParams, Link } from "react-router-dom";
import { api } from "../services/api";
import {
  Briefcase,
  MapPin,
  Clock,
  UploadCloud,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Loader2,
  Mail,
  User,
  Sparkles,
  FileText,
  Check,
  ChevronRight,
  ArrowRight,
  Award
} from "lucide-react";

export default function JobApply() {
  const { jobId } = useParams();
  
  const [job, setJob] = useState(null);
  const [loadingJob, setLoadingJob] = useState(true);
  const [error, setError] = useState("");
  
  // Form states
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [file, setFile] = useState(null);
  const [dragActive, setDragActive] = useState(false);
  
  // Submit states
  const [submitting, setSubmitting] = useState(false);
  const [submitStep, setSubmitStep] = useState(0); // 0 = idle, 1 = uploading, 2 = extracting, 3 = AI analyzing
  const [screeningResult, setScreeningResult] = useState(null);
  
  const fileInputRef = useRef(null);

  useEffect(() => {
    fetchJob();
  }, [jobId]);

  const fetchJob = async () => {
    setLoadingJob(true);
    setError("");
    try {
      const jobData = await api.jobs.getPublicJob(jobId);
      setJob(jobData);
    } catch (err) {
      console.error(err);
      setError("We couldn't retrieve the details for this job posting. It may have been closed or deleted.");
    } finally {
      setLoadingJob(false);
    }
  };

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
      if (droppedFile.type === "application/pdf" || droppedFile.name.toLowerCase().endsWith(".pdf")) {
        setFile(droppedFile);
      } else {
        alert("Only PDF resume files are supported.");
      }
    }
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      if (selectedFile.type === "application/pdf" || selectedFile.name.toLowerCase().endsWith(".pdf")) {
        setFile(selectedFile);
      } else {
        alert("Only PDF resume files are supported.");
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name || !email || !file) {
      alert("Please provide your name, email, and upload your PDF resume.");
      return;
    }
    
    setSubmitting(true);
    setError("");
    setSubmitStep(1); // Uploading
    
    // Smooth UI steps simulator
    const stepInterval = setInterval(() => {
      setSubmitStep(prev => {
        if (prev < 3) return prev + 1;
        return prev;
      });
    }, 1500);

    try {
      const result = await api.jobs.submitApplication(jobId, name, email, file);
      clearInterval(stepInterval);
      setScreeningResult(result);
    } catch (err) {
      clearInterval(stepInterval);
      console.error(err);
      setError(err.message || "Failed to submit application. Please try again.");
    } finally {
      setSubmitting(false);
      setSubmitStep(0);
    }
  };

  const getScoreBadgeClass = (score) => {
    if (score >= 80) return "bg-emerald-500/10 text-emerald-400 border-emerald-500/20";
    if (score >= 50) return "bg-amber-500/10 text-amber-400 border-amber-500/20";
    return "bg-rose-500/10 text-rose-400 border-rose-500/20";
  };

  const getScoreRingColor = (score) => {
    if (score >= 80) return "stroke-emerald-400";
    if (score >= 50) return "stroke-amber-400";
    return "stroke-rose-500";
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

  if (loadingJob) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-dark-950 text-gray-100">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-brand mx-auto mb-4" />
          <p className="text-gray-400 text-sm font-medium">Fetching job details...</p>
        </div>
      </div>
    );
  }

  if (error && !job) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-dark-950 text-gray-100 px-6">
        <div className="glass-card max-w-md w-full p-8 text-center border-rose-500/20 shadow-rose-950/10">
          <AlertTriangle className="w-12 h-12 text-rose-400 mx-auto mb-4" />
          <h2 className="text-lg font-bold text-white">Oops! Job Details Unavailable</h2>
          <p className="text-sm text-gray-400 mt-2 leading-relaxed">{error}</p>
          <Link
            to="/"
            className="btn-primary mt-6 inline-flex items-center gap-2 text-xs px-4 py-2"
          >
            Go Back Home <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-dark-950 text-gray-100 flex flex-col justify-between selection:bg-brand selection:text-white">
      {/* Top Header navbar */}
      <header className="border-b border-white/5 bg-dark-900/60 backdrop-blur-md sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <Link to="/" className="flex items-center space-x-3 group">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-brand to-accent flex items-center justify-center shadow-lg shadow-brand/10 transition-transform group-hover:scale-105">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <span className="text-2xl font-extrabold tracking-tight text-white bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-300">
              FixHire
            </span>
          </Link>
          <div className="text-xs text-gray-500 font-semibold tracking-wider uppercase">
            Public Job Application Portal
          </div>
        </div>
      </header>

      {/* Main Form/Success Content */}
      <main className="flex-grow w-full max-w-7xl mx-auto px-6 py-12 flex flex-col justify-center items-center">
        
        {screeningResult ? (
          /* Premium Application Success Dashboard */
          <div className="w-full max-w-4xl glass-card overflow-hidden border-emerald-500/25 shadow-emerald-950/5 animate-fade-in text-left">
            <div className="p-8 border-b border-white/5 bg-gradient-to-br from-emerald-950/20 to-dark-950/40">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                  <div className="flex items-center gap-2 text-emerald-400 font-semibold text-sm">
                    <CheckCircle2 className="w-5 h-5 shrink-0" />
                    <span>Application Submitted Successfully!</span>
                  </div>
                  <h1 className="text-2xl font-extrabold text-white mt-2">
                    Thank you, {screeningResult.candidate_name}!
                  </h1>
                  <p className="text-sm text-gray-400 mt-1 leading-relaxed">
                    Your resume has been successfully submitted and screened for the <strong className="text-gray-200">{job.title}</strong> position.
                  </p>
                </div>
                
                <div className="flex items-center gap-4 bg-dark-900/60 p-4 rounded-xl border border-gray-800 self-start md:self-auto">
                  <div className="relative w-14 h-14 flex items-center justify-center">
                    <svg className="w-full h-full transform -rotate-90">
                      <circle cx="28" cy="28" r="23" className="stroke-dark-800 fill-none" strokeWidth="4" />
                      <circle 
                        cx="28" cy="28" r="23" 
                        className={`fill-none ${getScoreRingColor(screeningResult.compatibility_score)}`} 
                        strokeWidth="4" 
                        strokeDasharray={2 * Math.PI * 23}
                        strokeDashoffset={2 * Math.PI * 23 * (1 - screeningResult.compatibility_score / 100)}
                        strokeLinecap="round"
                      />
                    </svg>
                    <span className="absolute text-xs font-extrabold text-white">
                      {screeningResult.compatibility_score}%
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] text-gray-500 uppercase font-semibold">AI Match Score</span>
                    <div className="mt-0.5">
                      <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-semibold border ${getRecommendationBadgeColor(screeningResult.analysis_results?.decision_recommendation)}`}>
                        {screeningResult.analysis_results?.decision_recommendation || "Processed"}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="p-8 grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Left Side: Summary & Strengths */}
              <div className="flex flex-col gap-6">
                <div>
                  <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">AI Fit Evaluation</h3>
                  <p className="text-sm text-gray-300 leading-relaxed bg-white/2 border border-white/5 p-4 rounded-xl">
                    {screeningResult.analysis_results?.fit_summary || 
                      `Analysis complete. The resume demonstrates compatibility with the job profile. The recruiter will review your application soon.`}
                  </p>
                </div>

                <div>
                  <h3 className="text-xs font-bold text-emerald-400 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                    <Award className="w-4 h-4" /> Noted Core Strengths
                  </h3>
                  <ul className="space-y-2">
                    {screeningResult.analysis_results?.strengths?.map((str, idx) => (
                      <li key={idx} className="flex items-start gap-2.5 p-3 rounded-lg bg-emerald-500/5 border border-emerald-500/10 text-xs text-gray-300 leading-relaxed">
                        <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                        <span>{str}</span>
                      </li>
                    )) || <li className="text-xs text-gray-500">Recruiter will contact you with evaluation feedback.</li>}
                  </ul>
                </div>
              </div>

              {/* Right Side: Next Steps & Summary */}
              <div className="flex flex-col justify-between border-t md:border-t-0 md:border-l border-white/5 md:pl-8 pt-6 md:pt-0">
                <div className="flex flex-col gap-4">
                  <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider">What happens next?</h3>
                  <div className="flex gap-3">
                    <div className="w-6 h-6 rounded-full bg-brand/10 border border-brand/20 flex items-center justify-center text-brand text-xs font-bold shrink-0 mt-0.5">1</div>
                    <p className="text-xs text-gray-400 leading-relaxed">
                      Our AI resume screening process has logged your credentials and analyzed your experience against the job profile.
                    </p>
                  </div>
                  <div className="flex gap-3">
                    <div className="w-6 h-6 rounded-full bg-brand/10 border border-brand/20 flex items-center justify-center text-brand text-xs font-bold shrink-0 mt-0.5">2</div>
                    <p className="text-xs text-gray-400 leading-relaxed">
                      The job poster has been notified. They can inspect your application details, read your resume directly, and check the AI recommendation matrix.
                    </p>
                  </div>
                  <div className="flex gap-3">
                    <div className="w-6 h-6 rounded-full bg-brand/10 border border-brand/20 flex items-center justify-center text-brand text-xs font-bold shrink-0 mt-0.5">3</div>
                    <p className="text-xs text-gray-400 leading-relaxed">
                      If there's a match, the recruiting manager will reach out via the email address you provided: <strong className="text-white">{email}</strong>.
                    </p>
                  </div>
                </div>

                <div className="mt-8 pt-6 border-t border-white/5 flex justify-end">
                  <Link
                    to="/"
                    className="btn-secondary text-xs px-5 py-2.5 flex items-center gap-1.5"
                  >
                    Return to Landing Page
                  </Link>
                </div>
              </div>
            </div>
          </div>
        ) : (
          /* Premium Application form & Job details side-by-side */
          <div className="w-full grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            
            {/* Job Details Meta (Left Columns) */}
            <div className="lg:col-span-7 flex flex-col gap-6 text-left">
              <div className="glass-card p-8 border-brand/10 shadow-brand/5 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-brand/5 rounded-full filter blur-xl"></div>
                
                <h1 className="text-3xl font-extrabold text-white leading-tight bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-300">
                  {job.title}
                </h1>
                {job.company_name && (
                  <p className="text-base font-semibold text-brand-light mt-1">{job.company_name}</p>
                )}
                
                <div className="flex flex-wrap gap-4 mt-3 text-xs text-gray-400 border-b border-white/5 pb-5">
                  <span className="flex items-center gap-1">
                    <MapPin className="w-4 h-4 text-brand" /> {job.location || "Remote"}
                  </span>
                  <span className="flex items-center gap-1">
                    <Clock className="w-4 h-4 text-brand" /> Posted {new Date(job.created_at).toLocaleDateString()}
                  </span>
                </div>

                {job.requirements && (
                  <div className="mt-6">
                    <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2.5">Desired Skills & Stack</h3>
                    <div className="flex flex-wrap gap-1.5">
                      {job.requirements.split(',').map((req, idx) => (
                        <span key={idx} className="px-3 py-1 rounded bg-brand/5 border border-brand/20 text-xs text-brand-light font-medium">
                          {req.trim()}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                <div className="mt-6">
                  <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2.5">Job Description</h3>
                  <div className="text-sm text-gray-300 leading-relaxed whitespace-pre-wrap font-sans">
                    {job.description}
                  </div>
                </div>
              </div>

              {/* Security notice */}
              <div className="p-4 rounded-xl bg-white/2 border border-white/5 text-[11px] text-gray-500 leading-relaxed">
                <span className="font-bold text-gray-400 block mb-1">Security & Privacy Note</span>
                Your uploaded resume document is scanned locally and screened on-demand through our secure matching process. We do not sell applicant details or distribute your personal documents to unauthorized training sets.
              </div>
            </div>

            {/* Application Submission Form (Right Columns) */}
            <div className="lg:col-span-5 flex flex-col gap-6 text-left">
              <div className="glass-card p-8 border-accent/10 shadow-accent/5">
                <h2 className="text-lg font-bold text-white flex items-center gap-2">
                  <Sparkles className="w-4.5 h-4.5 text-accent animate-pulse" /> Apply for this position
                </h2>
                <p className="text-xs text-gray-400 mt-1 leading-relaxed">
                  Submit your details and PDF resume. Our matching system will cross-reference your skills and experience to highlight matches instantly.
                </p>

                {error && (
                  <div className="mt-4 p-3 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs flex items-start gap-2">
                    <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                    <span>{error}</span>
                  </div>
                )}

                <form onSubmit={handleSubmit} className="mt-6 flex flex-col gap-4">
                  <div>
                    <label className="form-label text-xs font-bold uppercase tracking-wider">Full Name *</label>
                    <div className="relative mt-1">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-500">
                        <User className="w-4 h-4" />
                      </div>
                      <input
                        type="text"
                        required
                        disabled={submitting}
                        placeholder="Your Full Name"
                        value={name}
                        onChange={e => setName(e.target.value)}
                        className="form-input pl-9 text-sm"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="form-label text-xs font-bold uppercase tracking-wider">Email Address *</label>
                    <div className="relative mt-1">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-500">
                        <Mail className="w-4 h-4" />
                      </div>
                      <input
                        type="email"
                        required
                        disabled={submitting}
                        placeholder="your@email.com"
                        value={email}
                        onChange={e => setEmail(e.target.value)}
                        className="form-input pl-9 text-sm"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="form-label text-xs font-bold uppercase tracking-wider mb-1 block">Upload Resume PDF *</label>
                    <div
                      onDragEnter={handleDrag}
                      onDragLeave={handleDrag}
                      onDragOver={handleDrag}
                      onDrop={handleDrop}
                      onClick={() => !submitting && fileInputRef.current?.click()}
                      className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-all duration-300 ${
                        dragActive 
                          ? "border-brand bg-brand/5" 
                          : file 
                            ? "border-emerald-500/40 bg-emerald-500/2" 
                            : "border-gray-800 hover:border-brand/40 hover:bg-dark-900/20"
                      } ${submitting ? "opacity-50 pointer-events-none" : ""}`}
                    >
                      <input
                        type="file"
                        ref={fileInputRef}
                        accept=".pdf"
                        onChange={handleFileChange}
                        className="hidden"
                      />

                      {file ? (
                        <div className="flex flex-col items-center">
                          <div className="w-10 h-10 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-400 mb-2">
                            <FileText className="w-5 h-5" />
                          </div>
                          <p className="text-xs font-semibold text-white max-w-[200px] truncate">{file.name}</p>
                          <p className="text-[10px] text-gray-500 mt-1">{(file.size / 1024).toFixed(1)} KB • Click to swap file</p>
                        </div>
                      ) : (
                        <div className="flex flex-col items-center">
                          <UploadCloud className="w-8 h-8 text-gray-500 mb-2" />
                          <p className="text-xs font-semibold text-white">Drag & drop resume PDF here</p>
                          <p className="text-[10px] text-gray-500 mt-1">or click to browse files (Only PDF supported)</p>
                        </div>
                      )}
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={submitting || !name || !email || !file}
                    className="btn-primary mt-4 py-3 flex items-center justify-center gap-2 font-bold text-xs"
                  >
                    {submitting ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin text-white" /> 
                        {submitStep === 1 && "Uploading resume file..."}
                        {submitStep === 2 && "Extracting text modules..."}
                        {submitStep === 3 && "Analyzing matching parameters with AI..."}
                      </>
                    ) : (
                      <>
                        Submit Application <ChevronRight className="w-4 h-4" />
                      </>
                    )}
                  </button>
                </form>
              </div>
            </div>

          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-white/5 py-6 bg-dark-950/20">
        <div className="max-w-7xl mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-gray-600 text-xs">
          <p>&copy; {new Date().getFullYear()} FixHire. All rights reserved.</p>
          <div className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block"></span>
            <span>AI Matching Engine Online</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
