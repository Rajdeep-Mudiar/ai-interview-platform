def calculate_final_score(resume_score, interview_score, integrity_score, proctoring_score=100.0):
    # Calculate weighted average of technical scores
    technical_base = (resume_score * 0.4) + (interview_score * 10 * 0.6)
    
    # Calculate integrity/proctoring penalty
    # 100% integrity/proctoring = 0 penalty. 
    # Each point below 100 results in a small deduction from the final score.
    integrity_penalty = (100 - integrity_score) * 0.2
    proctoring_penalty = (100 - proctoring_score) * 0.3
    
    final = technical_base - integrity_penalty - proctoring_penalty
    final = max(0, min(100, final))

    if final >= 80:
        recommendation = "Strong Hire"
    elif final >= 60:
        recommendation = "Consider"
    else:
        recommendation = "Reject"

    return {
        "final_score": round(final, 2),
        "recommendation": recommendation
    }