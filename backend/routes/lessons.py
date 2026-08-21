import datetime
import json
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from database import get_db
from models import Lesson, Section, History
import schemas
import pipeline

router = APIRouter(prefix="/api/v1/lessons", tags=["lessons"])


def save_history_snapshot(
    db: Session,
    session_id: str,
    lesson_id: int,
    role: str,
    section_type: str,
    content_text: str,
    label: str = None
):
    history_entry = History(
        session_id=session_id,
        lesson_id=lesson_id,
        role=role,
        section_type=section_type,
        content_snapshot=content_text,
        label=label or f"Update {section_type.replace('_', ' ').capitalize()}",
        created_at=datetime.datetime.now().isoformat()
    )
    db.add(history_entry)
    db.commit()


@router.post("/{lesson_id}/sections/ai-action")
async def run_section_action_endpoint(lesson_id: int, req: schemas.AIActionRequest, db: Session = Depends(get_db)):
    section = db.query(Section).filter(
        Section.lesson_id == lesson_id,
        Section.role == req.role,
        Section.section_type == req.section_type
    ).first()
    if not section:
        raise HTTPException(status_code=404, detail="Section not found")

    original_text = section.content_text
    try:
        content_to_process = json.loads(original_text)
    except Exception:
        content_to_process = original_text

    if isinstance(content_to_process, str):
        processed = await pipeline.run_section_action(section.section_type, content_to_process, req.action, req.params)
        section.content_text = json.dumps(processed)
    else:
        processed = await pipeline.run_section_action(section.section_type, str(content_to_process), req.action, req.params)
        section.content_text = json.dumps(processed)

    db.commit()
    save_history_snapshot(
        db,
        section.lesson.course_id,
        section.lesson_id,
        section.role,
        section.section_type,
        section.content_text,
        f"AI {req.action.capitalize()}: {req.section_type.replace('_', ' ').capitalize()}"
    )
    return {"status": "success", "content": section.content_text}


@router.post("/{lesson_id}/quiz/generate")
async def generate_more_quizzes_endpoint(lesson_id: int, count: int = 3, db: Session = Depends(get_db)):
    lesson = db.query(Lesson).filter(Lesson.id == lesson_id).first()
    if not lesson:
        raise HTTPException(status_code=404, detail="Lesson not found")

    core_sec = db.query(Section).filter(Section.lesson_id == lesson_id, Section.role == "creator", Section.section_type == "core_content").first()
    core_text = json.loads(core_sec.content_text) if core_sec else ""

    new_quizzes = await pipeline.generate_more_quiz(lesson.title, core_text, count)

    quiz_sec = db.query(Section).filter(Section.lesson_id == lesson_id, Section.role == "creator", Section.section_type == "quiz").first()
    if quiz_sec:
        try:
            curr = json.loads(quiz_sec.content_text)
            if not isinstance(curr, list):
                curr = [curr]
        except Exception:
            curr = []
        curr.extend(new_quizzes)
        quiz_sec.content_text = json.dumps(curr)
    else:
        quiz_sec = Section(lesson_id=lesson_id, role="creator", section_type="quiz", content_text=json.dumps(new_quizzes))
        db.add(quiz_sec)

    db.commit()
    save_history_snapshot(db, lesson.course_id, lesson_id, "creator", "quiz", quiz_sec.content_text, "AI Generate More Quizzes")
    return {"status": "success", "quizzes": new_quizzes}


@router.post("/{lesson_id}/exercises/generate")
async def generate_more_exercises_endpoint(lesson_id: int, count: int = 1, db: Session = Depends(get_db)):
    lesson = db.query(Lesson).filter(Lesson.id == lesson_id).first()
    if not lesson:
        raise HTTPException(status_code=404, detail="Lesson not found")

    core_sec = db.query(Section).filter(Section.lesson_id == lesson_id, Section.role == "creator", Section.section_type == "core_content").first()
    core_text = json.loads(core_sec.content_text) if core_sec else ""

    new_exercises = await pipeline.generate_more_exercises(lesson.title, core_text, count)

    ex_sec = db.query(Section).filter(Section.lesson_id == lesson_id, Section.role == "creator", Section.section_type == "exercises").first()
    if ex_sec:
        try:
            curr = json.loads(ex_sec.content_text)
            if not isinstance(curr, list):
                curr = [curr]
        except Exception:
            curr = []
        curr.extend(new_exercises)
        ex_sec.content_text = json.dumps(curr)
    else:
        ex_sec = Section(lesson_id=lesson_id, role="creator", section_type="exercises", content_text=json.dumps(new_exercises))
        db.add(ex_sec)

    db.commit()
    save_history_snapshot(db, lesson.course_id, lesson_id, "creator", "exercises", ex_sec.content_text, "AI Generate More Exercises")
    return {"status": "success", "exercises": new_exercises}


@router.post("/{lesson_id}/sections/save")
def save_section_endpoint(lesson_id: int, req: schemas.SaveSectionRequest, db: Session = Depends(get_db)):
    section = db.query(Section).filter(
        Section.lesson_id == lesson_id,
        Section.role == req.role,
        Section.section_type == req.section_type
    ).first()
    if not section:
        section = Section(
            lesson_id=lesson_id,
            role=req.role,
            section_type=req.section_type,
            content_text=json.dumps(req.content)
        )
        db.add(section)
    else:
        section.content_text = json.dumps(req.content)
    db.commit()

    lesson = db.query(Lesson).filter(Lesson.id == lesson_id).first()
    session_id = lesson.course_id if lesson else ""
    save_history_snapshot(db, session_id, lesson_id, req.role, req.section_type, section.content_text, f"Manual Edit: {req.section_type.replace('_', ' ').capitalize()}")

    return {"status": "success", "content": section.content_text}
