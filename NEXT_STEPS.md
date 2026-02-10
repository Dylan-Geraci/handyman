# Backend Enhancements: AI Recommendation System Next Steps

## Executive Summary

The AI recommendation system (Phase 1) is **functionally complete** and meets all PM requirements. However, to move from MVP to production-ready, we need to implement critical infrastructure for:

- **Performance & Scalability** - Caching layer to reduce API costs by 80% and improve response times 5-10x
- **Learning & Personalization** - User behavior tracking and custom preferences for higher acceptance rates
- **Analytics & Optimization** - Interaction data collection, A/B testing framework for data-driven improvements
- **Proactive Engagement** - Background jobs for pre-computation and push notifications

This document provides a **priority-ordered roadmap** with detailed implementation steps, code examples, and verification procedures.

---

## 🎯 Priority List (Ordered by Importance)

| Priority | Feature | Effort | Impact | Why Important |
|----------|---------|--------|--------|---------------|
| **1** | Tracking & Analytics | 3 days | Foundation | Required for all learning/optimization features |
| **2** | Caching Layer (Redis) | 2 days | High | 5-10x performance, 80% cost reduction |
| **3** | Database Indexes | 1 day | Medium | 50-70% query performance improvement |
| **4** | User Preferences | 4 days | High | Personalization increases acceptance +15-20% |
| **5** | Background Jobs | 3-4 days | High | Proactive engagement, real-time notifications |
| **6** | A/B Testing Framework | 3-4 days | Medium | Continuous improvement, data-driven optimization |

**Total Estimated Time:** 16-19 days (~3-4 weeks)

---

## Priority 1: Foundation - Tracking & Analytics 📊

### Why First?

Without interaction tracking, we cannot:
- Measure recommendation quality (acceptance rates)
- Learn from user behavior (personalization)
- Optimize the algorithm (A/B testing)
- Build business intelligence dashboards

**This is the foundation for all other enhancements.**

### Implementation Steps

#### 1.1 Create `recommendation_interactions` Collection

**File:** `backend/database.py`

Add new collection reference:

```python
recommendation_interactions_collection = db.recommendation_interactions
```

**Schema Design:**

```python
{
  "_id": ObjectId,
  "tasker_id": ObjectId,              # User who saw recommendation
  "task_id": ObjectId,                # Task that was recommended
  "recommendation_score": 94.5,       # Match score shown
  "recommendation_rank": 2,           # Position in list (1st, 2nd, 3rd...)
  "action": "viewed|clicked|accepted|rejected|ignored",
  "timestamp": datetime.utcnow(),
  "task_completion_status": null,     # Updated later: "completed|cancelled|declined"
  "completion_timestamp": null,       # When task finished
  "rating_given": null                # Rating if task completed (1-5)
}
```

**Create Indexes:**

```python
# Add to database.py or create migration script
recommendation_interactions_collection.create_index([("tasker_id", 1), ("timestamp", -1)])
recommendation_interactions_collection.create_index([("task_id", 1)])
recommendation_interactions_collection.create_index([("action", 1)])
```

#### 1.2 Add Tracking to Recommendation Endpoint

**File:** `backend/routers/tasks.py` (modify lines ~218-257)

Track when recommendations are shown:

```python
from datetime import datetime
from bson import ObjectId
from database import recommendation_interactions_collection

@router.get("/tasks/recommendations", response_model=RecommendationResponse)
async def get_task_recommendations(
    current_user: Annotated[dict, Depends(get_current_user)],
    limit: int = Query(default=10, ge=1, le=50),
    category: Optional[str] = Query(default=None)
):
    """Get personalized task recommendations for the current tasker."""

    # ... existing code to get recommendations ...

    # NEW: Track that recommendations were shown
    for rank, rec in enumerate(recommendations, start=1):
        recommendation_interactions_collection.insert_one({
            "tasker_id": ObjectId(current_user["_id"]),
            "task_id": ObjectId(rec["task"]["_id"]),
            "recommendation_score": rec["match_score"],
            "recommendation_rank": rank,
            "action": "viewed",
            "timestamp": datetime.utcnow(),
            "task_completion_status": None,
            "completion_timestamp": None,
            "rating_given": None
        })

    return recommendations
```

#### 1.3 Track Task Acceptance

**File:** `backend/routers/tasks.py` (in `accept_task` or similar endpoint)

Add tracking when tasker accepts a task:

```python
@router.put("/tasks/{task_id}/accept")
async def accept_task(
    task_id: str,
    current_user: Annotated[dict, Depends(get_current_user)]
):
    """Accept a task as a tasker."""

    # ... existing acceptance logic ...

    # NEW: Track acceptance
    recommendation_interactions_collection.update_one(
        {
            "tasker_id": ObjectId(current_user["_id"]),
            "task_id": ObjectId(task_id),
            "action": "viewed"
        },
        {
            "$set": {
                "action": "accepted",
                "timestamp": datetime.utcnow()
            }
        }
    )

    return {"message": "Task accepted successfully"}
```

#### 1.4 Create Analytics Endpoint

**File:** `backend/routers/tasks.py`

New endpoint for recommendation analytics:

```python
@router.get("/admin/recommendations/analytics")
async def get_recommendation_analytics(
    current_user: Annotated[dict, Depends(get_current_user)]
):
    """
    Admin endpoint to view recommendation system performance.

    Returns:
    - Total recommendations shown
    - Total accepted
    - Acceptance rate percentage
    - Average score of accepted tasks
    """
    if current_user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")

    # Calculate key metrics
    total_shown = recommendation_interactions_collection.count_documents({"action": "viewed"})
    total_accepted = recommendation_interactions_collection.count_documents({"action": "accepted"})
    acceptance_rate = (total_accepted / total_shown * 100) if total_shown > 0 else 0

    # Average score of accepted vs rejected tasks
    accepted_scores = list(recommendation_interactions_collection.aggregate([
        {"$match": {"action": "accepted"}},
        {"$group": {"_id": None, "avg_score": {"$avg": "$recommendation_score"}}}
    ]))

    avg_accepted_score = accepted_scores[0]["avg_score"] if accepted_scores else 0

    return {
        "total_recommendations_shown": total_shown,
        "total_accepted": total_accepted,
        "acceptance_rate_percent": round(acceptance_rate, 2),
        "average_score_of_accepted": round(avg_accepted_score, 2),
        "last_updated": datetime.utcnow()
    }
```

### Verification Steps

1. Make a recommendation request: `GET /tasks/recommendations`
2. Check `recommendation_interactions` collection has new documents
3. Accept a task and verify action updated to "accepted"
4. Call `GET /admin/recommendations/analytics` and verify metrics are calculated correctly

### Success Metrics

- Collection populates with interaction data
- Analytics endpoint returns accurate metrics
- Data can be used for future learning algorithms

