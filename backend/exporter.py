import json
import io
import zipfile
import re
import html as html_lib

try:
    import docx
    from docx.shared import Inches, Pt, RGBColor
except ImportError:
    docx = None

try:
    import pdfkit
except ImportError:
    pdfkit = None

try:
    from reportlab.lib.pagesizes import letter
    from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer
    from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
    from reportlab.lib import colors
except ImportError:
    SimpleDocTemplate = None

def get_role_label(role: str) -> str:
    mapping = {
        "creator": "Creator POV",
        "student": "Student POV",
        "educator": "Educator POV",
        "all": "All Roles Combined"
    }
    return mapping.get(role.lower(), role.capitalize())

def clean_lesson_title(title: str) -> str:
    if not title:
        return "Untitled Lesson"
    cleaned = re.sub(r'^\s*Lesson\s*\d+\s*[:\-\.]*\s*', '', title, flags=re.IGNORECASE).strip()
    return cleaned if cleaned else title

def format_section_content_to_md(content, indent: int = 0) -> list[str]:
    lines = []
    pad = "  " * indent

    if isinstance(content, str):
        lines.append(f"{pad}{content}")
    elif isinstance(content, list):
        for item in content:
            if isinstance(item, dict):
                if "question" in item:  # Quiz item
                    q = item.get("question", "")
                    lines.append(f"{pad}- **Question:** {q}")
                    if "options" in item and isinstance(item["options"], list):
                        for opt in item["options"]:
                            correct_marker = " ✅" if opt == item.get("answer") else ""
                            lines.append(f"{pad}  - {opt}{correct_marker}")
                    if item.get("explanation"):
                        lines.append(f"{pad}  - *Explanation:* {item['explanation']}")
                elif "criteria" in item:  # Rubric item
                    c = item.get("criteria", "")
                    lines.append(f"{pad}- **Criteria:** {c}")
                    for k in ["excellent", "good", "needs_improvement"]:
                        if item.get(k):
                            lines.append(f"{pad}  - *{k.replace('_', ' ').capitalize()}:* {item[k]}")
                elif "title" in item or "name" in item:  # Exercise or activity item
                    t = item.get("title") or item.get("name")
                    lines.append(f"{pad}- **{t}**")
                    for k, v in item.items():
                        if k in ["title", "name"]:
                            continue
                        if isinstance(v, (str, int, float)):
                            lines.append(f"{pad}  - *{k.replace('_', ' ').capitalize()}:* {v}")
                        elif isinstance(v, list):
                            lines.append(f"{pad}  - *{k.replace('_', ' ').capitalize()}:* {', '.join(map(str, v))}")
                else:
                    parts = []
                    for k, v in item.items():
                        if isinstance(v, (str, int, float)):
                            parts.append(f"*{k.replace('_', ' ').capitalize()}:* {v}")
                    if parts:
                        lines.append(f"{pad}- " + " | ".join(parts))
                    else:
                        lines.append(f"{pad}- {json.dumps(item)}")
            else:
                lines.append(f"{pad}- {item}")
    elif isinstance(content, dict):
        for k, v in content.items():
            k_label = k.replace('_', ' ').capitalize()
            if isinstance(v, (str, int, float)):
                lines.append(f"{pad}**{k_label}:** {v}")
            elif isinstance(v, (list, dict)):
                lines.append(f"{pad}**{k_label}:**")
                lines.extend(format_section_content_to_md(v, indent + 1))
            else:
                lines.append(f"{pad}**{k_label}:** {v}")
    else:
        lines.append(f"{pad}{content}")
    return lines

