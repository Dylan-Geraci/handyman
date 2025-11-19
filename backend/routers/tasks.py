"""
Task management routes.
Handles task creation, listing, accepting, completing, and AI search.
"""

import json
from typing import Annotated, List, Optional

from fastapi import APIRouter, Depends, HTTPException, status
from bson import ObjectId

from security import get_current_user, serialize_document
from config import gemini_model
from database import tasks_collection, users_collection, notifications_collection
from models import Task, Notification, AISearchQuery, UserPublic


router = APIRouter(prefix="/api", tags=["tasks"])


# --- AI Search ---
@router.post("/taskers/ai-search", response_model=List[UserPublic])
async def ai_search_taskers(
    query: AISearchQuery,
    current_user: Annotated[dict, Depends(get_current_user)]
):
    """Search for taskers using AI to parse natural language queries."""
    if not gemini_model:
        raise HTTPException(
            status_code=500,
            detail="Gemini API is not configured. Please check your API key."
        )
    if current_user["role"] != "client":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only clients can search for taskers."
        )

    prompt = f"""
    Analyze the following client request: "{query.query}"
    Extract the `skills` (as a list of lowercase strings) and the `location` (as a string).
    Return ONLY a valid JSON object. Example: {{"skills": ["plumbing", "faucet repair"], "location": "Fullerton"}}
    """

    try:
        response = gemini_model.generate_content(prompt)
        json_text = response.text.strip().replace(
            "```json", "").replace("```", "").strip()
        entities = json.loads(json_text)
        skills = [skill.lower() for skill in entities.get("skills", [])]
        location = entities.get("location")
    except Exception as e:
        raise HTTPException(
            status_code=500, detail=f"Failed to process AI query: {e}")

    mongo_query = {"role": "tasker"}
    if skills:
        mongo_query["skills"] = {"$all": skills}
    if location:
        mongo_query["location"] = {"$regex": location, "$options": "i"}

    taskers_cursor = users_collection.find(mongo_query)
    return [UserPublic(**tasker) for tasker in taskers_cursor]


# --- Task CRUD ---
@router.post("/tasks", status_code=status.HTTP_201_CREATED)
async def create_task(
    task: Task,
    current_user: Annotated[dict, Depends(get_current_user)]
):
    """Create a new task (clients only)."""
    if current_user["role"] != "client":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only clients can create tasks."
        )

    task_data = task.dict()
    task_data["client_username"] = current_user["username"]

    tasks_collection.insert_one(task_data)
    return serialize_document(task_data)


@router.get("/tasks")
async def get_open_tasks(
    current_user: Annotated[dict, Depends(get_current_user)],
    location: Optional[str] = None,
    q: Optional[str] = None
):
    """Get open tasks (taskers only). Supports location and keyword filters."""
    if current_user["role"] != "tasker":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only taskers can view open tasks."
        )

    query = {"status": "open"}
    if location:
        query["location"] = {"$regex": location, "$options": "i"}
    if q:
        query["$or"] = [
            {"title": {"$regex": q, "$options": "i"}},
            {"description": {"$regex": q, "$options": "i"}}
        ]

    tasks_cursor = tasks_collection.find(query)
    return [serialize_document(task) for task in tasks_cursor]


@router.put("/tasks/{task_id}/accept")
async def accept_task(
    task_id: str,
    current_user: Annotated[dict, Depends(get_current_user)]
):
    """Accept a task (taskers only)."""
    if current_user["role"] != "tasker":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only taskers can accept tasks."
        )

    try:
        task = tasks_collection.find_one(
            {"_id": ObjectId(task_id), "status": "open"})
    except Exception:
        raise HTTPException(status_code=404, detail="Invalid Task ID format")

    if not task:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Task not found or has already been accepted."
        )

    update_data = {
        "$set": {
            "status": "in_progress",
            "tasker_username": current_user["username"]
        }
    }
    tasks_collection.update_one({"_id": ObjectId(task_id)}, update_data)

    # Notify the client
    notification_for_client = Notification(
        user_to_notify=task["client_username"],
        message=f"Your task '{task['title']}' has been accepted by {current_user['full_name']}.",
        link=f"/tasks/{task_id}/chat"
    )
    notifications_collection.insert_one(notification_for_client.dict())

    updated_task = tasks_collection.find_one({"_id": ObjectId(task_id)})
    return serialize_document(updated_task)


@router.put("/tasks/{task_id}/complete")
async def complete_task(
    task_id: str,
    current_user: Annotated[dict, Depends(get_current_user)]
):
    """Mark a task as complete (clients only)."""
    try:
        task = tasks_collection.find_one({"_id": ObjectId(task_id)})
    except Exception:
        raise HTTPException(status_code=404, detail="Invalid Task ID format")

    if not task:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Task not found."
        )

    if task.get("client_username") != current_user["username"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You can only complete your own tasks."
        )

    update_data = {"$set": {"status": "completed"}}
    tasks_collection.update_one({"_id": ObjectId(task_id)}, update_data)

    # Notify the tasker
    if task.get("tasker_username"):
        notification_for_tasker = Notification(
            user_to_notify=task["tasker_username"],
            message=f"The task '{task['title']}' has been marked as complete by the client.",
            link=f"/taskers/{task['tasker_username']}"
        )
        notifications_collection.insert_one(notification_for_tasker.dict())

    updated_task = tasks_collection.find_one({"_id": ObjectId(task_id)})
    return serialize_document(updated_task)


# --- My Tasks ---
@router.get("/my-client-tasks")
async def get_my_client_tasks(current_user: Annotated[dict, Depends(get_current_user)]):
    """Get all tasks created by the current client."""
    if current_user["role"] != "client":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied."
        )
    tasks_cursor = tasks_collection.find(
        {"client_username": current_user["username"]})
    return [serialize_document(task) for task in tasks_cursor]


@router.get("/my-tasker-tasks")
async def get_my_tasker_tasks(current_user: Annotated[dict, Depends(get_current_user)]):
    """Get all tasks accepted by the current tasker."""
    if current_user["role"] != "tasker":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied."
        )
    tasks_cursor = tasks_collection.find(
        {"tasker_username": current_user["username"]})
    return [serialize_document(task) for task in tasks_cursor]
