import asyncio
import json
import uuid
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session

from database import SessionLocal, get_db
from models import Session as DbSession, Course, Lesson, Section, Pptx
import schemas
import pipeline
from services.progress_service import progress_publisher
from services.generator_service import generate_course_content_task_async

router = APIRouter(prefix="/api/v1/courses", tags=["courses"])


@router.get("/sessions/{session_id}/stream-progress")
async def stream_progress(session_id: str):
    async def event_generator():
        q = progress_publisher.subscribe(session_id)
        db = SessionLocal()
        try:
            db_session = db.query(DbSession).filter(DbSession.id == session_id).first()
            if db_session:
                init_data = {
                    "progress": db_session.progress,
                    "status": db_session.status,
                    "status_text": db_session.status_text,
                    "step": db_session.step
                }
                yield f"data: {json.dumps(init_data)}\n\n"
        finally:
            db.close()

        try:
            while True:
                data = await q.get()
                yield f"data: {json.dumps(data)}\n\n"
                if data.get("status") in ["completed", "error"]:
                    break
        except asyncio.CancelledError:
            pass
        finally:
            progress_publisher.unsubscribe(session_id, q)

    return StreamingResponse(event_generator(), media_type="text/event-stream")


@router.get("/sessions")
def list_sessions(db: Session = Depends(get_db)):
    sessions = db.query(DbSession).order_by(DbSession.id.desc()).all()
    result = []
    for s in sessions:
        course = db.query(Course).filter(Course.id == s.id).first()
        title = course.title if course else s.prompt

        tags = []
        if s.tech_tags:
            try:
                tags = json.loads(s.tech_tags)
            except Exception:
                tags = []
        if not tags:
            tags = pipeline.get_default_candidate_tags(s.prompt or title or "AI Course", [])

        result.append({
            "session_id": s.id,
            "title": title or s.prompt or "Untitled Course",
            "prompt": s.prompt,
            "step": s.step,
            "status": s.status,
            "progress": s.progress,
            "difficulty": s.config_difficulty,
            "audience": s.config_audience,
            "tech_tags": tags
        })
    return result


@router.post("/sessions")
def create_session(input_data: schemas.KeywordInput, db: Session = Depends(get_db)):
    session_id = str(uuid.uuid4())

    ai_result = pipeline.generate_concept_and_grounding(input_data.keyword)
    grounding = ai_result.get("grounding", {})
    tech_tags = grounding.get("tech_tags", [])
    all_suggested_tags = grounding.get("all_suggested_tags", pipeline.get_default_candidate_tags(input_data.keyword, tech_tags))

    display_title = ai_result.get("display_title", input_data.keyword)
    explicit_params = ai_result.get("explicit_parameters", {})
    lesson_count_override = explicit_params.get("lesson_count")
    duration_override = explicit_params.get("duration")

    db_session = DbSession(
        id=session_id,
        step="context",
        prompt=display_title,
        tech_tags=json.dumps(tech_tags),
        prerequisites=json.dumps(grounding.get("prerequisites", [])),
        boundaries=json.dumps(grounding.get("out_of_scope", [])),
        learning_outcomes=json.dumps(grounding.get("learning_outcomes", [])),
        config_audience=grounding.get("target_audience", "Student"),
        subject_context=ai_result.get("subject_context", ""),
        status="idle",
        progress=0
    )

    if lesson_count_override and isinstance(lesson_count_override, int):
        db_session.config_lessons = lesson_count_override
    if duration_override and isinstance(duration_override, str):
        db_session.config_duration = duration_override

    db.add(db_session)
    db.commit()
    db.refresh(db_session)

    return {
        "session_id": session_id,
        "step": db_session.step,
        "prompt": db_session.prompt,
        "tech_tags": json.loads(db_session.tech_tags),
        "all_suggested_tags": all_suggested_tags,
        "config": {
            "lessons_count": db_session.config_lessons,
            "duration": db_session.config_duration,
            "difficulty": db_session.config_difficulty,
            "target_audience": db_session.config_audience,
        },
        "subject_context": db_session.subject_context
    }


