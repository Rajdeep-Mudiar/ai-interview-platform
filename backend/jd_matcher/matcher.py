from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity
from resume_parser.parser import SKILL_KEYWORDS
import spacy

nlp = spacy.load("en_core_web_sm")

# Semantic synonyms for common roles/skills
SYNONYMS = {
    "software development": ["software engineering", "application development", "programming"],
    "software engineering": ["software development", "coding", "full stack development"],
    "data analysis": ["data analytics", "data science", "statistical analysis"],
    "machine learning": ["ml", "artificial intelligence", "ai", "deep learning"],
    "frontend": ["front-end", "client-side", "web development"],
    "backend": ["back-end", "server-side", "api development"],
}

def compute_match_score(resume_text, jd_text):
    documents = [resume_text, jd_text]
    tfidf = TfidfVectorizer()
    matrix = tfidf.fit_transform(documents)
    similarity = cosine_similarity(matrix[0:1], matrix[1:2])
    score = round(similarity[0][0] * 100, 2)
    return score

def check_skill_match(skill, text):
    """Check if skill or its synonyms are in text (Semantic Matching)"""
    skill = skill.lower()
    text = text.lower()
    if skill in text:
        return True
    
    # Check synonyms
    for main_skill, alternates in SYNONYMS.items():
        if skill == main_skill or skill in alternates:
            if any(alt in text for alt in [main_skill] + alternates):
                return True
    return False

def skill_gap_analysis(resume_text, jd_text):
    matched = []
    missing = []
    for skill in SKILL_KEYWORDS:
        if check_skill_match(skill, jd_text):
            if check_skill_match(skill, resume_text):
                matched.append(skill)
            else:
                missing.append(skill)
    return matched, missing

def calculate_experience_score(resume_text):
    """
    Simple experience scoring based on frequency of industry keywords 
    and presence of recent years (ATS Experience Scoring)
    """
    import re
    years = re.findall(r'20\d{2}|19\d{2}', resume_text)
    year_score = 0
    if years:
        latest_year = max(int(y) for y in years)
        # Priority to recent experience (last 2-3 years)
        if latest_year >= 2024:
            year_score = 20
        elif latest_year >= 2022:
            year_score = 10
            
    # Skill frequency (Frequency Scoring)
    words = resume_text.lower().split()
    skill_freq = sum(1 for word in words if word in SKILL_KEYWORDS)
    freq_score = min(skill_freq * 2, 30) # Cap at 30
    
    return year_score + freq_score

def analyze_candidate(resume_text, jd_text):
    matched, missing = skill_gap_analysis(resume_text, jd_text)
    
    # Semantic Match Score (K)
    keyword_score = compute_match_score(resume_text, jd_text)
    
    # Experience Score (E)
    exp_score = calculate_experience_score(resume_text)
    
    # Final weighted score: ATS Score = w1K + w2E + w3S
    # w1=0.6, w2=0.2, w3=0.2 (S is derived from percentage of matched skills)
    skill_match_ratio = (len(matched) / (len(matched) + len(missing))) * 100 if (len(matched) + len(missing)) > 0 else 0
    
    final_ats_score = (0.6 * keyword_score) + (0.2 * exp_score) + (0.2 * skill_match_ratio)
    final_ats_score = round(min(final_ats_score, 100.0), 2)
        
    return {
        "fit_score": final_ats_score,
        "matched_skills": matched,
        "missing_skills": missing,
        "semantic_matching": True,
        "experience_score": exp_score
    }