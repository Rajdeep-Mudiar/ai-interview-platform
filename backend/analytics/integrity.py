def calculate_proctoring_score(alerts):
    """
    Calculates a proctoring compliance score (0-100) based on alerts.
    High severity alerts deduct 15 points, medium deduct 5 points.
    """
    score = 100
    for alert in alerts:
        severity = alert.get("severity", "medium").lower()
        if severity == "high":
            score -= 15
        else:
            score -= 5
    
    return max(0, score)

def cheating_risk(warnings_count_or_score):
    # If it's a score (0-100)
    if isinstance(warnings_count_or_score, (int, float)) and warnings_count_or_score > 10:
        score = warnings_count_or_score
        if score >= 80: return "Low"
        if score >= 50: return "Medium"
        return "High"
    
    # Legacy support for warnings count
    warnings = warnings_count_or_score
    if warnings <= 2:
        return "Low"
    elif warnings <= 5:
        return "Medium"
    else:
        return "High"