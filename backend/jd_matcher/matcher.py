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

def check_skill_match(skill, text_lower, doc=None):
    """Check if skill or its synonyms are in text (Semantic Matching)"""
    if skill in text_lower:
        # For multi-word skills, a simple substring check is usually okay
        if " " in skill:
            return True
        # For single-word skills, we want exact word matches
        if doc:
            for token in doc:
                if token.text == skill:
                    return True
        else:
            # Fallback if doc is not provided
            pattern = rf"\b{re.escape(skill)}\b"
            if re.search(pattern, text_lower):
                return True
    
    # Check synonyms
    for main_skill, alternates in SYNONYMS.items():
        if skill == main_skill or skill in alternates:
            alts_to_check = [main_skill] + alternates
            if any(alt in text_lower for alt in alts_to_check):
                # Similar exact word check for synonyms
                for alt in alts_to_check:
                    if " " in alt and alt in text_lower:
                        return True
                    if doc:
                        if any(token.text == alt for token in doc):
                            return True
                    else:
                        if re.search(rf"\b{re.escape(alt)}\b", text_lower):
                            return True
    return False

import re

def skill_gap_analysis(resume_text, jd_text):
    resume_lower = resume_text.lower()
    jd_lower = jd_text.lower()
    
    # Pre-process with spaCy for better token matching
    resume_doc = nlp(resume_lower)
    jd_doc = nlp(jd_lower)
    
    matched = []
    missing = []
    
    # Identify skills mentioned in JD
    required_skills = []
    for skill in SKILL_KEYWORDS:
        if check_skill_match(skill, jd_lower, jd_doc):
            required_skills.append(skill)
            
    # Check which of those are in the resume
    for skill in required_skills:
        if check_skill_match(skill, resume_lower, resume_doc):
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
            year_score = 25
        elif latest_year >= 2022:
            year_score = 15
            
    # Skill frequency (Frequency Scoring)
    # We use a set of found keywords to avoid gaming by repeating same word
    found_skills = set()
    resume_lower = resume_text.lower()
    for skill in SKILL_KEYWORDS:
        if skill in resume_lower:
            found_skills.add(skill)
            
    freq_score = min(len(found_skills) * 1.5, 25) # Cap at 25
    
    return year_score + freq_score

def analyze_candidate(resume_text, jd_text):
    matched, missing = skill_gap_analysis(resume_text, jd_text)
    
    # 1. Semantic Content Score (K) - TF-IDF based
    keyword_score = compute_match_score(resume_text, jd_text)
    
    # 2. Experience Score (E) - Recency & Breadth
    exp_score = calculate_experience_score(resume_text)
    
    # 3. Skill Match Ratio (S) - Hard requirement matching
    total_required = len(matched) + len(missing)
    skill_match_ratio = (len(matched) / total_required) * 100 if total_required > 0 else 100
    
    # Final weighted score: ATS Score = w1*S + w2*K + w3*E
    # We prioritize Skill Match Ratio (S) as it's the most objective
    # w1=0.5 (Skill Match), w2=0.3 (TF-IDF Similarity), w3=0.2 (Experience)
    final_ats_score = (0.5 * skill_match_ratio) + (0.3 * keyword_score) + (0.2 * exp_score)
    final_ats_score = round(min(final_ats_score, 100.0), 2)
        
    return {
        "fit_score": final_ats_score,
        "matched_skills": matched,
        "missing_skills": missing,
        "semantic_matching": True,
        "experience_score": exp_score,
        "skill_match_ratio": round(skill_match_ratio, 2)
    }