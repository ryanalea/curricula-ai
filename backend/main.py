from fastapi import FastAPI, Depends, HTTPException, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
import uuid
import json
import asyncio
from typing import List

from models import SessionLocal, init_db, Session as DbSession, Course, Lesson, Section
import schemas
import pipeline

init_db()

app = FastAPI(title="AI Course Generator API", version="1.0.0")

# Enable CORS for frontend integration
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:3000",
        "http://127.0.0.1:3000"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Dependency to get db session
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

@app.get("/")
def read_root():
    return {"message": "Welcome to AI Course Generator API"}

@app.get("/api/v1/courses/sessions")
def list_sessions(db: Session = Depends(get_db)):
    sessions = db.query(DbSession).order_by(DbSession.id.desc()).all()
    result = []
    for s in sessions:
        # Try to get course title from Course entity
        course = db.query(Course).filter(Course.id == s.id).first()
        title = course.title if course else s.prompt
        result.append({
            "session_id": s.id,
            "title": title or s.prompt or "Untitled Course",
            "prompt": s.prompt,
            "step": s.step,
            "status": s.status,
            "progress": s.progress,
            "difficulty": s.config_difficulty,
            "audience": s.config_audience,
        })
    return result

@app.post("/api/v1/courses/sessions")
def create_session(input_data: schemas.KeywordInput, db: Session = Depends(get_db)):
    session_id = str(uuid.uuid4())
    
    # 1. Generate initial concept & grounding parameters from user prompt
    ai_result = pipeline.generate_concept_and_grounding(input_data.keyword)
    
    # Create the session
    db_session = DbSession(
        id=session_id,
        step="context",
        prompt=input_data.keyword,
        tech_tags=json.dumps(ai_result.get("grounding", {}).get("tech_tags", [])),
        prerequisites=json.dumps(ai_result.get("grounding", {}).get("prerequisites", [])),
        boundaries=json.dumps(ai_result.get("grounding", {}).get("out_of_scope", [])),
        learning_outcomes=json.dumps(ai_result.get("grounding", {}).get("learning_outcomes", [])),
        config_audience=ai_result.get("grounding", {}).get("target_audience", "Student"),
        subject_context=ai_result.get("subject_context", ""),
        status="idle",
        progress=0
    )
    db.add(db_session)
    db.commit()
    db.refresh(db_session)
    
    return {
        "session_id": session_id,
        "step": db_session.step,
        "prompt": db_session.prompt,
        "tech_tags": json.loads(db_session.tech_tags),
        "config": {
            "lessons_count": db_session.config_lessons,
            "duration": db_session.config_duration,
            "difficulty": db_session.config_difficulty,
            "target_audience": db_session.config_audience,
        },
        "subject_context": db_session.subject_context
    }

@app.get("/api/v1/courses/sessions/{session_id}")
def get_session(session_id: str, db: Session = Depends(get_db)):
    db_session = db.query(DbSession).filter(DbSession.id == session_id).first()
    if not db_session:
        raise HTTPException(status_code=404, detail="Session not found")
    
    # Check if lessons exist
    lessons_data = []
    course = db.query(Course).filter(Course.id == session_id).first()
    if course:
        for lesson in sorted(course.lessons, key=lambda l: l.order):
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
                "order": lesson.order,
                "sections": sections_data
            })
            
    # Get course title from Course entity if it exists
    course = db.query(Course).filter(Course.id == session_id).first()
    course_title = course.title if course else (db_session.prompt or "Untitled Course")

    return {
        "session_id": db_session.id,
        "title": course_title,
        "step": db_session.step,
        "prompt": db_session.prompt,
        "tech_tags": json.loads(db_session.tech_tags),
        "prerequisites": json.loads(db_session.prerequisites),
        "out_of_scope": json.loads(db_session.boundaries),
        "learning_outcomes": json.loads(db_session.learning_outcomes),
        "config": {
            "lessons_count": db_session.config_lessons,
            "duration": db_session.config_duration,
            "difficulty": db_session.config_difficulty,
            "target_audience": db_session.config_audience,
        },
        "subject_context": db_session.subject_context,
        "proposals": json.loads(db_session.proposals),
        "selected_proposal_id": db_session.selected_proposal_id,
        "structure": json.loads(db_session.structure),
        "status": db_session.status,
        "progress": db_session.progress,
        "status_text": db_session.status_text,
        "lessons": lessons_data
    }

@app.post("/api/v1/courses/sessions/{session_id}/grounding")
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

@app.post("/api/v1/courses/sessions/{session_id}/config")
def update_config(session_id: str, config_data: schemas.CourseConfigUpdate, db: Session = Depends(get_db)):
    db_session = db.query(DbSession).filter(DbSession.id == session_id).first()
    if not db_session:
        raise HTTPException(status_code=404, detail="Session not found")
        
    db_session.config_lessons = config_data.lessons_count
    db_session.config_duration = config_data.duration
    db_session.config_difficulty = config_data.difficulty
    db_session.config_audience = config_data.target_audience
    db_session.subject_context = config_data.subject_context
    db.commit()
    
    return {"message": "Config updated successfully"}

@app.post("/api/v1/courses/sessions/{session_id}/proposals/generate")
def generate_proposals_api(session_id: str, db: Session = Depends(get_db)):
    db_session = db.query(DbSession).filter(DbSession.id == session_id).first()
    if not db_session:
        raise HTTPException(status_code=404, detail="Session not found")
        
    grounding = {
        "tech_tags": json.loads(db_session.tech_tags),
        "prerequisites": json.loads(db_session.prerequisites),
        "out_of_scope": json.loads(db_session.boundaries),
        "learning_outcomes": json.loads(db_session.learning_outcomes),
        "target_audience": db_session.config_audience
    }
    
    proposals = pipeline.generate_proposals(db_session.prompt, grounding)
    db_session.proposals = json.dumps(proposals)
    db_session.step = "proposal"
    db.commit()
    
    return {"proposals": proposals}

