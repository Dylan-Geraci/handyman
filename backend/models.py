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
    service_categories: Optional[List[str]] = []  # Category IDs for taskers


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
    service_categories: Optional[List[str]] = None  # Category IDs for taskers


# --- Task Models ---
class Task(BaseModel):
    title: str
    description: str
    location: str
    category_id: str  # Required: Category this task belongs to
    task_type_id: str  # Required: Specific task type within category
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


# --- Recommendation Models ---
class RecommendationQuery(BaseModel):
    """Query parameters for task recommendations."""
    limit: Optional[int] = Field(default=10, ge=1, le=50)
    min_score: Optional[int] = Field(default=50, ge=0, le=100)
    location_radius: Optional[int] = Field(default=25, ge=0)
    include_reasons: Optional[bool] = True


class MatchBreakdown(BaseModel):
    """Breakdown of match score components."""
    category_match: float
    semantic_match: float
    distance: float
    recency: float
    difficulty_match: float
    historical_success: float
    competition: float


class TaskRecommendation(BaseModel):
    """Single task recommendation with match details."""
    task: dict
    match_score: float
    match_breakdown: MatchBreakdown
    distance_miles: Optional[float] = None
    posted_minutes_ago: Optional[int] = None
    match_reasons: Optional[List[str]] = None


class RecommendationResponse(BaseModel):
    """Response model for task recommendations."""
    recommendations: List[dict]
    total_available: int
    showing_top: int


# --- Scraper Models ---
class ScrapeRequest(BaseModel):
    """Request model for triggering a scrape run."""
    source: str = "craigslist"
    locations: List[str] = ["New York, NY"]


class ScrapeResponse(BaseModel):
    """Response model for scrape run results."""
    source: str
    scraped: int
    inserted: int
    updated: int
    errors: int


class ScrapeLog(BaseModel):
    """Log entry for a scrape run."""
    timestamp: datetime = Field(default_factory=datetime.utcnow)
    source: str
    locations: List[str]
    scraped: int
    inserted: int
    updated: int
    errors: int
