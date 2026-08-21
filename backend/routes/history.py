from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from database import get_db
from models import History, Section

router = APIRouter(tags=["history"])


@router.get("/api/v1/courses/{session_id}/history")
def get_course_history(session_id: str, db: Session = Depends(get_db)):
    history_list = db.query(History).filter(History.session_id == session_id).order_by(History.created_at.desc()).all()
    return [{
        "id": h.id,
        "lesson_id": h.lesson_id,
        "role": h.role,
        "section_type": h.section_type,
        "label": h.label,
        "created_at": h.created_at
    } for h in history_list]


@router.post("/api/v1/courses/{session_id}/history/{history_id}/restore")
@router.post("/api/v1/history/{history_id}/restore")
def restore_course_history(history_id: int, session_id: str = None, db: Session = Depends(get_db)):
    h = db.query(History).filter(History.id == history_id).first()
    if not h:
        raise HTTPException(status_code=404, detail="History entry not found")

    section = db.query(Section).filter(
        Section.lesson_id == h.lesson_id,
        Section.role == h.role,
        Section.section_type == h.section_type
    ).first()

    if not section:
        section = Section(
            lesson_id=h.lesson_id,
            role=h.role,
            section_type=h.section_type,
            content_text=h.content_snapshot
        )
        db.add(section)
    else:
        section.content_text = h.content_snapshot

    db.commit()
    return {"status": "success", "content": section.content_text}