**Estimated Effort:** 3 days
**Impact:** Foundation for all learning and optimization features

---

## Priority 2: Performance - Caching Layer (Redis) 🚀

### Why Second?

- Current system makes expensive AI calls for every recommendation request
- No caching = higher costs, slower responses
- Caching can reduce API calls by **80%+** and improve response times **5-10x**

### Implementation Steps

#### 2.1 Add Redis Configuration

**File:** `backend/config.py`

Add Redis settings:

```python
import os
from redis import Redis

# ... existing config ...

# Redis for caching
REDIS_HOST = os.getenv("REDIS_HOST", "localhost")
REDIS_PORT = int(os.getenv("REDIS_PORT", 6379))
REDIS_DB = int(os.getenv("REDIS_DB", 0))
REDIS_PASSWORD = os.getenv("REDIS_PASSWORD", None)

# Cache TTL settings
RECOMMENDATION_CACHE_TTL = int(os.getenv("RECOMMENDATION_CACHE_TTL", 1800))  # 30 minutes
SEMANTIC_MATCH_CACHE_TTL = int(os.getenv("SEMANTIC_MATCH_CACHE_TTL", 86400))  # 24 hours

# Initialize Redis client
try:
    redis_client = Redis(
        host=REDIS_HOST,
        port=REDIS_PORT,
        db=REDIS_DB,
        password=REDIS_PASSWORD,
        decode_responses=True
    )
    redis_client.ping()  # Test connection
    print("✓ Redis connected successfully")
except Exception as e:
    print(f"⚠ Redis connection failed: {e}. Caching disabled.")
    redis_client = None
```

**Add to requirements.txt:**

```txt
redis==5.0.1
```

#### 2.2 Add Caching to Recommendation Engine

**File:** `backend/utils/recommendation_engine.py`

Modify `RecommendationEngine` class:

```python
import json
from config import redis_client, RECOMMENDATION_CACHE_TTL

class RecommendationEngine:
    def __init__(self, tasker, options=None):
        self.tasker = tasker
        self.options = options or {}
        self.cache_key = f"recommendations:{tasker['_id']}"
        # ... rest of init ...

    def get_recommendations(self):
        """Get recommendations with caching support."""

        # Try cache first
        if redis_client:
            try:
                cached = redis_client.get(self.cache_key)
                if cached:
                    print(f"✓ Cache hit for tasker {self.tasker['_id']}")
                    return json.loads(cached)
            except Exception as e:
                print(f"Cache read error: {e}")

        # Cache miss - compute recommendations
        recommendations = self._compute_recommendations()

        # Store in cache
        if redis_client:
            try:
                redis_client.setex(
                    self.cache_key,
                    RECOMMENDATION_CACHE_TTL,
                    json.dumps(recommendations, default=str)  # Handle ObjectId serialization
                )
                print(f"✓ Cached recommendations for tasker {self.tasker['_id']}")
            except Exception as e:
                print(f"Cache write error: {e}")

        return recommendations

    def _compute_recommendations(self):
        """Original recommendation logic (no caching)."""
        # ... existing recommendation logic ...
        pass
```

#### 2.3 Cache AI Semantic Matches

**File:** `backend/utils/recommendation_helpers.py`

Modify `ai_semantic_match` function:

```python
import hashlib
from config import redis_client, SEMANTIC_MATCH_CACHE_TTL

def ai_semantic_match(tasker_profile, task, gemini_model):
    """
    Calculate semantic match using AI with caching.
    Cache key based on tasker skills + task description.
    """

    # Generate cache key from tasker skills + task description
    skills_str = str(sorted(tasker_profile.get('skills', [])))
    task_desc = task.get('description', '')
    cache_input = f"{skills_str}_{task_desc}"
    cache_key = f"semantic:{hashlib.md5(cache_input.encode()).hexdigest()}"

    # Try cache
    if redis_client:
        try:
            cached_score = redis_client.get(cache_key)
            if cached_score:
                return float(cached_score)
        except Exception as e:
            print(f"Semantic cache read error: {e}")

    # Compute semantic match (expensive AI call)
    score = _compute_semantic_match_with_ai(tasker_profile, task, gemini_model)

    # Cache result (24 hour TTL - semantic matches are stable)
    if redis_client:
        try:
            redis_client.setex(cache_key, SEMANTIC_MATCH_CACHE_TTL, str(score))
        except Exception as e:
            print(f"Semantic cache write error: {e}")

    return score
```

#### 2.4 Add Cache Invalidation Endpoint

**File:** `backend/routers/tasks.py`

New admin endpoint to clear caches:

```python
from config import redis_client

@router.post("/admin/recommendations/clear-cache")
async def clear_recommendation_cache(
    current_user: Annotated[dict, Depends(get_current_user)]
):
    """
    Clear all recommendation caches (admin only).
    Use when algorithm changes or need fresh recommendations.
    """
    if current_user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")

    if not redis_client:
        return {"message": "Redis not configured"}

    # Delete all recommendation cache keys
    pattern = "recommendations:*"
    keys = redis_client.keys(pattern)
    if keys:
        redis_client.delete(*keys)

    return {
        "message": "Cache cleared successfully",
        "keys_deleted": len(keys)
    }
```

### Environment Variables to Add

```env
# Redis Configuration
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_DB=0
REDIS_PASSWORD=

# Cache TTL Settings (in seconds)
RECOMMENDATION_CACHE_TTL=1800      # 30 minutes
SEMANTIC_MATCH_CACHE_TTL=86400    # 24 hours
```

### Verification Steps

1. Install Redis: `docker run -d -p 6379:6379 redis:7-alpine`
2. Make same recommendation request twice
3. Check second request is faster (< 100ms vs 1-2 seconds)
4. Verify Redis has cached data: `redis-cli KEYS "recommendations:*"`
5. Clear cache via endpoint and verify keys deleted

### Success Metrics

- API response time: < 200ms (down from 1-2 seconds)
- Cache hit rate: > 70% after warmup
- Gemini API calls: -80% reduction
- Cost savings: ~$X per month (calculate based on usage)

**Estimated Effort:** 2 days
**Impact:** 5-10x performance improvement, 80% reduction in AI costs

---

## Priority 3: Optimization - Database Indexes 💾

### Why Third?

- Faster queries **without code changes**
- Current queries scan entire collections (slow at scale)
- Indexes can improve query performance **50-70%**

### Implementation Steps

#### 3.1 Create Performance Indexes

**File:** Create `backend/migrations/add_recommendation_indexes.py`

