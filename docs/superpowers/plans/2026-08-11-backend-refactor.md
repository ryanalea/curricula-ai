# Backend Architecture Refactor (Routers + Services) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Merapikan arsitektur backend jadi routers + services tanpa mengubah perilaku endpoint, bentuk response, atau cara menjalankan server.

**Architecture:** Pecah `main.py` (god file) menjadi `main.py` tipis + `routers/` per domain; pecah `pipeline.py` (god file) menjadi `services/` per tanggung jawab; pisahkan konfigurasi (`config.py`) dan DB (`database.py`) dari models.

**Tech Stack:** Python 3.12, FastAPI 0.141, SQLAlchemy 2.0, openai, uvicorn.

## Global Constraints

- Path endpoint `/api/v1/...` dan bentuk response HARUS identik dengan sebelum refactor.
- Cara run TIDAK berubah: `uvicorn main:app --reload --host 127.0.0.1 --port 8000` dari `backend/`.
- `main.py` tetap di `backend/` dan tetap expose `app` + panggil `init_db()` saat import.
- JANGAN push ke GitHub. JANGAN sentuh `frontend/`.
- Tidak menambah dependensi baru.
- Logika client AI (OpenRouter → OpenAI → mock) dipindah verbatim ke `config.py`.
- `DATABASE_URL` default tetap `sqlite:///./course_generator.db`; boleh di-override via env (untuk smoke test).
- `pipeline.py` dihapus setelah dipindah; hanya `main.py` yang mengimpornya.

---

### Task 1: Foundation — config.py, database.py, models.py dipisah

**Files:**
- Create: `backend/config.py`
- Create: `backend/database.py`
- Modify: `backend/models.py`

**Interfaces:**
- Produces:
  - `config.client` (OpenAI client atau None), `config.OPENAI_MODEL` (str)
  - `database.Base`, `database.DATABASE_URL`, `database.engine`, `database.SessionLocal`, `database.get_db()` (generator), `database.init_db()`
  - `models.Base` diimpor dari `database`

- [ ] **Step 1: Buat `backend/config.py`** (verbatim dari `pipeline.py:1-27`, tanpa import json/asyncio/re)

```python
import os
from dotenv import load_dotenv
from openai import OpenAI

# Load environment variables
load_dotenv()

# Initialize client (OpenAI / OpenRouter)
openrouter_api_key = os.environ.get("OPENROUTER_API_KEY")
openai_api_key = os.environ.get("OPENAI_API_KEY", "MOCK_KEY_FOR_DEVELOPMENT")

client = None
if openrouter_api_key:
    client = OpenAI(
        base_url="https://openrouter.ai/api/v1",
        api_key=openrouter_api_key
    )
    OPENAI_MODEL = os.environ.get("OPENROUTER_MODEL", "openai/gpt-4o-mini")
else:
    if openai_api_key and openai_api_key != "MOCK_KEY_FOR_DEVELOPMENT":
        client = OpenAI(api_key=openai_api_key)
        OPENAI_MODEL = os.environ.get("OPENAI_MODEL", "gpt-4o-mini")
    else:
        OPENAI_MODEL = "gpt-4o-mini"
```

- [ ] **Step 2: Buat `backend/database.py`** (Engine/session/init_db pindah dari `models.py:137-143` + `get_db` dari `main.py:37-42`)

```python
import os
from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker

DATABASE_URL = os.environ.get("DATABASE_URL", "sqlite:///./course_generator.db")

Base = declarative_base()

engine = create_engine(DATABASE_URL, connect_args={"check_same_thread": False})
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

def init_db():
    Base.metadata.create_all(bind=engine)
```

- [ ] **Step 3: Ubah `backend/models.py`** — ganti import dan hapus blok DB di akhir

Ubah bagian atas menjadi:
```python
from sqlalchemy import Column, Integer, String, Text, ForeignKey, Table
from sqlalchemy.orm import relationship

from database import Base
```

Hapus seluruh blok mulai `DATABASE_URL = "sqlite:///./course_generator.db"` sampai akhir file
(line 137-143: `engine`, `SessionLocal`, `init_db`). Kelas model TIDAK berubah.

- [ ] **Step 4: Verifikasi** — jalankan dari `backend/`

