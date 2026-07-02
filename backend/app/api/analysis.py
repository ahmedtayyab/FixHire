import io
import json
from typing import List
from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File, Form
from sqlalchemy.orm import Session
import google.generativeai as genai
from pydantic import BaseModel, Field
from pypdf import PdfReader

from app.core.database import get_db
from app.core.config import settings
from app.api.auth import get_current_user
from app.models.user import User
from app.models.analysis import Analysis
from app.schemas.analysis import AnalysisResponse

router = APIRouter(prefix="/analysis", tags=["Resume Analysis"])

# PDF Text Extraction Helper
def extract_text_from_pdf(file_bytes: bytes) -> str:
    try:
        pdf_file = io.BytesIO(file_bytes)
        reader = PdfReader(pdf_file)
        text = ""
        for page in reader.pages:
            text += page.extract_text() or ""
        # If no text could be extracted (e.g. scanned image PDF), raise error
        if not text.strip():
            raise ValueError("No text could be extracted from the PDF. It might be scanned or empty.")
        return text
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Failed to process PDF: {str(e)}"
        )

# Pydantic schemas for Gemini Structured Output
class STARBulletPoint(BaseModel):
    original: str = Field(description="The original bullet point or experience line from the candidate's resume")
    rewritten: str = Field(description="The rewritten version in STAR (Situation, Task, Action, Result) format, optimized for impact and containing keywords from the job description")

class InterviewQuestion(BaseModel):
    question: str = Field(description="Tailored interview question targeting gaps, specific projects, or required skills")
    why_asked_or_tips: str = Field(description="The reason for asking this question or guidance on how the candidate should structure their answer")

class GeminiAnalysisResult(BaseModel):
    compatibility_score: int = Field(description="ATS compatibility score between 0 and 100 based on core skills, credentials, and role match")
    missing_skills: List[str] = Field(description="Key skills, technologies, or concepts from the job description that are absent or weak in the resume")
    improvement_suggestions: List[str] = Field(description="Actionable and specific tips to improve the resume for this job description (e.g., formatting, metrics, wording)")
    star_bullet_points: List[STARBulletPoint] = Field(description="3 to 5 examples of original resume lines rewritten into high-impact STAR format")
    cover_letter: str = Field(description="A highly tailored, professional 3-4 paragraph cover letter (~300-400 words) using the candidate's background and addressing the job requirements")
    recruiter_summary: str = Field(description="A 2-3 sentence professional snapshot of the candidate's fit, strengths, and primary gap for recruiters")
    interview_questions: List[InterviewQuestion] = Field(description="3 to 5 personalized interview questions with answering tips based on the candidate's background and the job")

@router.post("/analyze", response_model=AnalysisResponse, status_code=status.HTTP_201_CREATED)
def analyze_resume(
    job_title: str = Form(...),
    job_description: str = Form(...),
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Uploads a candidate's resume PDF, extracts text, calls Gemini API to analyze it
    against a target job description, stores the result, and returns the analysis.
    """
    # 1. Validate Gemini API Key config
    if not settings.GEMINI_API_KEY:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Google Gemini API key is missing. Please add GEMINI_API_KEY to your .env file in the root directory."
        )

    # 2. Validate PDF format
    if not file.filename.lower().endswith(".pdf"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Only PDF files are supported for resume upload."
        )

    # 3. Read and parse PDF file content
    try:
        file_content = file.file.read()
        resume_text = extract_text_from_pdf(file_content)
    finally:
        file.file.close()

    # 4. Configure and invoke Gemini AI
    try:
        genai.configure(api_key=settings.GEMINI_API_KEY)
        model = genai.GenerativeModel("gemini-1.5-flash")
        
        prompt = f"""
You are an expert ATS (Applicant Tracking System) advisor and recruiter.
Analyze the candidate's resume text and the target job description details to compute compatibility, detect gaps, rewrite experiences, write a customized cover letter, summarize the profile, and list prep questions.

JOB TITLE:
{job_title}

JOB DESCRIPTION:
{job_description}

CANDIDATE RESUME TEXT:
{resume_text}

Strictly generate output fitting the specified JSON schema.
"""
        response = model.generate_content(
            prompt,
            generation_config=genai.GenerationConfig(
                response_mime_type="application/json",
                response_schema=GeminiAnalysisResult
            )
        )
        
        # Parse the structured JSON response
        result_json = json.loads(response.text)
        compatibility_score = result_json.get("compatibility_score", 50)
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"AI processing failed: {str(e)}"
        )

    # 5. Save the analysis to the database
    new_analysis = Analysis(
        user_id=current_user.id,
        job_title=job_title,
        job_description=job_description,
        resume_filename=file.filename,
        compatibility_score=compatibility_score,
        analysis_results=result_json
    )
    
    db.add(new_analysis)
    db.commit()
    db.refresh(new_analysis)
    
    return new_analysis

@router.get("/history", response_model=List[AnalysisResponse])
def get_analysis_history(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Fetches the history of all resume analyses performed by the currently logged-in candidate.
    """
    history = db.query(Analysis).filter(Analysis.user_id == current_user.id).order_by(Analysis.created_at.desc()).all()
    return history

@router.delete("/{analysis_id}", status_code=status.HTTP_200_OK)
def delete_analysis(
    analysis_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Deletes a specific analysis record from the candidate's history.
    """
    analysis = db.query(Analysis).filter(Analysis.id == analysis_id, Analysis.user_id == current_user.id).first()
    
    if not analysis:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Analysis record not found."
        )
        
    db.delete(analysis)
    db.commit()
    
    return {"message": "Analysis record successfully deleted."}