```python
"""
Database migration: Add performance indexes for recommendation system.

Run once: python backend/migrations/add_recommendation_indexes.py
"""

from database import tasks_collection, users_collection, recommendation_interactions_collection

def add_recommendation_indexes():
    """Create all indexes needed for optimal recommendation performance."""

    print("Creating performance indexes for recommendation system...")

    # ========================================
    # Tasks Collection Indexes
    # ========================================

    # Used by: Filter tasks by status + category in recommendation engine
    tasks_collection.create_index([("status", 1), ("category_id", 1)])
    print("✓ Created index: tasks.status + category_id")

    # Used by: Recency scoring (newer tasks first)
    tasks_collection.create_index([("posted_at", -1)])
    print("✓ Created index: tasks.posted_at (descending)")

    # Used by: Location-based searches
    tasks_collection.create_index([("location", "text")])
    print("✓ Created index: tasks.location (text search)")

    # Used by: Filter open tasks by location
    tasks_collection.create_index([("status", 1), ("location", 1)])
    print("✓ Created index: tasks.status + location")

    # ========================================
    # Users Collection Indexes
    # ========================================

    # Used by: Filter taskers by service categories
    users_collection.create_index([("service_categories", 1)])
    print("✓ Created index: users.service_categories")

    # Used by: Filter available taskers by role and experience
    users_collection.create_index([("role", 1), ("experience_level", 1)])
    print("✓ Created index: users.role + experience_level")

    # Used by: Find active/available taskers
    users_collection.create_index([("role", 1), ("is_available", 1)])
    print("✓ Created index: users.role + is_available")

    # ========================================
    # Recommendation Interactions Indexes
    # ========================================

    # Used by: Get tasker's interaction history (sorted by time)
    recommendation_interactions_collection.create_index([("tasker_id", 1), ("timestamp", -1)])
    print("✓ Created index: recommendation_interactions.tasker_id + timestamp")

    # Used by: Find all interactions for a task
    recommendation_interactions_collection.create_index([("task_id", 1)])
    print("✓ Created index: recommendation_interactions.task_id")

    # Used by: Analytics queries (count by action type)
    recommendation_interactions_collection.create_index([("action", 1)])
    print("✓ Created index: recommendation_interactions.action")

    # Used by: Historical success rate queries
    recommendation_interactions_collection.create_index([
        ("tasker_id", 1),
        ("action", 1),
        ("task_completion_status", 1)
    ])
    print("✓ Created index: recommendation_interactions.tasker_id + action + completion_status")

    print("\n✅ All indexes created successfully!")
    print("\nTo verify indexes, run in MongoDB shell:")
    print("  db.tasks.getIndexes()")
    print("  db.users.getIndexes()")
    print("  db.recommendation_interactions.getIndexes()")

if __name__ == "__main__":
    try:
        add_recommendation_indexes()
    except Exception as e:
        print(f"\n❌ Error creating indexes: {e}")
        raise
```

#### 3.2 Run Migration

```bash
cd backend
python migrations/add_recommendation_indexes.py
```

### Verification Steps

1. Run the migration script
2. Check indexes exist in MongoDB:
   ```javascript
   db.tasks.getIndexes()
   db.users.getIndexes()
   db.recommendation_interactions.getIndexes()
   ```
3. Use `explain()` to verify index usage:
   ```javascript
   db.tasks.find({status: "open", category_id: "plumbing"}).explain("executionStats")
   // Check "executionStats.executionTimeMillis" and "indexUsed"
   ```

### Success Metrics

- Query execution time: < 50ms (down from 200-500ms)
- Index usage: 100% of recommendation queries use indexes
- Database CPU usage: -40% reduction

**Estimated Effort:** 1 day
**Impact:** 50-70% query performance improvement

---

## Priority 4: Personalization - User Preferences 🎨

### Why Fourth?

- Enables per-user weight customization
- Allows taskers to specify preferences (max distance, avoid certain tasks)
- Foundation for machine learning personalization
- Increases acceptance rates by **+15-20%**

### Implementation Steps

#### 4.1 Create `tasker_preferences` Collection

**File:** `backend/database.py`

Add collection reference:

```python
tasker_preferences_collection = db.tasker_preferences
```

**Schema Design:**

```python
{
  "_id": ObjectId,
  "tasker_id": ObjectId,

  # Custom scoring weights
  "custom_weights": {
    "category_match": 0.20,
    "semantic_match": 0.30,
    "distance": 0.25,
    "recency": 0.15,
    "difficulty_match": 0.10,
    "historical_success": 0.10,
    "competition": 0.05
  },

  # User preferences
  "preferences": {
    "max_distance_miles": 15,                   # Only show tasks within X miles
    "min_score_threshold": 60,                  # Hide low-match tasks
    "avoid_task_types": ["electrical", "plumbing"],  # Categories to exclude
    "prefer_high_budget": True,                 # Prioritize higher-paying tasks
    "notification_enabled": True,               # Enable push notifications
    "auto_accept_above_score": null             # Future: auto-accept >95 score
  },

  "updated_at": datetime.utcnow()
}
```

#### 4.2 Load Preferences in Recommendation Engine

**File:** `backend/utils/recommendation_engine.py`

Modify init to load preferences:

```python
from database import tasker_preferences_collection

class RecommendationEngine:
    def __init__(self, tasker, options=None):
        self.tasker = tasker
        self.options = options or {}

        # Load custom preferences
        prefs = tasker_preferences_collection.find_one({"tasker_id": tasker["_id"]})
        if prefs:
            self.custom_weights = prefs.get("custom_weights", {})
            self.user_preferences = prefs.get("preferences", {})
            print(f"✓ Loaded custom preferences for tasker {tasker['_id']}")
        else:
            self.custom_weights = None
            self.user_preferences = {}

        # ... rest of init ...
```

#### 4.3 Apply Custom Weights in Scoring

**File:** `backend/utils/recommendation_engine.py`

Use custom weights if available:

```python
def calculate_overall_score(self, component_scores):
    """
    Calculate weighted overall score.
    Uses custom weights if tasker has preferences, otherwise default weights.
    """

    # Default weights
    weights = {
        "category_match": 0.20,
        "semantic_match": 0.30,
        "distance": 0.25,
        "recency": 0.15,
        "difficulty_match": 0.10,
        "historical_success": 0.10,
        "competition": 0.05
    }

    # Override with custom weights if available
    if self.custom_weights:
        weights.update(self.custom_weights)
        print(f"Using custom weights: {self.custom_weights}")

    # Calculate weighted score
    total_score = sum(
        component_scores.get(key, 0) * weights[key]
        for key in weights.keys()
    )

    return total_score
```

#### 4.4 Apply User Filters

**File:** `backend/utils/recommendation_engine.py`

Filter tasks based on preferences:

