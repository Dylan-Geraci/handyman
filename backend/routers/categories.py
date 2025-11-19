"""
Category and Task Type routes.
Handles browsing categories, task types, and searching.
These are PUBLIC endpoints - no authentication required.
"""

from typing import List, Optional

from fastapi import APIRouter, HTTPException, Query
from bson import ObjectId

from database import categories_collection, task_types_collection
from models import CategoryResponse, TaskTypeResponse
from security import serialize_document


router = APIRouter(prefix="/api", tags=["categories"])


# --- Category Endpoints ---

@router.get("/categories", response_model=List[CategoryResponse])
def get_all_categories():
    """
    Get all service categories.

    Returns a list of all categories (Assembly, Cleaning, etc.)
    that users can browse to find services.

    This is a PUBLIC endpoint - no authentication required.
    """
    categories_cursor = categories_collection.find({})

    categories = []
    for cat in categories_cursor:
        categories.append(CategoryResponse(
            id=str(cat["_id"]),
            name=cat["name"],
            description=cat["description"],
            icon_url=cat.get("icon_url")
        ))

    return categories


@router.get("/categories/{category_id}", response_model=CategoryResponse)
def get_category_by_id(category_id: str):
    """
    Get a single category by ID.

    Returns the category details for a specific category.
    Useful when displaying a category page or its task types.

    This is a PUBLIC endpoint - no authentication required.
    """
    try:
        category = categories_collection.find_one({"_id": ObjectId(category_id)})
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid category ID format")

    if not category:
        raise HTTPException(status_code=404, detail="Category not found")

    return CategoryResponse(
        id=str(category["_id"]),
        name=category["name"],
        description=category["description"],
        icon_url=category.get("icon_url")
    )


@router.get("/categories/{category_id}/task-types", response_model=List[TaskTypeResponse])
def get_task_types_by_category(category_id: str):
    """
    Get all task types for a specific category.

    Example: GET /api/categories/{assembly_id}/task-types
    Returns: Furniture Assembly, Crib Assembly, Desk Assembly, etc.

    This is the "dropdown" that appears when a user clicks a category.

    This is a PUBLIC endpoint - no authentication required.
    """
    # First verify the category exists
    try:
        category = categories_collection.find_one({"_id": ObjectId(category_id)})
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid category ID format")

    if not category:
        raise HTTPException(status_code=404, detail="Category not found")

    # Get all task types for this category
    task_types_cursor = task_types_collection.find({"category_id": category_id})

    task_types = []
    for tt in task_types_cursor:
        task_types.append(TaskTypeResponse(
            id=str(tt["_id"]),
            name=tt["name"],
            description=tt["description"],
            category_id=tt["category_id"],
            keywords=tt.get("keywords", [])
        ))

    return task_types


# --- Task Type Endpoints ---

@router.get("/task-types", response_model=List[TaskTypeResponse])
def get_all_task_types(category_id: Optional[str] = None):
    """
    Get all task types, optionally filtered by category.

    Query params:
    - category_id: Filter to only task types in this category

    Example: GET /api/task-types?category_id=abc123
    Returns all task types, or just those in the specified category.

    This is a PUBLIC endpoint - no authentication required.
    """
    query = {}
    if category_id:
        query["category_id"] = category_id

    task_types_cursor = task_types_collection.find(query)

    task_types = []
    for tt in task_types_cursor:
        task_types.append(TaskTypeResponse(
            id=str(tt["_id"]),
            name=tt["name"],
            description=tt["description"],
            category_id=tt["category_id"],
            keywords=tt.get("keywords", [])
        ))

    return task_types


@router.get("/task-types/search", response_model=List[TaskTypeResponse])
def search_task_types(q: str = Query(..., min_length=1, description="Search query")):
    """
    Search task types by name or keywords.

    This powers the search bar functionality.
    Example: GET /api/task-types/search?q=furniture
    Returns: Furniture Assembly, Outdoor Furniture Assembly, etc.

    Searches both the task type name and keywords array.

    This is a PUBLIC endpoint - no authentication required.
    """
    # Search in name and keywords using regex (case-insensitive)
    query = {
        "$or": [
            {"name": {"$regex": q, "$options": "i"}},
            {"keywords": {"$regex": q, "$options": "i"}}
        ]
    }

    task_types_cursor = task_types_collection.find(query)

    task_types = []
    for tt in task_types_cursor:
        task_types.append(TaskTypeResponse(
            id=str(tt["_id"]),
            name=tt["name"],
            description=tt["description"],
            category_id=tt["category_id"],
            keywords=tt.get("keywords", [])
        ))

    return task_types


@router.get("/task-types/{task_type_id}", response_model=TaskTypeResponse)
def get_task_type_by_id(task_type_id: str):
    """
    Get a single task type by ID.

    Returns full details of a specific task type.
    Useful when pre-filling task creation forms.

    This is a PUBLIC endpoint - no authentication required.
    """
    try:
        task_type = task_types_collection.find_one({"_id": ObjectId(task_type_id)})
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid task type ID format")

    if not task_type:
        raise HTTPException(status_code=404, detail="Task type not found")

    return TaskTypeResponse(
        id=str(task_type["_id"]),
        name=task_type["name"],
        description=task_type["description"],
        category_id=task_type["category_id"],
        keywords=task_type.get("keywords", [])
    )