def get_resolved_lesson_sections(lesson: dict, role: str) -> dict:
    sections = lesson.get("sections", {}).get(role, {})
    if sections and len(sections) > 0:
        return sections
        
    title = clean_lesson_title(lesson.get("title", "Lesson Content"))
    if role == "creator":
        return {
            "overview": f"This lesson provides a comprehensive overview and practical foundation for {title}. Students will explore core concepts, industry use-cases, and implementation patterns necessary for real-world projects.",
            "learning_outcomes": [
                f"Master core concepts and architectural components of {title}.",
                f"Implement hands-on code examples and workflows using industry standards.",
                "Apply critical thinking to analyze, debug, and optimize real-world production scenarios."
            ],
            "core_content": f"### 1. Conceptual Foundations\n{title} serves as a key pillar in modern systems engineering. By leveraging structured workflows and robust error handling, developers can ensure high performance and maintainability.\n\n### 2. Practical Implementation\nTo implement {title} effectively, engineers must follow clean architecture patterns and best practices.",
            "exercises": [
                {"title": f"Building {title} Pipeline", "description": f"Implement a basic working prototype for {title} using Python/JavaScript.", "code_template": f"// Exercise: {title}\nfunction executeTask() {{\n  console.log('Executing {title}...');\n}}"}
            ],
            "quizzes": [
                {"question": f"What is the primary objective of {title}?", "options": ["To establish a robust, scalable technical workflow", "To bypass data validation", "To reduce readability"], "answer": "To establish a robust, scalable technical workflow", "explanation": "It ensures reliable engineering standards."}
            ]
        }
    elif role == "student":
        return {
            "why_this_matters": f"Understanding {title} is crucial for career advancement. It bridges theoretical principles with industry-grade implementation strategies.",
            "practice": {
                "code_block": f"// Interactive Sandbox for {title}\nfunction main() {{\n  console.log('Running {title} sandbox...');\n}}\nmain();",
                "interactive_exercise": f"Extend the function logic for {title}.",
                "checklist": ["Set up local environment", "Implement core logic", "Pass automated tests"]
            },
            "debugging": "### Common Pitfalls & Solutions\n1. **Unhandled Edge Cases:** Validate inputs prior to execution.\n2. **Performance Bottlenecks:** Optimize data structure lookups.",
            "ethics": "### Code Principles & Ethics\nEnsure user data protection, transparency, and security compliance throughout implementation."
        }
    else: # educator
        return {
            "facilitator_guide": f"### Educator Instructions\nFacilitate an interactive discussion on {title}. Encourage students to participate in pair-programming exercises.",
            "lesson_plan": {
                "ice_breaker": f"Ask students: 'What real-world applications of {title} have you encountered?'",
                "timing": "Lecture & Demo: 20 mins | Pair Lab: 30 mins | Wrap-up & Q&A: 10 mins"
            },
            "rubric": [
                {"criteria": "Implementation", "excellent": "Code runs error-free with optimal logic", "good": "Code runs with minor style issues", "needs_improvement": "Code contains execution errors"},
                {"criteria": "Understanding", "excellent": "Demonstrates deep mastery of concepts", "good": "Demonstrates basic understanding", "needs_improvement": "Lacks core understanding"}
            ],
            "discussion_questions": [
                f"How does {title} improve overall system efficiency?",
                "What key trade-offs should be considered when deploying to production?"
            ]
        }

def export_to_markdown(course_data: dict, role: str) -> str:
    md = []
    md.append(f"# 🎓 {course_data.get('title', 'Untitled Course')}")
    md.append(f"**Difficulty:** {course_data.get('config', {}).get('difficulty', 'Beginner')} | **Audience:** {course_data.get('config', {}).get('target_audience', 'Student')}\n")
    md.append("---\n")

    roles_to_export = ["creator", "student", "educator"] if role == "all" else [role]
    lessons = course_data.get("lessons", [])
    if not lessons and course_data.get("structure"):
        lessons = course_data.get("structure")

    if not lessons:
        lessons = [{"title": course_data.get("title", "Course Module")}]

    for r in roles_to_export:
        md.append(f"## 📘 {get_role_label(r)}")
        for idx, lesson in enumerate(lessons):
            l_num = lesson.get('order') or (idx + 1)
            clean_t = clean_lesson_title(lesson.get('title', 'Untitled Lesson'))
            md.append(f"### Lesson {l_num}: {clean_t}")
            sections = get_resolved_lesson_sections(lesson, r)
            
            for sec_type, content in sections.items():
                title = sec_type.replace("_", " ").capitalize()
                md.append(f"#### {title}")
                formatted_lines = format_section_content_to_md(content)
                md.extend(formatted_lines)
                md.append("")
        md.append("---\n")
    return "\n".join(md)

def _inline_markdown_to_html(text: str) -> str:
    """Converts inline markdown (bold, italics, inline code) to HTML."""
    # Inline code first, so markers inside `code` aren't picked up as bold/italic
    text = re.sub(r'`([^`]+?)`', r"<code style='background:#F1F5F9;color:#BE185D;padding:1px 5px;border-radius:4px;font-family:Consolas,monospace;font-size:0.9em;'>\1</code>", text)
    # Bold (**text** or __text__)
    text = re.sub(r'\*\*(.+?)\*\*', r"<strong>\1</strong>", text)
    text = re.sub(r'__(.+?)__', r"<strong>\1</strong>", text)
    # Italics (*text* or _text_) - avoid matching leftover single asterisks used as bullets
    text = re.sub(r'(?<!\*)\*(?!\*)(.+?)(?<!\*)\*(?!\*)', r"<em>\1</em>", text)
    return text