```python
def filter_tasks_by_preferences(self, tasks):
    """Apply user preference filters to tasks."""

    if not self.user_preferences:
        return tasks

    filtered_tasks = []

    for task in tasks:
        # Max distance filter
        max_distance = self.user_preferences.get("max_distance_miles")
        if max_distance and task.get("distance_miles", 0) > max_distance:
            continue

        # Avoid task types filter
        avoid_types = self.user_preferences.get("avoid_task_types", [])
        if task.get("category") in avoid_types:
            continue

        # Min score threshold (applied after scoring)
        # This will be checked later in the pipeline

        filtered_tasks.append(task)

    return filtered_tasks
```

#### 4.5 Preference Management Endpoints

**File:** `backend/routers/tasks.py`

New endpoints for preference management:

```python
from pydantic import BaseModel
from typing import Optional, List

class TaskerPreferences(BaseModel):
    """Model for tasker preference updates."""
    max_distance_miles: Optional[int] = None
    min_score_threshold: Optional[int] = None
    avoid_task_types: Optional[List[str]] = None
    prefer_high_budget: Optional[bool] = None
    notification_enabled: Optional[bool] = None

class CustomWeights(BaseModel):
    """Model for custom scoring weights."""
    category_match: Optional[float] = None
    semantic_match: Optional[float] = None
    distance: Optional[float] = None
    recency: Optional[float] = None
    difficulty_match: Optional[float] = None
    historical_success: Optional[float] = None
    competition: Optional[float] = None

@router.get("/users/me/preferences")
async def get_user_preferences(
    current_user: Annotated[dict, Depends(get_current_user)]
):
    """Get tasker's recommendation preferences."""
    prefs = tasker_preferences_collection.find_one({"tasker_id": current_user["_id"]})

    if not prefs:
        return {
            "message": "No preferences set, using defaults",
            "preferences": None,
            "custom_weights": None
        }

    return {
        "preferences": prefs.get("preferences", {}),
        "custom_weights": prefs.get("custom_weights", {}),
        "updated_at": prefs.get("updated_at")
    }

@router.put("/users/me/preferences")
async def update_user_preferences(
    preferences: TaskerPreferences,
    current_user: Annotated[dict, Depends(get_current_user)]
):
    """Update tasker's recommendation preferences."""

    update_data = {k: v for k, v in preferences.dict().items() if v is not None}

    tasker_preferences_collection.update_one(
        {"tasker_id": current_user["_id"]},
        {
            "$set": {
                "preferences": update_data,
                "updated_at": datetime.utcnow()
            }
        },
        upsert=True
    )

    # Clear cache since preferences changed
    if redis_client:
        cache_key = f"recommendations:{current_user['_id']}"
        redis_client.delete(cache_key)

    return {"message": "Preferences updated successfully"}

@router.put("/users/me/preferences/weights")
async def update_custom_weights(
    weights: CustomWeights,
    current_user: Annotated[dict, Depends(get_current_user)]
):
    """Update tasker's custom scoring weights."""

    # Validate weights sum to ~1.0 (allow small tolerance)
    weight_values = [v for v in weights.dict().values() if v is not None]
    if weight_values:
        total = sum(weight_values)
        if abs(total - 1.0) > 0.01:
            raise HTTPException(
                status_code=400,
                detail=f"Weights must sum to 1.0 (current sum: {total})"
            )

    update_data = {k: v for k, v in weights.dict().items() if v is not None}

    tasker_preferences_collection.update_one(
        {"tasker_id": current_user["_id"]},
        {
            "$set": {
                "custom_weights": update_data,
                "updated_at": datetime.utcnow()
            }
        },
        upsert=True
    )

    # Clear cache
    if redis_client:
        cache_key = f"recommendations:{current_user['_id']}"
        redis_client.delete(cache_key)

    return {"message": "Custom weights updated successfully"}
```

### Verification Steps

1. Set custom preferences via `PUT /users/me/preferences`
2. Get recommendations and verify custom weights applied
3. Check scores differ from default weights
4. Test filters (max distance, avoid types)
5. Verify cache is cleared when preferences change

### Success Metrics

- Taskers set custom preferences: > 30% adoption
- Acceptance rate for users with custom preferences: +15-20% vs defaults
- User satisfaction surveys: > 4.2/5.0

**Estimated Effort:** 4 days
**Impact:** Personalized recommendations, higher acceptance rates (+15-20%)

---

## Priority 5: Proactive Features - Background Jobs ⏰

### Why Fifth?

- Enables **push notifications** for high-match tasks
- **Pre-computes recommendations** overnight (faster responses during peak hours)
- **Real-time matching** when new tasks are posted

### Implementation Steps

#### 5.1 Install APScheduler

**File:** `backend/requirements.txt`

Add dependency:

```txt
apscheduler==3.10.4
```

#### 5.2 Create Background Task Scheduler

**File:** Create `backend/background_tasks.py`

