import io
import json
from concurrent.futures import ThreadPoolExecutor
from typing import List
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File, Form, Query
from sqlalchemy.orm import Session
import google.generativeai as genai
from pydantic import BaseModel, Field

from app.core.database import get_db
from app.core.config import settings
from app.api.auth import get_current_user
from app.models.user import User
from app.models.job import Job
from app.models.screening import CandidateScreening
from app.schemas.job import JobCreate, JobResponse, JobDetailResponse
from app.schemas.screening import ScreeningResponse
from app.utils.resume_storage import get_screening_pdf_bytes, save_screening_pdf
from pypdf import PdfReader

router = APIRouter(prefix="/jobs", tags=["Job Postings & Screenings"])

# PDF Text Extraction Helper
def extract_text_from_pdf(file_bytes: bytes) -> str:
    try:
        pdf_file = io.BytesIO(file_bytes)
        reader = PdfReader(pdf_file)
        text = ""
        for page in reader.pages:
            text += page.extract_text() or ""
        if not text.strip():
            raise ValueError("No text could be extracted from the PDF. It might be scanned or empty.")
        return text
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Failed to process PDF: {str(e)}"
        )

# Helper to guess candidate's name from filename or resume text
def extract_candidate_name(resume_text: str, filename: str) -> str:
    base_name = filename.rsplit('.', 1)[0]
    base_name = base_name.replace('_', ' ').replace('-', ' ')
    words = base_name.split()
    cleaned_words = [w for w in words if w.lower() not in ["cv", "resume", "pdf", "updated", "final", "2026", "2025", "job", "apply", "1", "2", "3"]]
    if cleaned_words:
        name_from_file = " ".join(cleaned_words).title()
        if len(name_from_file) > 2:
            return name_from_file

    lines = [line.strip() for line in resume_text.split('\n') if line.strip()]
    if lines:
        first_line = lines[0]
        if len(first_line.split()) <= 4 and len(first_line) < 30:
            return first_line.strip()
            
    return "Candidate"

# Pydantic schemas for Gemini Structured Output
class KeyExperienceMatch(BaseModel):
    achievement: str = Field(description="A matching achievement or project from the candidate's resume that fits the job")
    relevance: str = Field(description="Explanation of why this is highly relevant to the job")

class RecruiterInterviewQuestion(BaseModel):
    question: str = Field(description="Targeted interview question for this candidate")
    expected_answer_points: List[str] = Field(description="Core points or keywords the recruiter should listen for in the candidate's response")

class GeminiScreeningResult(BaseModel):
    compatibility_score: int = Field(description="Overall compatibility score between 0 and 100 based on job requirements")
    fit_summary: str = Field(description="A concise 2-3 sentence overview of why this candidate fits or doesn't fit the role")
    strengths: List[str] = Field(description="Key strengths matching the job requirements")
    gaps: List[str] = Field(description="Critical missing skills, credentials, or experience gaps")
    experience_matches: List[KeyExperienceMatch] = Field(description="2-3 specific matching experiences or achievements from their resume")
    interview_questions: List[RecruiterInterviewQuestion] = Field(description="3 tailored interview questions for the recruiter to ask, with guidelines")
    decision_recommendation: str = Field(description="Short recommendation: 'Strong Hire', 'Proceed to Interview', 'Hold', or 'No Match'")

