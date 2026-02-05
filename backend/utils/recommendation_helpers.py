"""
Helper functions for the task recommendation system.

Provides scoring functions for various recommendation factors:
- Distance calculation
- Recency scoring
- Task difficulty estimation
- Tasker experience level determination
- Competition analysis
- AI semantic matching
"""

import json
from datetime import datetime
from typing import Dict, Optional
from config import gemini_model
from database import users_collection, tasks_collection, task_types_collection
from utils.geocoding import get_distance_between_locations


def calculate_distance_score(tasker: dict, task: dict) -> float:
    """
    Calculate distance score based on proximity between tasker and task.

    Scoring:
    - 0-5 miles: 25 points
    - 5-10 miles: 20 points
    - 10-15 miles: 15 points
    - 15-20 miles: 10 points
    - 20-30 miles: 5 points
    - 30+ miles: 0 points

    Args:
        tasker: Tasker user document
        task: Task document

    Returns:
        Distance score (0-25)
    """
    tasker_location = tasker.get("location", "")
    task_location = task.get("location", "")

    if not tasker_location or not task_location:
        return 0.0

    # Calculate distance in miles
    distance = get_distance_between_locations(tasker_location, task_location)

    # If distance is 0 (unknown locations), return 0 score
    if distance == 0.0:
        return 0.0

    # Score based on distance tiers
    if distance <= 5:
        return 25.0
    elif distance <= 10:
        return 20.0
    elif distance <= 15:
        return 15.0
    elif distance <= 20:
        return 10.0
    elif distance <= 30:
        return 5.0
    else:
        return 0.0


def calculate_recency_score(task: dict) -> float:
    """
    Calculate recency score based on how long ago the task was posted.

    Scoring:
    - Last hour: 15 points
    - 1-6 hours: 12 points
    - 6-24 hours: 8 points
    - 1-3 days: 4 points
    - 3+ days: 0 points

    Args:
        task: Task document with 'posted_at' field

    Returns:
        Recency score (0-15)
    """
    posted_at = task.get("posted_at")

    if not posted_at:
        # If no posted_at field, return middle score
        return 8.0

    # Calculate minutes since posting
    current_time = datetime.utcnow()
    time_diff = current_time - posted_at
    minutes_ago = time_diff.total_seconds() / 60

    # Score based on recency tiers
    if minutes_ago <= 60:  # Last hour
        return 15.0
    elif minutes_ago <= 360:  # Last 6 hours
        return 12.0
    elif minutes_ago <= 1440:  # Last 24 hours
        return 8.0
    elif minutes_ago <= 4320:  # Last 3 days
        return 4.0
    else:  # Older than 3 days
        return 0.0


def estimate_task_difficulty(task: dict) -> int:
    """
    Estimate task difficulty level using AI or heuristics.

    Difficulty levels:
    - 1: Beginner (simple, routine tasks)
    - 2: Intermediate (moderate complexity)
    - 3: Expert (complex, specialized tasks)

    Args:
        task: Task document

    Returns:
        Difficulty level (1-3)
    """
    # Try AI estimation first
    if gemini_model:
        try:
            prompt = f"""
            Analyze this task and rate its difficulty level:

            Title: {task.get('title', 'N/A')}
            Description: {task.get('description', 'N/A')}

            Rate the difficulty as:
            - 1 for simple, routine tasks (basic assembly, simple cleaning, etc.)
            - 2 for moderate complexity (furniture assembly, painting rooms, etc.)
            - 3 for complex, specialized tasks (electrical work, plumbing, etc.)

            Return ONLY the number 1, 2, or 3.
            """

            response = gemini_model.generate_content(prompt)
            difficulty = int(response.text.strip())

            # Validate response
            if difficulty in [1, 2, 3]:
                return difficulty

        except Exception as e:
            print(f"AI difficulty estimation failed: {e}. Using fallback.")

    # Fallback: Use heuristics
    description = task.get("description", "").lower()
    title = task.get("title", "").lower()
    combined = f"{title} {description}"

    # Expert-level keywords
    expert_keywords = [
        "electrical", "plumbing", "wiring", "hvac", "certified",
        "licensed", "permit", "inspection", "professional",
        "complex", "advanced", "technical", "specialized"
    ]

    # Beginner-level keywords
    beginner_keywords = [
        "simple", "basic", "easy", "quick", "straightforward",
        "small", "minor", "light", "routine", "standard"
    ]

    # Count keyword matches
    expert_count = sum(1 for kw in expert_keywords if kw in combined)
    beginner_count = sum(1 for kw in beginner_keywords if kw in combined)

    if expert_count >= 2:
        return 3  # Expert
    elif beginner_count >= 2:
        return 1  # Beginner
    else:
        return 2  # Intermediate (default)


