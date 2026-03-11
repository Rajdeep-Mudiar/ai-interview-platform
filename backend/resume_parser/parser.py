from pdfminer.high_level import extract_text
import spacy

nlp = spacy.load("en_core_web_sm")

SKILL_KEYWORDS = [
"python","java","react","node","machine learning",
"deep learning","sql","javascript","html","css"
]

def parse_resume(file_path):

    text = extract_text(file_path)

    doc = nlp(text)

    skills = []

    for token in doc:

        if token.text.lower() in SKILL_KEYWORDS:
            skills.append(token.text)

    return {
        "skills":list(set(skills))
    }