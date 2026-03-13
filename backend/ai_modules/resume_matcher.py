import pdfplumber
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity
import spacy

nlp = spacy.load("en_core_web_sm")

SKILLS_CONFIG = {
    "skills": [
        "python", "java", "react", "node", "sql",
        "machine learning", "docker", "aws", "javascript"
    ]
}

def extract_text_from_pdf(file):
    text = ""
    try:
        with pdfplumber.open(file) as pdf:
            for page in pdf.pages:
                text += page.extract_text()
    except Exception as e:
        print(f"Error extracting text from PDF: {e}")
        return ""
    return text

def calculate_match_score(resume_text, job_description):
    documents = [resume_text, job_description]
    vectorizer = TfidfVectorizer()
    vectors = vectorizer.fit_transform(documents)
    similarity = cosine_similarity(vectors[0:1], vectors[1:2])
    score = round(similarity[0][0] * 100, 2)
    return score

def extract_skills(text):
    text = text.lower()
    found = []
    for skill in SKILLS_CONFIG["skills"]:
        if skill in text:
            found.append(skill)
    return found

def analyze_resume(file, job_description):
    resume_text = extract_text_from_pdf(file)
    score = calculate_match_score(resume_text, job_description)
    resume_skills = extract_skills(resume_text)
    job_skills = extract_skills(job_description)
    missing = list(set(job_skills) - set(resume_skills))
    return {
        "score": score,
        "resume_skills": resume_skills,
        "missing_skills": missing,
        "resume_text": resume_text
    }
