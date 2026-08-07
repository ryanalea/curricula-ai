import io

try:
    import docx
except ImportError:
    docx = None

try:
    import pypdf
except ImportError:
    try:
        import PyPDF2 as pypdf
    except ImportError:
        pypdf = None

def parse_txt(file_bytes: bytes) -> str:
    try:
        return file_bytes.decode('utf-8')
    except UnicodeDecodeError:
        return file_bytes.decode('latin-1', errors='ignore')

def parse_docx(file_bytes: bytes) -> str:
    if not docx:
        return file_bytes.decode('utf-8', errors='ignore')
    doc = docx.Document(io.BytesIO(file_bytes))
    fullText = []
    for para in doc.paragraphs:
        fullText.append(para.text)
    return '\n'.join(fullText)

def parse_pdf(file_bytes: bytes) -> str:
    if not pypdf:
        return file_bytes.decode('utf-8', errors='ignore')
    try:
        pdf_file = io.BytesIO(file_bytes)
        # Check standard PdfReader vs PdfFileReader based on package version
        if hasattr(pypdf, "PdfReader"):
            reader = pypdf.PdfReader(pdf_file)
            pages = reader.pages
        else:
            reader = pypdf.PdfFileReader(pdf_file)
            pages = reader.pages if hasattr(reader, "pages") else [reader.getPage(i) for i in range(reader.getNumPages())]
            
        text = []
        for page in pages:
            t = page.extract_text()
            if t:
                text.append(t)
        return '\n'.join(text)
    except Exception as e:
        return f"[Error parsing PDF: {str(e)}]"

def parse_document(filename: str, file_bytes: bytes) -> str:
    ext = filename.split('.')[-1].lower()
    if ext == 'pdf':
        return parse_pdf(file_bytes)
    elif ext == 'docx':
        return parse_docx(file_bytes)
    else:
        return parse_txt(file_bytes)
