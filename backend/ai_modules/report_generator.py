from reportlab.lib.pagesizes import letter
from reportlab.pdfgen import canvas
import uuid

def generate_report(data):
    filename = f"report_{uuid.uuid4()}.pdf"
    path = f"reports/{filename}"
    c = canvas.Canvas(path, pagesize=letter)
    y = 750
    c.drawString(200, y, "AI Interview Report")
    y -= 40
    c.drawString(50, y, f"Candidate: {data['name']}")
    y -= 30
    c.drawString(50, y, f"Resume Score: {data['resume_score']}%")
    y -= 20
    c.drawString(50, y, f"Interview Score: {data['interview_score']}%")
    y -= 20
    c.drawString(50, y, f"Integrity Score: {data['integrity_score']}%")
    y -= 40
    c.drawString(50, y, "Skills Detected:")
    y -= 20
    for skill in data["skills"]:
        c.drawString(70, y, skill)
        y -= 15
    y -= 20
    c.drawString(50, y, "Missing Skills:")
    y -= 20
    for skill in data["missing_skills"]:
        c.drawString(70, y, skill)
        y -= 15
    y -= 30
    c.drawString(50, y, f"Recommendation: {data['recommendation']}")
    c.save()
    return filename
