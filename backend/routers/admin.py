"""
Admin and public content routes.
Handles services, portfolio, contact requests, tasker profiles, and reviews.
"""

from typing import Annotated, Optional

from fastapi import APIRouter, Depends, HTTPException, status
from bson import ObjectId

from security import get_current_user, serialize_document
from database import (
    services_collection,
    portfolio_collection,
    contact_requests_collection,
    users_collection,
    reviews_collection,
    categories_collection
)
from models import Service, PortfolioItem, ContactRequest, Review, UserPublic


router = APIRouter(prefix="/api", tags=["admin"])


# --- Public Endpoints ---
@router.get("/services")
def get_services():
    """Get all services (public)."""
    services_cursor = services_collection.find({})
    return [serialize_document(service) for service in services_cursor]


@router.get("/portfolio")
def get_portfolio():
    """Get all portfolio items (public)."""
    portfolio_cursor = portfolio_collection.find({})
    return [serialize_document(item) for item in portfolio_cursor]


@router.post("/contact")
def submit_contact_request(request: ContactRequest):
    """Submit a contact request (public)."""
    contact_requests_collection.insert_one(request.dict())
    return {"status": "success", "message": "Your message has been sent!"}


@router.get("/taskers/{username}")
def get_tasker_profile(username: str):
    """Get a tasker's public profile with populated service categories."""
    user = users_collection.find_one({"username": username, "role": "tasker"})
    if not user:
        raise HTTPException(status_code=404, detail="Tasker not found")

    # Populate service_categories with full category objects
    if user.get("service_categories"):
        populated_categories = []
        for category_id in user["service_categories"]:
            try:
                category = categories_collection.find_one({"_id": ObjectId(category_id)})
                if category:
                    populated_categories.append({
                        "id": str(category["_id"]),
                        "name": category["name"],
                        "description": category["description"],
                        "icon_url": category.get("icon_url")
                    })
            except Exception:
                # Skip invalid IDs (defensive programming)
                continue

        # Add populated categories to response
        user_response = serialize_document(user)
        user_response["service_categories_populated"] = populated_categories
        return user_response

    return serialize_document(user)


@router.get("/taskers/browse")
def browse_taskers(
    category_id: Optional[str] = None,
    location: Optional[str] = None
):
    """Browse taskers by category and location (public endpoint)."""
    query = {"role": "tasker"}

    # Filter by category if provided
    if category_id:
        query["service_categories"] = category_id

    # Filter by location if provided
    if location:
        query["location"] = {"$regex": location, "$options": "i"}

    taskers_cursor = users_collection.find(query)
    taskers = []

    for tasker in taskers_cursor:
        # Populate service_categories with full category objects
        populated_categories = []
        if tasker.get("service_categories"):
            for cat_id in tasker["service_categories"]:
                try:
                    category = categories_collection.find_one({"_id": ObjectId(cat_id)})
                    if category:
                        populated_categories.append({
                            "id": str(category["_id"]),
                            "name": category["name"],
                            "description": category["description"],
                            "icon_url": category.get("icon_url")
                        })
                except Exception:
                    continue

        tasker_response = serialize_document(tasker)
        tasker_response["service_categories_populated"] = populated_categories
        taskers.append(tasker_response)

    return taskers


@router.get("/reviews/{tasker_username}")
def get_tasker_reviews(tasker_username: str):
    """Get all reviews for a tasker."""
    reviews_cursor = reviews_collection.find(
        {"tasker_username": tasker_username})
    return [serialize_document(review) for review in reviews_cursor]


# --- Protected Review Endpoint ---
@router.post("/reviews", status_code=status.HTTP_201_CREATED)
async def create_review(
    review: Review,
    current_user: Annotated[dict, Depends(get_current_user)]
):
    """Create a review for a completed task (clients only)."""
    from database import tasks_collection

    try:
        task = tasks_collection.find_one({"_id": ObjectId(review.task_id)})
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
            detail="You can only review your own tasks."
        )

    if task.get("status") != "completed":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="You can only review completed tasks."
        )

    existing_review = reviews_collection.find_one({"task_id": review.task_id})
    if existing_review:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="A review for this task has already been submitted."
        )

    review_data = review.dict()
    review_data["client_username"] = current_user["username"]

    reviews_collection.insert_one(review_data)
    return serialize_document(review_data)


# --- Admin Service Endpoints ---
@router.post("/services", status_code=status.HTTP_201_CREATED)
async def create_service(
    service: Service,
    current_user: Annotated[dict, Depends(get_current_user)]
):
    """Create a new service (admin only)."""
    if current_user["role"] != "admin":
        raise HTTPException(status_code=403, detail="Admin access required.")
    service_dict = service.dict()
    services_collection.insert_one(service_dict)
    return serialize_document(service_dict)


@router.get("/services/{service_id}")
def get_service(service_id: str):
    """Get a single service by ID."""
    service = services_collection.find_one({"_id": ObjectId(service_id)})
    if not service:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Service not found"
        )
    return serialize_document(service)


@router.put("/services/{service_id}")
async def update_service(
    service_id: str,
    service_update: Service,
    current_user: Annotated[dict, Depends(get_current_user)]
):
    """Update a service (admin only)."""
    if current_user["role"] != "admin":
        raise HTTPException(status_code=403, detail="Admin access required.")

    update_data = service_update.dict(exclude_unset=True)
    result = services_collection.update_one(
        {"_id": ObjectId(service_id)},
        {"$set": update_data}
    )

    if result.matched_count == 0:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Service not found"
        )

    updated_service = services_collection.find_one(
        {"_id": ObjectId(service_id)})
    return serialize_document(updated_service)


@router.delete("/services/{service_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_service(
    service_id: str,
    current_user: Annotated[dict, Depends(get_current_user)]
):
    """Delete a service (admin only)."""
    if current_user["role"] != "admin":
        raise HTTPException(status_code=403, detail="Admin access required.")

    result = services_collection.delete_one({"_id": ObjectId(service_id)})
    if result.deleted_count == 0:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Service not found"
        )
    return


# --- Admin Portfolio Endpoints ---
@router.post("/portfolio", status_code=status.HTTP_201_CREATED)
async def create_portfolio_item(
    item: PortfolioItem,
    current_user: Annotated[dict, Depends(get_current_user)]
):
    """Create a new portfolio item (admin only)."""
    if current_user["role"] != "admin":
        raise HTTPException(status_code=403, detail="Admin access required.")
    item_dict = item.dict()
    portfolio_collection.insert_one(item_dict)
    return serialize_document(item_dict)