@router.get("/sessions/{session_id}")
def get_session(session_id: str, db: Session = Depends(get_db)):
    db_session = db.query(DbSession).filter(DbSession.id == session_id).first()
    if not db_session:
        raise HTTPException(status_code=404, detail="Session not found")

    lessons_data = []
    course = db.query(Course).filter(Course.id == session_id).first()
    if course:
        for lesson in sorted(course.lessons, key=lambda l: l.position):
            sections_data = {}
            for sec in lesson.sections:
                if sec.role not in sections_data:
                    sections_data[sec.role] = {}
                try:
                    sections_data[sec.role][sec.section_type] = json.loads(sec.content_text)
                except Exception:
                    sections_data[sec.role][sec.section_type] = sec.content_text
            lessons_data.append({
                "id": lesson.id,
                "title": lesson.title,
                "order": lesson.position,
                "sections": sections_data
            })

    pptx_by_lesson = {}
    if course:
        lesson_ids = [l.id for l in course.lessons]
        if lesson_ids:
            pptx_records = db.query(Pptx).filter(Pptx.lesson_id.in_(lesson_ids)).all()
            for pptx in pptx_records:
                try:
                    pptx_by_lesson[pptx.lesson_id] = {"layouts": json.loads(pptx.layouts_json)}
                except Exception:
                    pptx_by_lesson[pptx.lesson_id] = {}

    course_title = course.title if course else (db_session.prompt or "Untitled Course")
    loaded_tech_tags = json.loads(db_session.tech_tags) if db_session.tech_tags else []
    all_suggested = pipeline.get_default_candidate_tags(db_session.prompt, loaded_tech_tags)

    return {
        "session_id": db_session.id,
        "title": course_title,
        "step": db_session.step,
        "prompt": db_session.prompt,
        "tech_tags": loaded_tech_tags,
        "all_suggested_tags": all_suggested,
        "prerequisites": json.loads(db_session.prerequisites) if db_session.prerequisites else [],
        "out_of_scope": json.loads(db_session.boundaries) if db_session.boundaries else [],
        "learning_outcomes": json.loads(db_session.learning_outcomes) if db_session.learning_outcomes else [],
        "config": {
            "lessons_count": db_session.config_lessons,
            "duration": db_session.config_duration,
            "difficulty": db_session.config_difficulty,
            "target_audience": db_session.config_audience,
            "subject_context": db_session.subject_context
        },
        "subject_context": db_session.subject_context,
        "document_filename": db_session.document_filename,
        "proposals": json.loads(db_session.proposals) if db_session.proposals else [],
        "selected_proposal_id": db_session.selected_proposal_id,
        "structure": json.loads(db_session.structure) if db_session.structure else [],
        "status": db_session.status,
        "progress": db_session.progress,
        "status_text": db_session.status_text,
        "lessons": lessons_data,
        "pptx_by_lesson": pptx_by_lesson
    }


@router.delete("/sessions/{session_id}")
def delete_session(session_id: str, db: Session = Depends(get_db)):
    db_session = db.query(DbSession).filter(DbSession.id == session_id).first()
    if not db_session:
        raise HTTPException(status_code=404, detail="Session not found")

    course = db.query(Course).filter(Course.id == session_id).first()
    if course:
        db.delete(course)
    db.delete(db_session)
    db.commit()
    return {"message": "Session deleted successfully"}


@router.patch("/sessions/{session_id}/status")
def update_session_status(session_id: str, payload: dict, db: Session = Depends(get_db)):
    db_session = db.query(DbSession).filter(DbSession.id == session_id).first()
    if not db_session:
        raise HTTPException(status_code=404, detail="Session not found")

    new_status = payload.get("status")
    if new_status:
        db_session.status = new_status
        db.commit()
    return {"message": "Status updated successfully", "status": db_session.status}


