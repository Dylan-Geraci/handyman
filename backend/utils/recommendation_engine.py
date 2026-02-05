"""
Core recommendation engine for matching taskers with optimal tasks.

The RecommendationEngine class implements a multi-factor scoring algorithm
that combines AI semantic matching with rule-based heuristics to provide
personalized task recommendations for taskers.
"""

from typing import Dict, List, Optional
from datetime import datetime
from database import tasks_collection, task_types_collection, categories_collection
from utils.recommendation_helpers import (
    calculate_category_match_score,
    ai_semantic_match,
    calculate_distance_score,
    calculate_recency_score,
    calculate_difficulty_match_score,
    calculate_historical_success_score,
    calculate_competition_score,
    generate_match_reasons
)
from utils.geocoding import get_distance_between_locations
from security import serialize_document
from bson import ObjectId


class RecommendationEngine:
    """
    AI-powered task recommendation engine.

    Analyzes available tasks and scores them based on multiple factors:
    - Category match (20 points max)
    - AI semantic match (30 points max)
    - Distance (25 points max)
    - Recency (15 points max)
    - Difficulty match (10 points max)
    - Historical success (10 points max)
    - Competition level (5 points max)

    Total possible: 115 points, normalized to 0-100 scale.
    """

    # Maximum possible score for normalization
    MAX_SCORE = 115.0

    def __init__(self, tasker: dict, options: Optional[Dict] = None):
        """
        Initialize the recommendation engine.

        Args:
            tasker: Tasker user document
            options: Optional configuration dict with:
                - limit: Max recommendations to return (default 10)
                - min_score: Minimum match score threshold (default 50)
                - location_radius: Search radius in miles (default 25)
                - include_reasons: Include match explanations (default True)
        """
        self.tasker = tasker
        self.options = options or {}

        # Set defaults
        self.limit = min(self.options.get("limit", 10), 50)  # Max 50
        self.min_score = max(self.options.get("min_score", 50), 0)  # Min 0
        self.location_radius = self.options.get("location_radius", 25)
        self.include_reasons = self.options.get("include_reasons", True)

    def get_candidate_tasks(self) -> List[dict]:
        """
        Get candidate tasks that match basic criteria.

        Filters:
        - Status must be "open"
        - Category must match tasker's service categories
        - Optional: Within location radius

        Returns:
            List of candidate task documents
        """
        # Build query
        query = {
            "status": "open",
        }

        # Filter by tasker's service categories
        service_categories = self.tasker.get("service_categories", [])
        if service_categories:
            query["category_id"] = {"$in": service_categories}
        else:
            # If no service categories, return empty list
            return []

        # Execute query
        candidates = list(tasks_collection.find(query))

        # Optional: Filter by location radius
        if self.location_radius > 0 and self.tasker.get("location"):
            filtered_candidates = []
            for task in candidates:
                if task.get("location"):
                    distance = get_distance_between_locations(
                        self.tasker.get("location"),
                        task.get("location")
                    )
                    # Keep task if within radius or if distance is unknown (0.0)
                    if distance == 0.0 or distance <= self.location_radius:
                        filtered_candidates.append(task)
                else:
                    # Keep tasks with no location specified
                    filtered_candidates.append(task)

            candidates = filtered_candidates

        return candidates

    def calculate_task_score(self, task: dict) -> Dict:
        """
        Calculate comprehensive match score for a task.

        Returns a dictionary with:
        - total_score: Overall match score (0-100)
        - scores: Breakdown of individual component scores
        - distance: Distance in miles (if available)
        - posted_ago: Minutes since task was posted
        - reasons: Human-readable match explanations

        Args:
            task: Task document

        Returns:
            Dictionary with score details
        """
        # Get task type for semantic matching
        task_type = None
        if task.get("task_type_id"):
            try:
                task_type = task_types_collection.find_one({
                    "_id": ObjectId(task.get("task_type_id"))
                })
            except:
                pass

        # Calculate individual scores
        category_score = calculate_category_match_score(self.tasker, task)
        semantic_score = ai_semantic_match(self.tasker, task, task_type)
        distance_score = calculate_distance_score(self.tasker, task)
        recency_score = calculate_recency_score(task)
        difficulty_score = calculate_difficulty_match_score(self.tasker, task)
        historical_score = calculate_historical_success_score(self.tasker, task)
        competition_score = calculate_competition_score(task)

        # Calculate total score
        raw_score = (
            category_score +
            semantic_score +
            distance_score +
            recency_score +
            difficulty_score +
            historical_score +
            competition_score
        )

        # Normalize to 0-100 scale
        final_score = round((raw_score / self.MAX_SCORE) * 100, 1)

        # Calculate distance
        distance = None
        if self.tasker.get("location") and task.get("location"):
            distance = get_distance_between_locations(
                self.tasker.get("location"),
                task.get("location")
            )

        # Calculate time since posting
        posted_ago = None
        if task.get("posted_at"):
            time_diff = datetime.utcnow() - task.get("posted_at")
            posted_ago = int(time_diff.total_seconds() / 60)  # Minutes

        # Prepare scores breakdown
        scores = {
            "category_match": round(category_score, 1),
            "semantic_match": round(semantic_score, 1),
            "distance": round(distance_score, 1),
            "recency": round(recency_score, 1),
            "difficulty_match": round(difficulty_score, 1),
            "historical_success": round(historical_score, 1),
            "competition": round(competition_score, 1),
        }

        # Generate match reasons
        reasons = []
        if self.include_reasons:
            reasons = generate_match_reasons(self.tasker, task, scores, distance)

        return {
            "total_score": final_score,
            "scores": scores,
            "distance": distance,
            "posted_ago": posted_ago,
            "reasons": reasons
        }

    def populate_task_details(self, task: dict) -> dict:
        """
        Populate task with category and task_type details.

        Args:
            task: Task document

        Returns:
            Task dict with populated category and task_type
        """
        task_response = serialize_document(task)

        # Populate category details
        if task.get("category_id"):
            try:
                category = categories_collection.find_one({
                    "_id": ObjectId(task["category_id"])
                })
                if category:
                    task_response["category_populated"] = {
                        "id": str(category["_id"]),
                        "name": category["name"],
                        "description": category["description"],
                        "icon_url": category.get("icon_url")
                    }
            except:
                pass

        # Populate task_type details
        if task.get("task_type_id"):
            try:
                task_type = task_types_collection.find_one({
                    "_id": ObjectId(task["task_type_id"])
                })
                if task_type:
                    task_response["task_type_populated"] = {
                        "id": str(task_type["_id"]),
                        "name": task_type["name"],
                        "description": task_type["description"],
                        "keywords": task_type.get("keywords", [])
                    }
            except:
                pass

        return task_response

    def get_recommendations(self) -> Dict:
        """
        Get ranked list of recommended tasks for the tasker.

        Returns:
            Dictionary with:
            - recommendations: List of tasks with scores and details
            - total_available: Total number of candidate tasks
            - showing_top: Number of recommendations returned

        Example response:
        {
            "recommendations": [
                {
                    "task": {...},
                    "match_score": 94.5,
                    "distance_miles": 2.3,
                    "posted_minutes_ago": 45,
                    "match_breakdown": {...},
                    "match_reasons": [...]
                },
                ...
            ],
            "total_available": 47,
            "showing_top": 10
        }
        """
        # Get candidate tasks
        candidates = self.get_candidate_tasks()
        total_available = len(candidates)

        # If no candidates, return empty result
        if not candidates:
            return {
                "recommendations": [],
                "total_available": 0,
                "showing_top": 0
            }

        # Score each task
        scored_tasks = []
        for task in candidates:
            score_data = self.calculate_task_score(task)

            # Filter by minimum score
            if score_data["total_score"] >= self.min_score:
                scored_tasks.append({
                    "task": task,
                    "score_data": score_data
                })

        # Sort by score (highest first)
        scored_tasks.sort(key=lambda x: x["score_data"]["total_score"], reverse=True)

        # Limit results
        top_tasks = scored_tasks[:self.limit]

        # Format recommendations
        recommendations = []
        for item in top_tasks:
            task = item["task"]
            score_data = item["score_data"]

            # Populate task details
            task_populated = self.populate_task_details(task)

            # Build recommendation object
            recommendation = {
                "task": task_populated,
                "match_score": score_data["total_score"],
                "match_breakdown": score_data["scores"]
            }

            # Add optional fields
            if score_data.get("distance") is not None:
                recommendation["distance_miles"] = score_data["distance"]

            if score_data.get("posted_ago") is not None:
                recommendation["posted_minutes_ago"] = score_data["posted_ago"]

            if self.include_reasons and score_data.get("reasons"):
                recommendation["match_reasons"] = score_data["reasons"]

            recommendations.append(recommendation)

        return {
            "recommendations": recommendations,
            "total_available": total_available,
            "showing_top": len(recommendations)
        }


