def analyze_emotions(emotions):
    nervous = emotions.count("fear") + emotions.count("sad")
    if nervous > len(emotions) * 0.4:
        return "Candidate appeared nervous"
    if emotions.count("happy") > len(emotions) * 0.4:
        return "Candidate appeared confident"
    return "Neutral emotional behaviour"
