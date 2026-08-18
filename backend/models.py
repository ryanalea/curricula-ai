from sqlalchemy import ForeignKey, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from database import Base


class Course(Base):
    __tablename__ = "courses"

    id: Mapped[str] = mapped_column(String(36), primary_key=True)
    title: Mapped[str] = mapped_column(String(200))
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    difficulty: Mapped[str] = mapped_column(String(50))
    duration: Mapped[int] = mapped_column(Integer)
    audience: Mapped[str] = mapped_column(String(100))
    lessons: Mapped[list["Lesson"]] = relationship(back_populates="course", cascade="all, delete-orphan")


class Lesson(Base):
    __tablename__ = "lessons"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    course_id: Mapped[str] = mapped_column(String(36), ForeignKey("courses.id", ondelete="CASCADE"), index=True)
    title: Mapped[str] = mapped_column(String(200))
    position: Mapped[int] = mapped_column(Integer)
    course: Mapped["Course"] = relationship(back_populates="lessons")
    sections: Mapped[list["Section"]] = relationship(back_populates="lesson", cascade="all, delete-orphan")


class Section(Base):
    __tablename__ = "sections"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    lesson_id: Mapped[int] = mapped_column(Integer, ForeignKey("lessons.id", ondelete="CASCADE"), index=True)
    role: Mapped[str] = mapped_column(String(20))
    section_type: Mapped[str] = mapped_column(String(100))
    content_text: Mapped[str] = mapped_column(Text)
    lesson: Mapped["Lesson"] = relationship(back_populates="sections")


class Session(Base):
    __tablename__ = "sessions"

    id: Mapped[str] = mapped_column(String(36), primary_key=True)
    step: Mapped[str] = mapped_column(String(30), default="dashboard")
    prompt: Mapped[str | None] = mapped_column(Text, nullable=True)
    tech_tags: Mapped[str] = mapped_column(Text, default="[]")
    config_lessons: Mapped[int] = mapped_column(Integer, default=5)
    config_duration: Mapped[int] = mapped_column(Integer, default=60)
    config_difficulty: Mapped[str] = mapped_column(String(30), default="Beginner")
    config_audience: Mapped[str] = mapped_column(String(100), default="Student")
    subject_context: Mapped[str] = mapped_column(Text, default="")
    document_context: Mapped[str | None] = mapped_column(Text, nullable=True)
    document_filename: Mapped[str | None] = mapped_column(String(200), nullable=True)
    prerequisites: Mapped[str] = mapped_column(Text, default="[]")
    boundaries: Mapped[str] = mapped_column(Text, default="[]")
    learning_outcomes: Mapped[str] = mapped_column(Text, default="[]")
    proposals: Mapped[str] = mapped_column(Text, default="[]")
    selected_proposal_id: Mapped[int | None] = mapped_column(Integer, nullable=True)
    structure: Mapped[str] = mapped_column(Text, default="[]")
    status: Mapped[str] = mapped_column(String(30), default="idle")
    progress: Mapped[int] = mapped_column(Integer, default=0)
    status_text: Mapped[str] = mapped_column(Text, default="")


class History(Base):
    __tablename__ = "history"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    session_id: Mapped[str] = mapped_column(String(36), ForeignKey("sessions.id", ondelete="CASCADE"), index=True)
    lesson_id: Mapped[int | None] = mapped_column(Integer, ForeignKey("lessons.id", ondelete="SET NULL"), nullable=True)
    role: Mapped[str | None] = mapped_column(String(20), nullable=True)
    section_type: Mapped[str | None] = mapped_column(String(100), nullable=True)
    content_snapshot: Mapped[str] = mapped_column(Text)
    label: Mapped[str | None] = mapped_column(String(100), nullable=True)
    created_at: Mapped[str] = mapped_column(String(32))