def export_to_html(course_data: dict, role: str) -> str:
    md_content = export_to_markdown(course_data, role)

    # Sanitize emojis that wkhtmltopdf cannot render in default Windows fonts
    md_content = re.sub(r'[\U00010000-\U0010ffff]', '', md_content)
    md_content = re.sub(r'[\u2600-\u27BF]', '', md_content)

    html_lines = []
    in_code_block = False
    code_buffer = []
    list_mode = None  # None | "ul" | "ul-nested"

    def close_list():
        nonlocal list_mode
        if list_mode == "ul":
            html_lines.append("</ul>")
        elif list_mode == "ul-nested":
            html_lines.append("</ul></li></ul>")
        list_mode = None

    lines = md_content.split("\n")
    for raw_line in lines:
        line_clean = raw_line.strip()

        # --- Fenced code blocks (```lang ... ```) ---
        if line_clean.startswith("```"):
            if not in_code_block:
                close_list()
                in_code_block = True
                code_buffer = []
            else:
                in_code_block = False
                code_text = html_lib.escape("\n".join(code_buffer))
                html_lines.append(
                    f"<pre style='background:#1E293B;color:#E2E8F0;padding:14px 16px;border-radius:8px;"
                    f"overflow-x:auto;font-family:Consolas,Menlo,monospace;font-size:11.5px;line-height:1.5;"
                    f"margin:10px 0;white-space:pre-wrap;word-wrap:break-word;'><code>{code_text}</code></pre>"
                )
            continue
        if in_code_block:
            code_buffer.append(raw_line)
            continue

        # Escape HTML special chars in normal (non-code) content, then apply inline markdown
        escaped = html_lib.escape(line_clean)

        if line_clean.startswith("# "):
            close_list()
            html_lines.append(f"<h1 style='color:#1A2040;font-family:sans-serif;font-size:24px;border-bottom:2.5px solid #E9B259;padding-bottom:8px;'>{_inline_markdown_to_html(html_lib.escape(line_clean[2:]))}</h1>")
        elif line_clean.startswith("## "):
            close_list()
            html_lines.append(f"<div class='page-break' style='page-break-before:always;'><h2 style='color:#2D3561;font-family:sans-serif;margin-top:28px;font-size:18px;border-left:4px solid #E9B259;padding-left:10px;'>{_inline_markdown_to_html(html_lib.escape(line_clean[3:]))}</h2></div>")
        elif line_clean.startswith("### "):
            close_list()
            html_lines.append(f"<h3 style='color:#C8913A;font-family:sans-serif;margin-top:20px;font-size:15px;'>{_inline_markdown_to_html(html_lib.escape(line_clean[4:]))}</h3>")
        elif line_clean.startswith("#### "):
            close_list()
            html_lines.append(f"<h4 style='color:#334155;font-family:sans-serif;margin-top:14px;font-size:13px;'>{_inline_markdown_to_html(html_lib.escape(line_clean[5:]))}</h4>")
        elif raw_line.startswith("  - ") or raw_line.startswith("    - "):
            item = _inline_markdown_to_html(html_lib.escape(line_clean[2:]))
            if list_mode != "ul-nested":
                close_list()
                html_lines.append("<ul style='margin:4px 0 8px 0;padding-left:20px;'><li style='list-style:none;'><ul style='margin:2px 0;padding-left:18px;'>")
                list_mode = "ul-nested"
            html_lines.append(f"<li style='font-family:sans-serif;line-height:1.5;color:#475569;margin-bottom:3px;'>{item}</li>")
        elif line_clean.startswith("- "):
            item = _inline_markdown_to_html(html_lib.escape(line_clean[2:]))
            if list_mode != "ul":
                close_list()
                html_lines.append("<ul style='margin:4px 0 8px 0;padding-left:20px;'>")
                list_mode = "ul"
            html_lines.append(f"<li style='font-family:sans-serif;line-height:1.6;color:#334155;margin-bottom:4px;'>{item}</li>")
        elif re.match(r'^\d+\.\s', line_clean):
            close_list()
            html_lines.append(f"<p style='font-family:sans-serif;line-height:1.65;color:#334155;margin-bottom:8px;font-weight:600;'>{_inline_markdown_to_html(escaped)}</p>")
        elif line_clean == "---":
            close_list()
            html_lines.append("<hr style='border: none; border-top: 1px solid #E2E8F0; margin: 24px 0;'>")
        elif line_clean == "":
            close_list()
            html_lines.append("<div style='height:8px;'></div>")
        else:
            close_list()
            html_lines.append(f"<p style='font-family:sans-serif;line-height:1.65;color:#334155;margin-bottom:10px;'>{_inline_markdown_to_html(escaped)}</p>")

    close_list()
    body = "\n".join(html_lines)
    title = course_data.get('title', 'Exported Course')
    return f"""<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>{title}</title>
    <style>
        @page {{
            size: A4;
            margin: 20mm;
        }}
        body {{
            padding: 30px;
            max-width: 850px;
            margin: auto;
            color: #1A2040;
            background-color: #FFFFFF;
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
        }}
        h1, h2, h3, h4 {{
            page-break-after: avoid;
        }}
        li {{
            page-break-inside: avoid;
        }}
        @media print {{
            body {{ padding: 0; }}
            .page-break {{ page-break-before: always; }}
        }}
    </style>
</head>
<body>
    <div style="text-align: right; font-size: 11px; color: #64748B; border-bottom: 1px solid #CBD5E1; padding-bottom: 6px; margin-bottom: 20px;">
        Curricula AI &middot; Maxy Academy &middot; {role.upper()} POV
    </div>
    {body}
</body>
</html>"""

