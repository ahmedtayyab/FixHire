from pathlib import Path

# backend/uploads/screenings/{screening_id}.pdf
UPLOAD_DIR = Path(__file__).resolve().parent.parent.parent / "uploads" / "screenings"
WORKSPACE_ROOT = Path(__file__).resolve().parent.parent.parent.parent


def ensure_upload_dir() -> Path:
    UPLOAD_DIR.mkdir(parents=True, exist_ok=True)
    return UPLOAD_DIR


def pdf_path_for_screening(screening_id: int) -> Path:
    return UPLOAD_DIR / f"{screening_id}.pdf"


def save_screening_pdf(screening_id: int, content: bytes) -> Path:
    ensure_upload_dir()
    path = pdf_path_for_screening(screening_id)
    path.write_bytes(content)
    return path


def load_screening_pdf(screening_id: int) -> bytes | None:
    path = pdf_path_for_screening(screening_id)
    if path.is_file():
        return path.read_bytes()
    return None


def resolve_pdf_from_filename(resume_filename: str) -> bytes | None:
    candidate = WORKSPACE_ROOT / resume_filename
    if candidate.is_file():
        return candidate.read_bytes()
    return None


def get_screening_pdf_bytes(screening_id: int, resume_filename: str, db_blob: bytes | None) -> bytes | None:
    if db_blob:
        return db_blob

    disk_bytes = load_screening_pdf(screening_id)
    if disk_bytes:
        return disk_bytes

    return resolve_pdf_from_filename(resume_filename)
