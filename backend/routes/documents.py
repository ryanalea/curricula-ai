import json
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

    # Auto-extract key technology terms / topics from the document content
    extracted_tags = []
    if parsed_text:
        import re
        # Find capitalized technology words / phrases or unique terms from document
        potential_terms = re.findall(r'\b[A-Z][a-zA-Z0-9\+\#\.\-]{2,}\b', parsed_text[:4000])
        stop_words = {'The', 'This', 'That', 'With', 'From', 'Have', 'They', 'What', 'When', 'Where', 'Which', 'Your', 'About', 'Using', 'Course', 'Lesson', 'Overview'}
        filtered_terms = [t for t in potential_terms if t not in stop_words]
        
        # Deduplicate preserving order, take top 4 unique document tags
        for t in filtered_terms:
            if t not in extracted_tags and len(extracted_tags) < 4:
                extracted_tags.append(t)

    # Merge extracted file tags into session's tech_tags
    existing_tags = json.loads(db_session.tech_tags) if db_session.tech_tags else []
    merged_tags = list(existing_tags)
    for tag in extracted_tags:
        if tag not in merged_tags:
            merged_tags.append(tag)

    db_session.tech_tags = json.dumps(merged_tags)
    db.commit()

    # Re-run pipeline grounding with the newly uploaded reference document content
    try:
        import pipeline
        ai_result = pipeline.generate_concept_and_grounding(
            keyword=db_session.prompt or "Software Development",
            tags=merged_tags,
            difficulty=db_session.config_difficulty or "Beginner",
            audience=db_session.config_audience or "Student",
            document_context=parsed_text
        )
        if ai_result.get("subject_context"):
            db_session.subject_context = ai_result["subject_context"]
        grounding = ai_result.get("grounding", {})
        if grounding.get("prerequisites"):
            db_session.prerequisites = json.dumps(grounding["prerequisites"])
        if grounding.get("out_of_scope"):
            db_session.boundaries = json.dumps(grounding["out_of_scope"])
        if grounding.get("learning_outcomes"):
            db_session.learning_outcomes = json.dumps(grounding["learning_outcomes"])
        db.commit()
    except Exception as e:
        print(f"Error refreshing grounding with document: {e}")

    return {
        "status": "success",
        "filename": file.filename,
        "document_filename": file.filename,
        "tech_tags": merged_tags,
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
