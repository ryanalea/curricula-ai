import json
import io
import zipfile

try:
    import docx
    from docx.shared import Inches, Pt, RGBColor
except ImportError:
    docx = None

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

def export_to_markdown(course_data: dict, role: str) -> str:
    md = []
    md.append(f"# 🎓 {course_data.get('title', 'Untitled Course')}")
    md.append(f"**Difficulty:** {course_data.get('config', {}).get('difficulty', 'Beginner')} | **Audience:** {course_data.get('config', {}).get('target_audience', 'Student')}\n")
    md.append("--- \n")

    roles_to_export = ["creator", "student", "educator"] if role == "all" else [role]

    for r in roles_to_export:
        md.append(f"## 📘 {get_role_label(r)}")
        for idx, lesson in enumerate(course_data.get("lessons", [])):
            md.append(f"### Lesson {idx + 1}: {lesson.get('title', 'Untitled Lesson')}")
            sections = lesson.get("sections", {}).get(r, {})
            
            for sec_type, content in sections.items():
                title = sec_type.replace("_", " ").capitalize()
                md.append(f"#### {title}")
                if isinstance(content, str):
                    md.append(content)
                elif isinstance(content, list):
                    for item in content:
                        if isinstance(item, dict):
                            # For quizzes or rubric rows
                            q_text = item.get("question", item.get("criteria", ""))
                            md.append(f"- **{q_text}**")
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
    # Simple markdown parser fallback to keep it zero-dependency
    html_lines = []
    for line in md_content.split("\n"):
        if line.startswith("# "):
            html_lines.append(f"<h1 style='color:#2D3561;font-family:sans-serif;'>{line[2:]}</h1>")
        elif line.startswith("## "):
            html_lines.append(f"<h2 style='color:#2D3561;font-family:sans-serif;margin-top:24px;'>{line[3:]}</h2>")
        elif line.startswith("### "):
            html_lines.append(f"<h3 style='color:#E9B259;font-family:sans-serif;margin-top:18px;'>{line[4:]}</h3>")
        elif line.startswith("#### "):
            html_lines.append(f"<h4 style='color:#2D3561;font-family:sans-serif;'>{line[5:]}</h4>")
        elif line.startswith("- "):
            html_lines.append(f"<li style='font-family:sans-serif;'>{line[2:]}</li>")
        elif line.startswith("  - "):
            html_lines.append(f"<li style='margin-left:20px;font-family:sans-serif;'>{line[4:]}</li>")
        elif line.strip() == "---":
            html_lines.append("<hr style='border: 1px solid #E8EAF0; margin: 30px 0;'>")
        elif line.strip() == "":
            html_lines.append("<br/>")
        else:
            html_lines.append(f"<p style='font-family:sans-serif;line-height:1.6;'>{line}</p>")
            
    body = "\n".join(html_lines)
    return f"""
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8">
        <title>{course_data.get('title', 'Exported Course')}</title>
        <style>
            body {{
                padding: 40px;
                max-width: 800px;
                margin: auto;
                color: #2D3561;
                background-color: #FFFFFF;
            }}
        </style>
    </head>
    <body>
        {body}
    </body>
    </html>
    """

def export_to_docx(course_data: dict, role: str) -> io.BytesIO:
    output = io.BytesIO()
    if not docx:
        # Generate raw text if python-docx not installed
        txt = export_to_markdown(course_data, role)
        output.write(txt.encode('utf-8'))
        output.seek(0)
        return output

    doc = docx.Document()
    
    # Custom styling
    style = doc.styles['Normal']
    font = style.font
    font.name = 'Arial'
    font.size = Pt(11)
    
    doc.add_heading(course_data.get('title', 'Untitled Course'), level=0)
    doc.add_paragraph(f"Difficulty: {course_data.get('config', {}).get('difficulty', 'Beginner')} | Audience: {course_data.get('config', {}).get('target_audience', 'Student')}")
    
    roles_to_export = ["creator", "student", "educator"] if role == "all" else [role]

    for r in roles_to_export:
        doc.add_heading(get_role_label(r), level=1)
        for idx, lesson in enumerate(course_data.get("lessons", [])):
            doc.add_heading(f"Lesson {idx + 1}: {lesson.get('title', 'Untitled Lesson')}", level=2)
            sections = lesson.get("sections", {}).get(r, {})
            
            for sec_type, content in sections.items():
                doc.add_heading(sec_type.replace("_", " ").capitalize(), level=3)
                if isinstance(content, str):
                    doc.add_paragraph(content)
                elif isinstance(content, list):
                    for item in content:
                        if isinstance(item, dict):
                            q_text = item.get("question", item.get("criteria", ""))
                            doc.add_paragraph(f"• {q_text}", style='List Bullet')
                            if "options" in item:
                                for opt in item["options"]:
                                    ans_tag = " [CORRECT]" if opt == item.get("answer") else ""
                                    doc.add_paragraph(f"  - {opt}{ans_tag}", style='Normal')
                        else:
                            doc.add_paragraph(f"• {item}", style='List Bullet')
                elif isinstance(content, dict):
                    for k, v in content.items():
                        doc.add_paragraph(f"{k.capitalize()}: {v}")
                        
    doc.save(output)
    output.seek(0)
    return output

def export_to_pdf(course_data: dict, role: str) -> io.BytesIO:
    # Basic PDF rendering using ReportLab or fallback to Markdown text stream
    output = io.BytesIO()
    if not SimpleDocTemplate:
        txt = export_to_markdown(course_data, role)
        output.write(txt.encode('utf-8'))
        output.seek(0)
        return output
        
    doc = SimpleDocTemplate(output, pagesize=letter)
    styles = getSampleStyleSheet()
    story = []
    
    title_style = ParagraphStyle(
        'DocTitle',
        parent=styles['Title'],
        fontName='Helvetica-Bold',
        fontSize=24,
        textColor=colors.HexColor('#081231')
    )
    h1_style = ParagraphStyle(
        'Heading1',
        parent=styles['Heading1'],
        fontName='Helvetica-Bold',
        fontSize=18,
        textColor=colors.HexColor('#486BF5')
    )
    
    story.append(Paragraph(course_data.get('title', 'Untitled Course'), title_style))
    story.append(Spacer(1, 12))
    
    txt = export_to_markdown(course_data, role)
    for line in txt.split('\n'):
        if line.startswith('# '):
            story.append(Paragraph(line[2:], title_style))
        elif line.startswith('## '):
            story.append(Paragraph(line[3:], h1_style))
        elif line.strip() != "":
            story.append(Paragraph(line, styles['Normal']))
            story.append(Spacer(1, 6))
            
    doc.build(story)
    output.seek(0)
    return output

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
