import json
import io
import zipfile

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

def get_resolved_lesson_sections(lesson: dict, role: str) -> dict:
    sections = lesson.get("sections", {}).get(role, {})
    if sections and len(sections) > 0:
        return sections
        
    title = lesson.get("title", "Lesson Content")
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
    md.append("--- \n")

    roles_to_export = ["creator", "student", "educator"] if role == "all" else [role]
    lessons = course_data.get("lessons", [])
    if not lessons and course_data.get("structure"):
        lessons = course_data.get("structure")

    if not lessons:
        lessons = [{"title": course_data.get("title", "Course Module")}]

    for r in roles_to_export:
        md.append(f"## 📘 {get_role_label(r)}")
        for idx, lesson in enumerate(lessons):
            md.append(f"### Lesson {idx + 1}: {lesson.get('title', 'Untitled Lesson')}")
            sections = get_resolved_lesson_sections(lesson, r)
            
            for sec_type, content in sections.items():
                title = sec_type.replace("_", " ").capitalize()
                md.append(f"#### {title}")
                if isinstance(content, str):
                    md.append(content)
                elif isinstance(content, list):
                    for item in content:
                        if isinstance(item, dict):
                            # For quizzes or rubric rows
                            q_text = item.get("question", item.get("criteria", item.get("title", "")))
                            md.append(f"- **{q_text}**")
                            if "description" in item:
                                md.append(f"  {item['description']}")
                            if "options" in item:
                                for opt in item["options"]:
                                    correct_marker = " ✅" if opt == item.get("answer") else ""
                                    md.append(f"  - {opt}{correct_marker}")
                                if item.get("explanation"):
                                    md.append(f"    *Explanation:* {item['explanation']}")
                        else:
                            md.append(f"- {item}")
                elif isinstance(content, dict):
                    for k, v in content.items():
                        md.append(f"**{k.replace('_', ' ').capitalize()}:** {v}\n")
                md.append("")
        md.append("--- \n")
    return "\n".join(md)

def export_to_html(course_data: dict, role: str) -> str:
    md_content = export_to_markdown(course_data, role)
    
    # Sanitize emojis that wkhtmltopdf cannot render in default Windows fonts
    import re
    md_content = re.sub(r'[\U00010000-\U0010ffff]', '', md_content)
    md_content = re.sub(r'[\u2600-\u27BF]', '', md_content)

    html_lines = []
    for line in md_content.split("\n"):
        line_clean = line.strip()
        if line_clean.startswith("# "):
            html_lines.append(f"<h1 style='color:#1A2040;font-family:sans-serif;font-size:24px;border-bottom:2px solid #6366F1;padding-bottom:8px;'>{line_clean[2:]}</h1>")
        elif line_clean.startswith("## "):
            html_lines.append(f"<div className='page-break' style='page-break-before:always;'><h2 style='color:#6366F1;font-family:sans-serif;margin-top:28px;font-size:18px;'>{line_clean[3:]}</h2></div>")
        elif line_clean.startswith("### "):
            html_lines.append(f"<h3 style='color:#1A2040;font-family:sans-serif;margin-top:20px;font-size:15px;'>{line_clean[4:]}</h3>")
        elif line_clean.startswith("#### "):
            html_lines.append(f"<h4 style='color:#334155;font-family:sans-serif;margin-top:14px;font-size:13px;'>{line_clean[5:]}</h4>")
        elif line_clean.startswith("- "):
            html_lines.append(f"<li style='font-family:sans-serif;line-height:1.6;color:#334155;margin-bottom:4px;'>{line_clean[2:]}</li>")
        elif line_clean.startswith("  - "):
            html_lines.append(f"<li style='margin-left:24px;font-family:sans-serif;line-height:1.5;color:#475569;'>{line_clean[4:]}</li>")
        elif line_clean == "---":
            html_lines.append("<hr style='border: none; border-top: 1px solid #E2E8F0; margin: 24px 0;'>")
        elif line_clean == "":
            html_lines.append("<br/>")
        else:
            html_lines.append(f"<p style='font-family:sans-serif;line-height:1.65;color:#334155;margin-bottom:10px;'>{line}</p>")
            
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
            doc.add_heading(f"Lesson {idx + 1}: {lesson.get('title', 'Untitled Lesson')}", level=2)
            sections = get_resolved_lesson_sections(lesson, r)
            
            for sec_type, content in sections.items():
                doc.add_heading(sec_type.replace("_", " ").capitalize(), level=3)
                if isinstance(content, str):
                    doc.add_paragraph(content)
                elif isinstance(content, list):
                    for item in content:
                        if isinstance(item, dict):
                            q_text = item.get("question", item.get("criteria", item.get("title", "")))
                            doc.add_paragraph(f"• {q_text}", style='List Bullet')
                        else:
                            doc.add_paragraph(f"• {item}", style='List Bullet')
                elif isinstance(content, dict):
                    for k, v in content.items():
                        doc.add_paragraph(f"{k.capitalize()}: {v}")
                        
    doc.save(output)
    output.seek(0)
    return output

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
        import html as html_lib
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
            fontSize=20,
            leading=24,
            textColor=colors.HexColor('#1A2040'),
            spaceAfter=10
        )
        h1_style = ParagraphStyle(
            'Heading1Custom',
            parent=styles['Heading1'],
            fontName='Helvetica-Bold',
            fontSize=15,
            leading=18,
            textColor=colors.HexColor('#6366F1'),
            spaceBefore=14,
            spaceAfter=8
        )
        h2_style = ParagraphStyle(
            'Heading2Custom',
            parent=styles['Heading2'],
            fontName='Helvetica-Bold',
            fontSize=12,
            leading=15,
            textColor=colors.HexColor('#1A2040'),
            spaceBefore=10,
            spaceAfter=6
        )
        body_style = ParagraphStyle(
            'BodyCustom',
            parent=styles['Normal'],
            fontName='Helvetica',
            fontSize=10,
            leading=14,
            textColor=colors.HexColor('#334155'),
            spaceAfter=6
        )

        txt = export_to_markdown(course_data, role)
        for line in txt.split('\n'):
            escaped_line = html_lib.escape(line)
            if line.startswith('# '):
                story.append(Paragraph(escaped_line[2:], title_style))
            elif line.startswith('## '):
                story.append(Paragraph(escaped_line[3:], h1_style))
            elif line.startswith('### '):
                story.append(Paragraph(escaped_line[4:], h2_style))
            elif line.startswith('#### '):
                story.append(Paragraph(escaped_line[5:], h2_style))
            elif line.strip() != "":
                story.append(Paragraph(escaped_line, body_style))

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
            md_content = export_to_markdown(course_data, role)
            zip_file.writestr(f"{role}_pov.md", md_content)
            
            html_content = export_to_html(course_data, role)
            zip_file.writestr(f"{role}_pov.html", html_content)
            
    output.seek(0)
    return output
