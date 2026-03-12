def calculate_final_score(resume_score, interview_score, integrity_score, proctoring_score=100.0):
    # Calculate weighted average of technical scores
    technical_base = (resume_score * 0.4) + (interview_score * 10 * 0.6)
    
    # Calculate integrity/proctoring penalty
    integrity_penalty = (100 - integrity_score) * 0.2
    proctoring_penalty = (100 - proctoring_score) * 0.3
    
    final = technical_base - integrity_penalty - proctoring_penalty
    final = max(0, min(100, final))

    # Threshold-based Hiring Decision
    # PASS: Final Score >= 60 AND Integrity >= 75
    if final >= 75 and integrity_score >= 85:
        recommendation = "ACCEPTED"
    elif final >= 60 and integrity_score >= 70:
        recommendation = "Consider"
    else:
        recommendation = "REJECT"

    return {
        "final_score": round(final, 2),
        "recommendation": recommendation
    }