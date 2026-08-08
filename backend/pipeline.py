import os
import json
import asyncio
from openai import OpenAI
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Initialize client
api_key = os.environ.get("OPENAI_API_KEY", "MOCK_KEY_FOR_DEVELOPMENT")
client = None
if api_key and api_key != "MOCK_KEY_FOR_DEVELOPMENT":
    client = OpenAI(api_key=api_key)

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

# Mock generation data for offline demo fallback
MOCK_GROUNDING = {
    "tech_tags": ["Python", "Data Science", "Pandas", "NumPy"],
    "prerequisites": ["Basic Programming Knowledge", "Understanding of Variables and Loops"],
    "out_of_scope": ["Deep Learning", "Web Development", "Database Management"],
    "learning_outcomes": ["Load and inspect datasets using Pandas", "Filter and clean raw data", "Perform basic aggregations"],
    "target_audience": "Student"
}

MOCK_PROPOSALS = [
    {
        "id": 1,
        "title": "Practical Data Science Boot camp",
        "description": "A hands-on, project-driven approach focused on building immediate data cleaning and analysis skills.",
        "differentiators": "100% code-along, features real Kaggle datasets, zero heavy math theory.",
        "difficulty": "Beginner",
        "estimated_hours": 6,
        "target_user": "Students & Aspiring Data Analysts"
    },
    {
        "id": 2,
        "title": "Recommended Data Foundations",
        "description": "Our balanced curriculum blending core statistical theory with programming fundamentals.",
        "differentiators": "Structured homework, covers data visualization best practices, direct mentor feedback.",
        "difficulty": "Intermediate",
        "estimated_hours": 8,
        "target_user": "Junior Developers & Professionals"
    },
    {
        "id": 3,
        "title": "Advanced Analytical Pipeline",
        "description": "Deep dive into production-grade pipelines, automation, and advanced data modeling.",
        "differentiators": "Focuses on clean code principles, pipeline scalability, and cloud deployments.",
        "difficulty": "Advanced",
        "estimated_hours": 12,
        "target_user": "Software Engineers & Data Scientists"
    }
]

def generate_concept_and_grounding(keyword: str):
    if not client:
        return {
            "subject_context": f"This course provides a comprehensive guide to {keyword}, covering setup, core APIs, and real-world projects.",
            "grounding": {
                "tech_tags": [keyword, "Modern Practices", "Framework Core"],
                "prerequisites": ["Basic coding experience", "Familiarity with terminal"],
                "out_of_scope": ["Advanced enterprise architectures", "Alternative legacy systems"],
                "learning_outcomes": [f"Understand fundamental {keyword} syntax", "Build a production-ready application", "Debug common runtime errors"],
                "target_audience": "Professional"
            }
        }
    
    try:
        prompt = f"""
        Given the keyword '{keyword}', generate:
        1. A rich text content overview/context for this topic (2-3 paragraphs).
        2. Technical tags relevant to the topic.
        3. Prerequisites required before starting.
        4. Learning boundaries (out of scope topics).
        5. Expected learning outcomes.
        6. Target audience (Student, Professional, Employee, or Teacher).

        Return your output as a JSON object with exactly these top-level keys:
        'subject_context' (string), 'grounding' (object with keys: 'tech_tags' (array), 'prerequisites' (array), 'out_of_scope' (array), 'learning_outcomes' (array), 'target_audience' (string)).
        """
        response = client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[{"role": "user", "content": prompt}],
            response_format={"type": "json_object"}
        )
        data = safe_load_json(response.choices[0].message.content)
        # Normalize: if AI returned flat structure (no 'grounding' key), wrap it
        if "grounding" not in data:
            data = {
                "subject_context": data.get("subject_context", ""),
                "grounding": {
                    "tech_tags": data.get("tech_tags", []),
                    "prerequisites": data.get("prerequisites", []),
                    "out_of_scope": data.get("out_of_scope", []),
                    "learning_outcomes": data.get("learning_outcomes", []),
                    "target_audience": data.get("target_audience", "Student")
                }
            }
        return data
    except Exception as e:
        print(f"Error calling OpenAI API: {e}")
        return {
            "subject_context": f"Failed to call API. Fallback context for {keyword}.",
            "grounding": MOCK_GROUNDING
        }

