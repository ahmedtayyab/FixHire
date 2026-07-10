# FixHire - AI-powered Recruitment Platform

FixHire is a modern SaaS recruitment application designed to assist both candidates and recruiters using artificial intelligence. This repository hosts a FastAPI backend and a React (Vite) frontend.

**Repository:** [github.com/ahmedtayyab/FixHire](https://github.com/ahmedtayyab/FixHire)

---

## Live Deployment

| Service | URL | Platform |
|---------|-----|----------|
| **Frontend (App)** | [https://fix-hire.vercel.app](https://fix-hire.vercel.app) | [Vercel](https://vercel.com) |
| **Backend (API)** | [https://fixhire.onrender.com](https://fixhire.onrender.com) | [Render](https://render.com) |
| **API Docs** | [https://fixhire.onrender.com/docs](https://fixhire.onrender.com/docs) | Swagger UI |
| **Database** | PostgreSQL on [Neon](https://neon.tech) | Managed cloud DB |

> **Note:** The Render free tier sleeps after ~15 minutes of inactivity. The first API request after idle may take 30–60 seconds to wake up.

---

## What's Been Done So Far

### Phase 1: Infrastructure & Authentication (Completed)
- **Project Scaffolding**: Setup the workspace folder structure separating the FastAPI backend and React frontend.
- **Database & Models**: Configured SQLAlchemy database connectivity using SQLite (`fixhire.db`) locally and PostgreSQL in production. Created initial schemas for users and resume scan sessions.
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

### Phase 4: Google OAuth Sign-In (Completed)
- **Backend OAuth Flow**:
  - Integrated `authlib` with Google OpenID Connect for social sign-in.
  - Added `/api/auth/google/login` and `/api/auth/google/callback` endpoints.
  - Session middleware for OAuth state/nonce validation between redirect and callback.
  - Auto-creates user accounts on first Google sign-in; existing users log in by email match.
- **Frontend Integration**:
  - "Sign in with Google" and "Sign up with Google" buttons on Login and Register pages.
  - Role selection (Candidate / Recruiter) before initiating Google OAuth.
  - Token handoff via redirect to `/login?google_token=...` and session hydration in `AuthContext`.
- **Security**:
  - OAuth credentials loaded from environment variables only (not committed to git).
  - GitHub push protection enforced for secrets in source code.

### Phase 5: Production Deployment (Completed)
- **Frontend on Vercel**:
  - Auto-deploys from `main` branch on every push.
  - Root directory: `frontend/`, build output: `dist/`.
  - Environment-based API URL via `VITE_API_URL`.
  - SPA routing configured in `vercel.json`.
- **Backend on Render**:
  - Auto-deploys from `main` branch on every push.
  - Root directory: `backend/`, start command: `uvicorn app.main:app --host 0.0.0.0 --port $PORT`.
  - Blueprint defined in `render.yaml`.
  - Production CORS allows the Vercel frontend via `FRONTEND_URL` env var.
- **Database on Neon**:
  - PostgreSQL connection via `DATABASE_URL` on Render.
  - `psycopg2-binary` driver with `postgres://` → `postgresql://` URL normalization.
- **Deployment Prep Code**:
  - `frontend/src/config.js` centralizes API origin for all frontend requests.
  - `.env.example` documents all local and production environment variables.

### Recent Refinements & Fixes
- **Gemini Model Upgrade**: Switched the default model to `gemini-2.5-flash` (as `gemini-1.5-flash` is decommissioned).
- **Flexible Environment Loading**: Settings load `.env` from backend root or parent directory.
- **Cover Letter Formatting**: Prompts enforce double newlines between salutation, paragraphs, and closing.
- **Screening PDF Backfill**: Restores PDFs for legacy screenings on startup.
- **Render Deploy Fix**: Added `httpx` dependency required by `authlib` OAuth client.
- **Backup Branch**: Pre-deployment snapshot preserved at `backup/phase3-complete` and tag `phase3-complete-backup`.

---

## API Endpoints

### Authentication

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| `POST` | `/api/auth/register` | Public | Register a new user |
| `POST` | `/api/auth/login` | Public | Login and receive JWT |
| `GET` | `/api/auth/me` | User | Get current user profile |
| `GET` | `/api/auth/google/login` | Public | Redirect to Google OAuth consent |
| `GET` | `/api/auth/google/callback` | Public | Google OAuth callback, issues JWT |

### Candidate Analysis

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| `POST` | `/api/analysis/analyze` | Candidate | Analyze resume against job description |
| `GET` | `/api/analysis/history` | Candidate | List past resume scans |
| `DELETE` | `/api/analysis/{id}` | Candidate | Delete a past scan |

### Jobs & Screening

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

| Layer | Technology |
|-------|------------|
| **Frontend** | React 19, Vite, Tailwind CSS, React Router |
| **Backend** | FastAPI, Uvicorn, SQLAlchemy |
| **AI Engine** | Google Gemini API (`gemini-2.5-flash`) |
| **Database** | SQLite (local) / PostgreSQL (production via Neon) |
| **Authentication** | JWT + bcrypt, Google OAuth (authlib) |
| **PDF Processing** | PyPDF |
| **Hosting** | Vercel (frontend), Render (backend), Neon (database) |

---

## Local Development Setup

### 1. Environment Configuration

Copy `.env.example` to `.env` in the project root:

```env
DATABASE_URL=sqlite:///./fixhire.db
JWT_SECRET_KEY=your_super_secret_jwt_key
GEMINI_API_KEY=your_google_gemini_api_key
GEMINI_MODEL_NAME=gemini-2.5-flash

# Optional: Google OAuth (for local social sign-in)
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
GOOGLE_OAUTH_REDIRECT_URI=http://127.0.0.1:8000/api/auth/google/callback
FRONTEND_URL=http://localhost:5173
```

### 2. Backend Setup

```bash
cd backend
python -m venv .venv

# Windows PowerShell
..\.venv\Scripts\Activate.ps1

pip install -r requirements.txt
uvicorn app.main:app --reload
```

Backend runs at [http://localhost:8000](http://localhost:8000) — API docs at [http://localhost:8000/docs](http://localhost:8000/docs).

### 3. Frontend Setup

```bash
cd frontend
npm install
npm run dev
```

Frontend runs at [http://localhost:5173](http://localhost:5173).

---

## Production Environment Variables

### Vercel (Frontend)

| Variable | Value |
|----------|-------|
| `VITE_API_URL` | `https://fixhire.onrender.com` |

### Render (Backend)

| Variable | Value |
|----------|-------|
| `DATABASE_URL` | PostgreSQL connection string from Neon |
| `JWT_SECRET_KEY` | Long random secret string |
| `GEMINI_API_KEY` | Google Gemini API key |
| `GEMINI_MODEL_NAME` | `gemini-2.5-flash` |
| `FRONTEND_URL` | `https://fix-hire.vercel.app` |
| `GOOGLE_CLIENT_ID` | Google OAuth client ID |
| `GOOGLE_CLIENT_SECRET` | Google OAuth client secret |
| `GOOGLE_OAUTH_REDIRECT_URI` | `https://fixhire.onrender.com/api/auth/google/callback` |

### Google Cloud Console (OAuth)

| Setting | Value |
|---------|-------|
| Authorized JavaScript origins | `https://fix-hire.vercel.app` |
| Authorized redirect URIs | `https://fixhire.onrender.com/api/auth/google/callback` |

---

## Deployment Architecture

```
GitHub (main branch)
    ├── push → Vercel  → https://fix-hire.vercel.app  (React frontend)
    └── push → Render  → https://fixhire.onrender.com (FastAPI backend)
                              └── Neon PostgreSQL (DATABASE_URL)
```

Every push to `main` auto-redeploys both frontend and backend.

---

## Project Structure

```
FixHire/
├── backend/
│   ├── app/
│   │   ├── api/          # Route handlers (auth, analysis, jobs)
│   │   ├── core/         # Config, database, security
│   │   ├── models/       # SQLAlchemy models
│   │   ├── schemas/      # Pydantic request/response schemas
│   │   └── utils/        # Resume storage helpers
│   └── requirements.txt
├── frontend/
│   ├── src/
│   │   ├── pages/        # Landing, Login, Dashboards, JobApply
│   │   ├── context/      # AuthContext
│   │   ├── services/     # API client
│   │   └── config.js     # API URL configuration
│   ├── vercel.json
│   └── package.json
├── render.yaml           # Render deployment blueprint
├── .env.example          # Environment variable template
└── README.md
```

---

## Backup & Rollback

A pre-deployment snapshot of Phase 3 is preserved on GitHub:

| Reference | Commit | Description |
|-----------|--------|-------------|
| Branch `backup/phase3-complete` | `865811c` | Phase 3 complete, before OAuth & deploy |
| Tag `phase3-complete-backup` | `865811c` | Same snapshot, pinned tag |

To restore: `git checkout backup/phase3-complete`

---

## License

This project is for educational and portfolio purposes.