```bash
python -m py_compile config.py database.py models.py && python -c "import models; print('models OK, tables:', [t for t in models.Base.metadata.tables])"
```
Expected: `models OK` + daftar tabel (users, projects, courses, lessons, sections, sessions, history, quizzes, exercises, prompt_templates, documents, templates, ai_jobs). Database file `course_generator.db` terbentuk (boleh dihapus setelahnya).

- [ ] **Step 5: Commit**

```bash
git add backend/config.py backend/database.py backend/models.py
git commit -m "refactor: split config and database bootstrap out of models"
```

---

### Task 2: JSON util + Services grounding/proposals/structure

**Files:**
- Create: `backend/utils/__init__.py`
- Create: `backend/utils/json_utils.py`
- Create: `backend/services/__init__.py`
- Create: `backend/services/grounding.py`
- Create: `backend/services/proposals.py`
- Create: `backend/services/structure.py`

**Interfaces:**
- Consumes: `config.client`, `config.OPENAI_MODEL`; `utils.json_utils.safe_load_json`
- Produces:
  - `services.grounding.MOCK_GROUNDING` (dict)
  - `services.grounding.get_default_candidate_tags(keyword, tech_tags=None) -> list`
  - `services.grounding.generate_concept_and_grounding(keyword: str) -> dict`
  - `services.grounding.generate_single_grounding_item(keyword, field_type, existing_items) -> str`
  - `services.proposals.MOCK_PROPOSALS` (list)
  - `services.proposals.generate_proposals(keyword, grounding_data) -> list`
  - `services.structure.generate_structure(proposal_title, config, grounding_data) -> list`

- [ ] **Step 1: Buat `backend/utils/__init__.py`** — file kosong.

- [ ] **Step 2: Buat `backend/utils/json_utils.py`** (verbatim dari `pipeline.py:29-41`)

```python
import json

def safe_load_json(raw_text: str):
    """Safely cleans and loads JSON strings, ignoring markdown code blocks if present."""
    if not raw_text:
        return {}
    cleaned = raw_text.strip()
    if cleaned.startswith("```json"):
        cleaned = cleaned[7:]
    elif cleaned.startswith("```"):
        cleaned = cleaned[3:]
    if cleaned.endswith("```"):
        cleaned = cleaned[:-3]
    cleaned = cleaned.strip()
    return json.loads(cleaned)
