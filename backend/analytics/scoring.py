def calculate_final_score(resume_score, interview_score, cheating_flags):

    cheating_penalty = cheating_flags * 5

    final = (
        (resume_score * 0.4) +
        (interview_score * 10 * 0.6)
    ) - cheating_penalty

    final = max(0, min(100, final))

    if final >= 80:
        recommendation = "Strong Hire"

    elif final >= 60:
        recommendation = "Consider"

    else:
        recommendation = "Reject"

    return {
        "final_score": round(final,2),
        "recommendation": recommendation
    }