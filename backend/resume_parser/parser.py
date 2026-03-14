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

def parse_resume(file_path):
    try:
        text = extract_text(file_path)
        text = clean_text(text)

        doc = nlp(text)
        skills = []

        for token in doc:
            if token.text.lower() in SKILL_KEYWORDS:
                skills.append(token.text.lower())

        return {
            "text": text,
            "skills": list(set(skills))
        }
    except Exception as e:
        print(f"Error parsing resume: {e}")
        return {"text": "", "skills": [], "error": str(e)}