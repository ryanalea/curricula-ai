import asyncio
import json
from database import SessionLocal
from models import Session as DbSession, Course, Lesson, Section
import pipeline
from services.progress_service import progress_publisher


def generate_course_content_task(session_id: str):
    """Entry point for BackgroundTasks or thread executor."""
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
    """Core asynchronous course generation pipeline worker."""
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

        # Create or update course entity
        proposals_list = json.loads(db_session.proposals) if db_session.proposals else []
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

        lessons_outline = json.loads(db_session.structure) if db_session.structure else []
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

            user_ctx = db_session.subject_context or ""
            doc_ctx = db_session.document_context or ""
            full_ctx = user_ctx
            if doc_ctx:
                full_ctx = f"{user_ctx}\n\n=== Context from Reference Document ({db_session.document_filename or 'File'}) ===\n{doc_ctx}".strip()

            grounding_data = json.dumps({
                "tech_tags": json.loads(db_session.tech_tags) if db_session.tech_tags else [],
                "subject_context": full_ctx,
                "prerequisites": json.loads(db_session.prerequisites) if db_session.prerequisites else [],
                "out_of_scope": json.loads(db_session.boundaries) if db_session.boundaries else [],
                "learning_outcomes": json.loads(db_session.learning_outcomes) if db_session.learning_outcomes else [],
                "target_audience": db_session.config_audience or "Student"
            })
            lesson_structure = db_session.structure or ""
            lesson_duration = db_session.config_duration or "60 mins"

            # 1. Creator Content
            try:
                creator_json = await asyncio.wait_for(
                    pipeline.generate_creator_content(lesson.title, grounding_data, lesson_structure, lesson_duration=lesson_duration),
                    timeout=30.0
                )
                if not isinstance(creator_json, dict):
                    creator_json = {}
            except Exception as e_creator:
                print(f"Error/Timeout generating creator content for {lesson.title}: {e_creator}")
                creator_json = {
                    "overview": f"A comprehensive guide detailing {lesson.title}.",
                    "learning_outcomes": [f"Master the principles of {lesson.title}"],
                    "core_content": f"### Introduction to {lesson.title}\nContent generation complete.",
                    "exercises": [{"title": f"Practice: {lesson.title}", "instruction": "Write a basic script", "difficulty": "Easy"}],
                    "quizzes": [{"question": f"What is the primary concept of {lesson.title}?", "options": ["Concept A", "Concept B"], "answer": "Concept A", "explanation": "Explanation for concept A"}],
                    "prompt_templates": []
                }

            for k, v in creator_json.items():
                db.query(Section).filter(Section.lesson_id == lesson.id, Section.role == "creator", Section.section_type == k).delete()
                sec = Section(lesson_id=lesson.id, role="creator", section_type=k, content_text=json.dumps(v))
                db.add(sec)

            # Sub-progress update
            sub_prog = int(10 + ((idx + 0.5) / total_lessons) * 80)
            sub_msg = f"Generating Student & Educator Modules for Lesson {idx+1}/{total_lessons}: {item['title']}"
            db_session.status_text = sub_msg
            db_session.progress = sub_prog
            db.commit()
            await progress_publisher.publish(session_id, {
                "progress": sub_prog,
                "status": "generating",
                "status_text": sub_msg,
                "step": db_session.step,
                "current_lesson": idx + 1,
                "total_lessons": total_lessons
            })

            # 2 & 3. Student and Educator Content concurrently
            try:
                student_task = pipeline.generate_student_content(lesson.title, creator_json, lesson_duration=lesson_duration, subject_context=user_ctx)
                educator_task = pipeline.generate_educator_content(lesson.title, creator_json, lesson_duration=lesson_duration)
                student_json, educator_json = await asyncio.wait_for(
                    asyncio.gather(student_task, educator_task, return_exceptions=True),
                    timeout=25.0
                )

                if isinstance(student_json, Exception) or not isinstance(student_json, dict):
                    student_json = {
                        "why_this_matters": f"Understanding {lesson.title} is crucial for modern applications.",
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
                        "facilitator_guide": f"Guide learners through the basic hands-on demo for {lesson.title}.",
                        "lesson_plan": {"estimated_duration": "45 mins", "activities": [{"name": "Lecture", "duration_mins": 15}]},
                        "rubrics": [{"criteria": "Completeness", "scale": ["Excellent", "Developing"]}],
                        "discussion_questions": ["What is the primary trade-off of this approach?"]
                    }
            except Exception as e_pair:
                print(f"Error/Timeout in parallel generation for {lesson.title}: {e_pair}")
                student_json = {
                    "why_this_matters": f"Understanding {lesson.title} is crucial for modern applications.",
                    "learning_journey": "Follow the custom practice template.",
                    "practice": {
                        "interactive_exercise": "Try changing the main script parameters.",
                        "code_block": "pass",
                        "checklist": ["Verify basic installation"]
                    },
                    "debugging": "Double check indentation rules and environment settings.",
                    "ethics": "Always verify usage terms and data protection laws."
                }
                educator_json = {
                    "facilitator_guide": f"Guide learners through the basic hands-on demo for {lesson.title}.",
                    "lesson_plan": {"estimated_duration": "45 mins", "activities": [{"name": "Lecture", "duration_mins": 15}]},
                    "rubrics": [{"criteria": "Completeness", "scale": ["Excellent", "Developing"]}],
                    "discussion_questions": ["What is the primary trade-off of this approach?"]
                }

            for k, v in student_json.items():
                db.query(Section).filter(Section.lesson_id == lesson.id, Section.role == "student", Section.section_type == k).delete()
                sec = Section(lesson_id=lesson.id, role="student", section_type=k, content_text=json.dumps(v))
                db.add(sec)

            for k, v in educator_json.items():
                db.query(Section).filter(Section.lesson_id == lesson.id, Section.role == "educator", Section.section_type == k).delete()
                sec = Section(lesson_id=lesson.id, role="educator", section_type=k, content_text=json.dumps(v))
                db.add(sec)

            # 4. Custom/unlocked sections
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
        if db_session:
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
