import random

QUESTION_BANK = {
"python":[
"Explain Python decorators.",
"What is the difference between list and tuple in Python?",
"How does Python memory management work?"
],

"react":[
"What are React hooks?",
"Explain the Virtual DOM in React.",
"What is the difference between state and props?"
],

"sql":[
"What is SQL indexing?",
"Explain JOIN types in SQL.",
"How does query optimization work?"
],

"machine learning":[
"What is overfitting in machine learning?",
"Explain the difference between supervised and unsupervised learning.",
"Describe a machine learning model you have built."
],

"docker":[
"What problem does Docker solve?",
"Explain containers vs virtual machines.",
"How does Docker improve deployment?"
]
}

def generate_questions(skills):
    questions = []
    for skill in skills:
        if skill in QUESTION_BANK:
            q = random.choice(QUESTION_BANK[skill])
            questions.append(q)
    return questions[:5]