def generate_proposals(keyword: str, grounding_data: dict):
    if not client:
        return MOCK_PROPOSALS
    
    try:
        prompt = f"""
        Create 3 curriculum proposals (Practical, Recommended, Advanced) for: '{keyword}'
        Grounding context: {json.dumps(grounding_data)}

        Return a JSON array of 3 objects containing:
        'id' (1, 2, 3), 'title', 'description', 'differentiators', 'difficulty', 'estimated_hours', 'target_user'.
        """
        response = client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[{"role": "user", "content": prompt}],
            response_format={"type": "json_object"}
        )
        data = safe_load_json(response.choices[0].message.content)
        # Ensure it returns list
        if "proposals" in data:
            return data["proposals"]
        return list(data.values())[0] if isinstance(data, dict) else data
    except Exception as e:
        print(f"Error generating proposals: {e}")
        return MOCK_PROPOSALS

def generate_structure(proposal_title: str, config: dict, grounding_data: dict):
    if not client:
        return [
            {"id": i, "title": f"Lesson {i}: Introduction to {proposal_title}", "order": i}
            for i in range(1, config.get("lessons_count", 4) + 1)
        ]
    
    try:
        prompt = f"""
        Generate a list of lessons for the course: '{proposal_title}'.
        Number of lessons requested: {config.get('lessons_count', 4)}.
        Grounding parameters: {json.dumps(grounding_data)}.

        Return output as a JSON array of objects, each containing:
        'id' (integer), 'title' (string), 'order' (integer).
        """
        response = client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[{"role": "user", "content": prompt}],
            response_format={"type": "json_object"}
        )
        data = safe_load_json(response.choices[0].message.content)
        if "lessons" in data:
            return data["lessons"]
        return list(data.values())[0] if isinstance(data, dict) else data
    except Exception as e:
        print(f"Error generating structure: {e}")
        return [
            {"id": i, "title": f"Lesson {i}: Core Concepts of {proposal_title}", "order": i}
            for i in range(1, config.get("lessons_count", 4) + 1)
        ]

async def generate_creator_content(lesson_title: str, grounding_data: str, lesson_structure: str):
    if not client:
        await asyncio.sleep(0.5)
        return {
            "overview": f"A comprehensive guide detailing {lesson_title}.",
            "learning_outcomes": ["Understand the core mechanics", "Implement standard exercises"],
            "core_content": f"### Introduction to {lesson_title}\nThis is the core content for {lesson_title}. Code block example:\n```python\nprint('Hello World')\n```",
            "exercises": [{"title": "Practice 1", "instruction": "Write a basic script", "difficulty": "Easy"}],
            "quiz": [{"question": "What is Python?", "options": ["Snake", "Language", "Coffee", "Car"], "answer": "Language", "explanation": "Python is a programming language."}],
            "prompt_templates": ["Create a mock generator script"]
        }
    
    prompt = f"""
    [ROLE]
    Anda adalah Curriculum Architect & Technical Content Creator Senior yang bertugas merancang dokumen induk teknis dan instruksional untuk modul kursus.

    [TASK]
    Berdasarkan struktur kurikulum dan parameter grounding berikut, hasilkan konten utama untuk POV CREATOR pada Lesson: "{lesson_title}".
    Parameter Grounding: {grounding_data}
    Struktur Lesson: {lesson_structure}

    [FORMAT]
    Kembalikan output murni dalam JSON terstruktur:
    {{
      "overview": "Deskripsi teknis mendalam tentang lesson ini",
      "learning_outcomes": ["Outcomes 1", "Outcomes 2"],
      "core_content": "Materi teks lengkap, konsep teoretis, dan contoh kode teknis",
      "exercises": [
        {{
          "title": "Nama Latihan",
          "instruction": "Instruksi latihan",
          "difficulty": "Easy/Medium/Hard"
        }}
      ],
      "quiz": [
        {{
          "question": "Pertanyaan",
          "options": ["A", "B", "C", "D"],
          "answer": "A",
          "explanation": "Penjelasan kunci jawaban"
        }}
      ],
      "prompt_templates": ["Prompt AI pendukung untuk builder"]
    }}

    [CONSTRAINT]
    - Gunakan bahasa yang teknis, presisi, dan komprehensif.
    - Fokus pada kelengkapan materi induk dan struktur latihan/kuis.
    - Tanpa salam pengantar, berikan respons JSON valid murni.
    """
    response = await loop.run_in_executor(
        None,
        lambda: client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[{"role": "user", "content": prompt}],
            response_format={"type": "json_object"}
        )
    )
    return safe_load_json(response.choices[0].message.content)