@app.post("/api/v1/courses/sessions/{session_id}/proposals/select")
def select_proposal(session_id: str, payload: schemas.ProposalSelect, db: Session = Depends(get_db)):
    db_session = db.query(DbSession).filter(DbSession.id == session_id).first()
    if not db_session:
        raise HTTPException(status_code=404, detail="Session not found")
        
    proposals_list = json.loads(db_session.proposals)
    selected_proposal = next((p for p in proposals_list if p["id"] == payload.selected_proposal_id), None)
    if not selected_proposal:
        raise HTTPException(status_code=400, detail="Invalid proposal ID")
        
    db_session.selected_proposal_id = payload.selected_proposal_id
    
    # Generate initial course structure/lessons outline
    grounding = {
        "tech_tags": json.loads(db_session.tech_tags),
        "prerequisites": json.loads(db_session.prerequisites),
        "out_of_scope": json.loads(db_session.boundaries),
        "learning_outcomes": json.loads(db_session.learning_outcomes),
        "target_audience": db_session.config_audience
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

@app.post("/api/v1/courses/sessions/{session_id}/structure/save")
def save_structure(session_id: str, payload: schemas.StructureUpdate, db: Session = Depends(get_db)):
    db_session = db.query(DbSession).filter(DbSession.id == session_id).first()
    if not db_session:
        raise HTTPException(status_code=404, detail="Session not found")
        
    structure_list = [{"id": l.id, "title": l.title, "order": l.order} for l in payload.lessons]
    db_session.structure = json.dumps(structure_list)
    db_session.step = "review"
    db.commit()
    
    return {"message": "Structure saved successfully", "step": db_session.step}

async def generate_course_content_task(session_id: str):
    db = SessionLocal()
    try:
        db_session = db.query(DbSession).filter(DbSession.id == session_id).first()
        if not db_session:
            return
            
        db_session.status = "generating"
        db_session.progress = 10
        db_session.status_text = "Initializing Course Generation..."
        db.commit()
        
        # Create course entity
        proposals_list = json.loads(db_session.proposals)
        sel_prop = next((p for p in proposals_list if p["id"] == db_session.selected_proposal_id), {})
        
        course = db.query(Course).filter(Course.id == session_id).first()
        if not course:
            course = Course(
                id=session_id,
                title=sel_prop.get("title", db_session.prompt),
                description=sel_prop.get("description", ""),
                difficulty=db_session.config_difficulty,
                duration=db_session.config_duration,
                audience=db_session.config_audience
            )
            db.add(course)
            db.commit()
            
        lessons_outline = json.loads(db_session.structure)
        total_lessons = len(lessons_outline)
        
        for idx, item in enumerate(lessons_outline):
            db_session.status_text = f"Generating content for Lesson {idx+1}/{total_lessons}: {item['title']}"
            db_session.progress = int(10 + (idx / total_lessons) * 80)
            db.commit()
            
            # Check or create Lesson
            lesson = db.query(Lesson).filter(Lesson.course_id == session_id, Lesson.order == item["order"]).first()
            if not lesson:
                lesson = Lesson(
                    course_id=session_id,
                    title=item["title"],
                    order=item["order"]
                )
                db.add(lesson)
                db.commit()
                db.refresh(lesson)
                
            # Run RTFC master prompting parallel/sequence calls
            grounding_data = db_session.prerequisites
            lesson_structure = db_session.structure
            
            # 1. Creator Content
            creator_json = await pipeline.generate_creator_content(lesson.title, grounding_data, lesson_structure)
            for k, v in creator_json.items():
                sec = Section(lesson_id=lesson.id, role="creator", section_type=k, content_text=json.dumps(v))
                db.add(sec)
                
            # 2. Student Content (uses Creator's core content)
            student_json = await pipeline.generate_student_content(lesson.title, creator_json.get("core_content", ""))
            for k, v in student_json.items():
                sec = Section(lesson_id=lesson.id, role="student", section_type=k, content_text=json.dumps(v))
                db.add(sec)
                
            # 3. Educator Content (uses Creator's core content)
            educator_json = await pipeline.generate_educator_content(lesson.title, creator_json.get("core_content", ""))
            for k, v in educator_json.items():
                sec = Section(lesson_id=lesson.id, role="educator", section_type=k, content_text=json.dumps(v))
                db.add(sec)
                
            db.commit()
            
        db_session.status = "completed"
        db_session.progress = 100
        db_session.status_text = "Course Generation Completed!"
        db_session.step = "generated"
        db.commit()
        
    except Exception as e:
        db_session.status = "error"
        db_session.status_text = f"Error during generation: {str(e)}"
        db.commit()
    finally:
        db.close()

@app.post("/api/v1/courses/sessions/{session_id}/content/generate")
def trigger_generation(session_id: str, background_tasks: BackgroundTasks, db: Session = Depends(get_db)):
    db_session = db.query(DbSession).filter(DbSession.id == session_id).first()
    if not db_session:
        raise HTTPException(status_code=404, detail="Session not found")
        
    db_session.status = "queued"
    db_session.progress = 5
    db_session.status_text = "Generation queued..."
    db.commit()
    
    background_tasks.add_task(generate_course_content_task, session_id)
    return {"message": "Generation started", "status": "queued"}
