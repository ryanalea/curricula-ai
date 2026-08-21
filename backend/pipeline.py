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
        api_key=openrouter_api_key,
        timeout=30.0
    )
    OPENAI_MODEL = os.environ.get("OPENROUTER_MODEL", "openai/gpt-4o-mini")
else:
    if openai_api_key and openai_api_key != "MOCK_KEY_FOR_DEVELOPMENT":
        client = OpenAI(api_key=openai_api_key, timeout=30.0)
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
        fallback_tags = candidate_tags
        return {
            "subject_context": f"This course provides a comprehensive guide to {keyword}, covering setup, core APIs, and real-world projects.",
            "grounding": {
                "tech_tags": fallback_tags[:3],
                "all_suggested_tags": fallback_tags,
                "prerequisites": [f"Basic understanding of {tags[0] if tags else keyword}", "Familiarity with terminal and basic programming"],
                "out_of_scope": ["Advanced multi-region cluster scaling", "Alternative legacy tooling"],
                "learning_outcomes": [f"Understand fundamental {tags[0] if tags else keyword} syntax and concepts", "Build a production-ready application", "Debug common runtime errors"],
                "target_audience": audience or "Professional"
            }
        }
    
    try:
        prompt = f"""
        [ROLE]
        You are an Intent Classification & Extraction Engine.

        [TASK]
        Analyze the following user input for a course: '{keyword}'
        Target audience '{audience}', difficulty level '{difficulty}'.
        
        1. Determine if this input is a simple topic (1-5 words) or a complex instructional prompt.
           If it is a simple topic or lacks specific instructions, set 'is_complex': false, and leave explicit parameters empty/null.
        2. Extract a 'display_title' (catchy, max 4-6 words) representing the core topic in standard English.
        3. Determine the 'course_domain' (e.g., "Coding", "Business & Management", "Pedagogy & Design", "Humanities", "Culinary Arts", etc.) in English.
        4. Determine the best 'interactivity_type' (e.g., "Coding Sandbox", "Case Study Simulator", "Roleplay Simulator", "Step-by-Step Worksheet").
        5. Extract any explicit user instructions if present (if 'is_complex' is true):
           - 'lesson_count' (integer, e.g., 4)
           - 'duration' (string, e.g., "2 weeks" or "1 hour")
           - 'tools' (array of strings, e.g., ["ChatGPT", "EdApp"])
           - 'final_project' (string in English)
           - 'explicit_outline' (array of strings translated into English)
        6. Generate standard grounding data in 100% English:
           - A rich text content overview/context for this topic in English (2-3 paragraphs).
           - Exactly 20 relevant tags/topics in 'all_suggested_tags' written exclusively in English.
           - 3 Prerequisites in English.
           - 3 Learning boundaries (out of scope topics) in English.
           - 3 Expected learning outcomes in English.

        [STRICT 100% ENGLISH ENFORCEMENT]
        - ABSOLUTE RULE: Output MUST be 100% in English. Every single field—including display_title, course_domain, subject_context, all 20 tags, prerequisites, out_of_scope, and learning_outcomes—MUST be written exclusively in standard professional English.
        - If the user input or source topic is in Indonesian or any other language, TRANSLATE and ADAPT all concepts, titles, and terms completely into natural English (e.g., convert Indonesian culinary terms, spices, or colloquialisms into standard English equivalents).
        - ZERO TOLERANCE: NEVER output Indonesian or any non-English words anywhere in the response.

        [FORMAT]
        Return a JSON object exactly like this:
        {{
          "is_complex": boolean,
          "display_title": "...",
          "course_domain": "...",
          "interactivity_type": "...",
          "explicit_parameters": {{
            "lesson_count": integer or null,
            "duration": "string or null",
            "tools": ["...", "..."],
            "final_project": "string or null",
            "explicit_outline": ["...", "..."]
          }},
          "subject_context": "string in English", 
          "all_suggested_tags": ["..."],
          "prerequisites": ["..."], 
          "out_of_scope": ["..."], 
          "learning_outcomes": ["..."], 
          "target_audience": "string"
        }}
        """
        # Using gpt-4o as explicitly requested for this router step
        router_model = "gpt-4o" if "gpt" in OPENAI_MODEL else OPENAI_MODEL
        
        response = client.chat.completions.create(
            model=router_model,
            messages=[{"role": "user", "content": prompt}],
            response_format={"type": "json_object"},
            max_tokens=2500,
            temperature=0.7
        )
        data = safe_load_json(response.choices[0].message.content)
        
        # Build injected context
        injected_context = f"[DOMAIN: {data.get('course_domain', 'General')}]\n"
        injected_context += f"[INTERACTIVITY: {data.get('interactivity_type', 'Interactive Practice')}]\n"
        explicit_params = data.get("explicit_parameters", {})
        if explicit_params.get("tools"):
            injected_context += f"[TOOLS REQUIRED: {', '.join(explicit_params.get('tools', []))}]\n"
        if explicit_params.get("final_project"):
            injected_context += f"[FINAL PROJECT: {explicit_params.get('final_project')}]\n"
        if explicit_params.get("explicit_outline") and len(explicit_params.get("explicit_outline")) > 0:
            outline_str = ", ".join(explicit_params.get("explicit_outline"))
            injected_context += f"[EXPLICIT OUTLINE: {outline_str}]\n"
            
        injected_context += "\n" + data.get("subject_context", "")
        
        # Normalize: wrap into grounding
        if "grounding" not in data:
            data = {
                "display_title": data.get("display_title", keyword),
                "is_complex": data.get("is_complex", False),
                "explicit_parameters": explicit_params,
                "subject_context": injected_context,
                "grounding": {
                    "tech_tags": data.get("all_suggested_tags", [])[:3],
                    "all_suggested_tags": data.get("all_suggested_tags", []),
                    "prerequisites": data.get("prerequisites", []),
                    "out_of_scope": data.get("out_of_scope", []),
                    "learning_outcomes": data.get("learning_outcomes", []),
                    "target_audience": data.get("target_audience", audience or "Student")
                }
            }
        # AI generate all_suggested_tags, ambil 3 pertama sebagai default
        suggested = data["grounding"].get("all_suggested_tags", [])
        data["grounding"]["tech_tags"] = suggested[:3] if suggested else get_default_candidate_tags(keyword)[:3]
        data["grounding"]["all_suggested_tags"] = suggested if suggested else get_default_candidate_tags(keyword)
        return data
    except Exception as e:
        print(f"Error calling OpenAI API: {e}")
        fallback_tags = get_default_candidate_tags(keyword)
        return {
            "subject_context": f"Failed to call API. Fallback context for {keyword}.",
            "grounding": {
                "tech_tags": fallback_tags[:3],
                "all_suggested_tags": fallback_tags,
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
        - ABSOLUTE ENGLISH ENFORCEMENT: Write all proposal titles, descriptions, differentiators, and target_user 100% in English. If '{keyword}' is in Indonesian or any other language, translate and adapt everything into standard English. NEVER use Indonesian words.

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
            {"type": "custom_creator_1", "id": "custom-creator-1", "title": "Technical Deep Dive", "instruction": "Explain the underlying architecture and theoretical details of this lesson's concepts in English.", "locked": False},
            {"type": "custom_creator_2", "id": "custom-creator-2", "title": "Industry Implementation Patterns", "instruction": "Discuss real-world production setups and architectural patterns used in the industry in English.", "locked": False},
            {"type": "custom_creator_3", "id": "custom-creator-3", "title": "Performance Optimization Tips", "instruction": "Provide advice on profiling, optimizing, and scaling this topic's implementations in English.", "locked": False}
        ],
        "student": [
            {"type": "custom_student_1", "id": "custom-student-1", "title": "Hands-on Guided Lab", "instruction": "Provide a step-by-step programming exercise or setup guide for students in English.", "locked": False},
            {"type": "custom_student_2", "id": "custom-student-2", "title": "Self-Assessment Challenge", "instruction": "Formulate a challenge scenario to test the student's understanding in English.", "locked": False},
            {"type": "custom_student_3", "id": "custom-student-3", "title": "Real-World Case Study", "instruction": "Explain how this specific concept was applied in a real-world industry situation in English.", "locked": False}
        ],
        "educator": [
            {"type": "custom_educator_1", "id": "custom-educator-1", "title": "Active Learning Strategy", "instruction": "Describe an interactive class activity or roleplay scenario in English.", "locked": False},
            {"type": "custom_educator_2", "id": "custom-educator-2", "title": "Common Misconceptions", "instruction": "Detail top 3 misconceptions students have about this topic and how to correct them in English.", "locked": False},
            {"type": "custom_educator_3", "id": "custom-educator-3", "title": "Peer Review Activity", "instruction": "Outline a 10-minute peer-review discussion template for the class in English.", "locked": False}
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
        CRITICAL: If the Grounding parameters or subject_context contains an `[EXPLICIT OUTLINE: ...]`, you MUST strictly use those explicit module/lesson titles as your lesson list in the exact order requested, adapting and translating them into standard English.
        2. Design exactly 3 custom-tailored, highly relevant additional sections for EACH of the 3 roles (creator, student, educator) in English. These 3 sections per role apply to the WHOLE course and will be used in EVERY lesson, so they must be topic-appropriate for the course as a whole, not for a single lesson.

        [RULES]
        - Each lesson title MUST be completely unique, specific, and written in English (CRITICAL: NEVER repeat generic prefixes like 'Introduction to...' or repeat the exact same title across lessons).
        - Do NOT repeat the full course title verbatim inside every lesson name.
        - The custom sections must focus on specific, concrete technical topics related directly to the course concept.
        - Write a detailed instruction (1-2 sentences) for each custom section in English detailing what the AI should write.
        - Exactly 3 custom sections per role. Do not add more.
        - ABSOLUTE ENGLISH ENFORCEMENT: Write all lesson titles, section titles, and instructions 100% in English. If '{proposal_title}' or grounding context is in Indonesian or any other language, translate and adapt everything into English. NEVER use Indonesian words.

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
            "overview": f"A comprehensive instructional guide outlining the curriculum module for {lesson_title}.",
            "learning_outcomes": ["Understand the core mechanisms and foundational concepts", "Apply practical steps independently in real-world scenarios"],
            "core_content": f"### Introduction to {lesson_title}\nThis section provides the essential knowledge base for {lesson_title}, covering foundational principles and practical industry implementation.",
            "exercises": [{"title": "Practical Lab 1", "instruction": "Follow the step-by-step hands-on guide according to the lesson specifications.", "difficulty": "Beginner"}],
            "quiz": [{"question": f"What is the primary objective of studying {lesson_title}?", "options": ["Enhance conceptual and practical mastery", "Bypass verification and quality checks", "Reduce system efficiency"], "answer": "Enhance conceptual and practical mastery", "explanation": "Deep conceptual understanding provides the basis for reliable implementation."}],
            "prompt_templates": ["Provide an additional case study analysis for this topic."]
        }
    
    prompt = f"""
    [ROLE]
    You are a Senior Curriculum Architect & Technical Content Creator designing core instructional and technical documents for course modules.
 
    [TASK]
    Based on the curriculum structure and grounding parameters below, generate the primary technical material for the CREATOR POV on Lesson: "{lesson_title}".
    Target Learning Duration: {lesson_duration} per lesson.
    Grounding Parameters: {grounding_data}
    Lesson Structure Context: {lesson_structure}
 
    [STRICT 100% ENGLISH ENFORCEMENT]
    - ABSOLUTE RULE: Output MUST be 100% in English. Every single field—including overview, learning_outcomes, core_content, exercises, quiz, and prompt_templates—MUST be written exclusively in standard professional English.
    - If the source material, prompt, or lesson title contains Indonesian or any non-English terms, TRANSLATE and ADAPT all concepts, ingredients, procedures, and explanations completely into natural English.
    - ZERO TOLERANCE: NEVER use Indonesian or any non-English words anywhere in the response.
    - NO FORCED CODING: Check the [DOMAIN: ...] in Grounding parameters. If the domain is NOT "Coding", you MUST NOT generate programming code snippets. Use structured frameworks, procedural steps, recipes, tables, or templates for non-coding topics.
    - Ensure the depth of core_content corresponds to reading/self-study material taking up 40% of the total {lesson_duration} lesson duration.
    - Provide in-depth, precise, and comprehensive content. Do not write brief summaries or bullet-point outlines only.
    - Include at least two in-depth sub-topics in core_content with clear explanations and real-world industry examples.
    - Include at least one practical implementation block (or workflow/recipe/framework if non-coding). NEVER use placeholders like '// TODO' or 'pass'.
 
    [FORMAT]
    Return a pure JSON object:
    {{
      "overview": "2-3 sentences of comprehensive description specific to lesson '{lesson_title}' in English",
      "learning_outcomes": ["Specific Learning Outcome 1", "Specific Learning Outcome 2", "Specific Learning Outcome 3"],
      "core_content": "Full detailed material in MARKDOWN format in English using '### ' headings for each sub-topic (minimum 2 sub-topics). In-depth and aligned with {lesson_duration}.",
      "exercises": [
        {{
          "title": "Specific exercise name for this lesson topic in English",
          "instruction": "Detailed, step-by-step, actionable practice instructions in English",
          "difficulty": "Beginner/Intermediate/Advanced"
        }}
      ],
      "quiz": [
        {{
          "question": "Clear question testing conceptual understanding of this lesson in English",
          "options": ["A", "B", "C", "D"],
          "answer": "One exact matching string from options",
          "explanation": "Clear explanation of the correct answer in English"
        }}
      ],
      "prompt_templates": ["Sample AI prompt in English for deeper exploration"]
    }}
 
    [CONSTRAINT]
    - Write 100% exclusively in standard professional English.
    - Minimum 2 exercises and minimum 3 quiz questions.
    - Provide pure valid JSON with no introductory conversational text.
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

async def generate_student_content(lesson_title: str, creator_content: dict, lesson_duration: str = "60 mins", subject_context: str = ""):
    core_content_creator = creator_content.get("core_content", "")
    creator_exercises = creator_content.get("exercises", [])
    
    if not client:
        await asyncio.sleep(0.5)
        return {
            "why_this_matters": f"Understanding {lesson_title} is essential as it provides the core practical competencies directly applicable in real-world situations.",
            "learning_journey": f"Follow this structured learning journey to master {lesson_title}.",
            "practice": {
                "interactive_exercise": "Execute the step-by-step practical simulation according to the given scenario.",
                "code_block": "Perform hands-on exploration following the lesson guidance.",
                "content_type": "markdown",
                "checklist": ["Review initial requirements", "Execute the practical workflow", "Evaluate output quality"]
            },
            "debugging": "### Common Pitfalls & Solutions\n1. Inaccurate Parameters: Verify all inputs.\n2. Workflow Divergence: Adhere to guidelines.",
            "ethics": "### Standards & Ethics\nApply integrity and quality standards throughout execution."
        }
    
    prompt = f"""
    [ROLE]
    You are an Expert Learning Experience Designer crafting engaging, student-facing modules.
 
    [SUBJECT CONTEXT & DOMAIN METADATA]
    {subject_context}

    [TASK]
    Based on the Creator curriculum material and exercises below, transform Lesson: "{lesson_title}" into an engaging, interactive module for the STUDENT POV.
    Target Duration: {lesson_duration} per lesson.
    Creator Core Content: {core_content_creator}
    Creator Exercises: {json.dumps(creator_exercises)}
 
    [STRICT 100% ENGLISH ENFORCEMENT]
    - ABSOLUTE RULE: Output MUST be 100% in English. Every single field—including why_this_matters, learning_journey, practice exercises, checklists, debugging pitfalls, and ethics—MUST be written exclusively in standard professional English.
    - If the Creator content or lesson title contains any Indonesian or non-English words, TRANSLATE and ADAPT them completely into natural English.
    - ZERO TOLERANCE: NEVER use Indonesian or any non-English words.
    - Design interactive exercises that logically take ~40% of the {lesson_duration} for hands-on practice.
    - **CRITICAL DOMAIN ROUTING RULE**:
      * Check [DOMAIN: ...] in SUBJECT CONTEXT & DOMAIN METADATA above.
      * If DOMAIN is Non-Coding (Culinary, Business, Design, Healthcare, Humanities, etc.):
        1. MUST set `"content_type": "markdown"`.
        2. NEVER generate programming code (Python/JS) in `code_block`.
        3. Fill `code_block` with structured scenario text, technical recipe/procedure steps, or real-world simulations in English.
      * ONLY set `"content_type": "code"` if DOMAIN is explicitly Coding or Software Engineering.
    - NEVER use empty placeholders like '// TODO' or 'pass'.
    - 'debugging' section must present at least 2 common mistakes / pitfalls specific to this topic with clear troubleshooting solutions in English.
 
    [FORMAT]
    Return JSON:
    {{
      "why_this_matters": "Engaging explanation in English of why this lesson is vital in real-world practice",
      "learning_journey": "Numbered roadmap (1. 2. 3.) in English guiding the student step-by-step through the concepts",
      "practice": {{
        "interactive_exercise": "Step-by-step guidance in English for completing this exercise",
        "code_block": "Structured scenario/recipe guide in English for non-coding OR starter code template for coding",
        "content_type": "markdown (non-coding) or code (coding)",
        "checklist": ["Actionable checklist item 1 in English", "Actionable checklist item 2 in English", "Actionable checklist item 3 in English"]
      }},
      "debugging": "MARKDOWN in English: Common pitfalls and exact troubleshooting steps",
      "ethics": "MARKDOWN in English: Ethical scope, quality standards, safety, or best practices"
    }}
 
    [CONSTRAINT]
    - Output must be 100% in English.
    - Provide pure valid JSON without conversational filler.
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
            "facilitator_guide": f"Begin the session with a concise review of foundational concepts, followed by hands-on demonstrations for {lesson_title}.",
            "lesson_plan": {
                "timing": f"Timing Allocation: {lesson_duration} (10m Intro, 35m Core Practice, 15m Discussion/Q&A)",
                "ice_breaker": "Ask: 'What is the most common challenge encountered when implementing this technique?'"
            },
            "rubric": [{"criteria": "Execution Precision", "excellent": "Executed flawlessly with optimal methodology", "good": "Good execution with minor adjustments needed", "needs_improvement": "Requires foundational review"}],
            "teaching_tips": ["Guide learners through hands-on practice incrementally."],
            "discussion_questions": ["How can this method be adapted for different real-world constraints?"],
            "assessment": "Have students present their completed practical output and explain their methodology."
        }
    
    prompt = f"""
    [ROLE]
    You are a Master Pedagogical Coach & Instructional Facilitator guiding educators, instructors, and mentors in delivering course modules.
 
    [TASK]
    Based on the Creator material and exercises, create a comprehensive Facilitator Guide for the EDUCATOR POV on Lesson: "{lesson_title}".
    Target Duration: {lesson_duration} per lesson.
    Creator Core Content: {core_content_creator}
    Creator Exercises: {json.dumps(creator_exercises)}
 
    [STRICT 100% ENGLISH ENFORCEMENT]
    - ABSOLUTE RULE: Output MUST be 100% in English. Every single field—including facilitator_guide, lesson_plan, rubric, teaching_tips, discussion_questions, and assessment—MUST be written exclusively in standard professional English.
    - If the Creator content or lesson title contains any Indonesian or non-English words, TRANSLATE and ADAPT them completely into natural English.
    - ZERO TOLERANCE: NEVER use Indonesian or any non-English words.
    - Lesson plan timing breakdown MUST sum up EXACTLY to the target duration ({lesson_duration}).
    - Assessment rubric criteria MUST directly evaluate student work on the Creator Exercises: {json.dumps(creator_exercises)}.
    - Assessment guide must offer concrete evaluation/homework instructions directly tied to the practical exercises in English.
 
    [FORMAT]
    Return JSON:
    {{
      "facilitator_guide": "Specific guide in English for facilitating this session within {lesson_duration}, including opening remarks and key emphasis points",
      "lesson_plan": {{
        "timing": "Time breakdown totaling exactly {lesson_duration} (e.g. 5m Opening, 20m Lab, 5m Reflection)",
        "ice_breaker": "Engaging ice-breaker question or warm-up activity in English"
      }},
      "rubric": [
        {{
          "criteria": "Assessment Criteria Name in English",
          "excellent": "Clear benchmark for Excellent performance in English",
          "good": "Clear benchmark for Good performance in English",
          "needs_improvement": "Clear benchmark for Needs Improvement in English"
        }}
      ],
      "teaching_tips": ["Tip for addressing common misconceptions in English", "Tip for guiding students in English"],
      "discussion_questions": ["Discussion question 1 in English", "Discussion question 2 in English"],
      "assessment": "Actionable homework or evaluation guide in English referencing the exercises"
    }}
 
    [CONSTRAINT]
    - Output must be 100% in English.
    - Minimum 2 rubric criteria.
    - Pure valid JSON without conversational wrapper.
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
    
    if action == "shorten":
        action_directive = """
        [GOAL: COMPREHENSIVE OVERALL SHORTENING & CONDENSATION]
        - Do NOT perform minor sentence-level trimming per paragraph.
        - You MUST aggressively synthesize and condense the ENTIRE document into an overall executive summary format that is roughly 40% to 50% of the original volume.
        - Combine and merge repetitive concepts, convert lengthy narrative blocks into crisp high-impact bullet points or short punchy paragraphs.
        - Retain ALL essential technical takeaways, core concepts, and key steps, but remove verbose elaborations and filler words.
        - The resulting text must feel concise, sharp, and directly to the point.
        """
        target_tokens = 900
    elif action == "expand":
        action_directive = """
        [GOAL: HOLISTIC EXPANSION & DEEP ELABORATION]
        - Deepen the entire section holistically by adding rich context, real-world industry examples, practical step-by-step guidance, and architectural considerations (1.5x - 2x depth).
        - Ensure every subtopic is thoroughly articulated with clear technical rationale.
        """
        target_tokens = 2500
    elif action == "simplify":
        action_directive = """
        [GOAL: SIMPLIFICATION & COGNITIVE ACCESSIBILITY]
        - Restructure the content to be crystal-clear, intuitive, and easy to understand for beginners.
        - Replace heavy academic/technical jargon with clear analogies, concise explanations, and structured lists.
        """
        target_tokens = 1500
    elif action == "rewrite":
        action_directive = """
        [GOAL: COMPLETE NARRATIVE REWRITE & STRUCTURAL POLISH]
        - Completely rewrite the section with a fresh, highly engaging, professional pedagogical voice.
        - Restructure the headings and flow for optimal readability and impact.
        """
        target_tokens = 2000
    elif action == "regenerate":
        action_directive = """
        [GOAL: FULL FRESH REGENERATION]
        - Generate a completely fresh, comprehensive, and up-to-date version of this section from scratch tailored to the topic.
        """
        target_tokens = 2000
    else:
        action_directive = f"Perform the action '{action}' thoroughly across the entire content."
        target_tokens = 1800
    
    prompt = f"""
    [TASK]
    Perform the action '{action}' on the following section content of type '{section_type}'.
    
    {action_directive}
    
    [CONTENT TO TRANSFORM]
    {content}
    
    [ADDITIONAL_PARAMETERS]
    {json.dumps(params or {})}
    
    [STRICT 100% ENGLISH ENFORCEMENT]
    - ABSOLUTE RULE: Output MUST be 100% in English.
    - If the input content contains any Indonesian or non-English text, translate and adapt everything into standard professional English during this action.
    - ZERO TOLERANCE: NEVER output any non-English words.
    - Keep formatting intact. If it is markdown, keep it as clean markdown.
    - Respond ONLY with the transformed content text. Do not add intro greetings, explanations, or outro comments.
    """
    loop = asyncio.get_event_loop()
    response = await loop.run_in_executor(
        None,
        lambda: client.chat.completions.create(
            model=OPENAI_MODEL,
            messages=[{"role": "user", "content": prompt}],
            max_tokens=target_tokens,
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
    Based on the following content for lesson '{lesson_title}', generate exactly {count} multiple choice quiz questions in 100% standard English.
    
    [CONTENT]
    {core_content}
    
    [STRICT 100% ENGLISH ENFORCEMENT]
    - All questions, options, and explanations MUST be written 100% in English. Zero non-English words.
    
    [FORMAT]
    Return JSON only with format:
    {{
      "quizzes": [
        {{
          "question": "Question text in English?",
          "options": ["A", "B", "C", "D"],
          "answer": "Exact matching string of correct option",
          "explanation": "Why correct in English"
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
                "instruction": "Extend the workflow template to support executing multiple tasks sequentially."
            }
        ] * count
    
    prompt = f"""
    Based on the following content for lesson '{lesson_title}', generate exactly {count} student exercises/tasks in 100% standard English.
    
    [CONTENT]
    {core_content}
    
    [STRICT 100% ENGLISH ENFORCEMENT]
    - All exercise titles and instructions MUST be written 100% in English. Zero non-English words.
    
    [FORMAT]
    Return JSON only with format:
    {{
      "exercises": [
        {{
          "title": "Exercise Name in English",
          "instruction": "Detailed task instructions in English..."
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

    Task: Suggest one new, distinct, and highly relevant item for the grounding field '{field_type}' in standard English.
    Existing items in this field are: {json.dumps(existing_items)}
    
    Guidelines:
    - Match the requested difficulty level ({difficulty}) and target audience ({audience}).
    - Leverage the tech stack ({tags_str}) where appropriate.
    - Make the suggestion short (1 concise sentence), highly actionable, and do NOT repeat or overlap with existing items.
    - STRICT ENGLISH ENFORCEMENT: The suggestion MUST be written 100% in English. If '{keyword}' or existing items are in Indonesian or any other language, translate and generate the suggestion in pure English. NEVER use Indonesian words.
    
    Return output as JSON only with format:
    {{
      "suggestion": "One sentence suggestion text in English"
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

def to_title_case(text: str) -> str:
    """Helper to convert string into standard English Title Case."""
    if not text:
        return ""
    minor_words = {"a", "an", "the", "and", "but", "or", "for", "nor", "on", "at", "to", "from", "by", "with", "in", "of", "vs", "via"}
    words = text.strip().split()
    if not words:
        return ""
    result = []
    for i, w in enumerate(words):
        lw = w.lower()
        if i == 0 or i == len(words) - 1 or lw not in minor_words:
            result.append(w.capitalize())
        else:
            result.append(lw)
    return " ".join(result)

async def polish_custom_element(raw_title: str, raw_description: str = "", context_type: str = "section", domain: str = "General") -> dict:
    """
    Intermediate AI Preprocessing & Sanitizer:
    Translates raw informal/non-English custom title to professional Title Case English,
    AND generates a concise 2-sentence domain-relevant educational description/summary.
    """
    if not raw_title or not raw_title.strip():
        return {"title": raw_title, "description": raw_description}
        
    if not client:
        return {
            "title": to_title_case(raw_title),
            "description": raw_description or f"Comprehensive instructional guidelines and practical applications for {to_title_case(raw_title)}."
        }
        
    prompt = f"""
    [ROLE]
    You are an Instructional Curriculum Architect & Language Specialist.

    [INPUT]
    Raw Input Title: "{raw_title}"
    Raw Input Description/Instruction: "{raw_description}"
    Context Type: {context_type} (custom_section, custom_lesson, or outcome)
    Course Domain: {domain}

    [TASK]
    Transform this raw input into a polished curriculum element in standard professional English:
    1. "title": Translate into formal educational English and format with Title Case (e.g., "cara bersihin kadal" -> "Hygienic Cleaning & Deodorizing Techniques", "tips bumbu murah" -> "Cost-Effective Seasoning & Flavor Balancing Strategies").
    2. "description": Write a concise, 2-sentence domain-specific educational overview for this element in standard English.

    [OUTPUT FORMAT]
    Return pure JSON with keys "title" and "description".
    """
    try:
        loop = asyncio.get_event_loop()
        response = await loop.run_in_executor(
            None,
            lambda: client.chat.completions.create(
                model=OPENAI_MODEL,
                messages=[{"role": "user", "content": prompt}],
                response_format={"type": "json_object"},
                max_tokens=250,
                temperature=0.3
            )
        )
        data = safe_load_json(response.choices[0].message.content)
        return {
            "title": data.get("title", to_title_case(raw_title)),
            "description": data.get("description", raw_description)
        }
    except Exception as e:
        print(f"Error polishing custom element: {e}")
        return {
            "title": to_title_case(raw_title),
            "description": raw_description or f"Practical instructional procedures for {to_title_case(raw_title)}."
        }

async def generate_custom_section_content(lesson_title: str, section_title: str, instruction: str, grounding_data: str) -> str:
    if not client:
        await asyncio.sleep(0.3)
        return f"### 1. Overview & Core Methodology\nPractical implementation procedures for {section_title}.\n\n### 2. Step-by-Step Practical Execution\n1. Prepare required materials and workspace.\n2. Execute the primary workflow systematically.\n3. Validate output against safety and quality standards."
    try:
        prompt = f"""
        [ROLE]
        You are a Master Subject Specialist & Senior Curriculum Designer authoring a comprehensive, actionable module section.

        [CONTEXT]
        Lesson Topic: "{lesson_title}"
        Specialized Section: "{section_title}"
        Custom Instruction: "{instruction}"
        Course Grounding & Domain: {grounding_data}

        [TASK]
        Generate in-depth, authentic, practical step-by-step instructional content for this specialized section.
        Length: 3 detailed, high-value sections in Markdown with '### ' sub-headings, numbered procedural steps, checklists, and safety/sanitation controls where relevant.
        
        [STRICT ZERO-BOILERPLATE & 100% ENGLISH ENFORCEMENT]
        - STRICT ENGLISH ONLY: Every word, procedure, tip, and heading MUST be in 100% standard English.
        - ZERO BOILERPLATE: BANNED PHRASES: NEVER write 'This section provides comprehensive guidelines...', 'In this module, learners will explore...', or similar meta filler. Start DIRECTLY with substantive, actionable instructional content.
        - DOMAIN AUTHENTICITY: If the topic is Culinary (e.g. food prep, cleaning meat, cooking, seasoning), write REAL culinary instructions (brine ratios, knife angles, heat control, odor neutralization, food safety temps). If Engineering, write real technical steps.
        - Include:
          1. Required tools, ingredients/materials, and prep checks.
          2. Step-by-step execution procedures (1., 2., 3.).
          3. Critical quality, safety, and troubleshooting tips.
        - Do not output the main section title as an H1 header at the start; begin immediately with the first '### ' sub-heading.
        """
        loop = asyncio.get_event_loop()
        response = await loop.run_in_executor(
            None,
            lambda: client.chat.completions.create(
                model=OPENAI_MODEL,
                messages=[{"role": "user", "content": prompt}],
                max_tokens=1400,
                temperature=0.7
            )
        )
        return response.choices[0].message.content.strip()
    except Exception as e:
        print(f"Error generating custom section content: {e}")
        return f"### 1. Preparation & Core Procedures\nComprehensive practical workflows for {section_title}.\n\n### 2. Step-by-Step Execution\n1. Prepare tools and materials.\n2. Execute procedures methodically.\n3. Perform quality validation."


async def generate_pptx_structure(course_data: dict, brand_colors: dict = None) -> dict:
    """Generate PPT slide structure with 3 layouts using AI."""
    if not client:
        return {
            "layouts": {
                "classic": _mock_pptx_layout(course_data, "classic"),
                "modern": _mock_pptx_layout(course_data, "modern"),
                "minimal": _mock_pptx_layout(course_data, "minimal")
            }
        }

    lessons_summary = []
    for lesson in course_data.get("lessons", []):
        sections = lesson.get("sections", {})
        creator = sections.get("creator", {})
        student = sections.get("student", {})
        educator = sections.get("educator", {})
        lessons_summary.append({
            "title": lesson.get("title", "Untitled Lesson"),
            "overview": creator.get("overview", ""),
            "learning_outcomes": creator.get("learning_outcomes", []),
            "core_content": creator.get("core_content", "")[:4000],
            "exercises": creator.get("exercises", []),
            "quiz": creator.get("quiz", []),
            "practice": student.get("practice", {}),
            "debugging": student.get("debugging", ""),
            "facilitator_guide": educator.get("facilitator_guide", "")[:2000],
            "lesson_plan": educator.get("lesson_plan", {})
        })

    colors_hint = ""
    if brand_colors:
        colors_hint = f"\nBrand colors: primary={brand_colors.get('primary', '#1a202c')}, accent={brand_colors.get('accent', '#d69e2e')}"

    lessons_summary_str = json.dumps(lessons_summary, ensure_ascii=False)[:12000]
    course_title = course_data.get('title', 'Untitled Course')
    difficulty = course_data.get('config', {}).get('difficulty', 'Beginner')
    audience = course_data.get('config', {}).get('target_audience', 'Student')
    num_lessons = len(lessons_summary)

    prompt = (
        """
    [ROLE]
    You are a Senior Instructional Designer and Presentation Expert creating a professional, comprehensive course slide deck.

    [TASK]
    Create a complete, high-quality slide deck for the course "{course_title}".
    Difficulty: {difficulty}
    Audience: {audience}
    Number of Lessons: {num_lessons}
    {colors_hint}

    Generate 3 different layout versions simultaneously: "layout_1", "layout_2", and "layout_3".
    Each layout must have the SAME slide content but COMPLETELY DIFFERENT visual themes and decorative elements.

    [SLIDE STRUCTURE]
    Generate as many slides as needed for comprehensive coverage. Do NOT limit slides - quality and completeness matter more than brevity.

    1. TITLE SLIDE (first slide):
       - title: Course title only
       - subtitle: "" (empty - no subtitle)
       - notes: Welcome greeting and course introduction script

    2. TABLE OF CONTENTS SLIDE:
       - Numbered list of all lessons
       - notes: Brief overview of what will be covered

    3. FOR EACH LESSON, generate these slides:
       a. LESSON TITLE slide - lesson number and title
       b. OVERVIEW slide - 4 key takeaway bullets from the lesson overview
       c. LEARNING OUTCOMES slide - bullet list of specific, measurable outcomes
       d. CORE CONTENT slides - extract ALL key concepts from core_content markdown:
          - Split into multiple slides if content is rich (max 4 bullets per slide)
          - Each bullet should be a clear, concise explanation (not just a keyword)
          - Include sub-concepts and practical implications
       e. CODE EXAMPLE slide(s) - extract code snippets from core_content or exercises:
          - Include actual working code with comments
          - Add language label
          - Limit to ~12 lines of code
       f. PRACTICE/EXERCISE slide - from student practice data:
          - Exercise title, description, and starter code if available
       g. KEY TAKEAWAYS slide - 3-5 summary bullets for the lesson

    4. END SLIDE:
       - title: "Thank You"
       - subtitle: course title
       - notes: Closing remarks and call to action

    [CONTENT QUALITY REQUIREMENTS]
    - Bullets must be informative sentences, NOT single keywords
    - Each content slide should teach something specific
    - Speaker notes must be detailed speaking scripts (2-4 sentences per slide), not just "This slide covers..."
    - Use the actual lesson data provided - do not make up generic content
    - Extract real concepts, real code, real exercises from the lesson data
    - If core_content has code examples, include them in code slides
    - If exercises exist, create practice slides from them

    [LESSON DATA]
    {lessons_summary_str}

    [FORMAT]
    Return a pure JSON object with exactly this structure:
    {
      "layouts": {
        "layout_1": {
          "theme": {"primary": "#1a202c", "secondary": "#ffffff", "accent": "#d69e2e", "text": "#ffffff"},
          "slides": [
            {"type": "title", "title": "Course Title", "subtitle": "", "notes": "..."},
            {"type": "toc", "title": "Table of Contents", "items": ["1. Lesson Title", "2. Lesson Title"], "notes": "..."},
            {"type": "lesson_title", "title": "Lesson 1: ...", "subtitle": "", "notes": "..."},
            {"type": "content", "title": "...", "bullets": ["Clear explanation of concept...", "..."], "notes": "..."},
            {"type": "code", "title": "...", "code": "# Actual code here", "language": "python", "notes": "..."},
            {"type": "end", "title": "Thank You", "subtitle": "...", "notes": "..."}
          ]
        },
        "layout_2": {
          "theme": {"primary": "#1a202c", "secondary": "#ffffff", "accent": "#3182ce", "text": "#ffffff"},
          "slides": [...same structure, same content, different visual theme...]
        },
        "layout_3": {
          "theme": {"primary": "#ffffff", "secondary": "#1a202c", "accent": "#319795", "text": "#1a202c"},
          "slides": [...same structure, same content, different visual theme...]
        }
      }
    }

    [CONSTRAINTS]
    - IMPORTANT: Write all slide content and speaker notes in English.
    - Every slide MUST have a "notes" field with detailed speaker notes (2-4 sentences).
    - All 3 layouts must have the SAME number of slides and SAME content.
    - Slide types: "title", "toc", "lesson_title", "content", "code", "end"
    - Max 6 bullets per content slide. Split into multiple slides if needed.
    - Title slide subtitle MUST be empty string "".
    - Return pure JSON only, no preamble.
    - Do NOT truncate or abbreviate - provide complete, comprehensive content.
    """
        .replace("{course_title}", str(course_title))
        .replace("{difficulty}", str(difficulty))
        .replace("{audience}", str(audience))
        .replace("{num_lessons}", str(num_lessons))
        .replace("{colors_hint}", str(colors_hint))
        .replace("{lessons_summary_str}", lessons_summary_str)
    )

    try:
        loop = asyncio.get_running_loop()
        response = await loop.run_in_executor(
            None,
            lambda: client.chat.completions.create(
                model=OPENAI_MODEL,
                messages=[{"role": "user", "content": prompt}],
                response_format={"type": "json_object"},
                max_tokens=16000,
                temperature=0.7
            )
        )
        data = safe_load_json(response.choices[0].message.content)
        if "layouts" not in data:
            data = {"layouts": data}
        for layout_name in ["layout_1", "layout_2", "layout_3"]:
            if layout_name not in data["layouts"]:
                data["layouts"][layout_name] = _mock_pptx_layout(course_data, layout_name)
        return data
    except Exception as e:
        print(f"Error generating PPTX structure: {e}")
        return {
            "layouts": {
                "layout_1": _mock_pptx_layout(course_data, "layout_1"),
                "layout_2": _mock_pptx_layout(course_data, "layout_2"),
                "layout_3": _mock_pptx_layout(course_data, "layout_3")
            }
        }


def _mock_pptx_layout(course_data: dict, layout_name: str) -> dict:
    themes = {
        "layout_1": {"primary": "#1a202c", "secondary": "#ffffff", "accent": "#d69e2e", "text": "#ffffff"},
        "layout_2": {"primary": "#1a202c", "secondary": "#ffffff", "accent": "#3182ce", "text": "#ffffff"},
        "layout_3": {"primary": "#ffffff", "secondary": "#1a202c", "accent": "#319795", "text": "#1a202c"}
    }
    theme = themes.get(layout_name, themes["layout_1"])
    title = course_data.get("title", "Untitled Course")
    difficulty = course_data.get("config", {}).get("difficulty", "Beginner")
    audience = course_data.get("config", {}).get("target_audience", "Student")
    lessons = course_data.get("lessons", [])

    slides = [
        {"type": "title", "title": title, "subtitle": "", "notes": f"Welcome to {title}. This course is designed for {audience} at {difficulty} level. Let's begin our learning journey."},
        {"type": "toc", "title": "Table of Contents", "items": [f"{i+1}. {l.get('title', 'Untitled')}" for i, l in enumerate(lessons)], "notes": f"Here is what we will cover today. We have {len(lessons)} lessons to explore."}
    ]
    for i, lesson in enumerate(lessons):
        sections = lesson.get("sections", {})
        creator = sections.get("creator", {})
        student = sections.get("student", {})
        educator = sections.get("educator", {})

        slides.append({"type": "lesson_title", "title": f"Lesson {i+1}: {lesson.get('title', 'Untitled')}", "subtitle": "", "notes": f"Let's begin Lesson {i+1}. This lesson covers key concepts and practical applications."})

        overview = creator.get("overview", "No overview available.")
        if overview:
            overview_bullets = [s.strip() for s in overview.replace("**", "").split(".") if s.strip()][:4]
            if not overview_bullets:
                overview_bullets = [overview[:200]]
            slides.append({"type": "content", "title": "Overview", "bullets": overview_bullets, "notes": f"This lesson overview covers: {overview[:300]}"})

        outcomes = creator.get("learning_outcomes", [])
        if isinstance(outcomes, list) and outcomes:
            slides.append({"type": "content", "title": "Learning Outcomes", "bullets": outcomes[:4], "notes": "By the end of this lesson, you will be able to demonstrate understanding of these key concepts and apply them in practice."})

        core_content = creator.get("core_content", "")
        if core_content:
            lines = [l.strip() for l in core_content.replace("**", "").replace("###", "").split("\n") if l.strip() and not l.strip().startswith("#")]
            bullets = [l for l in lines if not l.startswith("```")][:4]
            if bullets:
                slides.append({"type": "content", "title": "Core Concepts", "bullets": bullets, "notes": f"Let's dive into the core concepts. {bullets[0] if bullets else ''}"})

        practice = student.get("practice", {})
        if isinstance(practice, dict):
            code_block = practice.get("code_block", "")
            if code_block:
                slides.append({"type": "code", "title": "Practice Exercise", "code": code_block[:1000], "language": "python", "notes": "Let's try this hands-on exercise. Follow along and run the code to see how it works."})
            checklist = practice.get("checklist", [])
            if checklist and isinstance(checklist, list):
                slides.append({"type": "content", "title": "Exercise Checklist", "bullets": [f"✓ {item}" for item in checklist[:4]], "notes": "Complete these steps to practice what you've learned."})

        facilitator = educator.get("facilitator_guide", "")
        if facilitator:
            tips = [t.strip() for t in facilitator.replace("**", "").split(".") if t.strip() and len(t.strip()) > 10][:5]
            if tips:
                slides.append({"type": "content", "title": "Key Takeaways", "bullets": tips, "notes": "Here are the key points to remember from this lesson."})

    slides.append({"type": "end", "title": "Thank You", "subtitle": title, "notes": f"Thank you for completing {title}. Continue practicing and exploring the concepts covered."})

    return {"theme": theme, "slides": slides}