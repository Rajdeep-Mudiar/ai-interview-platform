import subprocess
from typing import List


def generate_ai_resume_suggestions(resume: str, missing_skills: List[str] | None = None) -> list[str]:
    """
    Use an Ollama model to generate resume improvement suggestions
    tailored to the candidate's resume (and optionally missing skills).
    """
    missing_text = ", ".join(missing_skills or [])

    prompt = f"""
You are an expert resume coach helping a candidate improve their resume.

Candidate Resume:
{resume}

Key missing or desired skills (if any):
{missing_text or "None explicitly listed"}

Give 5 specific, actionable suggestions to improve this resume for a technical role.
Return them as a simple numbered or bulleted list, one suggestion per line, without any extra commentary.
"""

    result = subprocess.run(
        ["ollama", "generate", "phi", "--prompt", prompt],
        capture_output=True,
        text=True,
    )

    text = result.stdout.strip()

    # If the model failed to respond, return an empty list so the caller can fall back
    if not text:
        return []

    # Split into individual suggestions, stripping bullets / numbers
    suggestions: list[str] = []
    for line in text.splitlines():
        cleaned = line.strip()
        if not cleaned:
            continue
        # Remove leading bullets or numbering like "1." or "- "
        if cleaned[0] in "-•*":
            cleaned = cleaned[1:].strip()
        if len(cleaned) > 2 and cleaned[1] == "." and cleaned[0].isdigit():
            cleaned = cleaned[2:].strip()
        suggestions.append(cleaned)

    return suggestions