```

- [ ] **Step 3: Buat `backend/services/__init__.py`** — file kosong.

- [ ] **Step 4: Buat `backend/services/grounding.py`** — pindah verbatim dari `pipeline.py`:

Header file:
```python
import re
import json
import asyncio
from config import client, OPENAI_MODEL
from utils.json_utils import safe_load_json
```

Pindahkan verbatim:
- `MOCK_GROUNDING` (pipeline.py:44-50)
- `get_default_candidate_tags` (pipeline.py:82-163) — versi 10 kategori + cap 20 yang sudah ada
- `generate_concept_and_grounding` (pipeline.py:177-246) — ganti referensi `client`→`client`, `OPENAI_MODEL`→`OPENAI_MODEL`, `safe_load_json`→`safe_load_json`, `get_default_candidate_tags`→`get_default_candidate_tags` (semua sudah sesuai nama, cukup pindah)
- `generate_single_grounding_item` (pipeline.py:662-696)

- [ ] **Step 5: Buat `backend/services/proposals.py`**

Header file:
```python
import json
from config import client, OPENAI_MODEL
from utils.json_utils import safe_load_json
```

Pindahkan verbatim:
- `MOCK_PROPOSALS` (pipeline.py:52-80)
- `generate_proposals` (pipeline.py:248-293)

- [ ] **Step 6: Buat `backend/services/structure.py`**

Header file:
```python
import json
from config import client, OPENAI_MODEL
from utils.json_utils import safe_load_json
```

Pindahkan verbatim:
- `generate_structure` (pipeline.py:295-356)

- [ ] **Step 7: Verifikasi**

```bash
python -m py_compile utils/json_utils.py services/grounding.py services/proposals.py services/structure.py
python -c "from services import grounding, proposals, structure; print(len(grounding.get_default_candidate_tags('flutter'))); print(len(proposals.generate_proposals('x', {}))); print(len(structure.generate_structure('Test', {'lessons_count': 4}, {})))"
```
Expected: `20`, `3`, `4` (mode mock tanpa API key).

- [ ] **Step 8: Commit**

```bash
git add backend/utils backend/services
git commit -m "refactor: extract grounding, proposals, structure services from pipeline"
```

---

### Task 3: Services content, session_io, history, generation

**Files:**
- Create: `backend/services/content.py`
- Create: `backend/services/session_io.py`
- Create: `backend/services/history.py`
- Create: `backend/services/generation.py`

**Interfaces:**
- Consumes: `config.client`, `config.OPENAI_MODEL`; `utils.json_utils.safe_load_json`; `database.SessionLocal`; `models` (Session, Course, Lesson, Section, History); `services.content.*`
- Produces:
  - `services.content.generate_creator_content(lesson_title, grounding_data, lesson_structure) -> dict`
  - `services.content.generate_student_content(lesson_title, core_content_creator) -> dict`
  - `services.content.generate_educator_content(lesson_title, core_content_creator, lesson_duration="60 mins") -> dict`
  - `services.content.run_section_action(section_type, content, action, params=None) -> str`
  - `services.content.generate_more_quiz(lesson_title, core_content, count=3) -> list`
  - `services.content.generate_more_exercises(lesson_title, core_content, count=1) -> list`
  - `services.session_io.build_lessons_data(course) -> list`
  - `services.session_io.serialize_session(db_session, course, all_suggested_tags) -> dict`
  - `services.history.save_history_snapshot(db, session_id, lesson_id, role, section_type, content_text, label=None)`
  - `services.generation.ProgressPublisher`, `services.generation.progress_publisher`
  - `services.generation.generate_course_content_task(session_id)`
  - `services.generation.generate_course_content_task_async(session_id)`

- [ ] **Step 1: Buat `backend/services/content.py`** — pindah verbatim dari `pipeline.py`:

Header file:
```python
import json
import asyncio
from config import client, OPENAI_MODEL
from utils.json_utils import safe_load_json
```

Pindahkan verbatim:
- `generate_creator_content` (pipeline.py:358-421)
- `generate_student_content` (pipeline.py:423-477)
- `generate_educator_content` (pipeline.py:479-541)
- `run_section_action` (pipeline.py:543-576)
- `generate_more_quiz` (pipeline.py:578-620)
- `generate_more_exercises` (pipeline.py:622-660)

- [ ] **Step 2: Buat `backend/services/session_io.py`** — helper deduplikasi `lessons_data` (dari `main.py:183-200` dan `main.py:695-712`, identik) + serializer session (`main.py:209-234`)

```python
import json


def build_lessons_data(course):
    lessons_data = []
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
    return lessons_data


def serialize_session(db_session, course, all_suggested_tags):
    course_title = course.title if course else (db_session.prompt or "Untitled Course")
    loaded_tech_tags = json.loads(db_session.tech_tags) if db_session.tech_tags else []
    return {
        "session_id": db_session.id,
        "title": course_title,
        "step": db_session.step,
        "prompt": db_session.prompt,
        "tech_tags": loaded_tech_tags,
        "all_suggested_tags": all_suggested_tags,
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
        "lessons": build_lessons_data(course)
    }
```

- [ ] **Step 3: Buat `backend/services/history.py`** (verbatim dari `main.py:676-687`)

```python
import datetime
from models import History


def save_history_snapshot(db, session_id, lesson_id, role, section_type, content_text, label=None):
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
```

- [ ] **Step 4: Buat `backend/services/generation.py`** — pindah verbatim dari `main.py`:

Header file:
```python
import json
import asyncio
from models import DbSession, Course, Lesson, Section
from database import SessionLocal
from services import content
```

Pindahkan verbatim:
- `ProgressPublisher` class (main.py:44-65)
- `progress_publisher = ProgressPublisher()` (main.py:66)
- `generate_course_content_task(session_id)` (main.py:372-383)
- `generate_course_content_task_async(session_id)` (main.py:385-542) — ganti `pipeline.generate_creator_content` → `content.generate_creator_content`, `pipeline.generate_student_content` → `content.generate_student_content`, `pipeline.generate_educator_content` → `content.generate_educator_content`

- [ ] **Step 5: Verifikasi**

```bash
python -m py_compile services/content.py services/session_io.py services/history.py services/generation.py
python -c "from services import content, session_io, history, generation; print('services OK')"
```
Expected: `services OK`

- [ ] **Step 6: Commit**

```bash
git add backend/services
git commit -m "refactor: extract content, session_io, history, generation services"
```

---

### Task 4: Routers per domain

**Files:**
- Create: `backend/routers/__init__.py`
- Create: `backend/routers/sessions.py`
- Create: `backend/routers/lessons.py`
- Create: `backend/routers/export.py`
- Create: `backend/routers/history.py`
- Create: `backend/routers/documents.py`

**Interfaces:**
- Consumes: semua service dari Task 2 & 3, `database.get_db`, `schemas`, `models` (DbSession, Course, Lesson, Section, History), `exporter`, `document_parser`, `services.generation.progress_publisher`
- Produces: `routers.sessions.router`, `routers.lessons.router`, `routers.export.router`, `routers.history.router`, `routers.documents.router` (masing-masing `APIRouter`)

- [ ] **Step 1: Buat `backend/routers/__init__.py`** — file kosong.

- [ ] **Step 2: Buat `backend/routers/sessions.py`** — pindah route session dari `main.py`, path IDENTIK:

Header:
```python
import uuid
import json
import asyncio
from typing import List

