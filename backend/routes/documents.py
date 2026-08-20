from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from sqlalchemy.orm import Session

from database import get_db
from models import Session as DbSession
import document_parser

router = APIRouter(tags=["documents"])


@router.post("/api/v1/sessions/{session_id}/documents/upload")
@router.post("/api/v1/courses/sessions/{session_id}/documents")
async def upload_document_endpoint(session_id: str, file: UploadFile = File(...), db: Session = Depends(get_db)):
    db_session = db.query(DbSession).filter(DbSession.id == session_id).first()
    if not db_session:
        raise HTTPException(status_code=404, detail="Session not found")

    contents = await file.read()
    try:
        parsed_text = document_parser.parse_document(file.filename, contents)
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Failed to parse document: {str(e)}")

    db_session.document_context = parsed_text
    db_session.document_filename = file.filename
    db.commit()
    return {
        "status": "success",
        "filename": file.filename,
        "document_filename": file.filename,
        "subject_context": db_session.subject_context
    }


@router.delete("/api/v1/sessions/{session_id}/documents")
@router.delete("/api/v1/courses/sessions/{session_id}/documents")
def delete_document_endpoint(session_id: str, db: Session = Depends(get_db)):
    db_session = db.query(DbSession).filter(DbSession.id == session_id).first()
    if db_session:
        db_session.document_context = None
        db_session.document_filename = None
        db.commit()
    return {"status": "success"}