```python
"""
Background task scheduler for recommendation system.

Jobs:
1. Pre-compute recommendations for all active taskers (runs nightly at 2 AM)
2. Send notifications for high-match tasks (runs every hour)
"""

from apscheduler.schedulers.background import BackgroundScheduler
from datetime import datetime, timedelta
import json
from database import (
    users_collection,
    tasks_collection,
    recommendation_interactions_collection
)
from utils.recommendation_engine import RecommendationEngine
from config import redis_client

scheduler = BackgroundScheduler()

# ========================================
# Job 1: Pre-compute Recommendations
# ========================================

def precompute_recommendations_for_all_taskers():
    """
    Run nightly to pre-compute recommendations for all active taskers.

    Benefits:
    - Faster API response during peak hours (serve from cache)
    - Reduced load on Gemini API during daytime
    - Ensures all taskers have fresh recommendations
    """
    print(f"[{datetime.utcnow()}] Starting recommendation pre-computation...")

    # Find all active taskers
    taskers = users_collection.find({
        "role": "tasker",
        "is_available": True
    })

    count = 0
    errors = 0

    for tasker in taskers:
        try:
            # Generate recommendations
            engine = RecommendationEngine(tasker, {"limit": 20})
            recommendations = engine.get_recommendations()

            # Store in cache for fast retrieval (24 hour TTL)
            if redis_client:
                cache_key = f"recommendations:{tasker['_id']}"
                redis_client.setex(
                    cache_key,
                    86400,  # 24 hours
                    json.dumps(recommendations, default=str)
                )

            count += 1

        except Exception as e:
            print(f"Error for tasker {tasker['_id']}: {e}")
            errors += 1

    print(f"✓ Pre-computed recommendations for {count} taskers ({errors} errors)")

# ========================================
# Job 2: High-Match Notifications
# ========================================

def send_high_match_notifications():
    """
    Check for high-scoring new tasks and notify matching taskers.

    Runs every hour to catch newly posted tasks.
    Sends push notification to taskers with score >= 90.
    """
    print(f"[{datetime.utcnow()}] Checking for high-match tasks...")

    # Find tasks posted in last hour
    one_hour_ago = datetime.utcnow() - timedelta(hours=1)
    new_tasks = tasks_collection.find({
        "status": "open",
        "posted_at": {"$gte": one_hour_ago}
    })

    notification_count = 0

    for task in new_tasks:
        # Find taskers who match this task's category
        matching_taskers = users_collection.find({
            "role": "tasker",
            "is_available": True,
            "service_categories": task["category_id"]
        })

        for tasker in matching_taskers:
            try:
                # Score this task for the tasker
                engine = RecommendationEngine(tasker)
                # You'll need to add a method to score a single task
                # score = engine.score_single_task(task)

                # For now, we'll compute full recommendations and find the task
                recommendations = engine.get_recommendations()
                task_score = None

                for rec in recommendations:
                    if str(rec["task"]["_id"]) == str(task["_id"]):
                        task_score = rec["match_score"]
                        break

                if task_score and task_score >= 90:
                    # TODO: Integrate with push notification service
                    # For now, just log
                    print(f"Would notify tasker {tasker['_id']} about task {task['_id']} (score: {task_score})")
                    notification_count += 1

                    # Track notification sent
                    recommendation_interactions_collection.insert_one({
                        "tasker_id": tasker["_id"],
                        "task_id": task["_id"],
                        "recommendation_score": task_score,
                        "recommendation_rank": 1,
                        "action": "notified",
                        "timestamp": datetime.utcnow(),
                        "task_completion_status": None,
                        "completion_timestamp": None,
                        "rating_given": None
                    })

            except Exception as e:
                print(f"Error scoring task {task['_id']} for tasker {tasker['_id']}: {e}")

    print(f"✓ Sent {notification_count} high-match notifications")

# ========================================
# Scheduler Configuration
# ========================================

def configure_scheduler():
    """Configure all scheduled jobs."""

    # Job 1: Pre-compute recommendations daily at 2 AM
    scheduler.add_job(
        precompute_recommendations_for_all_taskers,
        'cron',
        hour=2,
        minute=0,
        id='precompute_recommendations',
        replace_existing=True
    )
    print("✓ Scheduled job: Pre-compute recommendations (daily at 2 AM)")

    # Job 2: Check for high-match tasks every hour
    scheduler.add_job(
        send_high_match_notifications,
        'interval',
        hours=1,
        id='high_match_notifications',
        replace_existing=True
    )
    print("✓ Scheduled job: High-match notifications (every hour)")

# ========================================
# Lifecycle Management
# ========================================

def start_scheduler():
    """Start the background task scheduler."""
    if not scheduler.running:
        configure_scheduler()
        scheduler.start()
        print("✅ Background task scheduler started")
    else:
        print("⚠ Scheduler already running")

def stop_scheduler():
    """Stop the background task scheduler."""
    if scheduler.running:
        scheduler.shutdown()
        print("✅ Background task scheduler stopped")
    else:
        print("⚠ Scheduler not running")
```

#### 5.3 Integrate Scheduler with FastAPI

**File:** `backend/main.py`

Add startup/shutdown events:

```python
from background_tasks import start_scheduler, stop_scheduler
import os

# ... existing imports and app setup ...

@app.on_event("startup")
async def startup_event():
    """Application startup event handler."""
    print("Starting Handyman Platform API...")

    # Start background jobs (only in production or if explicitly enabled)
    enable_jobs = os.getenv("ENABLE_BACKGROUND_JOBS", "false").lower() == "true"
    if enable_jobs:
        start_scheduler()
    else:
        print("⚠ Background jobs disabled (set ENABLE_BACKGROUND_JOBS=true to enable)")

@app.on_event("shutdown")
async def shutdown_event():
    """Application shutdown event handler."""
    print("Shutting down Handyman Platform API...")
    stop_scheduler()
```

#### 5.4 Add Manual Job Trigger Endpoints (Testing)

**File:** `backend/routers/tasks.py`

Add admin endpoints to manually trigger jobs:

```python
from background_tasks import (
    precompute_recommendations_for_all_taskers,
    send_high_match_notifications
)

@router.post("/admin/jobs/precompute-recommendations")
async def trigger_precompute_job(
    current_user: Annotated[dict, Depends(get_current_user)]
):
    """Manually trigger recommendation pre-computation (admin only)."""
    if current_user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")

    # Run in background thread to avoid blocking API
    import threading
    thread = threading.Thread(target=precompute_recommendations_for_all_taskers)
    thread.start()

    return {"message": "Pre-computation job started"}

@router.post("/admin/jobs/send-notifications")
async def trigger_notification_job(
    current_user: Annotated[dict, Depends(get_current_user)]
):
    """Manually trigger high-match notifications (admin only)."""
    if current_user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")

    import threading
    thread = threading.Thread(target=send_high_match_notifications)
    thread.start()

    return {"message": "Notification job started"}
```

### Environment Variables to Add

```env
# Background Job Settings
ENABLE_BACKGROUND_JOBS=true          # Set to 'true' to enable scheduler
PRECOMPUTE_HOUR=2                    # Hour to run pre-computation (0-23)
HIGH_MATCH_THRESHOLD=90              # Minimum score for notifications
NOTIFICATION_CHECK_INTERVAL=1        # Hours between notification checks
```

### Verification Steps

1. Check console logs for scheduler startup message
2. Manually trigger pre-computation job: `POST /admin/jobs/precompute-recommendations`
3. Verify pre-computed recommendations in Redis: `redis-cli KEYS "recommendations:*"`
4. Create a new high-match task and wait for notification check
5. Check `recommendation_interactions` collection for "notified" actions

### Success Metrics

- Pre-computation runs successfully every night
- API response time during peak hours: < 100ms (served from cache)
- High-match notifications sent within 1 hour of task posting
- Notification engagement rate: > 60%

**Estimated Effort:** 3-4 days
**Impact:** Proactive engagement, real-time notifications, better UX

---

## Priority 6: Intelligence - A/B Testing Framework 🧪

### Why Sixth?

- Test different scoring weights to **optimize acceptance rates**
- **Data-driven algorithm improvements** (measure what works)
- Measure impact of changes before rolling out to all users

### Implementation Steps

#### 6.1 Create `ab_tests` Collection

**File:** `backend/database.py`

Add collection reference:

```python
ab_tests_collection = db.ab_tests
```

**Schema Design:**