async def generate_student_content(lesson_title: str, core_content_creator: str):
    if not client:
        await asyncio.sleep(0.5)
        return {
            "why_this_matters": f"Understanding {lesson_title} is crucial because it acts as the building block for all subsequent workflows.",
            "learning_journey": f"Follow these interactive steps to master {lesson_title}.",
            "practice": {
                "interactive_exercise": "Try changing the parameters in the starter template.",
                "code_block": "def run():\n    # TODO: Fill in details\n    pass",
                "checklist": ["Identify key features", "Run the sample script"]
            },
            "debugging": "Common bug: IndentationError. Fix: Ensure 4 spaces are used for indentation.",
            "ethics": "Always ensure data privacy policies are respected when processing student records."
        }
    
    prompt = f"""
    [ROLE]
    Anda adalah Lead Learning Experience Designer (LX Designer) & Tutor AI Interaktif yang ahli menyajikan materi pembelajaran yang menyenangkan, intuitif, dan *hands-on*.

    [TASK]
    Berdasarkan materi induk berikut, transformasi materi Lesson: "{lesson_title}" menjadi modul belajar interaktif khusus untuk POV STUDENT.
    Materi Induk: {core_content_creator}

    [FORMAT]
    Kembalikan output murni dalam JSON terstruktur:
    {{
      "why_this_matters": "Penjelasan intuitif dan analogi mengapa materi ini penting di dunia nyata",
      "learning_journey": "Langkah-langkah belajar interaktif yang mudah dipahami bab demi bab",
      "practice": {{
        "interactive_exercise": "Panduan praktik langkah demi langkah",
        "code_block": "Draf kode awal untuk diisi siswa",
        "checklist": ["Checklist pemahaman 1", "Checklist pemahaman 2"]
      }},
      "debugging": "Daftar kesalahan umum (common bugs/errors) dan cara mengatasinya",
      "ethics": "Pertimbangan etika atau best practice dalam menerapkan materi ini"
    }}

    [CONSTRAINT]
    - JANGAN sertakan jawaban kuis, rubrik penilaian pengajar, atau panduan fasilitator.
    - Gunakan bahasa yang suportif, mudah dipahami, dan berorientasi pada penyelesaian masalah nyata.
    - Sediakan blok *debugging* dan *ethics* yang relevan.
    - Tanpa salam pengantar, berikan respons JSON valid murni.
    """
    response = await loop.run_in_executor(
        None,
        lambda: client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[{"role": "user", "content": prompt}],
            response_format={"type": "json_object"}
        )
    )
    return safe_load_json(response.choices[0].message.content)

async def generate_educator_content(lesson_title: str, core_content_creator: str):
    if not client:
        await asyncio.sleep(0.5)
        return {
            "facilitator_guide": f"Begin with a 5-minute recap of prerequisite terms, then demo {lesson_title}.",
            "lesson_plan": {
                "timing": "15m Intro, 30m Coding, 15m Q&A",
                "ice_breaker": "Ask students: 'What is the most frustrating error you hit this week?'"
            },
            "rubric": [{"criteria": "Code Accuracy", "excellent": "Code runs without warnings", "good": "Code runs with minor style warnings", "needs_improvement": "Code fails to execute"}],
            "teaching_tips": ["For struggling students, pair them up in peer programming sessions."],
            "discussion_questions": ["How would you explain this pattern to a non-technical manager?"],
            "assessment": "Ask students to extend the practice code block to handle empty datasets."
        }
    
    prompt = f"""
    [ROLE]
    Anda adalah Master Pedagogi & Instructional Coach Senior yang membimbing dosen, mentor, dan fasilitator kelas dalam membawakan materi pembelajaran.

    [TASK]
    Berdasarkan materi induk dan struktur lesson berikut, buatlah Panduan Mengajar (Facilitator Guide) khusus untuk POV EDUCATOR/MENTOR pada Lesson: "{lesson_title}".
    Materi Induk: {core_content_creator}

    [FORMAT]
    Kembalikan output murni dalam JSON terstruktur:
    {{
      "facilitator_guide": "Panduan cara membawakan sesi, pembukaan kelas, dan poin krusial yang harus ditekankan",
      "lesson_plan": {{
        "timing": "Rincian alokasi waktu (misal: 15 menit teori, 30 menit praktik, 15 menit Q&A)",
        "ice_breaker": "Pertanyaan pemantik atau aktivitas singkat sebelum masuk materi"
      }},
      "rubric": [
        {{
          "criteria": "Kriteria Penilaian",
          "excellent": "Indikator nilai A",
          "good": "Indikator nilai B",
          "needs_improvement": "Indikator perbaikan"
        }}
      ],
      "teaching_tips": ["Tips menangani siswa yang tertinggal", "Tips menjawab pertanyaan sulit"],
      "discussion_questions": ["Pertanyaan diskusi kelas 1", "Pertanyaan diskusi kelas 2"],
      "assessment": "Panduan evaluasi tugas akhir atau homework"
    }}

    [CONSTRAINT]
    - Fokus sepenuhnya pada strategi pedagogi, alokasi waktu kelas (*timing*), rubrik penilaian, dan tips mengajar di kelas.
    - Hindari mengulang teks materi pelajaran panjang milik siswa.
    - Tanpa salam pengantar, berikan respons JSON valid murni.
    """
    response = await loop.run_in_executor(
        None,
        lambda: client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[{"role": "user", "content": prompt}],
            response_format={"type": "json_object"}
        )
    )
    return safe_load_json(response.choices[0].message.content)

