from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity

SKILLS = [
    "python","java","react","node","machine learning",
    "deep learning","sql","docker","aws","tensorflow"
]

def compute_match_score(resume_text, jd_text):

    documents = [resume_text, jd_text]

    tfidf = TfidfVectorizer()

    matrix = tfidf.fit_transform(documents)

    similarity = cosine_similarity(matrix[0:1], matrix[1:2])

    score = round(similarity[0][0] * 100, 2)

    return score

def skill_gap_analysis(resume_text, jd_text):
    resume_text = resume_text.lower()
    jd_text = jd_text.lower()
    matched = []
    missing = []
    for skill in SKILLS:
        if skill in jd_text:
            if skill in resume_text:
                matched.append(skill)
            else:
                missing.append(skill)
    return matched, missing

# 🚀 STEP 47 — Combine Matching Engine

def analyze_candidate(resume_text, jd_text):
    score = compute_match_score(resume_text, jd_text)
    matched, missing = skill_gap_analysis(resume_text, jd_text)
    return {
        "fit_score": score,
        "matched_skills": matched,
        "missing_skills": missing
    }