# Mock Screening Generator
def generate_mock_screening(candidate_name: str, job_title: str) -> dict:
    char_sum = sum(ord(c) for c in candidate_name)
    profile_type = char_sum % 3
    
    if profile_type == 0:
        score = 85 + (char_sum % 11)  # 85 to 95
        recommendation = "Strong Hire"
        strengths = [
            f"Demonstrates advanced expertise in core technologies required for {job_title}.",
            "Proven track record of delivering scalable web applications under pressure.",
            "Strong communication skills and collaborative team leadership background."
        ]
        gaps = [
            "Lacks formal certifications in cloud architectures, although has hand-on experience.",
            "Limited public contribution to open-source libraries."
        ]
        matches = [
            {
                "achievement": "Engineered a distributed microservices architecture, boosting performance by 40%.",
                "relevance": "Directly matches our requirement for high-throughput scaling."
            },
            {
                "achievement": "Led a team of 4 senior developers to release a SaaS product in 6 months.",
                "relevance": "Aligns with the team lead and collaborative requirements."
            }
        ]
        questions = [
            {
                "question": "Can you describe the scaling bottlenecks you encountered in your microservices backend and how you resolved them?",
                "expected_answer_points": ["Database sharding", "Caching strategies", "Load balancing", "Service mesh"]
            },
            {
                "question": "How do you manage technical debt when pushing for aggressive product deadlines?",
                "expected_answer_points": ["Refactoring plans", "Agile sprint estimation", "Code reviews"]
            }
        ]
    elif profile_type == 1:
        score = 62 + (char_sum % 14)  # 62 to 75
        recommendation = "Proceed to Interview"
        strengths = [
            f"Solid foundational knowledge of frameworks matching {job_title}.",
            "Experience working in Agile/Scrum product environments.",
            "Strong analytical problem-solving abilities."
        ]
        gaps = [
            f"Requires mentorship in system architecture concepts needed for {job_title}.",
            "No direct experience leading project deployments or CI/CD pipeline setup."
        ]
        matches = [
            {
                "achievement": "Built and maintained frontend dashboards using React and Tailwind CSS.",
                "relevance": "Directly fits the frontend engineering aspect of the role."
            }
        ]
        questions = [
            {
                "question": "Walk us through a challenging UI state management bug you fixed recently.",
                "expected_answer_points": ["Redux/Context API", "Component re-renders", "Browser developer tools"]
            },
            {
                "question": "What is your approach to learning a new backend framework or tool on the job?",
                "expected_answer_points": ["Documentation study", "Building proof-of-concept projects", "Code reviews"]
            }
        ]
    else:
        score = 30 + (char_sum % 16)  # 30 to 45
        recommendation = "No Match"
        strengths = [
            "Good general software development credentials.",
            "Enthusiastic about technical learning and expansion."
        ]
        gaps = [
            f"Resume shows minimal overlap with the stack requested for {job_title}.",
            "Lacks professional experience in production SaaS architectures."
        ]
        matches = [
            {
                "achievement": "Completed a coding bootcamp focusing on Full Stack JavaScript.",
                "relevance": "Demonstrates training, but lacks matching mid-to-senior level expertise."
            }
        ]
        questions = [
            {
                "question": "What specific aspects of our technology stack are you most eager to learn and master?",
                "expected_answer_points": ["FastAPI/Python backend", "Database optimization", "System scaling"]
            }
        ]

    return {
        "compatibility_score": score,
        "fit_summary": f"{candidate_name} exhibits a {recommendation.lower()} profile for the {job_title} position. The profile highlights key technical capabilities and relevant project experience, balanced with potential skill gaps.",
        "strengths": strengths,
        "gaps": gaps,
        "experience_matches": matches,
        "interview_questions": questions,
        "decision_recommendation": recommendation
    }


def build_screening_prompt(
    job_title: str,
    job_description: str,
    job_requirements: str | None,
    resume_text: str,
) -> str:
    prompt_resume = resume_text[: settings.SCREENING_MAX_RESUME_CHARS]
    return f"""
You are an expert recruitment and HR advisor.
Screen the candidate's resume against the following job profile and generate a comprehensive screening evaluation matrix.

JOB TITLE:
{job_title}

JOB DESCRIPTION:
{job_description}

JOB REQUIREMENTS:
{job_requirements or "None specified"}

CANDIDATE RESUME TEXT:
{prompt_resume}

Strictly generate output fitting the specified JSON schema.
"""


def run_gemini_screening(model, prompt: str) -> dict:
    response = model.generate_content(
        prompt,
        generation_config=genai.GenerationConfig(
            response_mime_type="application/json",
            response_schema=GeminiScreeningResult,
        ),
    )
    return json.loads(response.text)


def process_single_resume_screening(
    prepared: dict,
    job_title: str,
    job_description: str,
    job_requirements: str | None,
    has_api_key: bool,
    model,
) -> dict:
    filename = prepared["filename"]
    resume_text = prepared["resume_text"]
    candidate_name = extract_candidate_name(resume_text, filename)

    if has_api_key:
        prompt = build_screening_prompt(
            job_title, job_description, job_requirements, resume_text
        )
        try:
            result_json = run_gemini_screening(model, prompt)
            compatibility_score = result_json.get("compatibility_score", 50)
        except Exception as e:
            raise RuntimeError(f"AI screening failed for {filename}: {str(e)}") from e
    else:
        result_json = generate_mock_screening(candidate_name, job_title)
        compatibility_score = result_json["compatibility_score"]

    return {
        **prepared,
        "candidate_name": candidate_name,
        "result_json": result_json,
        "compatibility_score": compatibility_score,
    }

