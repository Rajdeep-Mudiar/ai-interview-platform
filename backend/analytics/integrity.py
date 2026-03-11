def cheating_risk(warnings):

    if warnings <= 2:
        return "Low"

    elif warnings <= 5:
        return "Medium"

    else:
        return "High"