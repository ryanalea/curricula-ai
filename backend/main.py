from fastapi import FastAPI, Depends, HTTPException, BackgroundTasks, UploadFile, File
from fastapi.responses import StreamingResponse
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
import uuid
import json
import asyncio
from typing import List
import datetime
import io

from database import SessionLocal, get_db
from models import Session as DbSession, Course, Lesson, Section, History
import schemas
import pipeline
import exporter
import document_parser

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

class ProgressPublisher:
    def __init__(self):
        self._subscribers: dict[str, list[asyncio.Queue]] = {}

    def subscribe(self, session_id: str) -> asyncio.Queue:
        if session_id not in self._subscribers:
            self._subscribers[session_id] = []
        q = asyncio.Queue()
        self._subscribers[session_id].append(q)
        return q

    def unsubscribe(self, session_id: str, q: asyncio.Queue):
        if session_id in self._subscribers and q in self._subscribers[session_id]:
            self._subscribers[session_id].remove(q)
            if not self._subscribers[session_id]:
                del self._subscribers[session_id]

    async def publish(self, session_id: str, data: dict):
        if session_id in self._subscribers:
            for q in list(self._subscribers[session_id]):
                await q.put(data)

progress_publisher = ProgressPublisher()

@app.get("/api/v1/courses/sessions/{session_id}/stream-progress")
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

@app.get("/")
def read_root():
    return {"message": "Welcome to AI Course Generator API"}

@app.get("/api/v1/courses/sessions")
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