def determine_experience_level(tasker: dict) -> int:
    """
    Determine tasker's experience level based on their history.

    Experience levels:
    - 1: Beginner (< 10 completed tasks)
    - 2: Intermediate (10-49 completed tasks)
    - 3: Expert (50+ completed tasks)

    Args:
        tasker: Tasker user document

    Returns:
        Experience level (1-3)
    """
    # First check if experience_level is already set
    if "experience_level" in tasker and tasker["experience_level"] in [1, 2, 3]:
        return tasker["experience_level"]

    # Otherwise calculate from completed_tasks_count
    completed_count = tasker.get("completed_tasks_count", 0)

    if completed_count >= 50:
        return 3  # Expert
    elif completed_count >= 10:
        return 2  # Intermediate
    else:
        return 1  # Beginner


def calculate_difficulty_match_score(tasker: dict, task: dict) -> float:
    """
    Calculate how well the task difficulty matches tasker's experience.

    Scoring:
    - Perfect match: 10 points
    - Off by one level: 6 points
    - Off by two levels: 2 points

    Args:
        tasker: Tasker user document
        task: Task document

    Returns:
        Difficulty match score (0-10)
    """
    task_difficulty = task.get("estimated_difficulty")

    # If difficulty not set, estimate it
    if not task_difficulty:
        task_difficulty = estimate_task_difficulty(task)

    tasker_level = determine_experience_level(tasker)

    # Calculate score based on match
    level_diff = abs(task_difficulty - tasker_level)

    if level_diff == 0:
        return 10.0  # Perfect match
    elif level_diff == 1:
        return 6.0  # Close match
    else:
        return 2.0  # Poor match


def calculate_historical_success_score(tasker: dict, task: dict) -> float:
    """
    Calculate score based on tasker's past success with similar tasks.

    Scoring:
    - 5+ similar completed tasks: 10 points
    - 2-4 similar completed tasks: 7 points
    - 1 similar completed task: 5 points
    - 0 similar completed tasks: 0 points

    Args:
        tasker: Tasker user document
        task: Task document

    Returns:
        Historical success score (0-10)
    """
    task_type_id = task.get("task_type_id")
    tasker_username = tasker.get("username")

    if not task_type_id or not tasker_username:
        return 0.0

    # Count completed tasks of this type
    completed_count = tasks_collection.count_documents({
        "tasker_username": tasker_username,
        "task_type_id": task_type_id,
        "status": "completed"
    })

    # Score based on count
    if completed_count >= 5:
        return 10.0
    elif completed_count >= 2:
        return 7.0
    elif completed_count >= 1:
        return 5.0
    else:
        return 0.0


def get_competition_count(task: dict) -> int:
    """
    Count the number of other qualified taskers nearby who could do this task.

    Args:
        task: Task document

    Returns:
        Number of qualified taskers
    """
    category_id = task.get("category_id")
    location = task.get("location", "")

    if not category_id:
        return 0

    # Extract city from location (e.g., "Brooklyn, NY" -> "Brooklyn")
    location_city = location.split(",")[0].strip() if "," in location else location

    # Count taskers with matching category in similar location
    count = users_collection.count_documents({
        "role": "tasker",
        "service_categories": category_id,
        "location": {"$regex": location_city, "$options": "i"}
    })

    return count


def calculate_competition_score(task: dict) -> float:
    """
    Calculate score based on competition level.

    Scoring:
    - 0-3 qualified taskers: 5 points (low competition)
    - 4-8 qualified taskers: 3 points (moderate competition)
    - 9+ qualified taskers: 0 points (high competition)

    Args:
        task: Task document

    Returns:
        Competition score (0-5)
    """
    competition_count = get_competition_count(task)

    if competition_count <= 3:
        return 5.0
    elif competition_count <= 8:
        return 3.0
    else:
        return 0.0


