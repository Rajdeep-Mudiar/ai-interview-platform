DECISION_THRESHOLDS = {
    "Strong Hire": 85,
    "Hire": 70,
    "Hold": 55,
}

def get_hiring_decision(resume_score, interview_score, integrity_score):
    final_score = (resume_score * 0.4) + (interview_score * 0.4) + (integrity_score * 0.2)
    decision = "Reject"
    for d, t in DECISION_THRESHOLDS.items():
        if final_score >= t:
            decision = d
            break
    return {
        "final_score": round(final_score, 2),
        "decision": decision
    }

def get_hiring_decision_with_weights(resume_score, interview_score, integrity_score, weights):
    final_score = (resume_score * weights['resume']) + (interview_score * weights['interview']) + (integrity_score * weights['integrity'])
    decision = "Reject"
    for d, t in DECISION_THRESHOLDS.items():
        if final_score >= t:
            decision = d
            break
    return {
        "final_score": round(final_score, 2),
        "decision": decision
    }
