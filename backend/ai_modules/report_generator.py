from reportlab.lib.pagesizes import letter
from reportlab.pdfgen import canvas
import uuid
import os

REPORTS_DIR = "reports"

HEADING_X = 200
START_Y = 750
LINE_HEIGHT = 20

def generate_report(data):
    if not os.path.exists(REPORTS_DIR):
        os.makedirs(REPORTS_DIR)
    filename = f"report_{uuid.uuid4()}.pdf"
    path = os.path.join(REPORTS_DIR, filename)
    try:
        c = canvas.Canvas(path, pagesize=letter)
        y = START_Y
        c.drawString(HEADING_X, y, "AI Interview Report")
        y -= LINE_HEIGHT * 2
        c.drawString(50, y, f"Candidate: {data['name']}")
        y -= LINE_HEIGHT * 1.5
        c.drawString(50, y, f"Resume Score: {data['resume_score']}%")
        y -= LINE_HEIGHT
        c.drawString(50, y, f"Interview Score: {data['interview_score']}%")
        y -= LINE_HEIGHT
        c.drawString(50, y, f"Integrity Score: {data['integrity_score']}%")
        y -= LINE_HEIGHT * 2
        c.drawString(50, y, "Skills Detected:")
        y -= LINE_HEIGHT
        for skill in data["skills"]:
            c.drawString(70, y, skill)
            y -= 15
        y -= LINE_HEIGHT
        c.drawString(50, y, "Missing Skills:")
        y -= LINE_HEIGHT
        for skill in data["missing_skills"]:
            c.drawString(70, y, skill)
            y -= 15
        y -= LINE_HEIGHT * 1.5
        c.drawString(50, y, f"Recommendation: {data['recommendation']}")
        c.save()
        return filename
    except Exception as e:
        print(f"Error generating report: {e}")
        return None
