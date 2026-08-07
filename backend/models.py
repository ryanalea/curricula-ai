from sqlalchemy import create_engine, Column, Integer, String, Text, ForeignKey, Table
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import relationship, sessionmaker
import json

Base = declarative_base()

class User(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True, index=True)
    username = Column(String, unique=True, index=True)
    email = Column(String, unique=True, index=True)

class Project(Base):
    __tablename__ = "projects"
    id = Column(Integer, primary_key=True, index=True)
    title = Column(String)
    description = Column(Text, nullable=True)
    user_id = Column(Integer, ForeignKey("users.id"))

class Course(Base):
    __tablename__ = "courses"
    id = Column(String, primary_key=True, index=True)
    title = Column(String)
    description = Column(Text, nullable=True)
    difficulty = Column(String)
    duration = Column(Integer)
    audience = Column(String)
    project_id = Column(Integer, ForeignKey("projects.id"), nullable=True)
    lessons = relationship("Lesson", back_populates="course", cascade="all, delete-orphan")

class Lesson(Base):
    __tablename__ = "lessons"
    id = Column(Integer, primary_key=True, index=True)
    course_id = Column(String, ForeignKey("courses.id"))
    title = Column(String)
    order = Column(Integer)
    course = relationship("Course", back_populates="lessons")
    sections = relationship("Section", back_populates="lesson", cascade="all, delete-orphan")

class Section(Base):
    __tablename__ = "sections"
    id = Column(Integer, primary_key=True, index=True)
    lesson_id = Column(Integer, ForeignKey("lessons.id"))
    role = Column(String)  # 'creator', 'student', 'educator'
    section_type = Column(String)  # e.g., 'overview', 'core_content', 'learning_journey', etc.
    content_text = Column(Text)
    lesson = relationship("Lesson", back_populates="sections")

class Session(Base):
    __tablename__ = "sessions"
    id = Column(String, primary_key=True, index=True)
    step = Column(String, default="dashboard")
    prompt = Column(Text, nullable=True)
    tech_tags = Column(Text, default="[]")  # JSON string list
    config_lessons = Column(Integer, default=5)
    config_duration = Column(Integer, default=60)
    config_difficulty = Column(String, default="Beginner")
    config_audience = Column(String, default="Student")
    subject_context = Column(Text, default="")
    prerequisites = Column(Text, default="[]")  # JSON string list
    boundaries = Column(Text, default="[]")  # JSON string list
    learning_outcomes = Column(Text, default="[]")  # JSON string list
    proposals = Column(Text, default="[]")  # JSON string of 3 proposals
    selected_proposal_id = Column(Integer, nullable=True)
    structure = Column(Text, default="[]")  # JSON string outline of lessons
    status = Column(String, default="idle")
    progress = Column(Integer, default=0)
    status_text = Column(String, default="")

class History(Base):
    __tablename__ = "history"
    id = Column(Integer, primary_key=True, index=True)
    session_id = Column(String)
    lesson_id = Column(Integer, nullable=True)
    section_type = Column(String, nullable=True)
    role = Column(String, nullable=True)
    content_snapshot = Column(Text)
    label = Column(String, nullable=True)
    created_at = Column(String)

class Quiz(Base):
    __tablename__ = "quizzes"
    id = Column(Integer, primary_key=True, index=True)
    lesson_id = Column(Integer, ForeignKey("lessons.id"))
    question = Column(String)
    options = Column(Text)  # JSON list
    answer = Column(String)
    explanation = Column(Text, nullable=True)
    difficulty = Column(String, nullable=True)
    type = Column(String, nullable=True)

class Exercise(Base):
    __tablename__ = "exercises"
    id = Column(Integer, primary_key=True, index=True)
    lesson_id = Column(Integer, ForeignKey("lessons.id"))
    title = Column(String)
    instruction = Column(Text)
    difficulty = Column(String, nullable=True)
    type = Column(String, nullable=True)  # hands-on, case-study

class PromptTemplate(Base):
    __tablename__ = "prompt_templates"
    id = Column(Integer, primary_key=True, index=True)
    lesson_id = Column(Integer, ForeignKey("lessons.id"), nullable=True)
    role = Column(String)
    content = Column(Text)
    is_favorite = Column(Integer, default=0)

class Document(Base):
    __tablename__ = "documents"
    id = Column(Integer, primary_key=True, index=True)
    session_id = Column(String, ForeignKey("sessions.id"))
    filename = Column(String)
    file_type = Column(String)
    storage_path = Column(String)
    created_at = Column(String)

class Template(Base):
    __tablename__ = "templates"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String)
    description = Column(Text, nullable=True)
    structure = Column(Text)  # JSON string
    is_public = Column(Integer, default=0)

class AIJob(Base):
    __tablename__ = "ai_jobs"
    id = Column(String, primary_key=True, index=True)
    session_id = Column(String, ForeignKey("sessions.id"))
    job_type = Column(String)
    status = Column(String)
    started_at = Column(String)
    completed_at = Column(String, nullable=True)
    error_msg = Column(Text, nullable=True)

DATABASE_URL = "sqlite:///./course_generator.db"
engine = create_engine(DATABASE_URL, connect_args={"check_same_thread": False})
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

def init_db():
    Base.metadata.create_all(bind=engine)

