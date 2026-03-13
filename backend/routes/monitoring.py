from fastapi import APIRouter, HTTPException, WebSocket, WebSocketDisconnect
from pydantic import BaseModel
from datetime import datetime
import uuid
from typing import Dict, List, Optional
from pipeline_db import db, Session, ActivityLog

router = APIRouter(prefix="/monitoring", tags=["monitoring"])

# In-memory storage for active WebSocket connections
# session_id -> List of active WebSocket connections (usually just the desktop)
active_connections: Dict[str, List[WebSocket]] = {}

class SessionCreate(BaseModel):
    candidate_email: str
    metadata: Optional[dict] = {}

class AIEvent(BaseModel):
    session_id: str
    device: str
    event: str
    confidence_score: float
    metadata: Optional[dict] = {}

class MobileConnect(BaseModel):
    session_id: str
    metadata: Optional[dict] = {}

@router.post("/sessions")
async def create_session(data: SessionCreate):
    session_id = str(uuid.uuid4())
    session = Session(
        session_id=session_id,
        candidate_email=data.candidate_email,
        desktop_connected=True,
        mobile_connected=False,
        start_time=datetime.now(),
        status="active",
        desktop_metadata=data.metadata
    )
    db.sessions.insert_one(session.dict())
    
    # Generate mobile link (in a real app, this would be a full URL)
    # Use window.location.origin in frontend, but here we hardcode for demo
    mobile_link = f"http://localhost:5173/mobile-monitoring/{session_id}"
    
    return {
        "session_id": session_id,
        "mobile_link": mobile_link
    }

@router.post("/mobile/connect")
async def mobile_connect(data: MobileConnect):
    session = db.sessions.find_one({"session_id": data.session_id})
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    
    db.sessions.update_one(
        {"session_id": data.session_id},
        {"$set": {
            "mobile_connected": True,
            "mobile_metadata": data.metadata
        }}
    )
    
    # Log the connection event
    log = ActivityLog(
        session_id=data.session_id,
        device="mobile",
        event="device_connected",
        confidence_score=1.0,
        timestamp=datetime.now(),
        metadata=data.metadata
    )
    db.activity_logs.insert_one(log.dict())
    
    # Notify desktop via WebSocket
    if data.session_id in active_connections:
        payload = {
            "type": "device_status",
            "payload": {
                "device": "mobile",
                "status": "connected",
                "timestamp": str(datetime.now())
            }
        }
        for connection in active_connections[data.session_id]:
            await connection.send_json(payload)
            
    return {"status": "connected"}

@router.get("/sessions/list")
async def list_sessions():
    sessions = list(db.sessions.find().sort("start_time", -1))
    for s in sessions:
        s["_id"] = str(s["_id"])
    return sessions

@router.get("/activity-logs")
async def get_all_activity_logs(limit: int = 50):
    logs = list(db.activity_logs.find().sort("timestamp", -1).limit(limit))
    for log in logs:
        log["_id"] = str(log["_id"])
    return logs

@router.get("/sessions/{session_id}/logs")
async def get_session_logs(session_id: str):
    logs = list(db.activity_logs.find({"session_id": session_id}).sort("timestamp", -1))
    for log in logs:
        log["_id"] = str(log["_id"])
    return logs

@router.get("/sessions/{session_id}")
async def get_session(session_id: str):
    session = db.sessions.find_one({"session_id": session_id})
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    session["_id"] = str(session["_id"])
    return session

@router.post("/events")
async def report_event(event: AIEvent):
    log = ActivityLog(
        session_id=event.session_id,
        device=event.device,
        event=event.event,
        confidence_score=event.confidence_score,
        timestamp=datetime.now(),
        metadata=event.metadata
    )
    db.activity_logs.insert_one(log.dict())
    
    # Update integrity score in session
    penalty = 0
    if event.event == "phone_detected": penalty = 20
    elif event.event == "multiple_person_detected": penalty = 15
    elif event.event == "multiple_face_detected": penalty = 15
    elif event.event == "looking_away": penalty = 5
    elif event.event == "tab_switch": penalty = 10
    
    if penalty > 0:
        db.sessions.update_one(
            {"session_id": event.session_id},
            {"$inc": {"integrity_score": -penalty}}
        )
    
    # Push alert to desktop client via WebSocket
    if event.session_id in active_connections:
        alert_payload = {
            "type": "suspicious_activity",
            "payload": {
                "session_id": event.session_id,
                "event_type": event.event,
                "device": event.device,
                "message": f"Alert: {event.event.replace('_', ' ').capitalize()}",
                "timestamp": str(datetime.now()),
                "confidence": event.confidence_score
            }
        }
        for connection in active_connections[event.session_id]:
            try:
                await connection.send_json(alert_payload)
            except Exception as e:
                print(f"Error sending WebSocket message: {e}")
    
    return {"status": "event_logged"}

@router.websocket("/ws/{session_id}")
async def websocket_endpoint(websocket: WebSocket, session_id: str):
    await websocket.accept()
    
    if session_id not in active_connections:
        active_connections[session_id] = []
    
    active_connections[session_id].append(websocket)
    
    # Update session status
    db.sessions.update_one(
        {"session_id": session_id},
        {"$set": {"desktop_connected": True}}
    )
    
    try:
        while True:
            # Keep connection alive and handle any client messages if needed
            data = await websocket.receive_text()
            # For now, we don't expect messages from the desktop client
            # but we could handle things like "tab_switch" here if sent via WS
    except WebSocketDisconnect:
        active_connections[session_id].remove(websocket)
        if not active_connections[session_id]:
            del active_connections[session_id]
        
        # Optionally update session status
        db.sessions.update_one(
            {"session_id": session_id},
            {"$set": {"desktop_connected": False}}
        )
