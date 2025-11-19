"""
Pydantic models for request/response validation.
These define the shape of data coming in and going out of the API.
"""

from datetime import datetime
from typing import List, Optional
from pydantic import BaseModel, EmailStr, Field


# --- Service & Portfolio Models (Admin) ---
class Service(BaseModel):
    name: str
    description: str


class PortfolioItem(BaseModel):
    title: str
    description: str
    image_url: str


# --- Contact Request ---
class ContactRequest(BaseModel):
    name: str
    email: EmailStr
    message: str


# --- User Models ---
class TokenData(BaseModel):
    username: str | None = None


class UserBase(BaseModel):
    username: str
    full_name: str
    role: str
    location: Optional[str] = None
    skills: Optional[List[str]] = []
    profile_image_url: Optional[str] = None
    bio: Optional[str] = None


class UserCreate(UserBase):
    password: str


class UserPublic(UserBase):
    pass


class UserUpdate(BaseModel):
    full_name: Optional[str] = None
    location: Optional[str] = None
    skills: Optional[List[str]] = None
    profile_image_url: Optional[str] = None
    bio: Optional[str] = None


# --- Task Models ---
class Task(BaseModel):
    title: str
    description: str
    location: str
    status: str = "open"
    client_username: Optional[str] = None
    tasker_username: Optional[str] = None


# --- Review Models ---
class Review(BaseModel):
    task_id: str
    tasker_username: str
    rating: int = Field(..., gt=0, lt=6)
    comment: Optional[str] = None
    client_username: Optional[str] = None


# --- Message Models ---
class Message(BaseModel):
    task_id: str
    sender_username: str
    content: str
    timestamp: datetime = Field(default_factory=datetime.utcnow)


# --- Notification Models ---
class Notification(BaseModel):
    user_to_notify: str
    message: str
    link: Optional[str] = None
    is_read: bool = False
    timestamp: datetime = Field(default_factory=datetime.utcnow)


# --- Password Reset Models ---
class PasswordResetRequest(BaseModel):
    email: EmailStr


class PasswordReset(BaseModel):
    token: str
    new_password: str


# --- AI Search Models ---
class AISearchQuery(BaseModel):
    query: str


# --- Category & Task Type Models (for Phase 2) ---
class CategoryResponse(BaseModel):
    id: str
    name: str
    description: str
    icon_url: Optional[str] = None


class TaskTypeResponse(BaseModel):
    id: str
    name: str
    description: str
    category_id: str
    keywords: List[str] = []


class CategoryWithTaskTypes(BaseModel):
    id: str
    name: str
    description: str
    icon_url: Optional[str] = None
    task_types: List[TaskTypeResponse]
