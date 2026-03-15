from fastapi import APIRouter, HTTPException, WebSocket, WebSocketDisconnect
from pydantic import BaseModel
from datetime import datetime
import os
import socket
import uuid
from urllib.parse import urlparse, urlunparse
from typing import Dict, List, Optional
from pymongo.errors import PyMongoError
from pipeline_db import db, Session, ActivityLog

router = APIRouter(prefix="/monitoring", tags=["monitoring"])

# In-memory storage for active WebSocket connections
# session_id -> List of active WebSocket connections (usually just the desktop)
active_connections: Dict[str, List[WebSocket]] = {}


def raise_db_unavailable(exc: Exception) -> None:
    raise HTTPException(status_code=503, detail=f"Monitoring database unavailable: {exc}")


def get_local_ip_address() -> str:
    sock = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
    try:
        sock.connect(("8.8.8.8", 80))
        return sock.getsockname()[0]
    except OSError:
        return "127.0.0.1"
    finally:
        sock.close()


def build_mobile_link(session_id: str) -> str:
    base_url = os.getenv("MOBILE_MONITORING_BASE_URL", "").strip().rstrip("/")
    if base_url:
        try:
            parsed = urlparse(base_url)
            if parsed.hostname in {"localhost", "127.0.0.1"}:
                ip_address = get_local_ip_address()
                netloc = f"{ip_address}:{parsed.port}" if parsed.port else ip_address
                parsed = parsed._replace(netloc=netloc)
                base_url = urlunparse(parsed).rstrip("/")
        except Exception:
            pass
        return f"{base_url}/mobile-monitoring/{session_id}"

    ip_address = get_local_ip_address()
    return f"http://{ip_address}:5173/mobile-monitoring/{session_id}"

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
    try:
        db.sessions.insert_one(session.dict())
    except PyMongoError as exc:
        raise_db_unavailable(exc)
    
    mobile_link = build_mobile_link(session_id)
    
    return {
        "session_id": session_id,
        "mobile_link": mobile_link
    }

@router.post("/mobile/connect")
async def mobile_connect(data: MobileConnect):
    try:
        session = db.sessions.find_one({"session_id": data.session_id})
    except PyMongoError as exc:
        raise_db_unavailable(exc)
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    
    try:
        db.sessions.update_one(
            {"session_id": data.session_id},
            {"$set": {
                "mobile_connected": True,
                "mobile_metadata": data.metadata
            }}
        )
    except PyMongoError as exc:
        raise_db_unavailable(exc)
    
    # Log the connection event
    log = ActivityLog(
        session_id=data.session_id,
        device="mobile",
        event="device_connected",
        confidence_score=1.0,
        timestamp=datetime.now(),
        metadata=data.metadata
    )
    try:
        db.activity_logs.insert_one(log.dict())
    except PyMongoError as exc:
        raise_db_unavailable(exc)
    
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
    try:
        sessions = list(db.sessions.find().sort("start_time", -1))
    except PyMongoError as exc:
        raise_db_unavailable(exc)
    for s in sessions:
        s["_id"] = str(s["_id"])
    return sessions

@router.get("/activity-logs")
async def get_all_activity_logs(limit: int = 50):
    try:
        logs = list(db.activity_logs.find().sort("timestamp", -1).limit(limit))
    except PyMongoError as exc:
        raise_db_unavailable(exc)
    for log in logs:
        log["_id"] = str(log["_id"])
    return logs

@router.get("/sessions/{session_id}/logs")
async def get_session_logs(session_id: str):
    try:
        logs = list(db.activity_logs.find({"session_id": session_id}).sort("timestamp", -1))
    except PyMongoError as exc:
        raise_db_unavailable(exc)
    for log in logs:
        log["_id"] = str(log["_id"])
    return logs

@router.get("/sessions/{session_id}")
async def get_session(session_id: str):
    try:
        session = db.sessions.find_one({"session_id": session_id})
    except PyMongoError as exc:
        raise_db_unavailable(exc)
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
    try:
        db.activity_logs.insert_one(log.dict())
    except PyMongoError as exc:
        raise_db_unavailable(exc)
    
    # Update integrity score in session
    penalty = 0
    if event.event == "phone_detected": penalty = 20
    elif event.event == "multiple_person_detected": penalty = 15
    elif event.event == "multiple_face_detected": penalty = 15
    elif event.event == "looking_away": penalty = 5
    elif event.event == "tab_switch": penalty = 10
    
    if penalty > 0:
        try:
            db.sessions.update_one(
                {"session_id": event.session_id},
                {"$inc": {"integrity_score": -penalty}}
            )
        except PyMongoError as exc:
            raise_db_unavailable(exc)
    
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
    try:
        db.sessions.update_one(
            {"session_id": session_id},
            {"$set": {"desktop_connected": True}}
        )
    except PyMongoError:
        await websocket.close(code=1011)
        return
    
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
        try:
            db.sessions.update_one(
                {"session_id": session_id},
                {"$set": {"desktop_connected": False}}
            )
        except PyMongoError:
            pass
