import os
import json
import asyncio
import re
import uuid
import copy
from typing import Any
from openai import OpenAI
from dotenv import load_dotenv

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

def generate_concept_and_grounding(keyword: str, tags: list = None, difficulty: str = "Beginner", audience: str = "Student"):
    candidate_tags = get_default_candidate_tags(keyword, tags)
    selected_tags = tags if tags and len(tags) > 0 else (candidate_tags[:3] if candidate_tags else ["Project-Based Learning", "Experiential Learning"])
    if not client:
        return {
            "subject_context": f"This course provides a comprehensive guide to {keyword}, covering setup, core APIs, and real-world projects.",
            "grounding": {
                "tech_tags": selected_tags,
                "all_suggested_tags": candidate_tags,
                "prerequisites": [f"Basic understanding of {tags[0] if tags else keyword}", "Familiarity with terminal and basic programming"],
                "out_of_scope": ["Advanced multi-region cluster scaling", "Alternative legacy tooling"],
                "learning_outcomes": [f"Understand fundamental {tags[0] if tags else keyword} syntax and concepts", "Build a production-ready application", "Debug common runtime errors"],
                "target_audience": audience or "Professional"
            }
        }
    
    try:
        tags_str = ", ".join(selected_tags) if selected_tags else keyword
        prompt = f"""
        Given the course topic '{keyword}', target audience '{audience}', difficulty level '{difficulty}', and selected tech stack/tools '{tags_str}':
        Generate:
        1. A rich text content overview/context for this topic (2-3 paragraphs).
        2. Selected technical tags relevant to the topic (use or incorporate: {selected_tags}).
        3. All suggested technical & pedagogical candidate tags for selecting options (15-20 items).
        4. 3 Prerequisites required before starting, perfectly calibrated for a {difficulty} level course aimed at {audience}.
        5. 3 Learning boundaries (out of scope topics) that keep the scope focused.
        6. 3 Expected learning outcomes centered around mastering {tags_str}.
        7. Target audience: '{audience}'.

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
                    "target_audience": data.get("target_audience", audience or "Student")
                }
            }
        selected = selected_tags if selected_tags else data["grounding"].get("tech_tags", [])[:3]
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
    
    fallback_sections = {
        "creator": [
            {"type": "custom_creator_1", "id": "custom-creator-1", "title": "Technical Deep Dive", "instruction": "Explain the underlying architecture and theoretical details of this lesson's concepts.", "locked": False},
            {"type": "custom_creator_2", "id": "custom-creator-2", "title": "Industry Implementation Patterns", "instruction": "Discuss real-world production setups and architectural patterns used in the industry.", "locked": False},
            {"type": "custom_creator_3", "id": "custom-creator-3", "title": "Performance Optimization Tips", "instruction": "Provide advice on profiling, optimizing, and scaling this topic's implementations.", "locked": False}
        ],
        "student": [
            {"type": "custom_student_1", "id": "custom-student-1", "title": "Hands-on Guided Lab", "instruction": "Provide a step-by-step programming exercise or setup guide for students.", "locked": False},
            {"type": "custom_student_2", "id": "custom-student-2", "title": "Self-Assessment Challenge", "instruction": "Formulate a challenge scenario to test the student's understanding.", "locked": False},
            {"type": "custom_student_3", "id": "custom-student-3", "title": "Real-World Case Study", "instruction": "Explain how this specific concept was applied in a real-world tech industry situation.", "locked": False}
        ],
        "educator": [
            {"type": "custom_educator_1", "id": "custom-educator-1", "title": "Active Learning Strategy", "instruction": "Describe an interactive class activity or roleplay scenario.", "locked": False},
            {"type": "custom_educator_2", "id": "custom-educator-2", "title": "Common Misconceptions", "instruction": "Detail top 3 misconceptions students have about this topic and how to correct them.", "locked": False},
            {"type": "custom_educator_3", "id": "custom-educator-3", "title": "Peer Review Activity", "instruction": "Outline a 10-minute peer-review discussion template for the class.", "locked": False}
        ]
    }
    
    fallback_lessons = [
        {
            "id": i, 
            "title": f"Lesson {i}: {fallback_topics[(i-1) % len(fallback_topics)]} ({proposal_title})", 
            "order": i,
            "sections": fallback_sections
        }
        for i in range(1, lessons_count + 1)
    ]
    
    if not client:
        return fallback_lessons
    
    try:
        prompt = f"""
        [ROLE]
        You are a Curriculum Architect designing the lesson-by-lesson roadmap for a course.

        [TASK]
        1. Design exactly {lessons_count} DISTINCT lessons for the course '{proposal_title}'.
        Grounding parameters (prerequisites, learning outcomes, tech tags, out-of-scope topics): {json.dumps(grounding_data)}.
        2. Design exactly 3 custom-tailored, highly relevant additional sections for EACH of the 3 roles (creator, student, educator). These 3 sections per role apply to the WHOLE course and will be used in EVERY lesson, so they must be topic-appropriate for the course as a whole, not for a single lesson.

        [RULES]
        - Each lesson title MUST be completely unique and specific (CRITICAL: NEVER repeat generic prefixes like 'Introduction to...' or repeat the exact same title across lessons).
        - Do NOT repeat the full course title verbatim inside every lesson name.
        - The custom sections must focus on specific, concrete technical topics related directly to the course concept.
        - Write a detailed instruction (1-2 sentences) for each custom section detailing what the AI should write in that section.
        - Exactly 3 custom sections per role. Do not add more.

        [FORMAT]
        Return a pure JSON object, no preamble, exactly:
        {{
          "lessons": [
            {{
              "id": 1,
              "title": "Lesson 1: Specific distinct foundational topic",
              "order": 1
            }},
            {{
              "id": 2,
              "title": "Lesson 2: Another distinct topic",
              "order": 2
            }}
          ],
          "sections": {{
            "creator": [
              {{"title": "Custom Topic Title 1", "instruction": "Detailed instruction for AI content generation about this topic."}},
              {{"title": "Custom Topic Title 2", "instruction": "Detailed instruction."}},
              {{"title": "Custom Topic Title 3", "instruction": "Detailed instruction."}}
            ],
            "student": [
              {{"title": "Student Challenge Title 1", "instruction": "Instruction."}},
              {{"title": "Student Tool Guide Title 2", "instruction": "Instruction."}},
              {{"title": "Student Case Study Title 3", "instruction": "Instruction."}}
            ],
            "educator": [
              {{"title": "Classroom Activity Title 1", "instruction": "Instruction."}},
              {{"title": "Misconceptions Guide Title 2", "instruction": "Instruction."}},
              {{"title": "Peer Review Guide Title 3", "instruction": "Instruction."}}
            ]
          }}
        }}
        The "lessons" array must contain exactly {lessons_count} items, ordered 1..{lessons_count}.
        """
        response = client.chat.completions.create(
            model=OPENAI_MODEL,
            messages=[{"role": "user", "content": prompt}],
            response_format={"type": "json_object"},
            max_tokens=1500,
            temperature=0.7
        )
        data = safe_load_json(response.choices[0].message.content)
        lessons = data.get("lessons")
        if isinstance(lessons, list) and len(lessons) > 0:
            # Build ONE shared set of custom sections per role, applied to ALL lessons
            shared = data.get("sections")
            if not isinstance(shared, dict):
                shared = lessons[0].get("sections") or {}
            processed_shared = {}
            for role_key in ["creator", "student", "educator"]:
                role_list = shared.get(role_key, []) if isinstance(shared, dict) else []
                if not isinstance(role_list, list):
                    role_list = []
                processed = []
                for idx, sec in enumerate(role_list):
                    if not isinstance(sec, dict):
                        sec = {}
                    title = sec.get("title", f"Custom Topic {idx+1}")
                    slug = re.sub(r'[^a-z0-9]+', '_', title.lower()).strip('_')[:30]
                    sec_type = (sec.get("type") or f"custom_{role_key}_{slug}")[:50]
                    processed.append({
                        "id": sec.get("id") or f"custom-{role_key}-{idx+1}-{uuid.uuid4().hex[:6]}",
                        "type": sec_type,
                        "title": title,
                        "instruction": sec.get("instruction", "Write curriculum content."),
                        "locked": False
                    })
                processed_shared[role_key] = processed

            if not any(processed_shared.get(r) for r in ["creator", "student", "educator"]):
                return fallback_lessons

            out_lessons = []
            for i, l in enumerate(lessons):
                title = l.get("title") or fallback_topics[i % len(fallback_topics)]
                out_lessons.append({
                    "id": l.get("id") or i + 1,
                    "title": title,
                    "order": l.get("order") or i + 1,
                    "sections": copy.deepcopy(processed_shared)
                })
            return out_lessons
        return fallback_lessons
    except Exception as e:
        print(f"Error generating structure: {e}")
        return fallback_lessons

async def generate_creator_content(lesson_title: str, grounding_data: str, lesson_structure: str, lesson_duration: str = "60 mins"):
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
    Target Durasi Belajar: {lesson_duration} per lesson.
    Parameter Grounding: {grounding_data}
    Struktur Lesson (daftar seluruh lesson dalam course ini, untuk konteks urutan & agar tidak tumpang tidak): {lesson_structure}
 
    [RULES]
    - Sesuaikan kedalaman materi core_content agar setara dengan materi bacaan/studi mandiri selama 40% dari total {lesson_duration} durasi pelajaran.
    - Tulis materi secara teknis, presisi, mendalam, dan komprehensif. Dilarang menulis ringkasan singkat atau hanya garis besar saja.
    - Berikan minimal dua sub-topik mendalam dalam core_content lengkap dengan penjelasan arsitektur dan contoh kasus nyata di industri.
    - Sertakan minimal satu blok kode implementasi teknis yang utuh. DILARANG KERAS menggunakan placeholder seperti '// TODO' atau 'pass' di dalam kode. Kode harus fungsional dan siap pakai.
 
    [FORMAT]
    Kembalikan output murni dalam JSON terstruktur:
    {{
      "overview": "2-3 kalimat deskripsi teknis yang spesifik untuk lesson '{lesson_title}' ini saja (bukan deskripsi umum tentang course secara keseluruhan)",
      "learning_outcomes": ["Outcome spesifik 1", "Outcome spesifik 2", "Outcome spesifik 3"],
      "core_content": "Materi lengkap dalam format MARKDOWN memakai heading '### ' untuk tiap sub-topik (minimal 2 sub-topik). Harus sangat mendalam dan lengkap sesuai target durasi {lesson_duration}.",
      "exercises": [
        {{
          "title": "Nama latihan yang spesifik untuk topik lesson ini",
          "instruction": "Instruksi latihan yang detail, langkah-demi-langkah, dan actionable, merujuk langsung ke konsep di core_content",
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
    - IMPORTANT: Write all output content in English.
    - WAJIB spesifik ke topik lesson "{lesson_title}" — DILARANG memakai kalimat generik/template tanpa menyebutkan konsep konkretnya.
    - Sediakan minimal 2 exercises dan minimal 3 quiz.
    - Tanpa salam pengantar, berikan respons JSON valid murni.
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

async def generate_student_content(lesson_title: str, creator_content: dict, lesson_duration: str = "60 mins"):
    core_content_creator = creator_content.get("core_content", "")
    creator_exercises = creator_content.get("exercises", [])
    
    if not client:
        await asyncio.sleep(0.5)
        return {
            "why_this_matters": f"Understanding {lesson_title} is crucial because it acts as the building block for all subsequent workflows.",
            "learning_journey": f"Follow these interactive steps to master {lesson_title}.",
            "practice": {
                "interactive_exercise": "Try changing the parameters in the starter template.",
                "code_block": "def run():\n    # Implement practice logic\n    print('Demo')",
                "checklist": ["Identify key features", "Run the sample script"]
            },
            "debugging": "Common bug: IndentationError. Fix: Ensure 4 spaces are used for indentation.",
            "ethics": "Always ensure data privacy policies are respected when processing student records."
        }
    
    prompt = f"""
    [ROLE]
    Anda adalah Lead Learning Experience Designer (LX Designer) & Tutor AI Interaktif yang ahli menyajikan materi pembelajaran yang menyenangkan, intuitif, dan *hands-on*.
 
    [TASK]
    Berdasarkan materi induk dan daftar latihan Creator berikut, transformasikan materi Lesson: "{lesson_title}" menjadi modul belajar interaktif khusus untuk POV STUDENT.
    Target Durasi Belajar: {lesson_duration} per lesson.
    Materi Induk: {core_content_creator}
    Daftar Latihan Creator: {json.dumps(creator_exercises)}
 
    [RULES]
    - Rancang latihan interaktif dan draf kode awal (*starter code*) yang secara logis membutuhkan waktu pengerjaan 40% dari total {lesson_duration} durasi pelajaran (hands-on practice).
    - Bagian 'practice.code_block' HARUS berupa draf kode awal yang utuh, fungsional, dan **berhubungan langsung dengan Latihan Creator**: {json.dumps(creator_exercises)}.
    - DILARANG menggunakan placeholder kosong seperti '// TODO' atau 'pass' di dalam draf kode. Tulis kode templat awal yang bisa langsung dicoba oleh siswa dengan menyisakan area parameter/fungsi logis tertentu untuk mereka selesaikan.
    - Bagian 'debugging' harus menyajikan minimal 2 kesalahan umum teknis yang nyata beserta cuplikan kode salah, pesan error, dan solusi perbaikannya yang spesifik untuk bab ini.
 
    [FORMAT]
    Kembalikan output murni dalam JSON terstruktur:
    {{
      "why_this_matters": "Penjelasan intuitif dan analogi konkret (bukan generik) mengapa materi lesson INI spesifik penting di dunia nyata",
      "learning_journey": "Langkah-langkah belajar berformat MARKDOWN dengan list bernomor (1. 2. 3.), merujuk konsep konkret dari Materi Induk, bukan langkah generik",
      "practice": {{
        "interactive_exercise": "Panduan praktik langkah demi langkah yang membimbing siswa menyelesaikan Latihan Creator di atas",
        "code_block": "Kode starter teknis yang lengkap, fungsional, dan siap pakai siswa (TANPA placeholder kosong)",
        "checklist": ["Checklist pemahaman spesifik 1", "Checklist pemahaman spesifik 2", "Checklist pemahaman spesifik 3"]
      }},
      "debugging": "Kesalahan umum teknis (common bugs) spesifik bab ini dengan cuplikan log error dan solusinya, format markdown",
      "ethics": "Pertimbangan etika atau best practice yang relevan dengan topik lesson ini secara spesifik"
    }}
 
    [CONSTRAINT]
    - IMPORTANT: Write all output content in English.
    - JANGAN sertakan jawaban kuis, rubrik penilaian pengajar, atau panduan fasilitator.
    - JANGAN gunakan kalimat generik yang bisa berlaku untuk topik apapun.
    - Tanpa salam pengantar, berikan respons JSON valid murni.
    """
    loop = asyncio.get_running_loop()
    response = await loop.run_in_executor(
        None,
        lambda: client.chat.completions.create(
            model=OPENAI_MODEL,
            messages=[{"role": "user", "content": prompt}],
            response_format={"type": "json_object"},
            max_tokens=2500,
            temperature=0.7
        )
    )
    return safe_load_json(response.choices[0].message.content)

async def generate_educator_content(lesson_title: str, creator_content: dict, lesson_duration: str = "60 mins"):
    core_content_creator = creator_content.get("core_content", "")
    creator_exercises = creator_content.get("exercises", [])
    
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
    Berdasarkan materi induk dan daftar latihan Creator berikut, buatlah Panduan Mengajar (Facilitator Guide) khusus untuk POV EDUCATOR/MENTOR pada Lesson: "{lesson_title}".
    Durasi Target Pelajaran: {lesson_duration} per lesson.
    Materi Induk: {core_content_creator}
    Daftar Latihan Creator: {json.dumps(creator_exercises)}
 
    [RULES]
    - Rancang rencana pembelajaran mengajar (lesson plan timing) secara mendetail agar total alokasi waktunya **persis sama dengan durasi target ({lesson_duration})**.
    - Kriteria penilaian di bagian 'rubric' HARUS spesifik dan **berhubungan langsung untuk menilai pengerjaan siswa terhadap Latihan Creator ini**: {json.dumps(creator_exercises)}.
    - Panduan evaluasi di bagian 'assessment' harus memberikan instruksi penilaian/homework nyata yang secara langsung mengevaluasi hasil pengerjaan Latihan Creator tersebut.
 
    [FORMAT]
    Kembalikan output murni dalam JSON terstruktur:
    {{
      "facilitator_guide": "Panduan spesifik cara membawakan sesi lesson INI dengan durasi total {lesson_duration}, pembukaan kelas, dan poin krusial (konsep dari Latihan & Materi Induk) yang harus ditekankan",
      "lesson_plan": {{
        "timing": "Rincian alokasi waktu yang totalnya HARUS PERSIS SAMA DENGAN DURASI TARGET ({lesson_duration}) per lesson (contoh jika durasi 60m: 10m Pembukaan, 35m Penjelasan & Praktik Latihan, 15m Q&A)",
        "ice_breaker": "Pertanyaan pemantik atau aktivitas singkat yang relevan dengan topik lesson ini, bukan generik"
      }},
      "rubric": [
        {{
          "criteria": "Kriteria Penilaian yang spesifik untuk menilai Latihan Creator di atas",
          "excellent": "Indikator nilai A",
          "good": "Indikator nilai B",
          "needs_improvement": "Indikator perbaikan"
        }}
      ],
      "teaching_tips": ["Tips menangani miskonsepsi umum yang SPESIFIK untuk topik ini", "Tips menjawab pertanyaan sulit terkait topik ini"],
      "discussion_questions": ["Pertanyaan diskusi kelas 1 yang spesifik ke topik", "Pertanyaan diskusi kelas 2 yang spesifik ke topik"],
      "assessment": "Panduan evaluasi tugas akhir/homework yang merujuk langsung ke Latihan Creator"
    }}
 
    [CONSTRAINT]
    - IMPORTANT: Write all output content in English.
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
    # Action modifiers: rewrite, expand, shorten, simplify, improve, fact_check
    if not client:
        await asyncio.sleep(0.5)
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

async def generate_single_grounding_item(
    keyword: str, 
    field_type: str, 
    existing_items: list, 
    difficulty: str = "Beginner", 
    audience: str = "Student", 
    tech_tags: list = None
):
    """Generates a single relevant grounding item (prerequisite, boundary, or outcome) tailored to user customization."""
    if not client:
        await asyncio.sleep(0.5)
        fallback = {
            "prerequisites": "Familiarity with clean code concepts",
            "boundaries": "Advanced cloud infrastructure scaling",
            "learning_outcomes": "Demonstrate practical deployment skills"
        }
        return fallback.get(field_type, "New grounding point")

    tags_str = ", ".join(tech_tags) if tech_tags else "General concepts"
    prompt = f"""
    Course Topic: '{keyword}'
    Target Audience: {audience}
    Difficulty Level: {difficulty}
    Tech Stack / Focus: {tags_str}

    Task: Suggest one new, distinct, and highly relevant item for the grounding field '{field_type}'.
    Existing items in this field are: {json.dumps(existing_items)}
    
    Guidelines:
    - Match the requested difficulty level ({difficulty}) and target audience ({audience}).
    - Leverage the tech stack ({tags_str}) where appropriate.
    - Make the suggestion short (1 concise sentence), highly actionable, and do NOT repeat or overlap with existing items.
    
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

async def generate_custom_section_content(lesson_title: str, section_title: str, instruction: str, grounding_data: str) -> str:
    if not client:
        await asyncio.sleep(0.3)
        return f"This is auto-generated mockup content for custom section '{section_title}' based on instruction: {instruction}."
    try:
        prompt = f"""
        [ROLE]
        You are a Technical Content Creator. Write content for a custom course section.

        [CONTEXT]
        Lesson: "{lesson_title}"
        Section Title: "{section_title}"
        Instruction for this section: "{instruction}"
        Course Prerequisites/Grounding: {grounding_data}

        [TASK]
        Write the section content in MARKDOWN format. Keep it technical, engaging, and highly informative.
        Length: 2-3 paragraphs.
        Do not include headers, just start writing the content.
        """
        loop = asyncio.get_event_loop()
        response = await loop.run_in_executor(
            None,
            lambda: client.chat.completions.create(
                model=OPENAI_MODEL,
                messages=[{"role": "user", "content": prompt}],
                max_tokens=600,
                temperature=0.7
            )
        )
        return response.choices[0].message.content.strip()
    except Exception as e:
        print(f"Error generating custom section content: {e}")
        return f"Content for '{section_title}' could not be generated. Instruction: {instruction}."