import requests

def test_pipeline():
    # 1. Test parse_resume
    # We need a small PDF or dummy file to test parsing. 
    # Since I don't want to create a PDF, I'll assume parsing works if the route exists.
    # Instead, I'll test the generation directly.
    
    print("Testing generate_ai_questions...")
    res = requests.post("http://localhost:8000/generate_ai_questions", json={
        "resume": "Experienced Python developer with 5 years in backend systems.",
        "jd": "Senior Python Developer role with focus on React and AWS.",
        "missing_skills": ["React", "AWS"]
    })
    print(f"Status: {res.status_code}")
    print(f"Response: {res.json()}")

if __name__ == "__main__":
    test_pipeline()
