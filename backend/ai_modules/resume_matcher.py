<<<<<<< HEAD
from jd_matcher.matcher import analyze_candidate
from resume_parser.parser import parse_resume

def analyze_resume(file, job_description):
    parsed = parse_resume(file)
    resume_text = parsed.get("text", "")
    
    # Use the unified matching engine from jd_matcher
    result = analyze_candidate(resume_text, job_description)
    
    return {
        "score": result["fit_score"],
        "resume_skills": result["matched_skills"],
        "missing_skills": result["missing_skills"],
        "resume_text": resume_text,
        "job_description": job_description,
        "experience_score": result["experience_score"],
        "skill_match_ratio": result["skill_match_ratio"]
    }
=======
import pdfplumber
import re
import spacy
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity

nlp = spacy.load("en_core_web_sm")

SKILLS = {
    "python","java","react","node","sql",
    "machine learning","docker","aws","javascript"
}

def extract_text_from_pdf(file):
    text_parts = []

    with pdfplumber.open(file) as pdf:
        for page in pdf.pages:
            page_text = page.extract_text()
            if page_text:
                text_parts.append(page_text)

    text = " ".join(text_parts)
    text = re.sub(r"\s+", " ", text)
    return text.strip()


def preprocess_text(text):
    doc = nlp(text.lower())

    tokens = [
        token.lemma_
        for token in doc
        if not token.is_stop
        and not token.is_punct
        and not token.like_num
    ]

    return " ".join(tokens)


def calculate_match_score(resume_text, job_description):
    processed_resume = preprocess_text(resume_text)
    processed_job = preprocess_text(job_description)

    vectorizer = TfidfVectorizer(
        ngram_range=(1,2),
        stop_words="english"
    )

    vectors = vectorizer.fit_transform([processed_resume, processed_job])

    similarity = cosine_similarity(vectors[0:1], vectors[1:2])[0][0]

    score = round(similarity * 100, 2)

    return score


def extract_skills(text):
    text = text.lower()

    found = set()

    doc = nlp(text)

    tokens = [token.text for token in doc]

    bigrams = [" ".join(pair) for pair in zip(tokens, tokens[1:])]

    for skill in SKILLS:
        if skill in tokens or skill in bigrams or skill in text:
            found.add(skill)

    return list(found)


def analyze_resume(file, job_description):

    resume_text = extract_text_from_pdf(file)

    score = calculate_match_score(resume_text, job_description)

    resume_skills = extract_skills(resume_text)

    job_skills = extract_skills(job_description)

    missing_skills = list(set(job_skills) - set(resume_skills))

    matched_skills = list(set(job_skills).intersection(set(resume_skills)))

    return {
        "match_score": score,
        "resume_skills": resume_skills,
        "job_required_skills": job_skills,
        "matched_skills": matched_skills,
        "missing_skills": missing_skills,
        "resume_text": resume_text
    }
>>>>>>> f8fff86 (changes)