def ai_semantic_match(tasker: dict, task: dict, task_type: Optional[dict] = None) -> float:
    """
    Use AI to determine how well the tasker's skills match the task requirements.

    Scoring:
    - AI analysis returns 0-100 score
    - Converted to 0-30 points for the recommendation system

    Fallback to keyword matching if AI unavailable.

    Args:
        tasker: Tasker user document
        task: Task document
        task_type: Optional task type document (for additional context)

    Returns:
        Semantic match score (0-30)
    """
    if gemini_model:
        try:
            # Get task type details if not provided
            if not task_type and task.get("task_type_id"):
                from bson import ObjectId
                task_type = task_types_collection.find_one({
                    "_id": ObjectId(task.get("task_type_id"))
                })

            task_type_name = task_type.get("name") if task_type else "N/A"
            task_type_desc = task_type.get("description") if task_type else "N/A"

            prompt = f"""
            Analyze how well this tasker matches this task:

            TASK:
            Title: {task.get('title', 'N/A')}
            Description: {task.get('description', 'N/A')}
            Task Type: {task_type_name}
            Task Type Description: {task_type_desc}

            TASKER:
            Skills: {', '.join(tasker.get('skills', []))}
            Bio: {tasker.get('bio', 'N/A')}
            Completed Tasks: {tasker.get('completed_tasks_count', 0)}
            Experience Level: {determine_experience_level(tasker)} (1=beginner, 2=intermediate, 3=expert)
            Average Rating: {tasker.get('avg_rating', 0.0)}/5

            Rate the match from 0-100 based on:
            - Skill relevance (do their skills align with task requirements?)
            - Experience with similar tasks
            - Specific qualifications mentioned

            Return ONLY a number from 0-100.
            """

            response = gemini_model.generate_content(prompt)
            ai_score = int(response.text.strip())

            # Validate and convert to 0-30 scale
            if 0 <= ai_score <= 100:
                return (ai_score / 100) * 30

        except Exception as e:
            print(f"AI semantic matching failed: {e}. Using keyword fallback.")

    # Fallback: Keyword-based matching
    return keyword_match_fallback(tasker, task)


def keyword_match_fallback(tasker: dict, task: dict) -> float:
    """
    Fallback keyword-based matching when AI is unavailable.

    Compares task description keywords with tasker skills.

    Args:
        tasker: Tasker user document
        task: Task document

    Returns:
        Match score (0-30)
    """
    # Extract keywords from task
    task_text = f"{task.get('title', '')} {task.get('description', '')}".lower()
    task_keywords = set(task_text.split())

    # Extract keywords from tasker skills
    tasker_skills = tasker.get("skills", [])
    skill_keywords = set(" ".join(tasker_skills).lower().split())

    # Calculate keyword overlap
    overlap = len(task_keywords & skill_keywords)

    # Convert overlap to score (each matching keyword = 3 points, max 30)
    score = min(overlap * 3, 30)

    return float(score)


def calculate_category_match_score(tasker: dict, task: dict) -> float:
    """
    Check if task category matches tasker's service categories.

    Scoring:
    - Category match: 20 points
    - No match: 0 points

    Args:
        tasker: Tasker user document
        task: Task document

    Returns:
        Category match score (0 or 20)
    """
    task_category_id = task.get("category_id")
    tasker_categories = tasker.get("service_categories", [])

    if task_category_id in tasker_categories:
        return 20.0
    else:
        return 0.0


def generate_match_reasons(
    tasker: dict,
    task: dict,
    scores: Dict[str, float],
    distance: Optional[float] = None
) -> list:
    """
    Generate human-readable explanations for why this task is a good match.

    Args:
        tasker: Tasker user document
        task: Task document
        scores: Dictionary of individual component scores
        distance: Optional distance in miles

    Returns:
        List of reason strings
    """
    reasons = []

    # Skill match reason
    if scores.get("semantic_match", 0) >= 20:
        reasons.append("Strong skill match for this task type")
    elif scores.get("semantic_match", 0) >= 15:
        reasons.append("Good skill match based on your experience")

    # Location reason
    if distance and distance <= 5:
        reasons.append(f"Very close to you ({distance:.1f} miles)")
    elif distance and distance <= 10:
        reasons.append(f"Close to your location ({distance:.1f} miles)")
    elif distance and distance <= 20:
        reasons.append(f"Within reasonable distance ({distance:.1f} miles)")

    # Recency reason
    if scores.get("recency", 0) >= 12:
        reasons.append("Recently posted")

    # Historical success reason
    if scores.get("historical_success", 0) >= 7:
        completed_count = tasks_collection.count_documents({
            "tasker_username": tasker.get("username"),
            "task_type_id": task.get("task_type_id"),
            "status": "completed"
        })
        reasons.append(f"You've completed {completed_count} similar tasks successfully")

    # Difficulty match reason
    if scores.get("difficulty_match", 0) >= 10:
        reasons.append("Task difficulty matches your experience level")

    # Competition reason
    competition_count = get_competition_count(task)
    if scores.get("competition", 0) >= 5:
        reasons.append(f"Low competition - only {competition_count} qualified taskers nearby")

    # If no specific reasons, add a generic one
    if not reasons:
        reasons.append("Matches your service categories")

    return reasons
