def evaluate_answer(answer, question):

    answer = answer.lower()

    keyword_map = {

        "docker":["container","image","deployment","virtualization"],

        "aws":["ec2","cloud","instance","scaling"],

        "python":["function","object","library","script"],

        "sql":["query","database","join","index"],

        "machine learning":["model","training","data","algorithm"]

    }

    score = 0
    keywords_found = []

    for topic in keyword_map:

        if topic in question.lower():

            for word in keyword_map[topic]:

                if word in answer:

                    keywords_found.append(word)
                    score += 1

    final_score = min(10, score * 2)

    return {
        "score": final_score,
        "keywords_detected": keywords_found
    }

def generate_feedback(score):

    if score >= 8:
        return "Strong answer with good technical explanation."

    elif score >= 5:
        return "Average answer but needs more technical depth."

    else:
        return "Weak answer. Candidate should improve understanding."
    

def analyze_answer(answer, question):

    result = evaluate_answer(answer, question)

    feedback = generate_feedback(result["score"])

    return {
        "score": result["score"],
        "keywords": result["keywords_detected"],
        "feedback": feedback
    }