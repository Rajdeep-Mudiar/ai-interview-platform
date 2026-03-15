import random

QUESTION_BANK = {
    "python": [
        "Explain Python decorators.",
        "What is the difference between list and tuple in Python?",
        "How does Python memory management work?"
    ],
    "react": [
        "What are React hooks?",
        "Explain the Virtual DOM in React.",
        "What is the difference between state and props?"
    ],
    "sql": [
        "What is SQL indexing?",
        "Explain JOIN types in SQL.",
        "How does query optimization work?"
    ],
    "machine learning": [
        "What is overfitting in machine learning?",
        "Explain the difference between supervised and unsupervised learning.",
        "Describe a machine learning model you have built."
    ],
    "docker": [
        "What problem does Docker solve?",
        "Explain containers vs virtual machines.",
        "How does Docker improve deployment?"
    ]
}

DEFAULT_QUESTIONS = [
    "Tell me about a challenging project you've worked on recently.",
    "How do you stay up-to-date with new technologies and industry trends?",
    "Describe a situation where you had to work with a difficult team member.",
    "What are your core strengths as a software developer?",
    "How do you approach debugging a complex problem?"
]

def generate_questions(skills):
    questions = []
    # Normalize skills to lowercase for better matching
    skills = [s.lower() for s in skills]
    
    for skill in skills:
        # Check for partial matches too
        matched_skill = next((k for k in QUESTION_BANK.keys() if k in skill or skill in k), None)
        if matched_skill:
            q = random.choice(QUESTION_BANK[matched_skill])
            if q not in questions:
                questions.append(q)
    
    # If no skills matched or we need more questions, add from default
    while len(questions) < 3:
        q = random.choice(DEFAULT_QUESTIONS)
        if q not in questions:
            questions.append(q)
            
    return questions[:5]

def generate_questions_with_count(skills, count):
    questions = []
    for skill in skills:
        if skill in QUESTION_BANK:
            q = random.choice(QUESTION_BANK[skill])
            questions.append(q)
    return questions[:count]

def add_question(skill, question):
    if skill in QUESTION_BANK:
        QUESTION_BANK[skill].append(question)
    else:
        QUESTION_BANK[skill] = [question]