```python
{
  "_id": ObjectId,
  "experiment_name": "weight_adjustment_v2",
  "description": "Testing higher distance weight for urban taskers",
  "start_date": datetime.utcnow(),
  "end_date": None,  # Set when experiment concludes
  "is_active": True,

  # Variant A (Control)
  "variant_a": {
    "name": "control",
    "description": "Current production weights",
    "weights": {
      "category_match": 0.20,
      "semantic_match": 0.30,
      "distance": 0.25,
      "recency": 0.15,
      "difficulty_match": 0.10,
      "historical_success": 0.10,
      "competition": 0.05
    }
  },

  # Variant B (Treatment)
  "variant_b": {
    "name": "treatment",
    "description": "Higher distance weight for urban taskers",
    "weights": {
      "category_match": 0.20,
      "semantic_match": 0.25,
      "distance": 0.35,  # Increased
      "recency": 0.10,   # Decreased
      "difficulty_match": 0.10,
      "historical_success": 0.10,
      "competition": 0.05
    }
  },

  # Tasker assignments (50/50 split)
  "tasker_assignments": {
    "tasker_123": "variant_a",
    "tasker_456": "variant_b",
    # ... more assignments
  },

  # Results (updated periodically)
  "results": {
    "variant_a": {
      "acceptance_rate": 0.42,
      "avg_score": 78.5,
      "sample_size": 150,
      "avg_time_to_accept_seconds": 120
    },
    "variant_b": {
      "acceptance_rate": 0.51,
      "avg_score": 82.3,
      "sample_size": 145,
      "avg_time_to_accept_seconds": 95
    },
    "winner": None,  # Set when test concludes
    "confidence_level": 0.95,
    "p_value": 0.03
  }
}
```

#### 6.2 A/B Test Assignment Logic

**File:** `backend/utils/recommendation_engine.py`

Integrate A/B testing into recommendation engine:

```python
from database import ab_tests_collection
import random

class RecommendationEngine:
    def __init__(self, tasker, options=None):
        self.tasker = tasker
        self.options = options or {}

        # ... existing preference loading ...

        # Check for active A/B tests
        active_test = ab_tests_collection.find_one({
            "is_active": True,
            "end_date": None
        })

        if active_test:
            tasker_id = str(tasker["_id"])

            # Check if tasker is already assigned to a variant
            if tasker_id not in active_test.get("tasker_assignments", {}):
                # Assign to variant (50/50 split)
                variant = "variant_a" if random.random() < 0.5 else "variant_b"

                ab_tests_collection.update_one(
                    {"_id": active_test["_id"]},
                    {"$set": {f"tasker_assignments.{tasker_id}": variant}}
                )

                print(f"✓ Assigned tasker {tasker_id} to {variant}")
            else:
                variant = active_test["tasker_assignments"][tasker_id]
                print(f"✓ Tasker {tasker_id} using existing variant: {variant}")

            # Use variant weights (override custom weights)
            self.custom_weights = active_test[variant]["weights"]
            self.active_ab_test = active_test["experiment_name"]
        else:
            self.active_ab_test = None
```

#### 6.3 A/B Test Management Endpoints

**File:** `backend/routers/tasks.py`

Create endpoints to manage A/B tests:

```python
from pydantic import BaseModel
from typing import Dict

class ABTestVariant(BaseModel):
    """Model for A/B test variant."""
    name: str
    description: str
    weights: Dict[str, float]

class ABTestCreate(BaseModel):
    """Model for creating A/B test."""
    experiment_name: str
    description: str
    variant_a: ABTestVariant
    variant_b: ABTestVariant

@router.post("/admin/ab-tests")
async def create_ab_test(
    test: ABTestCreate,
    current_user: Annotated[dict, Depends(get_current_user)]
):
    """Create a new A/B test (admin only)."""
    if current_user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")

    # Check if there's already an active test
    existing = ab_tests_collection.find_one({"is_active": True, "end_date": None})
    if existing:
        raise HTTPException(
            status_code=400,
            detail=f"Active test already exists: {existing['experiment_name']}"
        )

    # Create new test
    test_doc = {
        "experiment_name": test.experiment_name,
        "description": test.description,
        "start_date": datetime.utcnow(),
        "end_date": None,
        "is_active": True,
        "variant_a": test.variant_a.dict(),
        "variant_b": test.variant_b.dict(),
        "tasker_assignments": {},
        "results": {
            "variant_a": {"acceptance_rate": 0, "avg_score": 0, "sample_size": 0},
            "variant_b": {"acceptance_rate": 0, "avg_score": 0, "sample_size": 0},
            "winner": None
        }
    }

    result = ab_tests_collection.insert_one(test_doc)

    return {
        "message": "A/B test created successfully",
        "test_id": str(result.inserted_id)
    }

@router.get("/admin/ab-tests/active")
async def get_active_ab_test(
    current_user: Annotated[dict, Depends(get_current_user)]
):
    """Get currently active A/B test (admin only)."""
    if current_user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")

    active_test = ab_tests_collection.find_one({"is_active": True, "end_date": None})

    if not active_test:
        return {"message": "No active A/B test"}

    # Calculate current results
    results = calculate_ab_test_results(active_test)

    return {
        "experiment_name": active_test["experiment_name"],
        "description": active_test["description"],
        "start_date": active_test["start_date"],
        "taskers_enrolled": len(active_test.get("tasker_assignments", {})),
        "results": results
    }

@router.post("/admin/ab-tests/{test_id}/conclude")
async def conclude_ab_test(
    test_id: str,
    winner: str,  # "variant_a" or "variant_b"
    current_user: Annotated[dict, Depends(get_current_user)]
):
    """Conclude an A/B test and declare winner (admin only)."""
    if current_user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")

    if winner not in ["variant_a", "variant_b"]:
        raise HTTPException(status_code=400, detail="Winner must be 'variant_a' or 'variant_b'")

    ab_tests_collection.update_one(
        {"_id": ObjectId(test_id)},
        {
            "$set": {
                "is_active": False,
                "end_date": datetime.utcnow(),
                "results.winner": winner
            }
        }
    )

    return {"message": f"A/B test concluded. Winner: {winner}"}

def calculate_ab_test_results(test):
    """Calculate current results for an A/B test."""

    results = {"variant_a": {}, "variant_b": {}}

    for variant in ["variant_a", "variant_b"]:
        # Find all taskers in this variant
        assigned_taskers = [
            ObjectId(tid) for tid, v in test.get("tasker_assignments", {}).items()
            if v == variant
        ]

        if not assigned_taskers:
            results[variant] = {
                "acceptance_rate": 0,
                "avg_score": 0,
                "sample_size": 0
            }
            continue

        # Count interactions for this variant
        total_views = recommendation_interactions_collection.count_documents({
            "tasker_id": {"$in": assigned_taskers},
            "action": "viewed"
        })

        total_accepts = recommendation_interactions_collection.count_documents({
            "tasker_id": {"$in": assigned_taskers},
            "action": "accepted"
        })

        # Calculate avg score of accepted tasks
        accepted_scores = list(recommendation_interactions_collection.aggregate([
            {"$match": {"tasker_id": {"$in": assigned_taskers}, "action": "accepted"}},
            {"$group": {"_id": None, "avg_score": {"$avg": "$recommendation_score"}}}
        ]))

        avg_score = accepted_scores[0]["avg_score"] if accepted_scores else 0
        acceptance_rate = (total_accepts / total_views) if total_views > 0 else 0

        results[variant] = {
            "acceptance_rate": round(acceptance_rate, 4),
            "avg_score": round(avg_score, 2),
            "sample_size": total_views
        }

    return results
```

