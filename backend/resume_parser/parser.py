import spacy
import pdfplumber
import os
import re
import logging

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Global NLP holder for lazy loading
_nlp = None

def get_nlp():
    global _nlp
    if _nlp is None:
        try:
            logger.info("⏳ Loading spacy model 'en_core_web_sm'...")
            _nlp = spacy.load("en_core_web_sm")
            logger.info("✅ Spacy model loaded successfully.")
        except OSError:
            logger.info("Downloading spacy model 'en_core_web_sm'...")
            import subprocess
            subprocess.run(["python", "-m", "spacy", "download", "en_core_web_sm"], check=True)
            _nlp = spacy.load("en_core_web_sm")
            logger.info("✅ Spacy model downloaded and loaded successfully.")
    return _nlp

SKILL_KEYWORDS = [
    "python", "java", "react", "node", "machine learning",
    "deep learning", "sql", "javascript", "html", "css",
    "docker", "kubernetes", "aws", "azure", "gcp", "tensorflow",
    "pytorch", "pandas", "numpy", "django", "flask", "fastapi",
    "mongodb", "postgresql", "redis", "git", "jenkins", "terraform",
    "typescript", "next.js", "graphql", "tailwind", "redux"
]

def extract_text_from_pdf(file_path):
    """Extract text from PDF using pdfplumber for better reliability."""
    text = ""
    try:
        with pdfplumber.open(file_path) as pdf:
            for page in pdf.pages:
                page_text = page.extract_text()
                if page_text:
                    text += page_text + "\n"
    except Exception as e:
        logger.error(f"Error extracting text from PDF {file_path}: {e}")
        # Fallback to pdfminer if needed, but pdfplumber is generally better
    return text

def parse_resume(file_path):
    """Enhanced resume parsing with better skill extraction and basic info."""
    if not os.path.exists(file_path):
        return {"error": "File not found", "skills": []}

    text = extract_text_from_pdf(file_path)
    if not text.strip():
        return {"error": "No text extracted from PDF", "skills": []}

    # Clean text: remove extra whitespace and normalize
    text = re.sub(r'\s+', ' ', text)
    
    # Lazy load the NLP model on first use
    nlp = get_nlp()
    doc = nlp(text)

    # Extract skills using both simple token match and entity recognition (if applicable)
    found_skills = set()
    
    # 1. Simple keyword matching with word boundaries
    text_lower = text.lower()
    for skill in SKILL_KEYWORDS:
        # Use regex to find skills as whole words to avoid partial matches (e.g., 'java' in 'javascript')
        pattern = r'\b' + re.escape(skill) + r'\b'
        if re.search(pattern, text_lower):
            found_skills.add(skill)

    # 2. Extract potential contact info (simple regex)
    email_match = re.search(r'[\w\.-]+@[\w\.-]+\.\w+', text)
    email = email_match.group(0) if email_match else None
    
    phone_match = re.search(r'(\d{3}[-\.\s]??\d{3}[-\.\s]??\d{4}|\(\d{3}\)\s*\d{3}[-\.\s]??\d{4}|\d{10})', text)
    phone = phone_match.group(0) if phone_match else None

    # Categorize skills for better UI presentation
    categorized_skills = {
        "Languages": [],
        "Frameworks": [],
        "Tools & Cloud": [],
        "Others": []
    }
    
    lang_list = ["python", "java", "javascript", "sql", "html", "css", "typescript"]
    framework_list = ["react", "node", "django", "flask", "fastapi", "next.js", "tailwind", "redux", "graphql"]
    tools_list = ["docker", "kubernetes", "aws", "azure", "gcp", "git", "jenkins", "terraform", "mongodb", "postgresql", "redis"]

    for skill in found_skills:
        if skill in lang_list:
            categorized_skills["Languages"].append(skill)
        elif skill in framework_list:
            categorized_skills["Frameworks"].append(skill)
        elif skill in tools_list:
            categorized_skills["Tools & Cloud"].append(skill)
        else:
            categorized_skills["Others"].append(skill)

    return {
        "email": email,
        "phone": phone,
        "skills": list(found_skills),
        "categorized_skills": categorized_skills,
        "text_preview": text[:500] + "..." if len(text) > 500 else text
    }
