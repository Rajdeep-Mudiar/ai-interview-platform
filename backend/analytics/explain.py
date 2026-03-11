def generate_explanation(resume_score, interview_score, missing_skills, cheating_risk):

    reasons = []

    if resume_score < 60:
        reasons.append("Low resume match with job description")

    if interview_score < 5:
        reasons.append("Weak interview performance")

    if len(missing_skills) > 0:
        reasons.append(
            "Missing important skills: " + ", ".join(missing_skills)
        )

    if cheating_risk == "High":
        reasons.append("Suspicious behaviour detected during interview")

    if len(reasons) == 0:
        reasons.append("Candidate meets most requirements")

    return reasons