@router.post("/sessions/{session_id}/grounding")
def save_grounding(session_id: str, grounding_data: schemas.GroundingInput, db: Session = Depends(get_db)):
    db_session = db.query(DbSession).filter(DbSession.id == session_id).first()
    if not db_session:
        raise HTTPException(status_code=404, detail="Session not found")

    db_session.tech_tags = json.dumps(grounding_data.tech_tags)
    db_session.prerequisites = json.dumps(grounding_data.prerequisites)
    db_session.boundaries = json.dumps(grounding_data.out_of_scope)
    db_session.learning_outcomes = json.dumps(grounding_data.learning_outcomes)
    db_session.config_audience = grounding_data.target_audience
    db_session.step = "proposal"
    db.commit()

    return {"message": "Grounding saved successfully", "step": db_session.step}


@router.post("/sessions/{session_id}/grounding/suggest")
async def suggest_grounding_item(session_id: str, req: schemas.GroundingSuggestRequest, db: Session = Depends(get_db)):
    db_session = db.query(DbSession).filter(DbSession.id == session_id).first()
    if not db_session:
        raise HTTPException(status_code=404, detail="Session not found")

    tech_tags = json.loads(db_session.tech_tags) if db_session.tech_tags else []
    suggestion = await pipeline.generate_single_grounding_item(
        keyword=db_session.prompt or "Software Development",
        field_type=req.field_type,
        existing_items=req.existing_items,
        difficulty=db_session.config_difficulty or "Beginner",
        audience=db_session.config_audience or "Student",
        tech_tags=tech_tags
    )
    return {"suggestion": suggestion}


@router.post("/sessions/{session_id}/config")
def update_config(session_id: str, config_data: schemas.CourseConfigUpdate, db: Session = Depends(get_db)):
    db_session = db.query(DbSession).filter(DbSession.id == session_id).first()
    if not db_session:
        raise HTTPException(status_code=404, detail="Session not found")

    db_session.config_lessons = config_data.lessons_count
    db_session.config_duration = config_data.duration
    db_session.config_difficulty = config_data.difficulty
    db_session.config_audience = config_data.target_audience
    db_session.subject_context = config_data.subject_context
    if config_data.tech_tags is not None:
        db_session.tech_tags = json.dumps(config_data.tech_tags)
    db.commit()

    return {"message": "Config updated successfully"}


@router.post("/sessions/{session_id}/grounding/refresh")
def refresh_grounding_endpoint(session_id: str, db: Session = Depends(get_db)):
    db_session = db.query(DbSession).filter(DbSession.id == session_id).first()
    if not db_session:
        raise HTTPException(status_code=404, detail="Session not found")

    tech_tags = json.loads(db_session.tech_tags) if db_session.tech_tags else []
    ai_result = pipeline.generate_concept_and_grounding(
        keyword=db_session.prompt or "Software Development",
        tags=tech_tags,
        difficulty=db_session.config_difficulty or "Beginner",
        audience=db_session.config_audience or "Student"
    )
    grounding = ai_result.get("grounding", {})
    prerequisites = grounding.get("prerequisites", [])
    out_of_scope = grounding.get("out_of_scope", [])
    learning_outcomes = grounding.get("learning_outcomes", [])

    db_session.prerequisites = json.dumps(prerequisites)
    db_session.boundaries = json.dumps(out_of_scope)
    db_session.learning_outcomes = json.dumps(learning_outcomes)
    db.commit()

    return {
        "prerequisites": prerequisites,
        "out_of_scope": out_of_scope,
        "learning_outcomes": learning_outcomes,
        "tech_tags": tech_tags,
        "subject_context": ai_result.get("subject_context", db_session.subject_context)
    }


