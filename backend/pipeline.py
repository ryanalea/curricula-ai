import os
import json
import asyncio
import re
from openai import OpenAI
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Initialize client (OpenAI)
api_key = os.environ.get("OPENAI_API_KEY", "MOCK_KEY_FOR_DEVELOPMENT")
OPENAI_MODEL = os.environ.get("OPENAI_MODEL", "gpt-4o-mini")
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

def get_default_candidate_tags(keyword: str, tech_tags: list = None) -> list:
    if tech_tags is None:
        tech_tags = []

    kw_lower = (keyword or "").lower()

    def kw_hits(keys):
        return any(
            re.search(rf"\b{re.escape(k)}\b", kw_lower) if len(k) <= 3 else k in kw_lower
            for k in keys
        )

    categories = [
        (["go", "golang", "concurrent", "microservice", "grpc", "pipeline"], [
            "Go (Golang)", "Concurrency", "Goroutines & Channels", "Microservices",
            "REST APIs", "gRPC", "Docker & Kubernetes", "CI/CD Pipelines",
            "System Architecture", "Performance Tuning"
        ]),
        (["python", "pandas", "numpy", "scikit", "jupyter", "data"], [
            "Python 3", "Data Science", "Pandas", "NumPy", "Data Visualization",
            "Machine Learning", "Jupyter Notebooks", "Data Analytics", "SQL & Databases", "ETL Pipelines"
        ]),
        (["ai", "machine learning", "deep learning", "llm", "neural", "gpt", "chatgpt", "tensorflow", "pytorch"], [
            "Generative AI", "Deep Learning", "Prompt Engineering", "LLM Integration",
            "Neural Networks", "PyTorch", "Transformers", "LangChain", "Vector Databases", "AI Ethics"
        ]),
        (["react", "native", "mobile", "javascript", "frontend", "web", "typescript", "html", "css", "vite"], [
            "React Native", "React 18", "JavaScript (ES6+)", "TypeScript",
            "State Management (Redux/Zustand)", "Component Architecture", "Mobile UI/UX",
            "REST API Integration", "Navigation & Routing", "Vite"
        ]),
        (["java", "spring", "backend", "hibernate"], [
            "Java", "Spring Boot", "Backend Development", "Microservices",
            "REST APIs", "SQL & Databases", "JPA/Hibernate", "System Architecture",
            "Docker & Kubernetes", "API Integration"
        ]),
        (["flutter", "dart"], [
            "Flutter", "Dart", "Mobile Development", "UI/UX",
            "State Management", "Widgets & Material Design", "REST API Integration",
            "Navigation & Routing", "Testing", "CI/CD Pipelines"
        ]),
        (["php", "laravel", "wordpress"], [
            "PHP", "Laravel", "Web Development", "MySQL",
            "Blade Templating", "Eloquent ORM", "REST APIs", "Frontend Development",
            "Docker & Kubernetes", "API Integration"
        ]),
        (["digital marketing", "seo", "content marketing", "social media", "copywriting"], [
            "Digital Marketing", "SEO", "Content Marketing", "Social Media Marketing",
            "Google Analytics", "Email Marketing", "Copywriting", "Brand Strategy",
            "Performance Marketing", "Market Research"
        ]),
        (["devops", "kubernetes", "docker", "aws", "azure", "cloud", "cicd", "terraform", "infrastructure"], [
            "DevOps", "Docker & Kubernetes", "CI/CD Pipelines", "Cloud Computing",
            "Infrastructure as Code", "Terraform", "Monitoring & Observability", "System Architecture",
            "AWS", "Security Best Practices"
        ]),
        (["blockchain", "solidity", "web3", "smart contract", "ethereum"], [
            "Blockchain", "Solidity", "Smart Contracts", "Web3",
            "Decentralized Applications", "Cryptography", "Ethereum", "Tokenomics",
            "Security Best Practices", "Smart Contract Testing"
        ]),
    ]

    tech_candidates = []
    for keys, tags in categories:
        if kw_hits(keys):
            for tag in tags:
                if tag not in tech_candidates:
                    tech_candidates.append(tag)

    if not tech_candidates:
        if keyword:
            stopwords = {"for", "and", "the", "with", "from", "about", "into", "that", "this", "your", "using", "how", "what", "which", "are", "was", "were", "non"}
            words = [w.capitalize() for w in keyword.split() if len(w) > 2 and w.lower() not in stopwords]
            tech_candidates = words + [
                f"{keyword.title()} Core", "System Design", "Hands-on Projects",
                "API Integration", "Architecture Patterns", "Best Practices"
            ]
        else:
            tech_candidates = ["Software Engineering", "Full-Stack Development", "System Architecture", "Cloud Infrastructure"]

    edu_tags = [
        "Capstone Projects", "Project-Based Learning", "Experiential Learning",
        "Collaborative Learning", "Industry Partnerships", "Authentic Assessment",
        "AI in Education", "Workplace Simulation", "Constructive Alignment",
        "Team-Based Skills", "Project Management", "Problem-Based Learning",
        "Portfolio Development", "Agile Methodologies", "Learning Outcomes"
    ]

    combined = []
    for tag in list(tech_tags) + tech_candidates + edu_tags:
        if tag and tag not in combined:
            combined.append(tag)
    return combined[:20]

