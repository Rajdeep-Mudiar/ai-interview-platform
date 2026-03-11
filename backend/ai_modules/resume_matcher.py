import pdfplumber
import re
import logging
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

# Flatten skills for easier matching
ALL_SKILLS = [skill for category in SKILL_CATEGORIES.values() for skill in category]

def extract_text_from_pdf(file_stream) -> str:
    """Extracts text from a PDF file stream."""
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
    return text.strip()

def clean_text(text: str) -> str:
    """Cleans text for better analysis."""
    text = text.lower()
    # Remove extra whitespace
    text = re.sub(r'\s+', ' ', text)
    # Remove special characters but keep some important ones
    text = re.sub(r'[^a-z0-9+#. ]', ' ', text)
    return text.strip()

def extract_skills_with_context(text: str) -> Dict[str, List[str]]:
    """Extracts skills organized by category."""
    text = clean_text(text)
    found_skills = {}
    
    for category, skills in SKILL_CATEGORIES.items():
        found_in_cat = []
        for skill in skills:
            # Use regex for whole word matching to avoid partial matches (e.g., 'go' in 'google')
            pattern = r'\b' + re.escape(skill) + r'\b'
            if re.search(pattern, text):
                found_in_cat.append(skill)
        if found_in_cat:
            found_skills[category] = found_in_cat
            
    return found_skills

def calculate_match_score(resume_text: str, job_description: str) -> Dict[str, Any]:
    """Calculates multiple similarity metrics for a better score."""
    clean_resume = clean_text(resume_text)
    clean_jd = clean_text(job_description)
    
    # 1. TF-IDF Cosine Similarity
    documents = [clean_resume, clean_jd]
    vectorizer = TfidfVectorizer(stop_words='english')
    try:
        vectors = vectorizer.fit_transform(documents)
        similarity = cosine_similarity(vectors[0:1], vectors[1:2])[0][0]
    except ValueError: # If no valid words after stopword removal
        similarity = 0.0
    
    # 2. Skill-based similarity
    resume_skills_flat = [s for cat in extract_skills_with_context(resume_text).values() for s in cat]
    jd_skills_flat = [s for cat in extract_skills_with_context(job_description).values() for s in cat]
    
    if not jd_skills_flat:
        skill_similarity = 1.0 # No skills required in JD
    else:
        matches = set(resume_skills_flat) & set(jd_skills_flat)
        skill_similarity = len(matches) / len(jd_skills_flat)
        
    # Weighted average: 40% text similarity, 60% skill matching
    final_score = (similarity * 0.4) + (skill_similarity * 0.6)
    
    return {
        "overall_score": round(final_score * 100, 2),
        "text_similarity": round(similarity * 100, 2),
        "skill_match_rate": round(skill_similarity * 100, 2)
    }

def analyze_resume(file_stream, job_description: str) -> Dict[str, Any]:
    """Complete resume analysis pipeline."""
    resume_text = extract_text_from_pdf(file_stream)
    if not resume_text:
        return {"error": "Could not extract text from PDF."}
        
    scores = calculate_match_score(resume_text, job_description)
    
    resume_skills_cat = extract_skills_with_context(resume_text)
    jd_skills_cat = extract_skills_with_context(job_description)
    
    # Flatten for easier comparison
    resume_skills_flat = set([s for cat in resume_skills_cat.values() for s in cat])
    jd_skills_flat = set([s for cat in jd_skills_cat.values() for s in cat])
    
    missing_skills = list(jd_skills_flat - resume_skills_flat)
    matched_skills = list(jd_skills_flat & resume_skills_flat)
    
    # Suggestions
    suggestions = []
    if missing_skills:
        suggestions.append(f"Consider adding the following skills to your resume: {', '.join(missing_skills[:5])}")
    if scores["overall_score"] < 50:
        suggestions.append("Your resume text has low similarity with the job description. Try to use more relevant keywords.")
        
    return {
        "score": scores["overall_score"],
        "metrics": scores,
        "resume_skills": resume_skills_cat,
        "matched_skills": matched_skills,
        "missing_skills": missing_skills,
        "suggestions": suggestions,
        "resume_text": resume_text[:1000] + "..." # Truncated for response efficiency
    }