# Endpoint: Create Job Posting
@router.post("", response_model=JobResponse, status_code=status.HTTP_201_CREATED)
def create_job(
    job_in: JobCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    if current_user.role != "recruiter":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied. Only recruiters can create job postings."
        )
    
    new_job = Job(
        user_id=current_user.id,
        title=job_in.title,
        description=job_in.description,
        requirements=job_in.requirements,
        location=job_in.location
    )
    db.add(new_job)
    db.commit()
    db.refresh(new_job)
    return new_job

# Endpoint: List Recruiter's Job Postings
@router.get("", response_model=List[JobResponse])
def list_jobs(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    if current_user.role != "recruiter":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied. Only recruiters can view job postings."
        )
    
    return db.query(Job).filter(Job.user_id == current_user.id).order_by(Job.created_at.desc()).all()

# Endpoint: Public Route to Retrieve Job details for Candidates Applying
@router.get("/{job_id}/public", response_model=JobResponse)
def get_public_job(
    job_id: int,
    db: Session = Depends(get_db)
):
    job = db.query(Job).filter(Job.id == job_id).first()
    if not job:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Job posting not found."
        )
    return job

# Endpoint: Get PDF for Specific Screening
# NOTE: This route MUST be defined before /{job_id} to prevent FastAPI from
# matching "screenings" as a job_id in the wildcard route below.
@router.get("/screenings/{screening_id}/pdf")
def get_screening_pdf(
    screening_id: int,
    token: str = Query(...),
    db: Session = Depends(get_db)
):
    from fastapi.responses import Response
    from app.core.security import decode_access_token
    
    payload = decode_access_token(token)
    if payload is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Could not validate credentials"
        )
    
    email = payload.get("sub")
    if not email:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Could not validate credentials"
        )
        
    user = db.query(User).filter(User.email == email).first()
    if not user or user.role != "recruiter":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied."
        )
        
    screening = db.query(CandidateScreening).filter(CandidateScreening.id == screening_id).first()
    if not screening:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Screening record not found."
        )
        
    job = db.query(Job).filter(Job.id == screening.job_id).first()
    if not job or job.user_id != user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied."
        )
        
    pdf_bytes = get_screening_pdf_bytes(
        screening.id,
        screening.resume_filename,
        screening.resume_pdf,
    )
    if not pdf_bytes:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="PDF source file is not available for this screening."
        )

    if not screening.resume_pdf:
        screening.resume_pdf = pdf_bytes
        save_screening_pdf(screening.id, pdf_bytes)
        db.commit()

    filename = screening.resume_filename or f"resume_{screening.id}.pdf"
    return Response(
        content=pdf_bytes,
        media_type="application/pdf",
        headers={"Content-Disposition": f'inline; filename="{filename}"'},
    )

# Endpoint: Delete Specific Screening
# NOTE: Must also be before /{job_id} for the same route-ordering reason.
@router.delete("/screenings/{screening_id}", status_code=status.HTTP_200_OK)
def delete_screening(
    screening_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    screening = db.query(CandidateScreening).filter(CandidateScreening.id == screening_id).first()
    if not screening:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Screening record not found."
        )
        
    job = db.query(Job).filter(Job.id == screening.job_id).first()
    if not job or job.user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied. You do not own the job posting associated with this screening."
        )
        
    db.delete(screening)
    db.commit()
    return {"message": "Candidate screening deleted successfully."}

# Endpoint: Retrieve Job Details + Screenings
@router.get("/{job_id}", response_model=JobDetailResponse)
def get_job(
    job_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    job = db.query(Job).filter(Job.id == job_id).first()
    if not job:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Job posting not found."
        )
    
    if job.user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied. You do not own this job posting."
        )
        
    return job

# Endpoint: Delete Job Posting
@router.delete("/{job_id}", status_code=status.HTTP_200_OK)
def delete_job(
    job_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    job = db.query(Job).filter(Job.id == job_id).first()
    if not job:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Job posting not found."
        )
    
    if job.user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied. You do not own this job posting."
        )
        
    db.delete(job)
    db.commit()
    return {"message": "Job posting and all associated screenings deleted successfully."}