@router.post("/sessions/{session_id}/proposals/generate")
def generate_proposals_api(session_id: str, db: Session = Depends(get_db)):
    db_session = db.query(DbSession).filter(DbSession.id == session_id).first()
    if not db_session:
        raise HTTPException(status_code=404, detail="Session not found")

    grounding = {
        "tech_tags": json.loads(db_session.tech_tags) if db_session.tech_tags else [],
        "prerequisites": json.loads(db_session.prerequisites) if db_session.prerequisites else [],
        "out_of_scope": json.loads(db_session.boundaries) if db_session.boundaries else [],
        "learning_outcomes": json.loads(db_session.learning_outcomes) if db_session.learning_outcomes else [],
        "target_audience": db_session.config_audience or "Student",
        "subject_context": db_session.subject_context or ""
    }

    proposals = pipeline.generate_proposals(db_session.prompt, grounding)
    db_session.proposals = json.dumps(proposals)
    db_session.step = "proposal"
    db.commit()

    return {"proposals": proposals}


@router.post("/sessions/{session_id}/proposals/select")
def select_proposal(session_id: str, payload: schemas.ProposalSelect, db: Session = Depends(get_db)):
    db_session = db.query(DbSession).filter(DbSession.id == session_id).first()
    if not db_session:
        raise HTTPException(status_code=404, detail="Session not found")

    proposals_list = json.loads(db_session.proposals) if db_session.proposals else []
    selected_proposal = next((p for p in proposals_list if p["id"] == payload.selected_proposal_id), None)
    if not selected_proposal:
        raise HTTPException(status_code=400, detail="Invalid proposal ID")

    db_session.selected_proposal_id = payload.selected_proposal_id

    grounding = {
        "tech_tags": json.loads(db_session.tech_tags) if db_session.tech_tags else [],
        "prerequisites": json.loads(db_session.prerequisites) if db_session.prerequisites else [],
        "out_of_scope": json.loads(db_session.boundaries) if db_session.boundaries else [],
        "learning_outcomes": json.loads(db_session.learning_outcomes) if db_session.learning_outcomes else [],
        "target_audience": db_session.config_audience or "Student",
        "subject_context": db_session.subject_context or ""
    }
    config = {
        "lessons_count": db_session.config_lessons,
        "difficulty": db_session.config_difficulty
    }

    structure = pipeline.generate_structure(selected_proposal["title"], config, grounding)
    db_session.structure = json.dumps(structure)
    db_session.step = "structure"
    db.commit()

    return {"message": "Proposal selected and structure generated", "structure": structure}


@router.post("/sessions/{session_id}/structure/save")
def save_structure(session_id: str, payload: schemas.StructureUpdate, db: Session = Depends(get_db)):
    db_session = db.query(DbSession).filter(DbSession.id == session_id).first()
    if not db_session:
        raise HTTPException(status_code=404, detail="Session not found")

    structure_list = []
    for l in payload.lessons:
        lesson_dict = {"id": l.id, "title": l.title, "order": l.order}
        if l.sections is not None:
            lesson_dict["sections"] = l.sections
        structure_list.append(lesson_dict)

    db_session.structure = json.dumps(structure_list)
    db_session.step = "review"
    db.commit()

    return {"message": "Structure saved successfully", "step": db_session.step}


@router.post("/sessions/{session_id}/content/generate")
async def trigger_generation(session_id: str, background_tasks: BackgroundTasks, db: Session = Depends(get_db)):
    db_session = db.query(DbSession).filter(DbSession.id == session_id).first()
    if not db_session:
        raise HTTPException(status_code=404, detail="Session not found")

    db_session.status = "queued"
    db_session.progress = 5
    db_session.status_text = "Generation queued..."
    db.commit()

    background_tasks.add_task(generate_course_content_task_async, session_id)
    return {"message": "Generation started", "status": "queued"}


@router.post("/sessions/{session_id}/cancel")
async def cancel_generation(session_id: str, db: Session = Depends(get_db)):
    db_session = db.query(DbSession).filter(DbSession.id == session_id).first()
    if db_session:
        db_session.status = "canceled"
        db_session.step = "review"
        db_session.status_text = "Generation canceled by user."
        db.commit()
        await progress_publisher.publish(session_id, {
            "progress": 0,
            "status": "canceled",
            "status_text": "Generation canceled by user.",
            "step": "review"
        })
    return {"status": "canceled"}
