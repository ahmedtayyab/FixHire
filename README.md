# FixHire - AI-powered Recruitment Platform

FixHire is a modern SaaS recruitment application designed to assist both candidates and recruiters using artificial intelligence.

## Features

### Candidate Portal (Phase 2 - Completed)
*   **ATS Compatibility Score**: A circular progress-based matching score engine aligning resume skills to target job requirements.
*   **Missing Skills Detection**: Identifies critical keywords, skills, and certifications missing from the resume but requested in the job description.
*   **Resume Improvement Suggestions**: Provides concrete recommendations for formatting, metrics, and phrasing.
*   **STAR Bullet Point Rewriter**: Rewrites existing experience lines into the STAR format (Situation, Task, Action, Result) side-by-side.
*   **AI Cover Letter Generator**: Generates a highly customized, professional cover letter matching candidate experience with job demands.
*   **Recruiter Synopsis**: Summarizes candidate fit and key highlights in a couple of sentences.
*   **Personalized Interview Prep**: Prepares 3-5 tailored interview questions with structural tips.
*   **Scan History**: Lists past resume optimizations in a sidebar, allowing candidates to select or delete records.

### Recruiter Portal
*   Job Posting Management
*   AI Candidate Summarization & Ranking
*   Candidate Comparison & Shortlisting

## Tech Stack
*   **Frontend**: React (Vite), Tailwind CSS (Dark Mode & Glassmorphism)
*   **Backend**: FastAPI (Python), SQLAlchemy (ORM)
*   **AI**: Google Gemini API (Structured JSON outputs using the official `google-generativeai` SDK)
*   **Database**: SQLite (Development) / PostgreSQL (Production)
*   **Authentication**: JWT (JSON Web Tokens) with password hashing (bcrypt)
*   **PDF Parsing**: PyPDF

## Setup & Running Guide

### 1. Environment Configuration
Create a `.env` file in the root workspace folder with the following variables:
```env
DATABASE_URL=sqlite:///./fixhire.db
JWT_SECRET_KEY=your_super_secret_jwt_key
GEMINI_API_KEY=your_google_gemini_api_key
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