# Endpoint: Bulk Screen Candidate Resumes (Recruiter upload)
@router.post("/{job_id}/screen", response_model=List[ScreeningResponse], status_code=status.HTTP_201_CREATED)
def screen_resumes(
    job_id: int,
    files: List[UploadFile] = File(...),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    job = db.query(Job).filter(Job.id == job_id).first()
    if not job:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Job posting not found."
        )
    
    if job.user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied. You do not own this job posting."
        )
        
    if len(files) > 10:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="You can screen a maximum of 10 resumes in one request."
        )

    has_api_key = bool(settings.GEMINI_API_KEY and settings.GEMINI_API_KEY.strip())
    prepared_files = []

    for file in files:
        if not file.filename.lower().endswith(".pdf"):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"File {file.filename} is not a PDF. Only PDF files are supported."
            )

        file_content = file.file.read()
        try:
            resume_text = extract_text_from_pdf(file_content)
        except Exception as e:
            if not has_api_key:
                resume_text = "Mock Resume Text extracted from PDF"
            else:
                raise e
        finally:
            file.file.close()

        prepared_files.append(
            {
                "filename": file.filename,
                "file_content": file_content,
                "resume_text": resume_text,
            }
        )

    model = None
    if has_api_key:
        genai.configure(api_key=settings.GEMINI_API_KEY)
        model = genai.GenerativeModel(settings.GEMINI_MODEL_NAME)

    def screen_one(prepared: dict) -> dict:
        return process_single_resume_screening(
            prepared,
            job.title,
            job.description,
            job.requirements,
            has_api_key,
            model,
        )

    try:
        if has_api_key and len(prepared_files) > 1:
            with ThreadPoolExecutor(max_workers=settings.SCREENING_CONCURRENCY) as executor:
                processed = list(executor.map(screen_one, prepared_files))
        else:
            processed = [screen_one(prepared) for prepared in prepared_files]
    except RuntimeError as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e),
        ) from e

    screenings_created = []
    for item in processed:
        new_screening = CandidateScreening(
            job_id=job.id,
            candidate_name=item["candidate_name"],
            resume_filename=item["filename"],
            resume_text=item["resume_text"],
            resume_pdf=item["file_content"],
            compatibility_score=item["compatibility_score"],
            analysis_results=item["result_json"],
        )
        db.add(new_screening)
        db.flush()
        save_screening_pdf(new_screening.id, item["file_content"])
        screenings_created.append(new_screening)

    db.commit()

    for scr in screenings_created:
        db.refresh(scr)

    return screenings_created

# Endpoint: Public Candidate Application Submission (No auth required)
@router.post("/{job_id}/apply", response_model=ScreeningResponse, status_code=status.HTTP_201_CREATED)
def apply_to_job(
    job_id: int,
    candidate_name: str = Form(...),
    candidate_email: str = Form(...),
    file: UploadFile = File(...),
    db: Session = Depends(get_db)
):
    job = db.query(Job).filter(Job.id == job_id).first()
    if not job:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Job posting not found."
        )

    if not file.filename.lower().endswith(".pdf"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Only PDF resume uploads are supported."
        )

    has_api_key = bool(settings.GEMINI_API_KEY and settings.GEMINI_API_KEY.strip())
    
    try:
        file_content = file.file.read()
        resume_text = extract_text_from_pdf(file_content)
    except Exception as e:
        if not has_api_key:
            resume_text = f"Mock Resume Text for candidate {candidate_name} applying via web form"
        else:
            raise e
    finally:
        file.file.close()

    # AI evaluation
    if has_api_key:
        try:
            genai.configure(api_key=settings.GEMINI_API_KEY)
            model = genai.GenerativeModel(settings.GEMINI_MODEL_NAME)
            
            prompt = f"""
You are an expert recruitment and HR advisor.
Screen the candidate's resume against the following job profile and generate a comprehensive screening evaluation matrix.

JOB TITLE:
{job.title}

JOB DESCRIPTION:
{job.description}

JOB REQUIREMENTS:
{job.requirements or "None specified"}

CANDIDATE RESUME TEXT:
{resume_text}

Strictly generate output fitting the specified JSON schema.
"""
            response = model.generate_content(
                prompt,
                generation_config=genai.GenerationConfig(
                    response_mime_type="application/json",
                    response_schema=GeminiScreeningResult
                )
            )
            result_json = json.loads(response.text)
            compatibility_score = result_json.get("compatibility_score", 50)
        except Exception as e:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"AI application parsing failed: {str(e)}"
            )
    else:
        # Fallback to Mock Screening
        result_json = generate_mock_screening(candidate_name, job.title)
        compatibility_score = result_json["compatibility_score"]

    new_screening = CandidateScreening(
        job_id=job.id,
        candidate_name=candidate_name,
        resume_filename=file.filename,
        resume_text=resume_text,
        resume_pdf=file_content,
        compatibility_score=compatibility_score,
        analysis_results=result_json
    )
    db.add(new_screening)
    db.flush()
    save_screening_pdf(new_screening.id, file_content)
    db.commit()
    db.refresh(new_screening)
    return new_screening


