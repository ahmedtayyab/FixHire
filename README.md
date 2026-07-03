# FixHire - AI-powered Recruitment Platform

FixHire is a modern SaaS recruitment application designed to assist both candidates and recruiters using artificial intelligence. This repository hosts a FastAPI backend and a React (Vite) frontend.

---

## What's Been Done So Far

### Phase 1: Infrastructure & Authentication (Completed)
- **Project Scaffolding**: Setup the workspace folder structure separating the FastAPI backend and React frontend.
- **Database & Models**: Configured SQLAlchemy database connectivity using SQLite (`fixhire.db`). Created initial schemas for users and resume scan sessions.
- **User Authentication**:
  - Implemented JWT token-based authentication on the backend (`app/api/auth.py`).
  - Added password hashing utilizing bcrypt.
  - Built endpoint routes for user registration (`/api/auth/register`) and login (`/api/auth/login`).
  - Created frontend Auth Context (`AuthContext.jsx`) and set up protected routing in React.
  - Designed clean, responsive UI pages for Landing, Login, and Registration using Tailwind CSS.

### Phase 2: Candidate Dashboard & Gemini AI Integration (Completed)
- **Resume Text Extraction**: Integrated PyPDF to extract text from candidate PDF uploads on the fly.
- **Structured Gemini Analysis**: 
  - Integrated the Google Gemini SDK with the FastAPI backend.
  - Set up structured JSON prompts requesting specific analysis objects from Gemini.
  - Implemented a fallback mock configuration so the backend can run in offline/test mode when no Gemini API key is configured.
- **Candidate Dashboard Features**:
  - **ATS Compatibility Score**: Calculates skill alignment and displays it in a clean circular progress component.
  - **Missing Skills Detection**: Identifies and displays critical keywords or technologies required by the job description but missing from the resume.
  - **Resume Improvement Suggestions**: Provides actionable feedback on formatting, metrics, and phrasing.
  - **STAR Bullet Point Rewriter**: Dynamically rewrites experience lines into the high-impact Situation-Task-Action-Result format.
  - **AI Cover Letter Generator**: Generates customized cover letters matching the candidate's background against the job description.
  - **Recruiter Synopsis**: Summarizes the candidate's core strengths and fit in 2-3 sentences.
  - **Personalized Interview Prep**: Prepares 3-5 tailored interview questions based on resume gaps, complete with answering tips.
- **Scan History Tracking**:
  - Designed a database-backed history tracker for resume scans.
  - Added a sidebar in the Candidate Dashboard allowing users to retrieve past optimization scans or delete them.

### Phase 3: Recruiter Portal & Job Screening (Completed)
- **Job Posting Management**:
  - Added `Job` and `CandidateScreening` database models with recruiter ownership and cascade deletes.
  - Built REST endpoints for creating, listing, viewing, and deleting job postings (`/api/jobs`).
  - Implemented a full Recruiter Dashboard with job creation modal, job list sidebar, and shareable apply links.
- **AI-Powered Bulk Resume Screening**:
  - Recruiters can upload up to 10 PDF resumes at once against a job posting (`/api/jobs/{id}/screen`).
  - Gemini generates structured screening dossiers: compatibility score, fit summary, strengths, gaps, experience matches, interview questions, and hire recommendation.
  - Mock screening fallback runs automatically when no Gemini API key is configured.
- **Candidate Screening Workspace**:
  - Sortable and filterable screening table with score badges and recommendation labels.
  - Side-by-side candidate dossier panel with overview, experience matches, and interview prep tabs.
  - View extracted resume text inline; open the original PDF in a new tab.
  - Delete individual screening reports or entire job postings with associated data.
- **Public Job Application Flow**:
  - Added a public apply page at `/apply/:jobId` (no login required).
  - Candidates submit name, email, and PDF resume; AI screening runs on submission (`/api/jobs/{id}/apply`).
  - Post-submission confirmation screen shows compatibility score, fit summary, and key strengths.
- **Resume PDF Storage**:
  - Original PDFs are persisted to `backend/uploads/screenings/` and stored in the database.
  - Startup backfill restores PDFs for legacy screenings from matching filenames in the workspace.
  - Secure PDF download endpoint for recruiters (`/api/jobs/screenings/{id}/pdf`).
- **Login UX Improvements**:
  - Two-step login flow: select Candidate or Recruiter role first, then enter credentials.
  - Role mismatch validation prevents signing in with the wrong portal selected.

### Recent Refinements & Fixes
- **Gemini Model Upgrade**: Switched the default model to `gemini-2.5-flash` in the backend settings (as `gemini-1.5-flash` is now decommissioned).
- **Flexible Environment Loading**: Updated settings initialization to load `.env` from either the backend root or the parent directory (`[".env", "../.env"]`). This prevents configuration loading issues regardless of whether the server is started from `/backend` or the workspace root.
- **Cover Letter Formatting**: Refined the prompts sent to Gemini to enforce double newlines (`\n\n`) between the salutation, paragraphs, and closing signature to ensure the cover letter formats as a professional, readable document.
- **Screening PDF Backfill**: Fixed "Open CV" for screenings created before PDF storage was enabled by backfilling from disk and matching source filenames on startup.

---

## API Endpoints (Phase 3)

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| `POST` | `/api/jobs` | Recruiter | Create a job posting |
| `GET` | `/api/jobs` | Recruiter | List recruiter's job postings |
| `GET` | `/api/jobs/{id}` | Recruiter | Get job details with screenings |
| `DELETE` | `/api/jobs/{id}` | Recruiter | Delete job and all screenings |
| `POST` | `/api/jobs/{id}/screen` | Recruiter | Bulk screen PDF resumes |
| `GET` | `/api/jobs/{id}/public` | Public | Get job info for apply page |
| `POST` | `/api/jobs/{id}/apply` | Public | Submit candidate application |
| `GET` | `/api/jobs/screenings/{id}/pdf` | Recruiter (token) | Download original resume PDF |
| `DELETE` | `/api/jobs/screenings/{id}` | Recruiter | Delete a screening report |

---

## Tech Stack

- **Frontend**: React (Vite), Tailwind CSS (Dark Mode & Glassmorphism design)
- **Backend**: FastAPI (Python), SQLAlchemy (ORM)
- **AI Engine**: Google Gemini API via official `google-generativeai` SDK
- **Database**: SQLite (Local Dev) / PostgreSQL (Production ready)
- **Authentication**: JWT (JSON Web Tokens) with bcrypt password hashing
- **PDF Processing**: PyPDF

---

## Setup & Running Guide

### 1. Environment Configuration
Create a `.env` file in the root workspace folder with the following variables:
```env
DATABASE_URL=sqlite:///./fixhire.db
JWT_SECRET_KEY=your_super_secret_jwt_key
GEMINI_API_KEY=your_google_gemini_api_key
GEMINI_MODEL_NAME=gemini-2.5-flash
```

### 2. Backend Setup
```bash
# Start backend from workspace root
cd backend
python -m venv .venv

# Activate virtualenv (Windows PowerShell)
..\.venv\Scripts\Activate.ps1

# Install dependencies
pip install -r requirements.txt

# Run local dev server
uvicorn app.main:app --reload
```

### 3. Frontend Setup
```bash
# Start frontend from workspace root
cd frontend
npm install
npm run dev
```
