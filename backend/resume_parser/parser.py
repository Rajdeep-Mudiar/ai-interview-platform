from pdfminer.high_level import extract_text
import spacy

nlp = spacy.load("en_core_web_sm")

SKILL_KEYWORDS = [
    "python", "java", "react", "node", "machine learning", "deep learning", "sql", "javascript", "html", "css",
    "docker", "kubernetes", "aws", "azure", "gcp", "terraform", "ansible", "jenkins", "git", "github", "gitlab",
    "mongodb", "postgresql", "mysql", "redis", "elasticsearch", "kafka", "rabbitmq", "rest api", "graphql",
    "typescript", "angular", "vue", "next.js", "nest.js", "express", "django", "flask", "fastapi", "spring boot",
    "c++", "c#", "go", "rust", "swift", "kotlin", "php", "ruby", "pytorch", "tensorflow", "keras", "scikit-learn",
    "pandas", "numpy", "matplotlib", "seaborn", "tableau", "power bi", "excel", "spark", "hadoop", "hive",
    "agile", "scrum", "kanban", "devops", "cicd", "microservices", "serverless", "testing", "unit testing",
    "integration testing", "e2e testing", "jest", "cypress", "selenium", "pytest", "mocha", "chai"
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