"""
Authentication and user profile routes.
Handles registration, login, password reset, and profile management.
"""

import secrets
from datetime import datetime, timedelta
from typing import Annotated, List

from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm

from security import get_current_user, hash_password, verify_password, create_access_token, serialize_document
from config import ACCESS_TOKEN_EXPIRE_MINUTES
from database import users_collection
from models import UserCreate, UserPublic, UserUpdate, PasswordResetRequest, PasswordReset


router = APIRouter()


# --- Registration ---
@router.post("/register", response_model=UserPublic)
def register(user: UserCreate):
    """Register a new user (client, tasker, or admin)."""
    existing_user = users_collection.find_one({"username": user.username})
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered"
        )

    hashed_password = hash_password(user.password)
    user_data = user.dict()
    user_data["hashed_password"] = hashed_password
    del user_data["password"]

    users_collection.insert_one(user_data)
    return user_data


# --- Login ---
@router.post("/token")
async def login_for_access_token(form_data: Annotated[OAuth2PasswordRequestForm, Depends()]):
    """Login and get JWT access token."""
    user = users_collection.find_one({"username": form_data.username})
    if not user or not verify_password(form_data.password, user["hashed_password"]):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": user["username"]}, expires_delta=access_token_expires
    )
    return {"access_token": access_token, "token_type": "bearer"}


# --- Password Reset ---
@router.post("/forgot-password")
async def forgot_password(request: PasswordResetRequest):
    """Request a password reset token."""
    user = users_collection.find_one({"username": request.email})
    if user:
        token = secrets.token_urlsafe(32)
        expire_time = datetime.utcnow() + timedelta(minutes=15)
        users_collection.update_one(
            {"_id": user["_id"]},
            {"$set": {"reset_token": token, "reset_token_expires": expire_time}}
        )
        print("--- PASSWORD RESET ---")
        print(f"Token for {request.email}: {token}")
        print(f"Full URL: http://localhost:5173/reset-password/{token}")
        print("----------------------")
    return {"message": "If an account with that email exists, a password reset token has been generated."}


@router.post("/reset-password")
async def reset_password(request: PasswordReset):
    """Reset password using token."""
    user = users_collection.find_one({
        "reset_token": request.token,
        "reset_token_expires": {"$gt": datetime.utcnow()}
    })
    if not user:
        raise HTTPException(
            status_code=400,
            detail="Invalid or expired password reset token."
        )
    hashed_password = hash_password(request.new_password)
    users_collection.update_one(
        {"_id": user["_id"]},
        {
            "$set": {"hashed_password": hashed_password},
            "$unset": {"reset_token": "", "reset_token_expires": ""}
        }
    )
    return {"message": "Password has been reset successfully."}


# --- User Profile ---
@router.get("/users/me", response_model=UserPublic)
async def read_users_me(current_user: Annotated[dict, Depends(get_current_user)]):
    """Get current user's profile."""
    return current_user


@router.put("/users/me", response_model=UserPublic)
async def update_user_me(
    user_update: UserUpdate,
    current_user: Annotated[dict, Depends(get_current_user)]
):
    """Update current user's profile."""
    update_data = user_update.dict(exclude_unset=True)

    # Prevent changing role or username
    update_data.pop("role", None)
    update_data.pop("username", None)

    users_collection.update_one(
        {"username": current_user["username"]},
        {"$set": update_data}
    )

    updated_user = users_collection.find_one(
        {"username": current_user["username"]})
    return updated_user
