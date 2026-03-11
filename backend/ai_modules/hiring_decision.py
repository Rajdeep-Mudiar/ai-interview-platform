def get_hiring_decision(resume_score, interview_score, integrity_score):
    final_score = (resume_score * 0.4) + (interview_score * 0.4) + (integrity_score * 0.2)
    if final_score >= 85:
        decision = "Strong Hire"
    elif final_score >= 70:
        decision = "Hire"
    elif final_score >= 55:
        decision = "Hold"
    else:
        decision = "Reject"
    return {
        "final_score": round(final_score,2),
        "decision": decision
    }