def export_to_docx(course_data: dict, role: str) -> io.BytesIO:
    output = io.BytesIO()
    if not docx:
        txt = export_to_markdown(course_data, role)
        output.write(txt.encode('utf-8'))
        output.seek(0)
        return output

    doc = docx.Document()
    style = doc.styles['Normal']
    font = style.font
    font.name = 'Arial'
    font.size = Pt(11)
    
    doc.add_heading(course_data.get('title', 'Untitled Course'), level=0)
    doc.add_paragraph(f"Difficulty: {course_data.get('config', {}).get('difficulty', 'Beginner')} | Audience: {course_data.get('config', {}).get('target_audience', 'Student')}")
    
    roles_to_export = ["creator", "student", "educator"] if role == "all" else [role]
    lessons = course_data.get("lessons", []) or course_data.get("structure", []) or [{"title": course_data.get("title", "Course Module")}]

    for r in roles_to_export:
        doc.add_heading(get_role_label(r), level=1)
        for idx, lesson in enumerate(lessons):
            l_num = lesson.get('order') or (idx + 1)
            clean_t = clean_lesson_title(lesson.get('title', 'Untitled Lesson'))
            doc.add_heading(f"Lesson {l_num}: {clean_t}", level=2)
            sections = get_resolved_lesson_sections(lesson, r)
            
            for sec_type, content in sections.items():
                doc.add_heading(sec_type.replace("_", " ").capitalize(), level=3)
                formatted_lines = format_section_content_to_md(content)
                for line in formatted_lines:
                    line_clean = line.strip()
                    if line_clean.startswith('- '):
                        doc.add_paragraph(line_clean[2:], style='List Bullet')
                    else:
                        doc.add_paragraph(line_clean)
                        
    doc.save(output)
    output.seek(0)
    return output

def md_to_reportlab_html(text: str) -> str:
    if not text:
        return ""
    s = html_lib.escape(text)
    s = re.sub(r'\*\*(.+?)\*\*', r'<b>\1</b>', s)
    s = re.sub(r'__(.+?)__', r'<b>\1</b>', s)
    s = re.sub(r'(?<!\*)\*(?!\*)(.+?)(?<!\*)\*(?!\*)', r'<i>\1</i>', s)
    s = re.sub(r'(?<!_)_(?!_)(.+?)(?<!_)_(?!_)', r'<i>\1</i>', s)
    s = re.sub(r'`([^`]+?)`', r'<font name="Courier" color="#BE185D">\1</font>', s)
    return s

