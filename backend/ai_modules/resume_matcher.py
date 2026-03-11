import pdfplumber
import re
import logging
import os
from typing import List, Dict, Any, Set
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity

# Configure logging
logger = logging.getLogger(__name__)

# Expanded skills dictionary for better extraction
SKILL_CATEGORIES = {
    "Languages": [
        "python", "java", "javascript", "typescript", "c++", "c#", "ruby", "go", "rust", "php", "swift", "kotlin", "sql"
    ],
    "Frontend": [
        "react", "angular", "vue", "next.js", "tailwind", "sass", "bootstrap", "html", "css", "redux", "jquery"
    ],
    "Backend": [
        "node", "express", "django", "flask", "fastapi", "spring boot", "laravel", "asp.net", "graphql", "rest api"
    ],
    "Data & AI": [
        "machine learning", "deep learning", "tensorflow", "pytorch", "pandas", "numpy", "scikit-learn", "nlp", "computer vision", "data analysis", "r", "pyspark"
    ],
    "Cloud & DevOps": [
        "aws", "azure", "gcp", "docker", "kubernetes", "jenkins", "terraform", "ansible", "ci/cd", "linux", "nginx"
    ],
    "Databases": [
        "mongodb", "postgresql", "mysql", "redis", "elasticsearch", "cassandra", "firebase", "sqlite"
    ],
    "Tools": [
        "git", "github", "jira", "postman", "figma", "unity", "unreal engine"
    ]
}

def extract_text_from_pdf(file_stream) -> str:
    """Extracts text from a PDF file stream with better cleanup."""
    text = ""
    try:
        with pdfplumber.open(file_stream) as pdf:
            for page in pdf.pages:
                page_text = page.extract_text()
                if page_text:
                    text += page_text + " "
    except Exception as e:
        logger.error(f"Error extracting PDF: {e}")
        return ""
    
    # Normalize text: remove extra whitespace and non-printable characters
    text = re.sub(r'\s+', ' ', text)
    text = "".join(char for char in text if char.isprintable())
    return text.strip()

def clean_text(text: str) -> str:
    """Cleans text for NLP analysis."""
    text = text.lower()
    # Remove special characters but keep some important ones for tech (+ # .)
    text = re.sub(r'[^a-z0-9+#. ]', ' ', text)
    return text.strip()

def extract_contact_info(text: str) -> Dict[str, str]:
    """Extracts basic contact information from resume text."""
    email_match = re.search(r'[\w\.-]+@[\w\.-]+\.\w+', text)
    phone_match = re.search(r'(\d{3}[-\.\s]??\d{3}[-\.\s]??\d{4}|\(\d{3}\)\s*\d{3}[-\.\s]??\d{4}|\d{10})', text)
    
    return {
        "email": email_match.group(0) if email_match else "N/A",
        "phone": phone_match.group(0) if phone_match else "N/A"
    }

def extract_skills_with_context(text: str) -> Dict[str, List[str]]:
    """Extracts skills organized by category using NLP and regex."""
    cleaned_text = clean_text(text)
    found_skills = {}
    
    for category, skills in SKILL_CATEGORIES.items():
        found_in_cat = []
        for skill in skills:
            # Word boundary regex for accurate matching (e.g. avoid 'go' matching in 'google')
            pattern = r'\b' + re.escape(skill) + r'\b'
            if re.search(pattern, cleaned_text):
                found_in_cat.append(skill)
        if found_in_cat:
            found_skills[category] = found_in_cat
            
    return found_skills

def calculate_match_score(resume_text: str, job_description: str) -> Dict[str, Any]:
    """Calculates weighted similarity metrics between resume and JD."""
    clean_resume = clean_text(resume_text)
    clean_jd = clean_text(job_description)
    
    # 1. TF-IDF Cosine Similarity
    documents = [clean_resume, clean_jd]
    vectorizer = TfidfVectorizer(stop_words='english', ngram_range=(1, 2)) # Unigrams and Bigrams
    try:
        vectors = vectorizer.fit_transform(documents)
        similarity = cosine_similarity(vectors[0:1], vectors[1:2])[0][0]
    except Exception:
        similarity = 0.0
    
    # 2. Skill-based similarity (Weighted more heavily)
    resume_skills_all = extract_skills_with_context(resume_text)
    jd_skills_all = extract_skills_with_context(job_description)
    
    # Flatten skills for matching
    resume_skills_flat = set([s for cat in resume_skills_all.values() for s in cat])
    jd_skills_flat = set([s for cat in jd_skills_all.values() for s in cat])
    
    if not jd_skills_flat:
        skill_similarity = 1.0 
    else:
        matches = resume_skills_flat & jd_skills_flat
        skill_similarity = len(matches) / len(jd_skills_flat)
        
    # Weighted average: 30% text similarity, 70% skill matching
    final_score = (similarity * 0.3) + (skill_similarity * 0.7)
    
    return {
        "overall_score": round(final_score * 100, 2),
        "text_similarity": round(similarity * 100, 2),
        "skill_match_rate": round(skill_similarity * 100, 2)
    }

def analyze_resume(file_stream, job_description: str) -> Dict[str, Any]:
    """Enhanced resume analysis pipeline with contact info and categorization."""
    resume_text = extract_text_from_pdf(file_stream)
    if not resume_text:
        return {"error": "Could not extract text from PDF. Ensure it's not scanned or corrupted."}
        
    contact_info = extract_contact_info(resume_text)
    scores = calculate_match_score(resume_text, job_description)
    
    resume_skills_cat = extract_skills_with_context(resume_text)
    jd_skills_cat = extract_skills_with_context(job_description)
    
    # Comparison
    resume_skills_flat = set([s for cat in resume_skills_cat.values() for s in cat])
    jd_skills_flat = set([s for cat in jd_skills_cat.values() for s in cat])
    
    missing_skills = list(jd_skills_flat - resume_skills_flat)
    matched_skills = list(jd_skills_flat & resume_skills_flat)
    
    # Smart Suggestions
    suggestions = []
    if missing_skills:
        suggestions.append(f"Adding these skills could improve your match: {', '.join(missing_skills[:5])}")
    if scores["overall_score"] < 40:
        suggestions.append("Your resume content has low relevance. Tailor your experience to match the job requirements.")
    elif scores["overall_score"] > 80:
        suggestions.append("Strong match! You have most of the required skills.")
        
    return {
        "score": scores["overall_score"],
        "metrics": scores,
        "contact": contact_info,
        "resume_skills": resume_skills_cat,
        "matched_skills": matched_skills,
        "missing_skills": missing_skills,
        "suggestions": suggestions,
        "resume_text": resume_text[:1500] + "..." # Truncated text preview
    }