def generate_concept_and_grounding(keyword: str):
    candidate_tags = get_default_candidate_tags(keyword)
    selected_tags = candidate_tags[:3] if candidate_tags else ["Project-Based Learning", "Experiential Learning"]
    if not client:
        return {
            "subject_context": f"This course provides a comprehensive guide to {keyword}, covering setup, core APIs, and real-world projects.",
            "grounding": {
                "tech_tags": selected_tags,
                "all_suggested_tags": candidate_tags,
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
        2. Selected technical tags relevant to the topic (exactly 3 items).
        3. All suggested technical & pedagogical candidate tags for selecting options (15-20 items).
        4. Prerequisites required before starting.
        5. Learning boundaries (out of scope topics).
        6. Expected learning outcomes.
        7. Target audience (Student, Professional, Employee, or Teacher).

        Return your output as a JSON object with exactly these top-level keys:
        'subject_context' (string), 'grounding' (object with keys: 'tech_tags' (array), 'all_suggested_tags' (array), 'prerequisites' (array), 'out_of_scope' (array), 'learning_outcomes' (array), 'target_audience' (string)).
        """
        response = client.chat.completions.create(
            model=OPENAI_MODEL,
            messages=[{"role": "user", "content": prompt}],
            response_format={"type": "json_object"},
            max_tokens=1800,
            temperature=0.7
        )
        data = safe_load_json(response.choices[0].message.content)
        # Normalize: if AI returned flat structure (no 'grounding' key), wrap it
        if "grounding" not in data:
            data = {
                "subject_context": data.get("subject_context", ""),
                "grounding": {
                    "tech_tags": data.get("tech_tags", []),
                    "all_suggested_tags": data.get("all_suggested_tags", []),
                    "prerequisites": data.get("prerequisites", []),
                    "out_of_scope": data.get("out_of_scope", []),
                    "learning_outcomes": data.get("learning_outcomes", []),
                    "target_audience": data.get("target_audience", "Student")
                }
            }
        selected = data["grounding"].get("tech_tags", [])[:3]
        data["grounding"]["tech_tags"] = selected
        if not data["grounding"].get("all_suggested_tags"):
            data["grounding"]["all_suggested_tags"] = get_default_candidate_tags(keyword, selected)
        return data
    except Exception as e:
        print(f"Error calling OpenAI API: {e}")
        selected_tags = ["Capstone Projects", "Project-Based Learning", "Experiential Learning"]
        return {
            "subject_context": f"Failed to call API. Fallback context for {keyword}.",
            "grounding": {
                "tech_tags": selected_tags,
                "all_suggested_tags": get_default_candidate_tags(keyword, selected_tags),
                "prerequisites": MOCK_GROUNDING["prerequisites"],
                "out_of_scope": MOCK_GROUNDING["out_of_scope"],
                "learning_outcomes": MOCK_GROUNDING["learning_outcomes"],
                "target_audience": MOCK_GROUNDING["target_audience"]
            }
        }

def generate_proposals(keyword: str, grounding_data: dict):
    if not client:
        return MOCK_PROPOSALS
    
    try:
        prompt = f"""
        [ROLE]
        You are a Curriculum Strategist proposing 3 distinct course angles for the topic '{keyword}'.

        [TASK]
        Create exactly 3 curriculum proposals with genuinely different positioning:
        1. "Practical" — hands-on, project-first, minimal theory.
        2. "Recommended" — balanced theory + practice, the default safe choice.
        3. "Advanced" — deep, production-grade, assumes stronger prior knowledge.
        Grounding context: {json.dumps(grounding_data)}

        [RULES]
        - Each proposal's 'description' and 'differentiators' must be concrete and specific to '{keyword}' (no generic filler like "hands-on learning" without naming what is actually built or covered).
        - 'estimated_hours' must increase from Practical -> Recommended -> Advanced.
        - 'difficulty' must be one of: Beginner, Intermediate, Advanced (matching the proposal's positioning).

        [FORMAT]
        Return a pure JSON object, no preamble, exactly:
        {{
          "proposals": [
            {{"id": 1, "title": "...", "description": "...", "differentiators": "...", "difficulty": "Beginner", "estimated_hours": 6, "target_user": "..."}},
            {{"id": 2, "title": "...", "description": "...", "differentiators": "...", "difficulty": "Intermediate", "estimated_hours": 8, "target_user": "..."}},
            {{"id": 3, "title": "...", "description": "...", "differentiators": "...", "difficulty": "Advanced", "estimated_hours": 12, "target_user": "..."}}
          ]
        }}
        """
        response = client.chat.completions.create(
            model=OPENAI_MODEL,
            messages=[{"role": "user", "content": prompt}],
            response_format={"type": "json_object"},
            max_tokens=1500,
            temperature=0.7
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
    lessons_count = config.get('lessons_count', 4)
    fallback_topics = [
        f"Foundations & Setup",
        f"Core Workflows & Architecture",
        f"Practical Implementation & Hands-On Labs",
        f"Advanced Patterns & Optimization",
        f"Capstone Integration & Real-World Deployment",
        f"Scaling & Performance Tuning",
        f"Security & Enterprise Best Practices",
        f"Maintenance & Future Roadmap"
    ]
    fallback_lessons = [
        {"id": i, "title": f"Lesson {i}: {fallback_topics[(i-1) % len(fallback_topics)]} ({proposal_title})", "order": i}
        for i in range(1, lessons_count + 1)
    ]
    
    if not client:
        return fallback_lessons
    
    try:
        prompt = f"""
        [ROLE]
        You are a Curriculum Architect designing the lesson-by-lesson roadmap for a course.

        [TASK]
        Design exactly {lessons_count} DISTINCT lessons for the course '{proposal_title}'.
        Grounding parameters (prerequisites, learning outcomes, tech tags, out-of-scope topics): {json.dumps(grounding_data)}.

        [RULES]
        - Each lesson title MUST be completely unique and specific (CRITICAL: NEVER repeat generic prefixes like 'Introduction to...' or repeat the exact same title across lessons).
        - Titles must progress logically from foundational concepts to advanced practical implementation:
          * Lesson 1: Foundations & Architecture
          * Lesson 2: Core Workflows & Hands-On Concepts
          * Lesson 3: Advanced Optimization & Implementation
          * Lesson 4+: Practical Capstone & Real-World Deployment
        - Do NOT repeat the full course title verbatim inside every lesson name.

        [FORMAT]
        Return a pure JSON object, no preamble, exactly:
        {{
          "lessons": [
            {{"id": 1, "title": "Lesson 1: Specific, distinct foundational topic", "order": 1}},
            {{"id": 2, "title": "Lesson 2: Specific, distinct intermediate topic", "order": 2}}
          ]
        }}
        The "lessons" array must contain exactly {lessons_count} items, ordered 1..{lessons_count}.
        """
        response = client.chat.completions.create(
            model=OPENAI_MODEL,
            messages=[{"role": "user", "content": prompt}],
            response_format={"type": "json_object"},
            max_tokens=1200,
            temperature=0.7
        )
        data = safe_load_json(response.choices[0].message.content)
        if "lessons" in data and isinstance(data["lessons"], list) and len(data["lessons"]) > 0:
            return data["lessons"]
        return list(data.values())[0] if isinstance(data, dict) and isinstance(list(data.values())[0], list) else fallback_lessons
    except Exception as e:
        print(f"Error generating structure: {e}")
        return fallback_lessons

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
    Struktur Lesson (daftar seluruh lesson dalam course ini, untuk konteks urutan & agar tidak tumpang tindih materi antar lesson): {lesson_structure}

    [FORMAT]
    Kembalikan output murni dalam JSON terstruktur:
    {{
      "overview": "2-3 kalimat deskripsi teknis yang spesifik untuk lesson '{lesson_title}' ini saja (bukan deskripsi umum tentang course secara keseluruhan)",
      "learning_outcomes": ["Outcome spesifik 1", "Outcome spesifik 2", "Outcome spesifik 3"],
      "core_content": "Materi lengkap dalam format MARKDOWN memakai heading '### ' untuk tiap sub-topik (minimal 2 sub-topik). Sertakan penjelasan konsep, contoh nyata/kasus penggunaan, dan minimal satu blok kode relevan dalam ```bahasa\\nkode\\n```. Panjang: 4-6 paragraf setara.",
      "exercises": [
        {{
          "title": "Nama latihan yang spesifik untuk topik lesson ini",
          "instruction": "Instruksi latihan yang detail dan actionable, merujuk langsung ke konsep di core_content",
          "difficulty": "Easy/Medium/Hard"
        }}
      ],
      "quiz": [
        {{
          "question": "Pertanyaan yang menguji pemahaman konsep spesifik lesson ini (bukan pertanyaan generik)",
          "options": ["A", "B", "C", "D"],
          "answer": "Salah satu string di options, persis sama",
          "explanation": "Penjelasan kunci jawaban"
        }}
      ],
      "prompt_templates": ["Contoh prompt AI yang bisa dipakai siswa untuk eksplorasi lebih lanjut terkait topik lesson ini"]
    }}

    [CONSTRAINT]
    - WAJIB spesifik ke topik lesson "{lesson_title}" — DILARANG memakai kalimat generik/template seperti "materi ini penting untuk fondasi" tanpa menyebutkan konsep konkretnya.
    - Konten antar lesson TIDAK BOLEH duplikat; gunakan Struktur Lesson di atas sebagai referensi supaya tiap lesson punya fokus materi berbeda.
    - Sediakan minimal 2 exercises dan minimal 3 quiz.
    - Gunakan bahasa yang teknis, presisi, dan komprehensif.
    - Tanpa salam pengantar, berikan respons JSON valid murni (tanpa markdown code fence di luar field core_content).
    """
    loop = asyncio.get_running_loop()
    response = await loop.run_in_executor(
        None,
        lambda: client.chat.completions.create(
            model=OPENAI_MODEL,
            messages=[{"role": "user", "content": prompt}],
            response_format={"type": "json_object"},
            max_tokens=3000,
            temperature=0.7
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
      "why_this_matters": "Penjelasan intuitif dan analogi konkret (bukan generik) mengapa materi lesson INI spesifik penting di dunia nyata",
      "learning_journey": "Langkah-langkah belajar berformat MARKDOWN dengan list bernomor (1. 2. 3.), merujuk konsep konkret dari Materi Induk, bukan langkah generik",
      "practice": {{
        "interactive_exercise": "Panduan praktik langkah demi langkah yang merujuk langsung ke konsep di Materi Induk",
        "code_block": "Draf kode awal (starter code) yang relevan dengan topik, siap diisi siswa",
        "checklist": ["Checklist pemahaman spesifik 1", "Checklist pemahaman spesifik 2", "Checklist pemahaman spesifik 3"]
      }},
      "debugging": "Minimal 2 kesalahan umum (common bugs/errors) YANG SPESIFIK untuk topik ini beserta cara mengatasinya, format markdown list",
      "ethics": "Pertimbangan etika atau best practice yang relevan dengan topik lesson ini secara spesifik"
    }}

    [CONSTRAINT]
    - JANGAN sertakan jawaban kuis, rubrik penilaian pengajar, atau panduan fasilitator.
    - JANGAN gunakan kalimat generik yang bisa berlaku untuk topik apapun — semua harus merujuk konsep konkret dari Materi Induk di atas.
    - Gunakan bahasa yang suportif, mudah dipahami, dan berorientasi pada penyelesaian masalah nyata.
    - Tanpa salam pengantar, berikan respons JSON valid murni.
    """
    loop = asyncio.get_running_loop()
    response = await loop.run_in_executor(
        None,
        lambda: client.chat.completions.create(
            model=OPENAI_MODEL,
            messages=[{"role": "user", "content": prompt}],
            response_format={"type": "json_object"},
            max_tokens=2000,
            temperature=0.7
        )
    )
    return safe_load_json(response.choices[0].message.content)

async def generate_educator_content(lesson_title: str, core_content_creator: str, lesson_duration: str = "60 mins"):
    if not client:
        await asyncio.sleep(0.5)
        return {
            "facilitator_guide": f"Begin with a 5-minute recap of prerequisite terms, then demo {lesson_title}.",
            "lesson_plan": {
                "timing": f"Session Duration: {lesson_duration}",
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
    Durasi Target Pelajaran: {lesson_duration} per lesson.
    Materi Induk: {core_content_creator}

    [FORMAT]
    Kembalikan output murni dalam JSON terstruktur:
    {{
      "facilitator_guide": "Panduan spesifik cara membawakan sesi lesson INI dengan durasi total {lesson_duration}, pembukaan kelas, dan poin krusial (konsep dari Materi Induk) yang harus ditekankan",
      "lesson_plan": {{
        "timing": "Rincian alokasi waktu yang totalnya HARUS PERSIS SAMA DENGAN DURASI TARGET ({lesson_duration}) per lesson (contoh jika durasi 60m: 10m Pembukaan, 35m Penjelasan & Praktik, 15m Q&A)",
        "ice_breaker": "Pertanyaan pemantik atau aktivitas singkat yang relevan dengan topik lesson ini, bukan generik"
      }},
      "rubric": [
        {{
          "criteria": "Kriteria Penilaian yang spesifik untuk exercise/topik lesson ini",
          "excellent": "Indikator nilai A",
          "good": "Indikator nilai B",
          "needs_improvement": "Indikator perbaikan"
        }}
      ],
      "teaching_tips": ["Tips menangani miskonsepsi umum yang SPESIFIK untuk topik ini", "Tips menjawab pertanyaan sulit terkait topik ini"],
      "discussion_questions": ["Pertanyaan diskusi kelas 1 yang spesifik ke topik", "Pertanyaan diskusi kelas 2 yang spesifik ke topik"],
      "assessment": "Panduan evaluasi tugas akhir/homework yang merujuk langsung ke exercise di Materi Induk"
    }}

    [CONSTRAINT]
    - Minimal 2 kriteria di rubric.
    - Fokus sepenuhnya pada strategi pedagogi, alokasi waktu kelas (*timing*), rubrik penilaian, dan tips mengajar di kelas.
    - Hindari mengulang teks materi pelajaran panjang milik siswa; hindari kalimat generik yang bisa berlaku untuk topik apapun.
    - Tanpa salam pengantar, berikan respons JSON valid murni.
    """
    loop = asyncio.get_running_loop()
    response = await loop.run_in_executor(
        None,
        lambda: client.chat.completions.create(
            model=OPENAI_MODEL,
            messages=[{"role": "user", "content": prompt}],
            response_format={"type": "json_object"},
            max_tokens=2000,
            temperature=0.7
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
            model=OPENAI_MODEL,
            messages=[{"role": "user", "content": prompt}],
            max_tokens=1800,
            temperature=0.7
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
            model=OPENAI_MODEL,
            messages=[{"role": "user", "content": prompt}],
            response_format={"type": "json_object"},
            max_tokens=1500,
            temperature=0.7
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
            model=OPENAI_MODEL,
            messages=[{"role": "user", "content": prompt}],
            response_format={"type": "json_object"},
            max_tokens=1500,
            temperature=0.7
        )
    )
    return safe_load_json(response.choices[0].message.content).get("exercises", [])

async def generate_single_grounding_item(keyword: str, field_type: str, existing_items: list):
    """Generates a single relevant grounding item (prerequisite, boundary, or outcome) using AI."""
    if not client:
        await asyncio.sleep(0.5)
        fallback = {
            "prerequisites": "Familiarity with clean code concepts",
            "boundaries": "Advanced cloud infrastructure scaling",
            "learning_outcomes": "Demonstrate practical deployment skills"
        }
        return fallback.get(field_type, "New grounding point")

    prompt = f"""
    Based on the course topic: '{keyword}', suggest one new, distinct, and highly relevant item for the grounding field '{field_type}'.
    Existing items in this field are: {json.dumps(existing_items)}
    
    Make the suggestion short (1 sentence), actionable, and do not repeat any existing items.
    
    Return output as JSON only with format:
    {{
      "suggestion": "One sentence suggestion text"
    }}
    """
    loop = asyncio.get_event_loop()
    response = await loop.run_in_executor(
        None,
        lambda: client.chat.completions.create(
            model=OPENAI_MODEL,
            messages=[{"role": "user", "content": prompt}],
            response_format={"type": "json_object"},
            max_tokens=300,
            temperature=0.7
        )
    )
    data = safe_load_json(response.choices[0].message.content)
    return data.get("suggestion", f"Understanding of {keyword} concepts")