### Verification Steps

1. Create A/B test via `POST /admin/ab-tests`
2. Make recommendations as two different taskers
3. Verify they're assigned to different variants (check MongoDB)
4. Check different scores based on variant weights
5. View results via `GET /admin/ab-tests/active`
6. Conclude test and declare winner

### Success Metrics

- A/B tests run for at least 2 weeks (sufficient sample size)
- Variant performance measured accurately
- Winning variants increase acceptance rate by > 5%
- Continuous improvement: 1 test per quarter

**Estimated Effort:** 3-4 days
**Impact:** Continuous improvement, data-driven optimization

---

## 📂 Critical Files to Modify

### New Files to Create:

1. `backend/migrations/add_recommendation_indexes.py` - Database indexes
2. `backend/background_tasks.py` - Scheduled jobs for pre-computation and notifications

### Files to Modify:

1. **`backend/database.py`**
   - Add: `recommendation_interactions_collection`
   - Add: `tasker_preferences_collection`
   - Add: `ab_tests_collection`

2. **`backend/config.py`**
   - Add: Redis configuration
   - Add: Cache TTL settings

3. **`backend/routers/tasks.py`**
   - Add: Interaction tracking to recommendation endpoint
   - Add: Tracking to task acceptance endpoint
   - Add: Analytics endpoint (`/admin/recommendations/analytics`)
   - Add: Cache clearing endpoint (`/admin/recommendations/clear-cache`)
   - Add: Preference management endpoints (`/users/me/preferences`)
   - Add: A/B test management endpoints (`/admin/ab-tests`)

4. **`backend/utils/recommendation_engine.py`**
   - Add: Caching support
   - Add: Custom weights from preferences
   - Add: A/B test variant assignment

5. **`backend/utils/recommendation_helpers.py`**
   - Add: Semantic match caching

6. **`backend/main.py`**
   - Add: Scheduler startup/shutdown events

7. **`backend/requirements.txt`**
   - Add: `redis==5.0.1`
   - Add: `apscheduler==3.10.4`

---

## 🌍 Environment Variables to Add

Create or update `.env` file:

```env
# ========================================
# Redis Configuration
# ========================================
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_DB=0
REDIS_PASSWORD=

# Cache TTL Settings (in seconds)
RECOMMENDATION_CACHE_TTL=1800      # 30 minutes - Full recommendation cache
SEMANTIC_MATCH_CACHE_TTL=86400    # 24 hours - AI semantic match cache

# ========================================
# Background Job Settings
# ========================================
ENABLE_BACKGROUND_JOBS=true        # Set to 'true' to enable scheduler
PRECOMPUTE_HOUR=2                  # Hour to run pre-computation (0-23)
HIGH_MATCH_THRESHOLD=90            # Minimum score for push notifications
NOTIFICATION_CHECK_INTERVAL=1      # Hours between notification checks

# ========================================
# A/B Testing (Optional)
# ========================================
AB_TEST_ENABLED=true               # Enable A/B testing framework
AB_TEST_SAMPLE_SIZE_MIN=100        # Minimum sample size before concluding test
```

---

## ✅ Verification Steps

### Priority 1 (Tracking):
```bash
# 1. Make recommendation request
curl -X GET http://localhost:8000/tasks/recommendations \
  -H "Authorization: Bearer YOUR_TOKEN"

# 2. Check MongoDB for interaction data
mongosh
> db.recommendation_interactions.find().limit(5)

# 3. Accept a task (via API or UI)

# 4. Verify action updated to "accepted"
> db.recommendation_interactions.find({action: "accepted"})

# 5. Call analytics endpoint
curl -X GET http://localhost:8000/admin/recommendations/analytics \
  -H "Authorization: Bearer ADMIN_TOKEN"
```

### Priority 2 (Caching):
```bash
# 1. Make same recommendation request twice
time curl -X GET http://localhost:8000/tasks/recommendations
time curl -X GET http://localhost:8000/tasks/recommendations
# Second should be < 100ms vs 1-2 seconds

# 2. Check Redis for cached data
redis-cli KEYS "recommendations:*"
redis-cli GET "recommendations:USER_ID"

# 3. Clear cache
curl -X POST http://localhost:8000/admin/recommendations/clear-cache \
  -H "Authorization: Bearer ADMIN_TOKEN"

# 4. Verify keys deleted
redis-cli KEYS "recommendations:*"
```

### Priority 3 (Indexes):
```javascript
// Run in MongoDB shell
mongosh

// Check indexes exist
db.tasks.getIndexes()
db.users.getIndexes()
db.recommendation_interactions.getIndexes()

// Verify index usage
db.tasks.find({status: "open", category_id: "plumbing"}).explain("executionStats")
// Check "executionStats.executionTimeMillis" and "indexUsed" field
```

### Priority 4 (Preferences):
```bash
# 1. Set custom preferences
curl -X PUT http://localhost:8000/users/me/preferences \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"max_distance_miles": 10, "prefer_high_budget": true}'

# 2. Get recommendations
curl -X GET http://localhost:8000/tasks/recommendations \
  -H "Authorization: Bearer YOUR_TOKEN"

# 3. Verify custom weights applied (check logs or response scores)

# 4. Update custom weights
curl -X PUT http://localhost:8000/users/me/preferences/weights \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"distance": 0.40, "semantic_match": 0.25}'
```

### Priority 5 (Background Jobs):
```bash
# 1. Check startup logs
# Should see: "✅ Background task scheduler started"

# 2. Manually trigger pre-computation
curl -X POST http://localhost:8000/admin/jobs/precompute-recommendations \
  -H "Authorization: Bearer ADMIN_TOKEN"

# 3. Check Redis for pre-computed recommendations
redis-cli KEYS "recommendations:*"

# 4. Manually trigger notification job
curl -X POST http://localhost:8000/admin/jobs/send-notifications \
  -H "Authorization: Bearer ADMIN_TOKEN"

# 5. Check MongoDB for "notified" actions
mongosh
> db.recommendation_interactions.find({action: "notified"})
```

