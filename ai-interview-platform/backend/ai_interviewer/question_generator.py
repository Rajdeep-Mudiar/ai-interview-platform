import random

QUESTION_BANK = {

"python":[
"Explain Python decorators.",
"What is the difference between lists and tuples?",
"How does Python handle memory management?"
],

"react":[
"What are React hooks?",
"Explain useEffect.",
"What is virtual DOM?"
],

"machine learning":[
"What is overfitting?",
"Explain supervised vs unsupervised learning.",
"What is gradient descent?"
],

"sql":[
"What is indexing in SQL?",
"Explain joins in SQL.",
"How do you optimize slow queries?"
],

"docker":[
"What is Docker and how does it work?",
"Difference between Docker image and container?",
"How would you deploy an application using Docker?"
],

"aws":[
"What is AWS EC2?",
"What is S3 used for?",
"Explain AWS auto-scaling."
]

}

def generate_questions(missing_skills, matched_skills):
    questions = []
    # Ask about missing skills first
    for skill in missing_skills:
        if skill in QUESTION_BANK:
            questions.append(random.choice(QUESTION_BANK[skill]))
    # Ask about known skills
    for skill in matched_skills:
        if skill in QUESTION_BANK:
            questions.append(random.choice(QUESTION_BANK[skill]))
    return questions[:5]