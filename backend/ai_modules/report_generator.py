from reportlab.lib.pagesizes import letter
from reportlab.lib import colors
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
import uuid
import os

def generate_report(data):
    """
    Generates a professional PDF report for a candidate.
    Expected data: {name, email, phone, job_title, overall_score, resume_score, 
                   interview_score, integrity_score, matched_skills, missing_skills, 
                   recommendation, suggestions}
    """
    # Ensure reports directory exists
    os.makedirs("reports", exist_ok=True)
    
    filename = f"report_{uuid.uuid4()}.pdf"
    path = f"reports/{filename}"
    
    doc = SimpleDocTemplate(path, pagesize=letter)
    styles = getSampleStyleSheet()
    story = []

    # Custom Styles
    title_style = ParagraphStyle(
        'TitleStyle',
        parent=styles['Heading1'],
        fontSize=24,
        textColor=colors.HexColor("#1e293b"),
        spaceAfter=20,
        alignment=1 # Center
    )
    
    header_style = ParagraphStyle(
        'HeaderStyle',
        parent=styles['Heading2'],
        fontSize=16,
        textColor=colors.HexColor("#334155"),
        spaceBefore=15,
        spaceAfter=10
    )

    # Title
    story.append(Paragraph("CareBridge AI Interview Report", title_style))
    story.append(Spacer(1, 12))

    # Candidate Info Table
    info_data = [
        ["Candidate Name:", data.get('name', 'N/A')],
        ["Email:", data.get('email', 'N/A')],
        ["Phone:", data.get('phone', 'N/A')],
        ["Applied Position:", data.get('job_title', 'N/A')],
        ["Report Date:", os.popen('date /t').read().strip() if os.name == 'nt' else os.popen('date').read().strip()]
    ]
    
    info_table = Table(info_data, colWidths=[120, 300])
    info_table.setStyle(TableStyle([
        ('TEXTCOLOR', (0, 0), (0, -1), colors.HexColor("#64748b")),
        ('FONTNAME', (0, 0), (0, -1), 'Helvetica-Bold'),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 8),
    ]))
    story.append(info_table)
    story.append(Spacer(1, 20))

    # Scores Section
    story.append(Paragraph("Assessment Scores", header_style))
    
    interview_display = data.get('interview_score', 0)
    # If it's a raw average (0-10), scale it to 100 for the report if needed, 
    # but the scoring logic already does some scaling. Let's just show it.
    
    scores_data = [
        ["Metric", "Score"],
        ["Overall Match", f"{data.get('overall_score', 0)}%"],
        ["Resume Fit", f"{data.get('resume_score', 0)}%"],
        ["Interview Performance", f"{round(interview_display * 10, 1)}%"],
        ["Integrity & Trust", f"{data.get('integrity_score', 0)}%"],
        ["Proctoring Compliance", f"{data.get('proctoring_score', 100)}%"]
    ]
    
    scores_table = Table(scores_data, colWidths=[200, 100])
    scores_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor("#f1f5f9")),
        ('TEXTCOLOR', (0, 0), (-1, 0), colors.HexColor("#1e293b")),
        ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
        ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
        ('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor("#cbd5e1")),
        ('PADDING', (0, 0), (-1, -1), 10),
    ]))
    story.append(scores_table)
    story.append(Spacer(1, 20))

    # Proctoring Section
    if data.get('proctoring_alerts'):
        story.append(Paragraph("Proctoring Alerts", header_style))
        alert_data = [["Type", "Message", "Severity", "Timestamp"]]
        for alert in data['proctoring_alerts']:
            alert_data.append([
                alert.get('type', 'N/A'),
                alert.get('message', 'N/A'),
                alert.get('severity', 'medium'),
                alert.get('timestamp', 'N/A')
            ])
        
        alert_table = Table(alert_data, colWidths=[100, 180, 70, 110])
        alert_table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor("#fee2e2")),
            ('TEXTCOLOR', (0, 0), (-1, 0), colors.HexColor("#991b1b")),
            ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
            ('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor("#fca5a5")),
            ('FONTSIZE', (0, 0), (-1, -1), 9),
            ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
        ]))
        story.append(alert_table)
        story.append(Spacer(1, 20))

    # Skills Section
    story.append(Paragraph("Skills Analysis", header_style))
    
    matched = ", ".join(data.get('matched_skills', [])) or "None detected"
    missing = ", ".join(data.get('missing_skills', [])) or "None identified"
    
    story.append(Paragraph(f"<b>Matched Skills:</b> {matched}", styles['Normal']))
    story.append(Spacer(1, 8))
    story.append(Paragraph(f"<b>Missing Skills:</b> {missing}", styles['Normal']))
    story.append(Spacer(1, 20))

    # Recommendation
    story.append(Paragraph("Hiring Recommendation", header_style))
    rec_color = "#16a34a" if "Hire" in data.get('recommendation', '') else "#dc2626"
    rec_style = ParagraphStyle('Rec', parent=styles['Normal'], textColor=colors.HexColor(rec_color), fontSize=12, fontName='Helvetica-Bold')
    story.append(Paragraph(data.get('recommendation', 'Pending'), rec_style))
    story.append(Spacer(1, 15))

    # AI Suggestions
    if data.get('suggestions'):
        story.append(Paragraph("AI Suggestions for Candidate", header_style))
        for suggestion in data['suggestions']:
            story.append(Paragraph(f"• {suggestion}", styles['Normal']))
            story.append(Spacer(1, 5))

    # Build PDF
    doc.build(story)
    return filename