### Priority 6 (A/B Testing):
```bash
# 1. Create A/B test
curl -X POST http://localhost:8000/admin/ab-tests \
  -H "Authorization: Bearer ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "experiment_name": "distance_weight_test",
    "description": "Testing higher distance weight",
    "variant_a": {
      "name": "control",
      "description": "Current weights",
      "weights": {"category_match": 0.20, "semantic_match": 0.30, ...}
    },
    "variant_b": {
      "name": "treatment",
      "description": "Higher distance weight",
      "weights": {"category_match": 0.20, "semantic_match": 0.25, "distance": 0.35, ...}
    }
  }'

# 2. Make recommendations as two different taskers
# Check MongoDB to verify they're assigned to different variants

# 3. View test results
curl -X GET http://localhost:8000/admin/ab-tests/active \
  -H "Authorization: Bearer ADMIN_TOKEN"

# 4. Conclude test
curl -X POST http://localhost:8000/admin/ab-tests/TEST_ID/conclude \
  -H "Authorization: Bearer ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"winner": "variant_b"}'
```

---

## 📊 Success Metrics

After full implementation, measure:

### Performance Metrics:
- **API response time:** < 200ms (down from 1-2 seconds)
- **Cache hit rate:** > 70%
- **Database query time:** < 50ms (down from 200-500ms)
- **Concurrent requests:** Handle 100+ req/s without degradation

### Engagement Metrics:
- **Acceptance rate:** > 40% (baseline to establish)
- **Time to first accept:** < 2 minutes (baseline to establish)
- **Daily active taskers using recommendations:** Track trend
- **Return rate:** Taskers return for more recommendations > 60%

### Cost Metrics:
- **Gemini API calls:** -80% reduction
- **Database query load:** -60% reduction
- **Redis hit rate:** > 70%
- **Monthly API cost savings:** $X (calculate based on current usage)

### Quality Metrics:
- **Average score of accepted tasks:** > 75
- **User satisfaction surveys:** > 4.0/5.0
- **False positive rate:** < 10% (tasks shown but not relevant)
- **Tasker complaints:** < 5 per month

### Learning Metrics (Long-term):
- **Personalization improvement:** Acceptance rate increase +10% after 3 months
- **A/B test winners:** Consistent 5-10% improvement per winning variant
- **Algorithm evolution:** Quarterly improvements based on data

---

## 📅 Implementation Roadmap

### **Week 1: Foundation**

**Days 1-3: Implement Recommendation Interaction Tracking (Priority 1)**
- Create `recommendation_interactions` collection
- Add tracking to recommendation endpoint
- Add tracking to task acceptance endpoint
- Build analytics endpoint
- Test with real data

**Deliverables:**
- Analytics dashboard showing acceptance rates
- Interaction data flowing into MongoDB

---

### **Week 2: Performance**

**Days 4-5: Add Redis Caching (Priority 2)**
- Set up Redis (Docker or cloud)
- Add Redis configuration to `config.py`
- Implement caching in recommendation engine
- Cache semantic matches
- Test performance improvements

**Day 6: Create Database Indexes (Priority 3)**
- Write migration script
- Run migration to create indexes
- Monitor query performance before/after
- Document improvements

**Deliverables:**
- 5-10x performance improvement
- 80% reduction in API costs
- Sub-200ms API response times

---

### **Week 3-4: Personalization & Proactivity**

**Days 7-10: User Preferences System (Priority 4)**
- Create `tasker_preferences` collection
- Modify engine to load and use custom weights
- Build preference management endpoints
- Test with different preference combinations

**Days 11-14: Background Jobs (Priority 5)**
- Install and configure APScheduler
- Implement pre-computation job (nightly at 2 AM)
- Implement high-match notification job (hourly)
- Test scheduling and job execution
- Add manual trigger endpoints for testing

**Deliverables:**
- Taskers can customize recommendations
- Proactive notifications for high-match tasks
- Pre-computed recommendations for faster responses

---

### **Week 5: Optimization (Optional)**

**Days 15-18: A/B Testing Framework (Priority 6)**
- Create `ab_tests` collection
- Implement variant assignment logic in engine
- Build test management endpoints
- Run first A/B test (e.g., distance weight adjustment)

**Deliverables:**
- Data-driven algorithm optimization
- Framework for continuous improvement

---

## 🚨 Common Pitfalls & Solutions

### Pitfall 1: Cache Invalidation Issues
**Problem:** Stale recommendations after task status changes
**Solution:** Invalidate cache when tasks are accepted/completed:
```python
# In task acceptance endpoint
redis_client.delete(f"recommendations:*")  # Clear all caches
```

### Pitfall 2: Redis Connection Failures
**Problem:** App crashes when Redis is down
**Solution:** Graceful degradation (already implemented):
```python
if redis_client:
    # Use cache
else:
    # Fallback to direct computation
```

### Pitfall 3: Background Job Performance
**Problem:** Pre-computation takes too long, blocks other jobs
**Solution:** Add job timeout and chunking:
```python
@scheduler.scheduled_job('cron', hour=2, max_instances=1, misfire_grace_time=3600)
def precompute_recommendations():
    # Process in chunks of 100 taskers
    # Add timeout per tasker (30 seconds max)
```

### Pitfall 4: A/B Test Sample Size Too Small
**Problem:** Declaring winner prematurely
**Solution:** Enforce minimum sample size:
```python
MIN_SAMPLE_SIZE = 100
if results["variant_a"]["sample_size"] < MIN_SAMPLE_SIZE:
    raise HTTPException(400, "Sample size too small")
```

---

## 📚 Additional Resources

### Documentation to Read:
- **Redis Best Practices:** https://redis.io/docs/manual/patterns/
- **APScheduler Guide:** https://apscheduler.readthedocs.io/
- **MongoDB Indexing:** https://www.mongodb.com/docs/manual/indexes/
- **A/B Testing Statistics:** https://www.optimizely.com/optimization-glossary/ab-testing/

### Tools for Monitoring:
- **Redis Commander:** GUI for Redis (docker)
- **MongoDB Compass:** GUI for MongoDB
- **Grafana:** Dashboard for metrics (if using Prometheus)

---

## 🎯 Next Steps After Implementation

Once all 6 priorities are complete, consider:

1. **Machine Learning Layer**
   - Train model on historical interaction data
   - Predict acceptance probability
   - Personalize weights automatically per tasker

2. **Advanced Features**
   - Real-time collaboration filtering (taskers like you also accepted...)
   - Task similarity clustering
   - Predictive task completion time

3. **Mobile Push Notifications**
   - Integrate with Firebase Cloud Messaging (FCM)
   - Send push notifications for high-match tasks
   - Track notification engagement

4. **Business Intelligence**
   - Build admin dashboard with charts
   - Track recommendation quality trends
   - A/B test history and insights

---

## 📞 Questions or Blockers?

If you encounter issues during implementation:

1. **Check logs** - Most issues will show up in console logs
2. **Verify environment variables** - Ensure all required vars are set
3. **Test incrementally** - Don't implement all priorities at once
4. **Monitor performance** - Use Redis Commander and MongoDB Compass

**Good luck with the implementation! 🚀**

---

*Document Version: 1.0*
*Last Updated: 2026-02-10*
*Author: Backend Team*
