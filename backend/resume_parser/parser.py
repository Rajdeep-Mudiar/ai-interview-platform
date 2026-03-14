from pdfminer.high_level import extract_text
import spacy

nlp = spacy.load("en_core_web_sm")

SKILL_KEYWORDS = [
    # Programming Languages
    "python", "java", "react", "node", "machine learning", "deep learning", "sql", "javascript", "html", "css",
    "c++", "c#", "go", "rust", "swift", "kotlin", "php", "ruby", "typescript", "scala", "dart", "r", "shell script",
    # Frameworks & Libraries
    "next.js", "nest.js", "express", "django", "flask", "fastapi", "spring boot", "angular", "vue", "svelte",
    "pytorch", "tensorflow", "keras", "scikit-learn", "pandas", "numpy", "matplotlib", "seaborn", "tailwind",
    "bootstrap", "material ui", "redux", "graphql", "rest api", "junit", "pytest", "jest", "cypress", "selenium",
    # Infrastructure & DevOps
    "docker", "kubernetes", "aws", "azure", "gcp", "terraform", "ansible", "jenkins", "git", "github", "gitlab",
    "devops", "cicd", "microservices", "serverless", "linux", "nginx", "apache", "prometheus", "grafana",
    # Databases
    "mongodb", "postgresql", "mysql", "redis", "elasticsearch", "kafka", "rabbitmq", "dynamodb", "sqlite", "oracle",
    # Data & Analytics
    "tableau", "power bi", "excel", "spark", "hadoop", "hive", "big data", "data visualization", "data mining",
    # Methodology & Soft Skills
    "agile", "scrum", "kanban", "project management", "sdlc", "testing", "unit testing", "integration testing",
    "e2e testing", "system design", "problem solving", "communication", "leadership", "collaboration"
]

import re

def clean_text(text):
    # Remove extra whitespaces
    text = re.sub(r'\s+', ' ', text)
    # Remove non-printable characters
    text = re.sub(r'[^\x00-\x7f]', r'', text)
    return text.strip()

import io

def parse_resume(file):
    try:
        # If file is a path string, open it; if it's a file-like object, read it
        if isinstance(file, str):
            text = extract_text(file)
        else:
            # For UploadFile.file (SPOOL or BytesIO)
            file.seek(0)
            file_content = file.read()
            text = extract_text(io.BytesIO(file_content))
            
        text = clean_text(text)

        # Better skill extraction: check for multi-word skills and standalone words
        text_lower = text.lower()
        skills = []
        
        # 1. Check for multi-word skills first (e.g., "machine learning")
        multi_word_skills = [s for s in SKILL_KEYWORDS if " " in s]
        for skill in multi_word_skills:
            if skill in text_lower:
                skills.append(skill)
                
        # 2. Check for single-word skills as standalone tokens
        single_word_skills = [s for s in SKILL_KEYWORDS if " " not in s]
        doc = nlp(text_lower)
        for token in doc:
            if token.text in single_word_skills:
                skills.append(token.text)

        return {
            "text": text,
            "skills": list(set(skills))
        }
    except Exception as e:
        import traceback
        traceback.print_exc()
        print(f"Error parsing resume: {e}")
        return {"text": "", "skills": [], "error": str(e)}