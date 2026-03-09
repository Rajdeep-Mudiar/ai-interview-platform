def resume_suggestions(missing_skills, resume_text):

    suggestions = []

    if len(missing_skills) > 0:
        suggestions.append(
            "Consider adding experience with: " + ", ".join(missing_skills)
        )

    if "project" not in resume_text.lower():
        suggestions.append(
            "Add project experience related to the job role"
        )

    if "achievement" not in resume_text.lower():
        suggestions.append(
            "Include measurable achievements (e.g., improved performance by 30%)"
        )

    if len(suggestions) == 0:
        suggestions.append("Your resume is well aligned with the job description")

    return suggestions