async def run_section_action(section_type: str, content: str, action: str, params: dict = None):
    # Action modifiers: rewrite, expand, shorten, simplify, translate, improve, fact_check
    if not client:
        await asyncio.sleep(0.5)
        if action == "translate":
            lang = (params or {}).get("target_language", "Indonesian")
            return f"[Action: Translated to {lang}] {content}"
        return f"[Action: {action.upper()}] {content}"
    
    prompt = f"""
    [TASK]
    Perform the action '{action}' on the following section content of type '{section_type}'.
    
    [CONTENT]
    {content}
    
    [ADDITIONAL_PARAMETERS]
    {json.dumps(params or {})}
    
    [CONSTRAINTS]
    - Keep formatting intact. If it is markdown, keep it as markdown.
    - Respond only with the updated content text. Do not add intro or outro.
    """
    loop = asyncio.get_event_loop()
    response = await loop.run_in_executor(
        None,
        lambda: client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[{"role": "user", "content": prompt}]
        )
    )
    return response.choices[0].message.content.strip()

async def generate_more_quiz(lesson_title: str, core_content: str, count: int = 3):
    if not client:
        await asyncio.sleep(0.5)
        return [
            {
                "question": f"Which of the following is a key aspect of {lesson_title}?",
                "options": ["Option A", "Option B", "Option C", "Option D"],
                "answer": "Option A",
                "explanation": "Option A is correct because of fundamental principles discussed."
            }
        ] * count
    
    prompt = f"""
    Based on the following content for lesson '{lesson_title}', generate exactly {count} multiple choice quiz questions.
    
    [CONTENT]
    {core_content}
    
    [FORMAT]
    Return JSON only with format:
    {{
      "quizzes": [
        {{
          "question": "Question text?",
          "options": ["A", "B", "C", "D"],
          "answer": "Exact matching string of correct option",
          "explanation": "Why correct"
        }}
      ]
    }}
    """
    loop = asyncio.get_event_loop()
    response = await loop.run_in_executor(
        None,
        lambda: client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[{"role": "user", "content": prompt}],
            response_format={"type": "json_object"}
        )
    )
    return safe_load_json(response.choices[0].message.content).get("quizzes", [])

async def generate_more_exercises(lesson_title: str, core_content: str, count: int = 1):
    if not client:
        await asyncio.sleep(0.5)
        return [
            {
                "title": f"Hands-on Exercise for {lesson_title}",
                "instruction": "Extend the code template to support parsing multiple records sequentially."
            }
        ] * count
    
    prompt = f"""
    Based on the following content for lesson '{lesson_title}', generate exactly {count} student exercises/tasks.
    
    [CONTENT]
    {core_content}
    
    [FORMAT]
    Return JSON only with format:
    {{
      "exercises": [
        {{
          "title": "Exercise Name",
          "instruction": "Detailed task instructions..."
        }}
      ]
    }}
    """
    loop = asyncio.get_event_loop()
    response = await loop.run_in_executor(
        None,
        lambda: client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[{"role": "user", "content": prompt}],
            response_format={"type": "json_object"}
        )
    )
    return safe_load_json(response.choices[0].message.content).get("exercises", [])