from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session

from database import SessionLocal, get_db
from models import DbSession, Course, Lesson, Section
import schemas
from services import grounding, proposals, structure, session_io
from services.generation import progress_publisher, generate_course_content_task

router = APIRouter()
```

Pindahkan verbatim (path & response IDENTIK) dengan penyesuaian import:
- `GET /api/v1/courses/sessions/{session_id}/stream-progress` (main.py:68-97) — `progress_publisher` dari service
- `GET /api/v1/courses/sessions` (main.py:103-131) — `pipeline.get_default_candidate_tags` → `grounding.get_default_candidate_tags`
- `POST /api/v1/courses/sessions` (main.py:133-174) — `pipeline.generate_concept_and_grounding` → `grounding.generate_concept_and_grounding`; `pipeline.get_default_candidate_tags` → `grounding.get_default_candidate_tags`
- `GET /api/v1/courses/sessions/{session_id}` (main.py:176-234) — pakai `session_io.serialize_session(db_session, course, all_suggested)` dengan `all_suggested = grounding.get_default_candidate_tags(db_session.prompt, loaded_tech_tags)` (perilaku identik)
- `DELETE /api/v1/courses/sessions/{session_id}` (main.py:236-247)
- `PATCH /api/v1/courses/sessions/{session_id}/status` (main.py:249-259)
- `POST /api/v1/courses/sessions/{session_id}/grounding` (main.py:261-275)
- `POST /api/v1/courses/sessions/{session_id}/grounding/suggest` (main.py:277-288) — `pipeline.generate_single_grounding_item` → `grounding.generate_single_grounding_item`
- `POST /api/v1/courses/sessions/{session_id}/config` (main.py:290-303)
- `POST /api/v1/courses/sessions/{session_id}/proposals/generate` (main.py:305-324) — `pipeline.generate_proposals` → `proposals.generate_proposals`
- `POST /api/v1/courses/sessions/{session_id}/proposals/select` (main.py:326-357) — `pipeline.generate_structure` → `structure.generate_structure`
- `POST /api/v1/courses/sessions/{session_id}/structure/save` (main.py:359-370)
- `POST /api/v1/courses/sessions/{session_id}/content/generate` (main.py:544-556)

Catatan: fungsi `generate_course_content_task` tidak lagi didefinisikan di router; dipakai dari `services.generation`.

- [ ] **Step 3: Buat `backend/routers/lessons.py`** — pindah route lesson dari `main.py`:

Header:
```python
import json
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from database import get_db
from models import Lesson, Section
import schemas
from services import content, history

router = APIRouter()
```

Pindahkan verbatim (path & response IDENTIK):
- `POST /api/v1/lessons/{lesson_id}/sections/ai-action` (main.py:558-587) — `pipeline.run_section_action` → `content.run_section_action`; `save_history_snapshot` → `history.save_history_snapshot`
- `POST /api/v1/lessons/{lesson_id}/quiz/generate` (main.py:590-619) — `pipeline.generate_more_quiz` → `content.generate_more_quiz`; `save_history_snapshot` → `history.save_history_snapshot`
- `POST /api/v1/lessons/{lesson_id}/exercises/generate` (main.py:621-649) — `pipeline.generate_more_exercises` → `content.generate_more_exercises`; `save_history_snapshot` → `history.save_history_snapshot`
- `POST /api/v1/lessons/{lesson_id}/sections/save` (main.py:651-674) — `save_history_snapshot` → `history.save_history_snapshot`

- [ ] **Step 4: Buat `backend/routers/export.py`** — pindah verbatim dari `main.py:689-764`:

Header:
```python
import io
from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session

