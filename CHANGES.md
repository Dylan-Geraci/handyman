# Development Changes Log

## 2026-02-08 - AI Recommendation System (Phase 1)

### Database Migration
**Script**: `backend/migrations/add_recommendation_fields.py`

**Users collection (taskers) - New fields**:
- `experience_level` (int): 1=beginner, 2=intermediate, 3=expert
- `completed_tasks_count` (int): Cached count for performance
- `avg_rating` (float): Cached average rating from reviews
- `preferred_locations` (array): Preferred work locations
- `last_active` (datetime): Last activity timestamp
- `coordinates` (object): Geocoded location {lat, lng}

**Tasks collection - New fields**:
- `posted_at` (datetime): UTC timestamp when task was posted
- `budget_range` (string): Optional budget (e.g., "$50-$75")
- `estimated_difficulty` (int): 1-3, AI-generated difficulty level
- `coordinates` (object): Geocoded task location {lat, lng}

### Database Indexes
Created for optimal query performance:
1. `tasks.posted_at` (descending) - Fast sorting by recency
2. `tasks.category_id + status` (compound) - Efficient category filtering
3. `tasks.location` (text) - Location-based search
4. `users.service_categories` - Tasker skill matching
5. `users.role + experience_level` (compound) - Experience-based filtering

### New Backend Files
- `backend/utils/recommendation_engine.py` - Core RecommendationEngine class with 7-factor algorithm
- `backend/utils/recommendation_helpers.py` - Scoring component functions (distance, recency, difficulty, etc.)
- `backend/utils/geocoding.py` - Location geocoding with city-to-coordinates mapping
- `backend/migrations/add_recommendation_fields.py` - Database schema migration script
- `backend/test_recommendations.py` - Unit tests for recommendation system

### API Endpoints
**GET** `/api/tasks/recommendations` - AI-ranked task recommendations for authenticated taskers

Query parameters:
- `limit` (default: 10, max: 50) - Number of recommendations
- `min_score` (default: 50) - Minimum match score threshold (0-100)
- `location_radius` (default: 25) - Search radius in miles
- `include_reasons` (default: true) - Include match explanations

### Recommendation Algorithm
**7-factor scoring system** (0-100 scale):
1. **Category Match** (20 points) - Boolean match with tasker's service categories
2. **AI Semantic Match** (30 points) - Gemini AI analyzes task-to-skill fit (keyword fallback)
3. **Distance Score** (25 points) - Geographic proximity (0-5 miles = max points)
4. **Recency Score** (15 points) - Time since posting (last hour = max points)
5. **Difficulty Match** (10 points) - Task complexity aligned with tasker experience
6. **Historical Success** (10 points) - Tasker's past performance on similar tasks
7. **Competition Level** (5 points) - Number of other qualified taskers nearby

**Formula**: `(Total Points / 115) * 100`

### Modified Existing Files
- `backend/routers/tasks.py` - Added `/tasks/recommendations` endpoint, updated task creation
- `backend/models.py` - Added RecommendationQuery, TaskRecommendation, MatchBreakdown models
- `backend/config.py` - Updated password hashing configuration
- `backend/security.py` - Implemented direct bcrypt usage

### Testing
- Unit tests created for all scoring components
- Integration tests for recommendation pipeline
- Mock Gemini API for testing fallback scenarios
- Test data creation scripts

---

## 2026-02-04 - Categories & Task Types

### Database Collections
**categories**:
- `name` (string)
- `description` (string)
- `icon_url` (string, optional)

**task_types**:
- `name` (string)
- `description` (string)
- `category_id` (string, reference to categories)
- `keywords` (array of strings for search optimization)

### Schema Updates
- `users.service_categories` - Array of category IDs (taskers only)
- `tasks.category_id` - Required reference to categories
- `tasks.task_type_id` - Required reference to task_types

### API Endpoints
- **GET** `/api/categories` - List all categories
- **GET** `/api/categories/{id}` - Get single category details
- **GET** `/api/categories/{id}/task-types` - Get all task types for a category
- **GET** `/api/task-types` - List all task types (optional ?category_id filter)
- **GET** `/api/task-types/{id}` - Get single task type
- **GET** `/api/task-types/search?q={query}` - Search task types by name/keywords
- **GET** `/api/tasks/matches` - Get tasks filtered by tasker's service categories

### Seed Data
10 main categories based on TaskRabbit research:
1. Handyman & Home Repairs
2. Furniture Assembly
3. Mounting & Installation
4. Moving & Heavy Lifting
5. Cleaning Services
6. Yard Work & Outdoor Maintenance
7. Delivery & Errands
8. Personal Assistant & Organization
9. Seasonal Services
10. Specialty Services

---

## Dependencies Added
- `geopy==2.4.1` - Geographic distance calculations (optional, using simple geocoding for MVP)

## Environment Variables
```env
# Required
DATABASE_URL=mongodb+srv://...
GEMINI_API_KEY=your_gemini_api_key
SECRET_KEY=your_jwt_secret

# Optional (recommendation system)
RECOMMENDATION_CACHE_TTL=600
MAX_RECOMMENDATIONS=50
DEFAULT_LOCATION_RADIUS=25
```
