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
    cover_letter: str = Field(description="A highly tailored, professional 3-4 paragraph cover letter (~300-400 words) using the candidate's background and addressing the job requirements. IMPORTANT: You MUST use double newlines ('\\n\\n') between the salutation, each body paragraph, and the closing signature so that the output is formatted as a professional letter.")
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
    # 1. Check if Gemini API Key config is present
    has_api_key = bool(settings.GEMINI_API_KEY and settings.GEMINI_API_KEY.strip())

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
    except Exception as e:
        if not has_api_key:
            resume_text = "Mock Resume Text extracted from PDF"
        else:
            raise e
    finally:
        file.file.close()

    # 4. Configure and invoke Gemini AI or fallback to Mock Mode
    if has_api_key:
        try:
            genai.configure(api_key=settings.GEMINI_API_KEY)
            model = genai.GenerativeModel(settings.GEMINI_MODEL_NAME)
            
            prompt = f"""
You are an expert ATS (Applicant Tracking System) advisor and recruiter.
Analyze the candidate's resume text and the target job description details to compute compatibility, detect gaps, rewrite experiences, write a customized cover letter, summarize the profile, and list prep questions.

JOB TITLE:
{job_title}

JOB DESCRIPTION:
{job_description}

CANDIDATE RESUME TEXT:
{resume_text}

For the 'cover_letter' field in the JSON output, you MUST format the letter professionally. Use double newlines ('\\n\\n') to separate:
1. The salutation (e.g., 'Dear Hiring Manager,')
2. Each body paragraph (3-4 distinct paragraphs with clear spacing)
3. The closing/sign-off (e.g., 'Sincerely,')
4. The candidate's name

Do NOT output the cover letter as a single continuous block of text or run paragraphs/sentences together.

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
    else:
        # Mock mode allows complete end-to-end testing and styling verification without a real API key.
        compatibility_score = 78
        result_json = {
            "compatibility_score": compatibility_score,
            "missing_skills": ["TypeScript", "GraphQL", "CI/CD Pipelines", "Tailwind CSS"],
            "improvement_suggestions": [
                "Quantify accomplishments: replace 'worked on the client portal' with 'designed and delivered the user profile module, decreasing latency by 30%'.",
                "Add a Dedicated Technical Skills section to improve ATS keyword indexing.",
                "Ensure professional contact information is placed at the top of the resume."
            ],
            "star_bullet_points": [
                {
                    "original": "Worked on the client portal frontend using React.",
                    "rewritten": "Designed and engineered the user profile module of the client portal using React and Redux, reducing API response loading latency by 30% for 10k+ daily active users (Situation/Task/Action/Result)."
                },
                {
                    "original": "Helped the team debug backend APIs.",
                    "rewritten": "Identified and resolved memory leaks in FastAPI authentication endpoints, reducing server resource consumption by 15% during peak traffic hours."
                }
            ],
            "cover_letter": f"Dear Hiring Team,\n\nI am writing to express my strong interest in the {job_title} position. With my background in software development and experience using modern frameworks, I am confident in my ability to make a meaningful contribution to your team.\n\nThroughout my career, I have focused on writing clean, maintainable code and solving complex technical challenges. I have experience building robust applications using React and Python/FastAPI, collaborating in agile teams, and improving application speed and stability.\n\nThank you for your time and consideration. I look forward to discussing how my experience fits the needs of your engineering organization.\n\nSincerely,\nCandidate",
            "recruiter_summary": f"A developer with strong fundamentals in React and Python/FastAPI. Demonstrates good problem-solving capabilities and has worked on full-stack portal features, but lacks explicit TypeScript and GraphQL experience highlighted in the {job_title} details.",
            "interview_questions": [
                {
                    "question": "Can you walk us through how you optimized the React client portal frontend to reduce loading latency by 30%?",
                    "why_asked_or_tips": "Verifies the metrics in the resume and tests the candidate's understanding of React performance patterns (e.g. memoization, bundle splitting, lazy loading)."
                },
                {
                    "question": "The job description emphasizes TypeScript and GraphQL. How would you approach transitioning from JavaScript and REST APIs to these technologies?",
                    "why_asked_or_tips": "Evaluates adaptability and learning capability regarding missing skills identified on their profile."
                }
            ]
        }

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