def test_recommendation_engine():
    """
    Simple test function to verify the engine works.

    Run with: python -m utils.recommendation_engine
    """
    from database import users_collection

    print("=" * 60)
    print("RECOMMENDATION ENGINE TEST")
    print("=" * 60)

    # Get a sample tasker
    tasker = users_collection.find_one({"role": "tasker"})

    if not tasker:
        print("\n✗ No taskers found in database")
        print("Please create a tasker account first.")
        return

    print(f"\nTesting recommendations for: {tasker.get('full_name')}")
    print(f"Service Categories: {tasker.get('service_categories', [])}")
    print(f"Location: {tasker.get('location', 'N/A')}")
    print()

    # Create engine
    engine = RecommendationEngine(tasker, {
        "limit": 5,
        "min_score": 40,
        "include_reasons": True
    })

    # Get recommendations
    print("Fetching recommendations...")
    result = engine.get_recommendations()

    print(f"\nFound {result['total_available']} candidate tasks")
    print(f"Showing top {result['showing_top']} recommendations\n")

    # Display results
    for i, rec in enumerate(result["recommendations"], 1):
        print(f"\n{i}. {rec['task']['title']}")
        print(f"   Match Score: {rec['match_score']}%")
        if rec.get("distance_miles"):
            print(f"   Distance: {rec['distance_miles']} miles")
        if rec.get("posted_minutes_ago"):
            hours = rec['posted_minutes_ago'] // 60
            mins = rec['posted_minutes_ago'] % 60
            print(f"   Posted: {hours}h {mins}m ago")
        if rec.get("match_reasons"):
            print(f"   Reasons:")
            for reason in rec["match_reasons"]:
                print(f"     - {reason}")

    print("\n" + "=" * 60)
    print("TEST COMPLETE")
    print("=" * 60)


if __name__ == "__main__":
    test_recommendation_engine()
