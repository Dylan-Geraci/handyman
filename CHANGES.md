# Project Changes Log

## 2026-02-04 - AI-Powered Task Recommendation System

### Overview
Implementing a proactive task recommendation algorithm that uses AI to match taskers with the most relevant tasks based on skills, location, recency, and other factors.

### Added

#### Backend - Core Infrastructure
- **New Directory**: `backend/utils/` - Utility modules for recommendation system
- **New Directory**: `backend/migrations/` - Database migration scripts

#### Backend - New Files
- `backend/migrations/add_recommendation_fields.py` - Migration script to add recommendation-related fields to users and tasks collections
- `backend/utils/recommendation_helpers.py` - Helper functions for scoring components (distance, recency, difficulty, etc.)
- `backend/utils/geocoding.py` - Location geocoding utilities with city-to-coordinates mapping
- `backend/utils/recommendation_engine.py` - Core RecommendationEngine class implementing the scoring algorithm
- `backend/test_recommendations.py` - Unit tests for recommendation system

#### Backend - Database Schema Changes

**Users Collection (Taskers) - New Fields:**
```python
{
    "experience_level": int,           # 1=beginner, 2=intermediate, 3=expert
    "completed_tasks_count": int,      # Cached count for performance
    "avg_rating": float,               # Cached average rating from reviews
    "preferred_locations": [str],      # Array of preferred work locations
    "last_active": datetime,           # Last activity timestamp
    "coordinates": {                   # Geocoded location for distance calculation
        "lat": float,
        "lng": float
    }
}
```

**Tasks Collection - New Fields:**
```python
{
    "posted_at": datetime,             # UTC timestamp when task was posted
    "budget_range": str,               # Optional budget (e.g., "$50-$75")
    "estimated_difficulty": int,       # 1-3, AI-generated difficulty level
    "coordinates": {                   # Geocoded task location
        "lat": float,
        "lng": float
    }
}
```

#### Backend - API Endpoints
- **GET** `/api/tasks/recommendations` - Returns AI-ranked task recommendations for authenticated taskers
  - Query Parameters:
    - `limit` (default: 10, max: 50) - Number of recommendations
    - `min_score` (default: 50) - Minimum match score threshold
    - `location_radius` (default: 25) - Search radius in miles
    - `include_reasons` (default: true) - Include match explanations

### Modified

#### Backend - Existing Files
- `backend/routers/tasks.py`
  - Added `/tasks/recommendations` endpoint
  - Modified `create_task` to add `posted_at`, `estimated_difficulty`, and `coordinates`
- `backend/models.py`
  - Added `RecommendationQuery` Pydantic model
  - Added `TaskRecommendation` Pydantic model
  - Added `MatchBreakdown` Pydantic model

### Algorithm Details

#### Scoring System (7 Factors, 0-100 Scale)
1. **Category Match** (20 points) - Boolean match with tasker's service categories
2. **AI Semantic Match** (30 points) - Gemini AI analyzes task-to-skill fit with keyword fallback
3. **Distance Score** (25 points) - Geographic proximity (0-5 miles = max points)
4. **Recency Score** (15 points) - Time since posting (last hour = max points)
5. **Difficulty Match** (10 points) - Task complexity aligned with tasker experience
6. **Historical Success** (10 points) - Tasker's past performance on similar tasks
7. **Competition Level** (5 points) - Number of other qualified taskers nearby

**Formula**: `Final Score = (Total Points / 115) * 100`

#### AI Integration
- Uses Google Gemini 2.5 Pro for semantic matching
- Fallback to keyword matching if AI unavailable
- Caches similar task analysis for performance

### Dependencies Added
- `geopy==2.4.1` - Geographic distance calculations (optional, using simple geocoding for MVP)

### Environment Variables
```env
RECOMMENDATION_CACHE_TTL=600        # Recommendation cache duration (seconds)
MAX_RECOMMENDATIONS=50              # Maximum tasks to score per request
DEFAULT_LOCATION_RADIUS=25          # Default search radius (miles)
```

### Database Indexes
```javascript
db.tasks.createIndex({ "posted_at": -1 })
db.tasks.createIndex({ "category_id": 1, "status": 1 })
db.tasks.createIndex({ "location": "text" })
db.users.createIndex({ "service_categories": 1 })
```

### Testing
- Unit tests for each scoring component
- Integration tests for recommendation pipeline
- Mock Gemini API for testing fallback scenarios
- Edge case testing (no tasks, no location data, AI failures)

### Performance Considerations
- Recommendations calculated on-demand (caching in Phase 3)
- AI used only after initial category filtering
- Efficient MongoDB queries with proper indexing
- Fallback mechanisms for all external dependencies

### Security
- Endpoint restricted to authenticated taskers only
- Input validation on all query parameters
- Rate limiting considerations for AI API calls

---

## Next Steps (Planned)

### Phase 2: Frontend Integration (Week 2)
- Create `frontend/src/pages/RecommendationsPage.jsx`
- Update `frontend/src/components/TaskerDashboard.jsx`
- Add recommendation API integration
- Build `TaskRecommendationCard` component

### Phase 3: Optimization (Ongoing)
- Implement caching layer (Redis or in-memory)
- A/B test scoring weights
- Add machine learning personalization
- Implement push notifications for high-match tasks

---

## Rollback Plan
If issues arise, the system can be rolled back by:
1. Removing the `/tasks/recommendations` endpoint
2. Database fields are additive and won't break existing functionality
3. Frontend continues to use existing `/tasks/matches` endpoint

---

*Last Updated: 2026-02-04*
