from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity

SKILLS = [
    "python", "java", "react", "node", "machine learning", "deep learning", "sql", "javascript", "html", "css",
    "docker", "kubernetes", "aws", "azure", "gcp", "terraform", "ansible", "jenkins", "git", "github", "gitlab",
    "mongodb", "postgresql", "mysql", "redis", "elasticsearch", "kafka", "rabbitmq", "rest api", "graphql",
    "typescript", "angular", "vue", "next.js", "nest.js", "express", "django", "flask", "fastapi", "spring boot",
    "c++", "c#", "go", "rust", "swift", "kotlin", "php", "ruby", "pytorch", "tensorflow", "keras", "scikit-learn",
    "pandas", "numpy", "matplotlib", "seaborn", "tableau", "power bi", "excel", "spark", "hadoop", "hive",
    "agile", "scrum", "kanban", "devops", "cicd", "microservices", "serverless", "testing", "unit testing",
    "integration testing", "e2e testing", "jest", "cypress", "selenium", "pytest", "mocha", "chai"
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
    matched, missing = skill_gap_analysis(resume_text, jd_text)
    
    # If all required skills in JD are present in resume, score is 100%
    if len(matched) > 0 and len(missing) == 0:
        score = 100.0
    else:
        score = compute_match_score(resume_text, jd_text)
        
    return {
        "fit_score": score,
        "matched_skills": matched,
        "missing_skills": missing
    }