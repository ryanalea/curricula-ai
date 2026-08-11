# Design: Backend Architecture Refactor (Routers + Services)

Tanggal: 2026-08-11
Status: Disetujui

## Tujuan

Merapikan arsitektur backend **tanpa mengubah perilaku apa pun**: semua endpoint, bentuk
response, dan cara menjalankan server (`uvicorn main:app` dari `backend/`) tetap identik.

Constraint: (1) jangan push ke GitHub, (2) jangan sentuh frontend.

## Masalah Saat Ini

- `main.py` (827 baris) adalah god file: semua route + background job + helper tercampur.
- `pipeline.py` (696 baris) god file: config client AI, JSON utils, mock data, heuristik tags,
  grounding, proposals, structure, konten 3 role, section action, quiz/exercise.
- Konfigurasi tersebar: client AI di `pipeline.py`, DB di `models.py`, CORS di `main.py`.
- Route datar tanpa pemisahan domain.
- Boilerplate `json.loads`/`json.dumps` berulang.
- Loop perakitan `lessons_data` diduplikasi di `get_session` dan `export_course`.

## Struktur Target

```
backend/
├── main.py              # tipis: init_db(), CORS, include routers, app = FastAPI
├── config.py            # load_dotenv, API key, client OpenAI/OpenRouter, OPENAI_MODEL
├── database.py          # Base, DATABASE_URL, engine, SessionLocal, get_db, init_db
├── models.py            # kelas model saja (Base dari database.py)
├── schemas.py           # tidak berubah
├── exporter.py          # tidak berubah
├── document_parser.py   # tidak berubah
├── smoke_test.py        # smoke test manual (TestClient, mode mock)
├── routers/
│   ├── __init__.py
│   ├── sessions.py      # stream-progress, CRUD, status, grounding(+suggest), config,
│   │                    # proposals(generate/select), structure/save, content/generate
│   ├── lessons.py       # ai-action, quiz/generate, exercises/generate, sections/save
│   ├── export.py        # export
│   ├── history.py       # history list + restore
│   └── documents.py     # upload
└── services/
    ├── __init__.py
    ├── grounding.py     # get_default_candidate_tags, generate_concept_and_grounding,
    │                    # generate_single_grounding_item, MOCK_GROUNDING
    ├── proposals.py     # generate_proposals, MOCK_PROPOSALS
    ├── structure.py     # generate_structure
    ├── content.py       # generate_creator/student/educator_content, run_section_action,
    │                    # generate_more_quiz, generate_more_exercises
    ├── session_io.py    # build_lessons_data + serialize_session
    ├── history.py       # save_history_snapshot
    └── generation.py    # ProgressPublisher + generate_course_content_task/_async
└── utils/
    ├── __init__.py
    └── json_utils.py    # safe_load_json
```

## Keputusan Kunci

1. **Entry point**: `main.py` tetap di `backend/`, tetap expose `app`, tetap panggil `init_db()`.
2. **Path & response**: identik dengan sekarang, hanya dipindahkan.
3. **`pipeline.py` dihapus**: hanya `main.py` yang mengimpornya; setelah refactor main.py
   mengimpor service langsung.
4. **Client AI**: logika dipindah utuh ke `config.py` (OpenRouter → OpenAI → mock),
   kode identik.
5. **DB**: `DATABASE_URL` default tetap `sqlite:///./course_generator.db`; di `database.py`
   memungkinkan override via env untuk smoke test (default tidak berubah).
6. **Duplikasi**: loop `lessons_data` → satu helper `build_lessons_data` dipakai oleh
   `get_session` dan `export_course`.
7. **Alur**: Router (validasi schemas) → Service (logika AI/bisnis) → DB (models/database) → response.
8. **Error handling**: HTTPException 404/400 + fallback konten AI tetap sama, hanya pindah.

## Verifikasi

- `python -m py_compile` semua file backend.
- `smoke_test.py` (TestClient, mode mock): GET `/`, list sessions, buat session, get session,
  grounding, config, proposals/generate, select, structure/save, export markdown — semua assert
  200 + bentuk response sesuai. Session uji dihapus di akhir.
- User tetap melakukan testing manual setelah selesai.