def export_to_pdf(course_data: dict, role: str) -> io.BytesIO:
    html_content = export_to_html(course_data, role)
    
    # 0. Find wkhtmltopdf binary path
    import os
    import subprocess
    import tempfile

    wkhtmltopdf_bin = "wkhtmltopdf"
    possible_paths = [
        r"C:\Program Files\wkhtmltopdf\bin\wkhtmltopdf.exe",
        r"C:\Program Files\wkhtmltopdf\wkhtmltopdf.exe",
        r"C:\Program Files (x86)\wkhtmltopdf\bin\wkhtmltopdf.exe",
        r"C:\Program Files (x86)\wkhtmltopdf\wkhtmltopdf.exe",
    ]
    for p in possible_paths:
        if os.path.exists(p):
            wkhtmltopdf_bin = p
            break

    # 1. Try pdfkit if available
    if pdfkit:
        try:
            config = None
            if wkhtmltopdf_bin != "wkhtmltopdf" and os.path.exists(wkhtmltopdf_bin):
                config = pdfkit.configuration(wkhtmltopdf=wkhtmltopdf_bin)
            pdf_bytes = pdfkit.from_string(html_content, False, configuration=config)
            out1 = io.BytesIO()
            out1.write(pdf_bytes)
            out1.seek(0)
            return out1
        except Exception:
            pass

    # 2. Try direct wkhtmltopdf subprocess execution
    try:
        with tempfile.NamedTemporaryFile(suffix='.html', delete=False, mode='w', encoding='utf-8') as html_file:
            html_file.write(html_content)
            html_path = html_file.name
        
        pdf_path = html_path + '.pdf'
        res = subprocess.run([wkhtmltopdf_bin, html_path, pdf_path], stdout=subprocess.PIPE, stderr=subprocess.PIPE)
        if res.returncode == 0 and os.path.exists(pdf_path):
            with open(pdf_path, 'rb') as f:
                pdf_bytes = f.read()
            out2 = io.BytesIO()
            out2.write(pdf_bytes)
            out2.seek(0)
            try:
                os.remove(html_path)
                os.remove(pdf_path)
            except Exception:
                pass
            return out2
    except Exception:
        pass

    # 3. ReportLab Multi-page Document Builder
    if SimpleDocTemplate:
        out3 = io.BytesIO()
        doc = SimpleDocTemplate(
            out3, 
            pagesize=letter,
            leftMargin=36,
            rightMargin=36,
            topMargin=40,
            bottomMargin=40
        )
        styles = getSampleStyleSheet()
        story = []
        
        title_style = ParagraphStyle(
            'DocTitle',
            parent=styles['Title'],
            fontName='Helvetica-Bold',
            fontSize=18,
            leading=22,
            textColor=colors.HexColor('#1A2040'),
            spaceAfter=10
        )
        h1_style = ParagraphStyle(
            'Heading1Custom',
            parent=styles['Heading1'],
            fontName='Helvetica-Bold',
            fontSize=15,
            leading=18,
            textColor=colors.HexColor('#2D3561'),
            spaceBefore=14,
            spaceAfter=8,
            keepWithNext=True
        )
        h2_style = ParagraphStyle(
            'Heading2Custom',
            parent=styles['Heading2'],
            fontName='Helvetica-Bold',
            fontSize=12,
            leading=15,
            textColor=colors.HexColor('#1A2040'),
            spaceBefore=10,
            spaceAfter=6,
            keepWithNext=True
        )
        h3_style = ParagraphStyle(
            'Heading3Custom',
            parent=styles['Heading3'],
            fontName='Helvetica-Bold',
            fontSize=10.5,
            leading=13,
            textColor=colors.HexColor('#334155'),
            spaceBefore=8,
            spaceAfter=4,
            keepWithNext=True
        )
        body_style = ParagraphStyle(
            'BodyCustom',
            parent=styles['Normal'],
            fontName='Helvetica',
            fontSize=9.5,
            leading=13.5,
            textColor=colors.HexColor('#334155'),
            spaceAfter=5
        )
        bullet_style_1 = ParagraphStyle(
            'Bullet1',
            parent=body_style,
            leftIndent=15,
            firstLineIndent=-10,
            spaceAfter=3
        )
        bullet_style_2 = ParagraphStyle(
            'Bullet2',
            parent=body_style,
            leftIndent=30,
            firstLineIndent=-10,
            spaceAfter=2
        )
        code_style = ParagraphStyle(
            'CodeBlockStyle',
            parent=body_style,
            fontName='Courier',
            fontSize=8.5,
            leading=11,
            textColor=colors.HexColor('#E2E8F0'),
            backColor=colors.HexColor('#1E293B'),
            borderPadding=8,
            spaceBefore=6,
            spaceAfter=6
        )

        txt = export_to_markdown(course_data, role)
        
        # Clean emojis for ReportLab standard Helvetica font
        txt = re.sub(r'[\U00010000-\U0010ffff]', '', txt)
        txt = re.sub(r'[\u2600-\u27BF]', '', txt)

        in_code = False
        code_lines = []

        for raw_line in txt.split('\n'):
            line_str = raw_line.rstrip()
            line_clean = line_str.strip()

            if line_clean.startswith('```'):
                if not in_code:
                    in_code = True
                    code_lines = []
                else:
                    in_code = False
                    code_text = html_lib.escape("\n".join(code_lines))
                    story.append(Paragraph(code_text.replace("\n", "<br/>").replace(" ", "&nbsp;"), code_style))
                continue

            if in_code:
                code_lines.append(raw_line)
                continue

            if not line_clean:
                story.append(Spacer(1, 4))
                continue

            if line_clean.startswith('# '):
                story.append(Paragraph(md_to_reportlab_html(line_clean[2:]), title_style))
            elif line_clean.startswith('## '):
                story.append(Paragraph(md_to_reportlab_html(line_clean[3:]), h1_style))
            elif line_clean.startswith('### '):
                story.append(Paragraph(md_to_reportlab_html(line_clean[4:]), h2_style))
            elif line_clean.startswith('#### '):
                story.append(Paragraph(md_to_reportlab_html(line_clean[5:]), h3_style))
            elif line_clean == '---':
                try:
                    from reportlab.platypus import HRFlowable
                    story.append(HRFlowable(width="100%", thickness=1, color=colors.HexColor('#CBD5E1'), spaceBefore=8, spaceAfter=8))
                except Exception:
                    story.append(Spacer(1, 8))
            elif line_str.startswith('    - ') or line_str.startswith('\t- '):
                item_text = line_clean[2:].strip()
                story.append(Paragraph(f"&bull;&nbsp;{md_to_reportlab_html(item_text)}", bullet_style_2))
            elif line_str.startswith('  - '):
                item_text = line_clean[2:].strip()
                story.append(Paragraph(f"&bull;&nbsp;{md_to_reportlab_html(item_text)}", bullet_style_1))
            elif line_clean.startswith('- ') or line_clean.startswith('* '):
                item_text = line_clean[2:].strip()
                story.append(Paragraph(f"&bull;&nbsp;{md_to_reportlab_html(item_text)}", bullet_style_1))
            else:
                story.append(Paragraph(md_to_reportlab_html(line_clean), body_style))

        try:
            doc.build(story)
            out3.seek(0)
            return out3
        except Exception as e:
            print(f"ReportLab error: {e}")

    # Fallback minimal Canvas document
    try:
        from reportlab.pdfgen import canvas
        out4 = io.BytesIO()
        c = canvas.Canvas(out4, pagesize=letter)
        c.setFont("Helvetica-Bold", 16)
        c.drawString(50, 750, course_data.get('title', 'Exported Course'))
        c.setFont("Helvetica", 10)
        c.drawString(50, 730, f"Role: {role.upper()} POV | Document Ready")
        c.save()
        out4.seek(0)
        return out4
    except Exception:
        pass

    out5 = io.BytesIO()
    pdf_skeleton = b"%PDF-1.4\n1 0 obj<</Type/Catalog/Pages 2 0 R>>endobj\n2 0 obj<</Type/Pages/Count 1/Kids[3 0 R]>>endobj\n3 0 obj<</Type/Page/MediaBox[0 0 612 792]/Parent 2 0 R>>endobj\nxref\n0 4\n0000000000 65535 f \n0000000009 00000 n \n0000000052 00000 n \n0000000101 00000 n \ntrailer<</Size 4/Root 1 0 R>>\nstartxref\n178\n%%EOF"
    out5.write(pdf_skeleton)
    out5.seek(0)
    return out5




def export_all_zip(course_data: dict) -> io.BytesIO:
    output = io.BytesIO()
    with zipfile.ZipFile(output, 'w') as zip_file:
        for role in ["creator", "student", "educator"]:
            # PDF Document
            try:
                pdf_stream = export_to_pdf(course_data, role)
                zip_file.writestr(f"{role}_pov.pdf", pdf_stream.getvalue())
            except Exception as e:
                print(f"Error generating ZIP PDF for {role}: {e}")

            # DOCX Document
            try:
                docx_stream = export_to_docx(course_data, role)
                zip_file.writestr(f"{role}_pov.docx", docx_stream.getvalue())
            except Exception as e:
                print(f"Error generating ZIP DOCX for {role}: {e}")

            # HTML Web Page Document
            try:
                html_content = export_to_html(course_data, role)
                zip_file.writestr(f"{role}_pov.html", html_content)
            except Exception as e:
                print(f"Error generating ZIP HTML for {role}: {e}")
            
    output.seek(0)
    return output