@app.post("/api/v1/courses/sessions")
def create_session(input_data: schemas.KeywordInput, db: Session = Depends(get_db)):
    session_id = str(uuid.uuid4())
    
    # 1. Generate initial concept & grounding parameters from user prompt
    ai_result = pipeline.generate_concept_and_grounding(input_data.keyword)
    grounding = ai_result.get("grounding", {})
    tech_tags = grounding.get("tech_tags", [])
    all_suggested_tags = grounding.get("all_suggested_tags", pipeline.get_default_candidate_tags(input_data.keyword, tech_tags))
    
    # Create the session
    db_session = DbSession(
        id=session_id,
        step="context",
        prompt=input_data.keyword,
        tech_tags=json.dumps(tech_tags),
        prerequisites=json.dumps(grounding.get("prerequisites", [])),
        boundaries=json.dumps(grounding.get("out_of_scope", [])),
        learning_outcomes=json.dumps(grounding.get("learning_outcomes", [])),
        config_audience=grounding.get("target_audience", "Student"),
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
        "all_suggested_tags": all_suggested_tags,
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
            
    # Get course title from Course entity if it exists
    course = db.query(Course).filter(Course.id == session_id).first()
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
        "prerequisites": json.loads(db_session.prerequisites),
        "out_of_scope": json.loads(db_session.boundaries),
        "learning_outcomes": json.loads(db_session.learning_outcomes),
        "config": {
            "lessons_count": db_session.config_lessons,
            "duration": db_session.config_duration,
            "difficulty": db_session.config_difficulty,
            "target_audience": db_session.config_audience,
            "subject_context": db_session.subject_context
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

@app.delete("/api/v1/courses/sessions/{session_id}")
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

@app.patch("/api/v1/courses/sessions/{session_id}/status")
def update_session_status(session_id: str, payload: dict, db: Session = Depends(get_db)):
    db_session = db.query(DbSession).filter(DbSession.id == session_id).first()
    if not db_session:
        raise HTTPException(status_code=404, detail="Session not found")
    
    new_status = payload.get("status")
    if new_status:
        db_session.status = new_status
        db.commit()
    return {"message": "Status updated successfully", "status": db_session.status}

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

@app.post("/api/v1/courses/sessions/{session_id}/grounding/suggest")
async def suggest_grounding_item(session_id: str, req: schemas.GroundingSuggestRequest, db: Session = Depends(get_db)):
    db_session = db.query(DbSession).filter(DbSession.id == session_id).first()
    if not db_session:
        raise HTTPException(status_code=404, detail="Session not found")
        
    suggestion = await pipeline.generate_single_grounding_item(
        db_session.prompt,
        req.field_type,
        req.existing_items
    )
    return {"suggestion": suggestion}

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
    if config_data.tech_tags is not None:
        db_session.tech_tags = json.dumps(config_data.tech_tags)
    db.commit()
    
    return {"message": "Config updated successfully"}

@app.post("/api/v1/courses/sessions/{session_id}/proposals/generate")
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

@app.post("/api/v1/courses/sessions/{session_id}/structure/save")
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

def generate_course_content_task(session_id: str):
    import asyncio
    try:
        loop = asyncio.get_event_loop()
        if loop.is_running():
            asyncio.create_task(generate_course_content_task_async(session_id))
        else:
            loop.run_until_complete(generate_course_content_task_async(session_id))
    except Exception:
        loop = asyncio.new_event_loop()
        asyncio.set_event_loop(loop)
        loop.run_until_complete(generate_course_content_task_async(session_id))

async def generate_course_content_task_async(session_id: str):
    db = SessionLocal()
    try:
        db_session = db.query(DbSession).filter(DbSession.id == session_id).first()
        if not db_session:
            return
            
        db_session.status = "generating"
        db_session.progress = 10
        db_session.status_text = "Initializing Course Generation..."
        db.commit()
        await progress_publisher.publish(session_id, {
            "progress": 10,
            "status": "generating",
            "status_text": db_session.status_text,
            "step": db_session.step
        })
        
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
            status_msg = f"Generating content for Lesson {idx+1}/{total_lessons}: {item['title']}"
            prog_val = int(10 + (idx / total_lessons) * 80)
            db_session.status_text = status_msg
            db_session.progress = prog_val
            db.commit()
            await progress_publisher.publish(session_id, {
                "progress": prog_val,
                "status": "generating",
                "status_text": status_msg,
                "step": db_session.step,
                "current_lesson": idx + 1,
                "total_lessons": total_lessons
            })
            
            # Check or create Lesson
            lesson = db.query(Lesson).filter(Lesson.course_id == session_id, Lesson.position == idx + 1).first()
            if not lesson:
                lesson = Lesson(
                    course_id=session_id,
                    title=item["title"],
                    position=idx + 1
                )
                db.add(lesson)
                db.commit()
                db.refresh(lesson)
                
            # Run RTFC master prompting calls in parallel for faster speed
            grounding_data = json.dumps({
                "tech_tags": json.loads(db_session.tech_tags) if db_session.tech_tags else [],
                "subject_context": db_session.subject_context or "",
                "prerequisites": json.loads(db_session.prerequisites) if db_session.prerequisites else [],
                "out_of_scope": json.loads(db_session.boundaries) if db_session.boundaries else [],
                "learning_outcomes": json.loads(db_session.learning_outcomes) if db_session.learning_outcomes else [],
                "target_audience": db_session.config_audience or "Student"
            })
            lesson_structure = db_session.structure or ""
            lesson_duration = db_session.config_duration or "60 mins"
            
            try:
                creator_json = await pipeline.generate_creator_content(lesson.title, grounding_data, lesson_structure, lesson_duration=lesson_duration)
                if not isinstance(creator_json, dict):
                    creator_json = {}
            except Exception as e_creator:
                print(f"Error generating creator content for {lesson.title}: {e_creator}")
                creator_json = {
                    "overview": f"A comprehensive guide detailing {lesson.title}.",
                    "learning_outcomes": ["Understand the core mechanics"],
                    "core_content": f"### Introduction to {lesson.title}\nContent generation complete.",
                    "exercises": [{"title": "Practice 1", "instruction": "Write a basic script", "difficulty": "Easy"}],
                    "quiz": [{"question": "Default Question?", "options": ["A", "B", "C", "D"], "answer": "A", "explanation": "Default option is correct."}],
                    "prompt_templates": []
                }

            for k, v in creator_json.items():
                db.query(Section).filter(Section.lesson_id == lesson.id, Section.role == "creator", Section.section_type == k).delete()
                sec = Section(lesson_id=lesson.id, role="creator", section_type=k, content_text=json.dumps(v))
                db.add(sec)
                
            # 2 & 3. Student and Educator Content concurrently (grounded in Creator content)
            try:
                student_task = pipeline.generate_student_content(lesson.title, creator_json, lesson_duration=lesson_duration)
                educator_task = pipeline.generate_educator_content(lesson.title, creator_json, lesson_duration=lesson_duration)
                student_json, educator_json = await asyncio.gather(student_task, educator_task, return_exceptions=True)
                
                if isinstance(student_json, Exception) or not isinstance(student_json, dict):
                    student_json = {
                        "why_this_matters": "Understanding this module is crucial for modern applications.",
                        "learning_journey": "Follow the custom practice template.",
                        "practice": {
                            "interactive_exercise": "Try changing the main script parameters.",
                            "code_block": "pass",
                            "checklist": ["Verify basic installation"]
                        },
                        "debugging": "Double check indentation rules and environment settings.",
                        "ethics": "Always verify usage terms and data protection laws."
                    }

                if isinstance(educator_json, Exception) or not isinstance(educator_json, dict):
                    educator_json = {
                        "facilitator_guide": "Guide learners through the basic hands-on demo.",
                        "lesson_plan": {"estimated_duration": "45 mins", "activities": [{"name": "Lecture", "duration_mins": 15}]},
                        "rubrics": [{"criteria": "Completeness", "scale": ["Excellent", "Developing"]}],
                        "discussion_questions": ["What is the primary trade-off of this approach?"]
                    }
            except Exception as e_pair:
                print(f"Error in parallel generation for {lesson.title}: {e_pair}")

            for k, v in student_json.items():
                db.query(Section).filter(Section.lesson_id == lesson.id, Section.role == "student", Section.section_type == k).delete()
                sec = Section(lesson_id=lesson.id, role="student", section_type=k, content_text=json.dumps(v))
                db.add(sec)

            for k, v in educator_json.items():
                db.query(Section).filter(Section.lesson_id == lesson.id, Section.role == "educator", Section.section_type == k).delete()
                sec = Section(lesson_id=lesson.id, role="educator", section_type=k, content_text=json.dumps(v))
                db.add(sec)
                
            # 4. Generate custom/unlocked sections from lessons_outline
            sections_dict = item.get("sections", {})
            for role_name in ["creator", "student", "educator"]:
                role_sects = sections_dict.get(role_name, [])
                for s in role_sects:
                    if not s.get("locked", False) and s.get("type"):
                        try:
                            cs_content = await pipeline.generate_custom_section_content(
                                lesson.title, 
                                s.get("title"), 
                                s.get("instruction", "Write curriculum content."), 
                                grounding_data
                            )
                            db.query(Section).filter(
                                Section.lesson_id == lesson.id, 
                                Section.role == role_name, 
                                Section.section_type == s.get("type")
                            ).delete()
                            sec = Section(
                                lesson_id=lesson.id, 
                                role=role_name, 
                                section_type=s.get("type"), 
                                content_text=json.dumps(cs_content)
                            )
                            db.add(sec)
                        except Exception as e_cs:
                            print(f"Error generating custom section '{s.get('title')}': {e_cs}")
                
            db.commit()
            
        db_session.status = "completed"
        db_session.progress = 100
        db_session.status_text = "Course Generation Completed!"
        db_session.step = "generated"
        db.commit()
        await progress_publisher.publish(session_id, {
            "progress": 100,
            "status": "completed",
            "status_text": "Course Generation Completed!",
            "step": "generated"
        })
        
    except Exception as e:
        try:
            db.rollback()
        except Exception:
            pass
        db_session.status = "error"
        db_session.status_text = f"Error during generation: {str(e)}"
        db.commit()
        await progress_publisher.publish(session_id, {
            "progress": db_session.progress or 0,
            "status": "error",
            "status_text": f"Error during generation: {str(e)}",
            "step": db_session.step
        })
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

@app.post("/api/v1/lessons/{lesson_id}/sections/ai-action")
async def run_section_action_endpoint(lesson_id: int, req: schemas.AIActionRequest, db: Session = Depends(get_db)):
    section = db.query(Section).filter(
        Section.lesson_id == lesson_id,
        Section.role == req.role,
        Section.section_type == req.section_type
    ).first()
    if not section:
        raise HTTPException(status_code=404, detail="Section not found")
    
    # Process modifications
    original_text = section.content_text
    # Parse json if it's stored as JSON string
    try:
        content_to_process = json.loads(original_text)
    except:
        content_to_process = original_text

    if isinstance(content_to_process, str):
        processed = await pipeline.run_section_action(section.section_type, content_to_process, req.action, req.params)
        section.content_text = json.dumps(processed)
    else:
        # If it's a structured dictionary (e.g. lesson plans, rubrics)
        # We perform action on keys or values
        processed = await pipeline.run_section_action(section.section_type, str(content_to_process), req.action, req.params)
        section.content_text = json.dumps(processed)
        
    db.commit()
    save_history_snapshot(db, section.lesson.course_id, section.lesson_id, section.role, section.section_type, section.content_text, f"AI {req.action.capitalize()}: {req.section_type.replace('_', ' ').capitalize()}")
    return {"status": "success", "content": section.content_text}


@app.post("/api/v1/lessons/{lesson_id}/quiz/generate")
async def generate_more_quizzes_endpoint(lesson_id: int, count: int = 3, db: Session = Depends(get_db)):
    lesson = db.query(Lesson).filter(Lesson.id == lesson_id).first()
    if not lesson:
        raise HTTPException(status_code=404, detail="Lesson not found")
        
    # Find Creator POV core_content Section
    core_sec = db.query(Section).filter(Section.lesson_id == lesson_id, Section.role == "creator", Section.section_type == "core_content").first()
    core_text = json.loads(core_sec.content_text) if core_sec else ""
    
    new_quizzes = await pipeline.generate_more_quiz(lesson.title, core_text, count)
    
    # Append to existing Quiz section
    quiz_sec = db.query(Section).filter(Section.lesson_id == lesson_id, Section.role == "creator", Section.section_type == "quiz").first()
    if quiz_sec:
        try:
            curr = json.loads(quiz_sec.content_text)
            if not isinstance(curr, list):
                curr = [curr]
        except:
            curr = []
        curr.extend(new_quizzes)
        quiz_sec.content_text = json.dumps(curr)
    else:
        quiz_sec = Section(lesson_id=lesson_id, role="creator", section_type="quiz", content_text=json.dumps(new_quizzes))
        db.add(quiz_sec)
        
    db.commit()
    save_history_snapshot(db, lesson.course_id, lesson_id, "creator", "quiz", quiz_sec.content_text, "AI Generate More Quizzes")
    return {"status": "success", "quizzes": new_quizzes}

@app.post("/api/v1/lessons/{lesson_id}/exercises/generate")
async def generate_more_exercises_endpoint(lesson_id: int, count: int = 1, db: Session = Depends(get_db)):
    lesson = db.query(Lesson).filter(Lesson.id == lesson_id).first()
    if not lesson:
        raise HTTPException(status_code=404, detail="Lesson not found")
        
    core_sec = db.query(Section).filter(Section.lesson_id == lesson_id, Section.role == "creator", Section.section_type == "core_content").first()
    core_text = json.loads(core_sec.content_text) if core_sec else ""
    
    new_exercises = await pipeline.generate_more_exercises(lesson.title, core_text, count)
    
    # Append to Creator POV Exercises
    ex_sec = db.query(Section).filter(Section.lesson_id == lesson_id, Section.role == "creator", Section.section_type == "exercises").first()
    if ex_sec:
        try:
            curr = json.loads(ex_sec.content_text)
            if not isinstance(curr, list):
                curr = [curr]
        except:
            curr = []
        curr.extend(new_exercises)
        ex_sec.content_text = json.dumps(curr)
    else:
        ex_sec = Section(lesson_id=lesson_id, role="creator", section_type="exercises", content_text=json.dumps(new_exercises))
        db.add(ex_sec)
        
    db.commit()
    save_history_snapshot(db, lesson.course_id, lesson_id, "creator", "exercises", ex_sec.content_text, "AI Generate More Exercises")
    return {"status": "success", "exercises": new_exercises}

@app.post("/api/v1/lessons/{lesson_id}/sections/save")
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

def save_history_snapshot(db: Session, session_id: str, lesson_id: int, role: str, section_type: str, content_text: str, label: str = None):
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

@app.get("/api/v1/courses/{session_id}/export")
def export_course(session_id: str, format: str = "markdown", role: str = "all", db: Session = Depends(get_db)):
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
            
    course_title = course.title if course else (db_session.prompt or "Untitled Course")
    course_data = {
        "title": course_title,
        "config": {
            "lessons_count": db_session.config_lessons,
            "duration": db_session.config_duration,
            "difficulty": db_session.config_difficulty,
            "target_audience": db_session.config_audience,
        },
        "lessons": lessons_data
    }
    
    filename_title = "".join([c if c.isalnum() else "_" for c in course_title])
    
    if format == "zip":
        stream = exporter.export_all_zip(course_data)
        return StreamingResponse(
            stream, 
            media_type="application/x-zip-compressed",
            headers={"Content-Disposition": f"attachment; filename={filename_title}_export.zip"}
        )
    elif format == "docx":
        stream = exporter.export_to_docx(course_data, role)
        return StreamingResponse(
            stream,
            media_type="application/vnd.openxmlformats-officedocument.wordprocessingml.document",
            headers={"Content-Disposition": f"attachment; filename={filename_title}_{role}.docx"}
        )
    elif format == "html":
        html_str = exporter.export_to_html(course_data, role)
        stream = io.BytesIO(html_str.encode('utf-8'))
        return StreamingResponse(
            stream,
            media_type="text/html",
            headers={"Content-Disposition": f"attachment; filename={filename_title}_{role}.html"}
        )
    elif format == "pdf":
        stream = exporter.export_to_pdf(course_data, role)
        return StreamingResponse(
            stream,
            media_type="application/pdf",
            headers={"Content-Disposition": f"attachment; filename={filename_title}_{role}.pdf"}
        )
    else: # markdown
        md_str = exporter.export_to_markdown(course_data, role)
        stream = io.BytesIO(md_str.encode('utf-8'))
        return StreamingResponse(
            stream,
            media_type="text/markdown",
            headers={"Content-Disposition": f"attachment; filename={filename_title}_{role}.md"}
        )

@app.get("/api/v1/courses/{session_id}/history")
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

@app.post("/api/v1/history/{history_id}/restore")
def restore_course_history(history_id: int, db: Session = Depends(get_db)):
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

@app.post("/api/v1/sessions/{session_id}/documents/upload")
async def upload_document_endpoint(session_id: str, file: UploadFile = File(...), db: Session = Depends(get_db)):
    db_session = db.query(DbSession).filter(DbSession.id == session_id).first()
    if not db_session:
        raise HTTPException(status_code=404, detail="Session not found")
        
    contents = await file.read()
    try:
        parsed_text = document_parser.parse_document(file.filename, contents)
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Failed to parse document: {str(e)}")
        
    current_context = db_session.subject_context or ""
    if current_context:
        db_session.subject_context = current_context + "\n\n=== Additional Context from Uploaded File (" + file.filename + ") ===\n" + parsed_text
    else:
        db_session.subject_context = "=== Context from Uploaded File (" + file.filename + ") ===\n" + parsed_text
        
    db.commit()
    return {"status": "success", "filename": file.filename, "subject_context": db_session.subject_context}




