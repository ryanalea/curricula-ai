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

DATABASE_URL = "sqlite:///./course_generator.db"
engine = create_engine(DATABASE_URL, connect_args={"check_same_thread": False})
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

def init_db():
    Base.metadata.create_all(bind=engine)
