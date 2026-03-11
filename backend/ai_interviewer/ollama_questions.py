import subprocess

def generate_ai_questions(resume, jd, missing_skills):

    prompt = f"""
You are an AI technical interviewer.

Candidate Resume:
{resume}

Job Description:
{jd}

Missing Skills:
{missing_skills}

Generate 5 technical interview questions tailored for this candidate.
"""

    # Run Phi model via Ollama
    result = subprocess.run(
        ["ollama", "generate", "phi", "--prompt", prompt],
        capture_output=True,
        text=True
    )

    text = result.stdout.strip()

    # Split and clean lines
    questions = [q.strip() for q in text.split("\n") if q.strip()]

    return questions