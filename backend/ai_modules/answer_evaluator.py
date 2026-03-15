from sentence_transformers import SentenceTransformer
from sklearn.metrics.pairwise import cosine_similarity

model = SentenceTransformer('all-MiniLM-L6-v2')

IDEAL_ANSWERS = {
    "react hooks":
        "React hooks allow functional components to use state and lifecycle features like useState and useEffect.",
    "virtual dom":
        "The Virtual DOM is a lightweight copy of the real DOM used by React to efficiently update UI using a diffing algorithm.",
    "sql joins":
        "SQL joins combine rows from multiple tables using relationships like INNER JOIN, LEFT JOIN, RIGHT JOIN."
}

def evaluate_answer(question, answer):
    ideal = None
    for key in IDEAL_ANSWERS:
        if key in question.lower():
            ideal = IDEAL_ANSWERS[key]
            break
    if not ideal:
        return {
            "score": 0,
            "similarity": 0
        }
    embeddings = model.encode([ideal, answer])
    similarity = cosine_similarity([embeddings[0]], [embeddings[1]])[0][0]
    score = min(round(similarity * 10, 2), 10)
    return {
        "score": score,
        "similarity": round(similarity * 100, 2)
    }
