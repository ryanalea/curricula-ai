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

> Dark navy sidebar · Light content area · Gold CTA buttons · Blue interactive elements

*Design palette: `#081231` · `#486BF5` · `#E9B259` · `#EFC568` · `#FDFEFE`*

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

### Backend (FastAPI + SQLite)
- ✅ Session-based workflow state machine
- ✅ Async AI content generation (non-blocking via `BackgroundTasks`)
- ✅ Real-time progress polling endpoint
- ✅ Modular pipeline: Concept → Grounding → Proposals → Structure → Content
- ✅ 3-role content generator (Creator, Student, Educator) per lesson
- ✅ SQLite persistence (Course, Lesson, Section, Session models)
- ✅ OpenAI-compatible with mock fallback for offline development
- ✅ CORS configured for local development

---

## 🛠️ Tech Stack

| Layer | Technology |
|-------|-----------|
| **Frontend** | React 18, Vite, Vanilla CSS |
| **Backend** | FastAPI, SQLAlchemy, SQLite |
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
│   ├── pipeline.py      # AI generation pipeline (all stages)
│   ├── models.py        # SQLAlchemy ORM models
│   ├── schemas.py       # Pydantic request/response schemas
│   ├── .env             # API keys (not committed)
│   └── course_generator.db  # SQLite database (auto-created)
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
pip install fastapi uvicorn sqlalchemy openai python-dotenv

# Create .env file
echo OPENAI_API_KEY=your_key_here > .env

# Start the server
uvicorn main:app --reload --host 127.0.0.1 --port 8000
```

> 💡 **No API key?** The app runs in **mock mode** — all AI steps return realistic demo data. Perfect for UI development.

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

Create `backend/.env`:

```env
OPENAI_API_KEY=sk-...your-key-here...
```

If `OPENAI_API_KEY` is not set or set to `MOCK_KEY_FOR_DEVELOPMENT`, the app runs fully in **mock/demo mode**.

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
- `#081231` — Navy (sidebar, text, code blocks)
- `#486BF5` — Blue (primary interactive, active states, tags)
- `#E9B259` — Gold (CTA buttons, highlights)
- `#EFC568` — Gold Alt (sidebar bylines, secondary accents)
- `#FDFEFE` — White (background, card surfaces)

**Typography:**
- Headings: [Outfit](https://fonts.google.com/specimen/Outfit) (700–900)
- Body: [Plus Jakarta Sans](https://fonts.google.com/specimen/Plus+Jakarta+Sans) (400–700)

---

## 🚧 Roadmap

- [ ] **Course Structure** — Lesson detail panel with per-role section editor
- [ ] **AI Toolbar** — Regenerate, Rewrite, Expand, Shorten per section
- [ ] **Quiz Manager** — Generate more, edit, delete individual questions
- [ ] **Export Hub** — DOCX, PDF, Markdown, HTML, ZIP (per role)
- [ ] **History & Versioning** — Restore previous versions of content
- [ ] **File Upload** — Knowledge base from PDF, DOCX, TXT
- [ ] **User Auth** — Login, profiles, multi-project support
- [ ] **Templates** — Pre-built course templates by category

---

## 🤝 Contributing

Pull requests are welcome. For major changes, please open an issue first.

---

## 📄 License

[MIT](LICENSE) © 2025 Maxy Academy
