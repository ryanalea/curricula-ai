# 🎓 Curricula AI — by Maxy Academy

> **AI-powered multi-role course generator** — Build structured, pedagogically-rich courses in minutes using a 3-perspective content pipeline: Creator, Student, and Educator.

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.100+-009688?logo=fastapi)](https://fastapi.tiangolo.com/)
[![React](https://img.shields.io/badge/React-18+-61DAFB?logo=react)](https://react.dev/)
[![Vite](https://img.shields.io/badge/Vite-8+-646CFF?logo=vite)](https://vitejs.dev/)

---

## ✨ Overview

**Curricula AI** is a full-stack AI course generation platform built for educators, instructional designers, and content creators. Powered by OpenAI's GPT-4o-mini, it transforms a single topic prompt into a complete, multi-role course with:

- **Creator POV** — Core content, quizzes, exercises, and AI prompt templates
- **Student POV** — Why It Matters, interactive practices, debugging guides, and ethics
- **Educator POV** — Facilitator guides, timing plans, rubrics, and discussion questions

The platform follows an **8-step AI-guided workflow** (RTFC pipeline) to ensure pedagogically-sound course structure before any content is generated.

---

## 🖼️ Screenshots

> Maxy brand layout: Deep Navy sidebar · Light Gray content background · Gold CTA buttons & interactive elements

*Design palette: Navy `#2D3561` · Gold `#E9B259` · Light Background `#E8EAF0` · White `#FFFFFF`*

---

## 🚀 Features

### Workflow (8 Steps)
| Step | Name | Description |
|------|------|-------------|
| 1 | **Prompt** | Enter a topic; AI generates concept, tags, and initial context |
| 2 | **Config** | Set lessons count, duration, difficulty, audience, and tech tags |
| 3 | **Grounding** | Review/edit AI-generated prerequisites, boundaries, and learning outcomes |
| 4 | **Proposals** | Choose from 3 curriculum approaches (Practical / Recommended / Advanced) |
| 5 | **Outline** | Drag, rename, add, delete, and reorder lesson modules |
| 6 | **Review** | Final summary before triggering generation |
| 7 | **Generating** | Live AI pipeline with real-time progress (0–100%) |
| 8 | **Generated** | Full WYSIWYG-ready course with role-switching tabs |

### Frontend (React + Vite)
- ✅ Multi-step wizard with step progress bar
- ✅ My Courses dashboard — list, resume, or view past sessions
- ✅ Loading states on all async actions (no double-submit)
- ✅ Markdown-lite content renderer (headings, code blocks, lists)
- ✅ Role-switching tabs (Creator / Student / Educator)
- ✅ Quiz display with correct answer highlighting
- ✅ Empty states with graceful fallback messages
- ✅ Responsive sidebar with section labels and nav badges

### Backend (FastAPI + MySQL)
- ✅ Session-based workflow state machine
- ✅ Async AI content generation (non-blocking via `BackgroundTasks`)
- ✅ Real-time progress polling endpoint
- ✅ Modular pipeline: Concept → Grounding → Proposals → Structure → Content
- ✅ 3-role content generator (Creator, Student, Educator) per lesson
- ✅ MySQL persistence (Course, Lesson, Section, Session models) with Alembic migrations
- ✅ OpenAI-compatible with mock fallback for offline development
- ✅ CORS configured for local development

---

## 🛠️ Tech Stack

| Layer | Technology |
|-------|-----------|
| **Frontend** | React 18, Vite, Vanilla CSS |
| **Backend** | FastAPI, SQLAlchemy 2.0, Alembic, MySQL |
| **AI** | OpenAI GPT-4o-mini (via `openai` SDK) |
| **Fonts** | Outfit + Plus Jakarta Sans (Google Fonts) |
| **State** | React `useState` / `useEffect` |
| **API Docs** | Auto-generated Swagger UI at `/docs` |

---

## 📁 Project Structure

```
ai-course-generator/
├── backend/
│   ├── main.py          # FastAPI app, all API endpoints
│   ├── database.py      # DB connection (MySQL), Base, SessionLocal
│   ├── pipeline.py      # AI generation pipeline (all stages)
│   ├── models.py        # SQLAlchemy 2.0 ORM models
│   ├── schemas.py       # Pydantic request/response schemas
│   ├── alembic.ini      # Alembic configuration
│   ├── alembic/         # Migration scripts (env.py, versions/)
│   ├── .env             # API keys & DB credentials (not committed)
│   └── .env.example     # Env variable template
│
└── frontend/
    ├── public/
    │   └── m-logo.png   # Maxy Academy logo mark
    ├── src/
    │   ├── App.jsx      # Main application (all views + logic)
    │   └── index.css    # Global design system & component styles
    ├── index.html
    └── package.json
```

---

## ⚙️ Setup & Installation

### Prerequisites
- Node.js 18+
- Python 3.10+
- pip
- MySQL 8+ (running)

### 1. Clone the repository

```bash
git clone https://github.com/lealeloio/curricula-ai.git
cd curricula-ai
```

### 2. Backend Setup

```bash
cd backend

# Create virtual environment
python -m venv venv
venv\Scripts\activate  # Windows
# source venv/bin/activate  # Mac/Linux

# Install dependencies
pip install -r requirements.txt

# Create .env file from template and fill in DB credentials + API key
cp .env.example .env

# Create the database (one-time)
mysql -u root -p -e "CREATE DATABASE curricula_ai CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"

# Apply database migrations
alembic upgrade head

# Start the server
uvicorn main:app --reload --host 127.0.0.1 --port 8000
```

> 💡 **No API key?** The app runs in **mock mode** — all AI steps return realistic demo data. Perfect for UI development. Set `OPENAI_API_KEY=MOCK_KEY_FOR_DEVELOPMENT` in `.env`.

> 🗄️ **Database migrations:** any schema change goes through Alembic. After editing models, generate a migration with `alembic revision --autogenerate -m "description"` then apply it with `alembic upgrade head`.

### 3. Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Start dev server
npm run dev
```

### 4. Open in browser

| Service | URL |
|---------|-----|
| Frontend | http://localhost:5173 |
| API Docs | http://localhost:8000/docs |

---

## 🔑 Environment Variables

Create `backend/.env` (see `.env.example`):

```env
# Database (MySQL)
DB_USER=root
DB_PASSWORD=your_password
DB_HOST=127.0.0.1
DB_PORT=3306
DB_NAME=curricula_ai

# AI Provider (OpenRouter is used if OPENROUTER_API_KEY is set)
OPENAI_API_KEY=sk-...your-key-here...
OPENAI_MODEL=gpt-4o-mini
```

If `OPENAI_API_KEY` is not set or set to `MOCK_KEY_FOR_DEVELOPMENT`, the app runs fully in **mock/demo mode**. Database credentials can alternatively be supplied as a single `DATABASE_URL` (e.g. `mysql+pymysql://user:pass@host:3306/curricula_ai?charset=utf8mb4`).

---

## 🗺️ API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/v1/courses/sessions` | List all sessions |
| `POST` | `/api/v1/courses/sessions` | Create new session (triggers AI concept generation) |
| `GET` | `/api/v1/courses/sessions/{id}` | Get session + generated content |
| `POST` | `/api/v1/courses/sessions/{id}/config` | Update course configuration |
| `POST` | `/api/v1/courses/sessions/{id}/proposals/generate` | Generate 3 curriculum proposals |
| `POST` | `/api/v1/courses/sessions/{id}/grounding` | Save grounding parameters |
| `POST` | `/api/v1/courses/sessions/{id}/proposals/select` | Select proposal + generate structure |
| `POST` | `/api/v1/courses/sessions/{id}/structure/save` | Save lesson outline |
| `POST` | `/api/v1/courses/sessions/{id}/content/generate` | Trigger full AI content generation |

Full interactive docs available at: `http://localhost:8000/docs`

---

## 🧠 AI Pipeline Architecture

```
User Prompt
  ↓
Concept Generator       → subject_context, tech_tags
  ↓
Context Config          → lessons_count, difficulty, audience
  ↓
Grounding Generator     → prerequisites, boundaries, learning_outcomes
  ↓
Proposal Generator      → 3 curriculum approaches
  ↓
[Human Review]          → user edits & selects
  ↓
Structure Generator     → lesson outline
  ↓
[Human Review]          → user reorders/renames
  ↓
Content Generator
  ├── Creator Generator → overview, core_content, quiz, exercises, prompt_templates
  ├── Student Generator → why_this_matters, practice, debugging, ethics
  └── Educator Generator→ facilitator_guide, lesson_plan, rubric, discussion
```

---

## 🎨 Design System

**Color Palette** (Maxy Academy brand):
- `#2D3561` — Navy (sidebar background, primary text)
- `#E9B259` — Gold (CTA buttons, active step icons, highlights)
- `#E8EAF0` — Light Gray (base workspace background)
- `#FFFFFF` — White (card background, main content area)

**Typography:**
- Headings: [Outfit](https://fonts.google.com/specimen/Outfit) (700–900)
- Body: [Plus Jakarta Sans](https://fonts.google.com/specimen/Plus+Jakarta+Sans) (400–700)

---

## 🚧 Roadmap

- [x] **Course Structure** — Lesson detail panel with per-role section editor
- [x] **AI Toolbar** — Regenerate, Rewrite, Expand, Shorten per section
- [x] **Quiz Manager** — Generate more, edit, delete individual questions
- [x] **Export Hub** — DOCX, PDF, HTML, ZIP (per role)
- [x] **History & Versioning** — Restore previous versions of content
- [x] **File Upload** — Knowledge base from PDF, DOCX, TXT
- [ ] **User Auth** — Login, profiles, multi-project support
- [ ] **Templates** — Pre-built course templates by category

---

## 🤝 Contributing

Pull requests are welcome. For major changes, please open an issue first.

---

## 📄 License

[MIT](LICENSE) © 2025 Maxy Academy
