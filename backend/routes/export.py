from fastapi import APIRouter, Response
from database.mongo import get_results_col
import pandas as pd
import io

router = APIRouter(prefix="/export", tags=["export"])

@router.get("/selected")
async def export_selected_candidates():
    """
    Exports candidates with 'ACCEPTED' status (Score >= 75 and Integrity >= 85) to CSV.
    """
    results_col = get_results_col()
    # Filter for ACCEPTED candidates
    query = {"recommendation": "ACCEPTED"}
    docs = list(results_col.find(query).sort("overall_score", -1))
    
    if not docs:
        return {"message": "No candidates meet the selection threshold yet."}

    # Prepare data for CSV
    data = []
    for doc in docs:
        data.append({
            "Name": doc.get("name"),
            "Email": doc.get("email"),
            "Job Title": doc.get("job_title"),
            "Final Score": f"{doc.get('overall_score')}%",
            "Integrity": f"{doc.get('integrity_score')}%",
            "Proctoring": f"{doc.get('proctoring_score')}%",
            "Status": doc.get("recommendation"),
            "Interview Date": doc.get("created_at").strftime("%Y-%m-%d %H:%M") if doc.get("created_at") else "N/A"
        })

    # Create DataFrame and convert to CSV
    df = pd.DataFrame(data)
    stream = io.StringIO()
    df.to_csv(stream, index=False)
    
    response = Response(content=stream.getvalue(), media_type="text/csv")
    response.headers["Content-Disposition"] = "attachment; filename=selected_candidates.csv"
    return response