from database import get_db
from models import DbSession, Course
from services.session_io import build_lessons_data
import exporter

router = APIRouter()
```

Path & response IDENTIK. Ganti loop `lessons_data` lokal dengan `build_lessons_data(course)` (hasil identik).

- [ ] **Step 5: Buat `backend/routers/history.py`** — pindah verbatim dari `main.py:766-802`:

Header:
```python
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from database import get_db
from models import History, Section

router = APIRouter()
```

Path & response IDENTIK (`GET /api/v1/courses/{session_id}/history`, `POST /api/v1/history/{history_id}/restore`).

- [ ] **Step 6: Buat `backend/routers/documents.py`** — pindah verbatim dari `main.py:804-823`:

Header:
```python
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from sqlalchemy.orm import Session

from database import get_db
from models import DbSession
import document_parser

router = APIRouter()
```

Path & response IDENTIK (`POST /api/v1/sessions/{session_id}/documents/upload`).

- [ ] **Step 7: Verifikasi**

```bash
python -m py_compile routers/*.py
```
Expected: tidak ada error.

- [ ] **Step 8: Commit**

```bash
git add backend/routers
git commit -m "refactor: extract route handlers into domain routers"
```

---

### Task 5: main.py tipis + hapus pipeline.py

**Files:**
- Modify: `backend/main.py` (tulis ulang jadi tipis)
- Delete: `backend/pipeline.py`

**Interfaces:**
- Consumes: router yang sudah dibuat
- Produces: `main.app` (FastAPI), endpoint `GET /` tetap ada

- [ ] **Step 1: Tulis ulang `backend/main.py`**

```python
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from database import init_db
from routers import sessions as sessions_router
from routers import lessons as lessons_router
from routers import export as export_router
from routers import history as history_router
from routers import documents as documents_router

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

app.include_router(sessions_router.router)
app.include_router(lessons_router.router)
app.include_router(export_router.router)
app.include_router(history_router.router)
app.include_router(documents_router.router)


@app.get("/")
def read_root():
    return {"message": "Welcome to AI Course Generator API"}
```

- [ ] **Step 2: Hapus `backend/pipeline.py`**

```bash
rm backend/pipeline.py
```

- [ ] **Step 3: Verifikasi import & jalur app**

```bash
python -m py_compile main.py
python -c "from main import app; print('routes:', len(app.routes))"
```
Expected: import sukses, jumlah routes ~21 (5 + 20 endpoint + 1 root + docs/redoc/404).

- [ ] **Step 4: Commit**

```bash
git add backend/main.py
git rm backend/pipeline.py
git commit -m "refactor: make main.py thin app assembly, remove pipeline.py"
```

---

### Task 6: Smoke test + verifikasi penuh

**Files:**
- Create: `backend/smoke_test.py`

**Interfaces:**
- Consumes: `main.app`
- Produces: script manual, exit 0 jika semua endpoint OK

- [ ] **Step 1: Buat `backend/smoke_test.py`** — TestClient mode mock, DB temp via env override

```python
import os
import sys

os.environ["DATABASE_URL"] = "sqlite:///./smoke_test.db"
if os.path.exists("smoke_test.db"):
    os.remove("smoke_test.db")

from fastapi.testclient import TestClient  # noqa: E402
from main import app  # noqa: E402

client = TestClient(app)

def check(label, resp, status=200, keys=None):
    if resp.status_code != status:
        print(f"FAIL [{label}] status={resp.status_code}: {resp.text[:200]}")
        sys.exit(1)
    body = resp.json()
    if keys:
        for k in keys:
            if k not in body:
                print(f"FAIL [{label}] missing key '{k}'")
                sys.exit(1)
    print(f"PASS [{label}]")
    return body

# 1. Root
check("GET /", client.get("/"), keys=["message"])

# 2. List sessions (kosong)
sessions = check("GET sessions list", client.get("/api/v1/courses/sessions"))
assert isinstance(sessions, list)

# 3. Buat session (mode mock)
created = check(
    "POST create session",
    client.post("/api/v1/courses/sessions", json={"keyword": "python data science"}),
    keys=["session_id", "tech_tags", "all_suggested_tags", "config", "subject_context"],
)
sid = created["session_id"]
assert len(created["tech_tags"]) == 3, "tech_tags harus 3 item"
assert len(created["all_suggested_tags"]) <= 20, "all_suggested_tags maks 20"

# 4. Get session
check("GET session", client.get(f"/api/v1/courses/sessions/{sid}"),
      keys=["session_id", "tech_tags", "all_suggested_tags", "proposals", "structure", "lessons", "prerequisites", "out_of_scope", "learning_outcomes"])

# 5. Grounding
check("POST grounding", client.post(f"/api/v1/courses/sessions/{sid}/grounding", json={
    "tech_tags": ["Python", "Data Science", "Pandas"],
    "prerequisites": ["Basic Python"],
    "out_of_scope": ["Deep Learning"],
    "learning_outcomes": ["Load data"],
    "target_audience": "Student",
}))

# 6. Config
check("POST config", client.post(f"/api/v1/courses/sessions/{sid}/config", json={
    "lessons_count": 4, "duration": 15, "difficulty": "Beginner",
    "target_audience": "Student", "subject_context": "context",
}))

# 7. Generate proposals (mock -> 3)
props = check("POST proposals/generate", client.post(f"/api/v1/courses/sessions/{sid}/proposals/generate"), keys=["proposals"])
assert len(props["proposals"]) == 3

# 8. Select proposal -> structure
sel = check("POST proposals/select", client.post(f"/api/v1/courses/sessions/{sid}/proposals/select", json={"selected_proposal_id": 1}), keys=["structure"])
assert len(sel["structure"]) == 4

# 9. Save structure
lessons = [{"id": i, "title": f"Lesson {i}", "order": i} for i in range(1, 5)]
check("POST structure/save", client.post(f"/api/v1/courses/sessions/{sid}/structure/save", json={"lessons": lessons}))

# 10. Export markdown
resp = client.get(f"/api/v1/courses/{sid}/export", params={"format": "markdown"})
if resp.status_code != 200:
    print(f"FAIL [GET export] status={resp.status_code}: {resp.text[:200]}")
    sys.exit(1)
print("PASS [GET export markdown]")

# 11. History list (kosong boleh)
check("GET history", client.get(f"/api/v1/courses/{sid}/history"))

# 12. Cleanup
check("DELETE session", client.delete(f"/api/v1/courses/sessions/{sid}"))

# 13. Hapus DB temp
if os.path.exists("smoke_test.db"):
    os.remove("smoke_test.db")

print("\nSMOKE TEST PASSED")
```

- [ ] **Step 2: Jalankan smoke test** (dari `backend/`, pastikan tidak ada OPENAI_API_KEY asli di env)

```bash
python smoke_test.py
```
Expected: semua baris `PASS [...]` + `SMOKE TEST PASSED`.

- [ ] **Step 3: Verifikasi semua file** 

```bash
python -m py_compile config.py database.py models.py schemas.py exporter.py document_parser.py utils/json_utils.py services/*.py routers/*.py main.py smoke_test.py
```
Expected: tidak ada error.

- [ ] **Step 4: Jalankan server manual sejenak** (opsional, cek tidak crash saat boot)

```bash
timeout 5 uvicorn main:app --host 127.0.0.1 --port 8010 || true
```
Expected: log startup uvicorn muncul tanpa traceback (timeout mematikan).

- [ ] **Step 5: Commit**

```bash
git add backend/smoke_test.py
git commit -m "test: add backend smoke test for endpoint parity"
```

---

## Self-Review Checklist

- **Spec coverage:** config/database split (T1), pipeline split grounding/proposals/structure/content (T2-T3), session_io dedup (T3), routers (T4), main.py tipis + hapus pipeline (T5), smoke test (T6). Semua bagian spec terwakili. ✓
- **Placeholder scan:** tidak ada TBD; kode baru (config, database, json_utils, session_io, history, routers, main, smoke_test) ditulis penuh. ✓
- **Type consistency:** nama fungsi service konsisten antar task (contoh `get_default_candidate_tags`, `build_lessons_data`, `save_history_snapshot`, `progress_publisher`, `generate_course_content_task`). ✓
