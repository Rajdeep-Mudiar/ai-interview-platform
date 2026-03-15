def resume_suggestions(missing_skills, resume_text):
    suggestions = []
    resume_lower = resume_text.lower()

    if len(missing_skills) > 0:
        # Limit to top 5 missing skills to avoid overwhelming the user
        top_missing = missing_skills[:5]
        suggestions.append(
            f"Bridge the skill gap by highlighting experience with: {', '.join(top_missing)}."
        )
        if len(missing_skills) > 5:
            suggestions.append(
                f"You also have {len(missing_skills) - 5} other missing technical keywords found in the JD."
            )

    # Contextual suggestions based on resume content
    if "project" not in resume_lower and "portfolio" not in resume_lower:
        suggestions.append(
            "Showcase your practical expertise by adding a 'Projects' section with links to GitHub or live demos."
        )

    if not any(word in resume_lower for word in ["achievement", "improved", "reduced", "increased", "delivered", "spearheaded"]):
        suggestions.append(
            "Use strong action verbs and quantify your impact (e.g., 'Improved system latency by 20%') to stand out to recruiters."
        )

    if len(resume_text.split()) < 200:
        suggestions.append(
            "Your resume seems a bit brief. Consider expanding on your responsibilities and technical contributions for each role."
        )

    if len(suggestions) == 0:
        suggestions.append("Outstanding! Your resume is highly optimized for this specific job description.")

    return suggestions