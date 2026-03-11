from sentence_transformers import SentenceTransformer
from sklearn.metrics.pairwise import cosine_similarity
import logging

logger = logging.getLogger(__name__)

# Global model holder for lazy loading
_model = None

def get_model():
    global _model
    if _model is None:
        logger.info("⏳ Loading SentenceTransformer model ('all-MiniLM-L6-v2')...")
        _model = SentenceTransformer('all-MiniLM-L6-v2')
        logger.info("✅ SentenceTransformer model loaded successfully.")
    return _model

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
    if not ideal:
        ideal = question
    
    # Lazy load the model on first use
    model = get_model()
    embeddings = model.encode([ideal, answer])
    similarity = cosine_similarity([embeddings[0]], [embeddings[1]])[0][0]
    score = round(similarity * 10, 2)
    if score > 10:
        score = 10
    return {
        "score": score,
        "similarity": round(similarity*100,2)
    }
