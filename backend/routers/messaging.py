"""
Messaging and notification routes.
Handles chat messages, notifications, and WebSocket connections.
"""

import json
from datetime import datetime
from typing import Annotated, List

from fastapi import APIRouter, Depends, HTTPException, status, WebSocket, WebSocketDisconnect
from bson import ObjectId

from security import get_current_user, get_current_user_from_token, serialize_document
from database import tasks_collection, messages_collection, notifications_collection


router = APIRouter(prefix="/api", tags=["messaging"])


# --- WebSocket Connection Manager ---
class ConnectionManager:
    """Manages WebSocket connections for real-time chat."""

    def __init__(self):
        self.active_connections: dict[str, List[WebSocket]] = {}

    async def connect(self, websocket: WebSocket, task_id: str):
        await websocket.accept()
        if task_id not in self.active_connections:
            self.active_connections[task_id] = []
        self.active_connections[task_id].append(websocket)

    def disconnect(self, websocket: WebSocket, task_id: str):
        if task_id in self.active_connections and websocket in self.active_connections[task_id]:
            self.active_connections[task_id].remove(websocket)

    async def broadcast(self, message: str, task_id: str):
        if task_id in self.active_connections:
            for connection in self.active_connections[task_id]:
                await connection.send_text(message)


manager = ConnectionManager()


# --- Message Endpoints ---
@router.get("/messages/{task_id}")
async def get_messages_for_task(
    task_id: str,
    current_user: Annotated[dict, Depends(get_current_user)]
):
    """Get chat history for a task."""
    try:
        task = tasks_collection.find_one({"_id": ObjectId(task_id)})
    except Exception:
        raise HTTPException(status_code=404, detail="Invalid Task ID format")

    if not task:
        raise HTTPException(status_code=404, detail="Task not found")

    # Only task participants can view messages
    if current_user["username"] not in [task.get("client_username"), task.get("tasker_username")]:
        raise HTTPException(
            status_code=403,
            detail="Not authorized to view these messages"
        )

    messages_cursor = messages_collection.find(
        {"task_id": task_id}).sort("timestamp", 1)
    return [serialize_document(msg) for msg in messages_cursor]


# --- Notification Endpoints ---
@router.get("/notifications")
async def get_my_notifications(current_user: Annotated[dict, Depends(get_current_user)]):
    """Get all notifications for current user."""
    notifications_cursor = notifications_collection.find({
        "user_to_notify": current_user["username"]
    }).sort("timestamp", -1)
    return [serialize_document(n) for n in notifications_cursor]


@router.put("/notifications/{notification_id}/read")
async def mark_notification_as_read(
    notification_id: str,
    current_user: Annotated[dict, Depends(get_current_user)]
):
    """Mark a notification as read."""
    try:
        notification = notifications_collection.find_one(
            {"_id": ObjectId(notification_id)})
    except Exception:
        raise HTTPException(
            status_code=404, detail="Invalid Notification ID format")

    if not notification:
        raise HTTPException(status_code=404, detail="Notification not found.")

    if notification["user_to_notify"] != current_user["username"]:
        raise HTTPException(
            status_code=403,
            detail="Not authorized to update this notification."
        )

    notifications_collection.update_one(
        {"_id": ObjectId(notification_id)},
        {"$set": {"is_read": True}}
    )
    return {"status": "success"}


# --- WebSocket Endpoint ---
# Note: This needs to be added to main.py directly since it's not under /api prefix
async def websocket_chat(websocket: WebSocket, task_id: str, token: str):
    """WebSocket endpoint for real-time chat."""
    user = await get_current_user_from_token(token)
    if not user:
        await websocket.close(code=status.WS_1008_POLICY_VIOLATION)
        return

    try:
        task = tasks_collection.find_one({"_id": ObjectId(task_id)})
    except Exception:
        await websocket.close(code=status.WS_1008_POLICY_VIOLATION)
        return

    if not task:
        await websocket.close(code=status.WS_1008_POLICY_VIOLATION)
        return

    # Only task participants can connect
    if user["username"] not in [task.get("client_username"), task.get("tasker_username")]:
        await websocket.close(code=status.WS_1008_POLICY_VIOLATION)
        return

    await manager.connect(websocket, task_id)
    try:
        while True:
            data = await websocket.receive_text()
            message_data = {
                "task_id": task_id,
                "sender_username": user["username"],
                "content": data,
                "timestamp": datetime.utcnow()
            }
            inserted_result = messages_collection.insert_one(message_data)
            created_message = messages_collection.find_one(
                {"_id": inserted_result.inserted_id})

            await manager.broadcast(
                json.dumps(serialize_document(created_message), default=str),
                task_id
            )
    except WebSocketDisconnect:
        manager.disconnect(websocket, task_id)
