import json

def save_candidate(data):

    with open("candidates.json","a") as f:
        f.write(json.dumps(data))
        f.write("\n")