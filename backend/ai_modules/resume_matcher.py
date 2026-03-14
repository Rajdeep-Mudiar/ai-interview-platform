from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity
from resume_parser.parser import parse_resume, clean_text, SKILL_KEYWORDS

def calculate_match_score(resume_text, job_description):
    documents = [resume_text, job_description]
    vectorizer = TfidfVectorizer()
    vectors = vectorizer.fit_transform(documents)
    similarity = cosine_similarity(vectors[0:1], vectors[1:2])
    score = round(similarity[0][0] * 100, 2)
    return score

def extract_skills_from_text(text):
    text = text.lower()
    found = []
    for skill in SKILL_KEYWORDS:
        if skill in text:
            found.append(skill)
    return found

def analyze_resume(file, job_description):
    parsed = parse_resume(file)
    resume_text = parsed.get("text", "")
    resume_skills = parsed.get("skills", [])
    
    score = calculate_match_score(resume_text, job_description)
    job_skills = extract_skills_from_text(job_description)
    
    missing = list(set(job_skills) - set(resume_skills))
    return {
        "score": score,
        "resume_skills": resume_skills,
        "missing_skills": missing,
        "resume_text": resume_text
    }
