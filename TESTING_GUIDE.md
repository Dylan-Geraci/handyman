# Testing Guide - AI Task Recommendation System

## Quick Start Testing

### Prerequisites Check
✅ Backend server running on http://localhost:8000
✅ Database migration completed successfully
✅ API docs accessible at http://localhost:8000/docs

### Current Status
- **Backend**: ✅ Complete and running
- **Database**: ✅ Migrated with indexes created
- **Test Data**: ❌ No taskers or tasks in database yet

---

## Option 1: Test via API Documentation (Recommended)

### Step 1: Access API Docs
Open your browser to:
```
http://localhost:8000/docs
```

### Step 2: Create a Test Tasker User

1. Find the **POST /api/users** endpoint
2. Click "Try it out"
3. Use this sample request body:

```json
{
  "username": "test_tasker_1",
  "email": "tasker1@test.com",
  "password": "Test123!",
  "full_name": "Alice Builder",
  "role": "tasker",
  "phone_number": "555-0101",
  "location": "Brooklyn, NY",
  "bio": "Experienced handyman with 5 years in furniture assembly and home repairs",
  "skills": ["Furniture Assembly", "Carpentry", "Drywall Repair", "Painting"],
  "is_available": true
}
```

4. Click "Execute"
5. Verify response is `201 Created`

**Note**: You may need to also provide `service_categories` (array of category IDs). Get categories first from `GET /api/categories`.

### Step 3: Login as Tasker

1. Find the **POST /token** endpoint
2. Click "Try it out"
3. Enter credentials:
   - `username`: test_tasker_1
   - `password`: Test123!
4. Click "Execute"
5. Copy the `access_token` from the response

### Step 4: Authorize in Swagger UI

1. Click the green "Authorize" button at the top right
2. Enter: `Bearer YOUR_ACCESS_TOKEN` (paste the token)
3. Click "Authorize"
4. Click "Close"

### Step 5: Create Test Tasks

1. Find the **POST /api/tasks** endpoint
2. Create 3-5 tasks with different characteristics:

**Task 1: High Match (Same category, nearby, recent)**
```json
{
  "title": "Assemble IKEA bed frame",
  "description": "Need help assembling a MALM king bed frame. All parts included. Should take 1-2 hours.",
  "location": "Brooklyn, NY",
  "category_id": "USE_ACTUAL_CATEGORY_ID",
  "task_type_id": "USE_ACTUAL_TASK_TYPE_ID",
  "status": "open"
}
```

**Task 2: Medium Match (Different location)**
```json
{
  "title": "Paint living room walls",
  "description": "Need to paint 2 walls in living room. Paint and supplies provided. About 4 hours work.",
  "location": "Queens, NY",
  "category_id": "USE_ACTUAL_CATEGORY_ID",
  "task_type_id": "USE_ACTUAL_TASK_TYPE_ID",
  "status": "open"
}
```

**Task 3: Lower Match (Far away)**
```json
{
  "title": "Fix drywall hole",
  "description": "Small hole in drywall needs patching and painting to match existing wall.",
  "location": "Staten Island, NY",
  "category_id": "USE_ACTUAL_CATEGORY_ID",
  "task_type_id": "USE_ACTUAL_TASK_TYPE_ID",
  "status": "open"
}
```

### Step 6: Test Recommendations Endpoint

1. Find the **GET /api/tasks/recommendations** endpoint
2. Click "Try it out"
3. Try different parameter combinations:

**Test 1: Default parameters**
```
limit: 10
min_score: 50
location_radius: 25
include_reasons: true
```

**Test 2: Narrow search**
```
limit: 5
min_score: 70
location_radius: 10
include_reasons: true
```

**Test 3: Wide search**
```
limit: 20
min_score: 30
location_radius: 50
include_reasons: true
```

4. Click "Execute"
5. Review the response

### Expected Response Format
```json
{
  "recommendations": [
    {
      "task": {
        "id": "...",
        "title": "Assemble IKEA bed frame",
        "description": "...",
        "location": "Brooklyn, NY",
        ...
      },
      "match_score": 85.5,
      "distance_miles": 2.3,
      "posted_minutes_ago": 15,
      "match_breakdown": {
        "category_match": 20,
        "semantic_match": 28,
        "location_score": 25,
        "recency_score": 15,
        "difficulty_match": 8,
        "historical_success": 0,
        "competition_level": 5
      },
      "match_reasons": [
        "Perfect category match for your services",
        "Strong skill alignment: furniture assembly",
        "Very close: only 2.3 miles away",
        "Posted recently (15 minutes ago)",
        "Low competition in this area"
      ]
    }
  ],
  "total_available": 3,
  "showing_top": 3
}
```

### What to Verify
✅ Tasks are returned and sorted by match_score (descending)
✅ Match scores are between 0-100
✅ Tasks with better fit have higher scores
✅ Distance calculations are reasonable
✅ Match reasons are clear and accurate
✅ No errors or exceptions

---

## Option 2: Test with Python Script

### Create Test Script

Create `backend/test_api_recommendations.py`:

```python
import requests
import json

BASE_URL = "http://localhost:8000"

# Step 1: Create tasker user
print("Creating test tasker...")
user_data = {
    "username": "test_tasker_api",
    "email": "api_tasker@test.com",
    "password": "Test123!",
    "full_name": "Bob Builder",
    "role": "tasker",
    "phone_number": "555-0102",
    "location": "Manhattan, NY",
    "bio": "Professional carpenter with expertise in furniture and cabinetry",
    "skills": ["Furniture Assembly", "Cabinet Installation", "Wood Repair"],
    "is_available": True
}

response = requests.post(f"{BASE_URL}/api/users", json=user_data)
if response.status_code == 201:
    print("✓ User created successfully")
else:
    print(f"✗ Failed to create user: {response.text}")

# Step 2: Login
print("\nLogging in...")
login_data = {
    "username": "test_tasker_api",
    "password": "Test123!"
}

response = requests.post(f"{BASE_URL}/token", data=login_data)
if response.status_code == 200:
    token = response.json()["access_token"]
    print("✓ Login successful")
else:
    print(f"✗ Login failed: {response.text}")
    exit(1)

headers = {"Authorization": f"Bearer {token}"}

# Step 3: Get categories
print("\nFetching categories...")
response = requests.get(f"{BASE_URL}/api/categories")
categories = response.json()
category_id = categories[0]["id"] if categories else None
print(f"✓ Using category: {category_id}")

# Step 4: Create test tasks
print("\nCreating test tasks...")
task_data = {
    "title": "Build custom bookshelf",
    "description": "Need a 6-foot tall custom bookshelf built for home office",
    "location": "Manhattan, NY",
    "category_id": category_id,
    "status": "open"
}

response = requests.post(f"{BASE_URL}/api/tasks", json=task_data, headers=headers)
if response.status_code == 201:
    print("✓ Task created successfully")
else:
    print(f"Note: Task creation might require different auth")

# Step 5: Get recommendations
print("\n" + "="*60)
print("TESTING RECOMMENDATIONS")
print("="*60)

response = requests.get(
    f"{BASE_URL}/api/tasks/recommendations",
    params={
        "limit": 10,
        "min_score": 50,
        "location_radius": 25,
        "include_reasons": True
    },
    headers=headers
)

if response.status_code == 200:
    data = response.json()
    print(f"\n✓ Recommendations retrieved successfully")
    print(f"Total available tasks: {data['total_available']}")
    print(f"Showing top: {data['showing_top']}\n")

    for i, rec in enumerate(data['recommendations'], 1):
        print(f"{i}. {rec['task']['title']}")
        print(f"   Match Score: {rec['match_score']:.1f}/100")
        print(f"   Distance: {rec['distance_miles']:.1f} miles")
        print(f"   Posted: {rec['posted_minutes_ago']} minutes ago")
        print(f"   Reasons:")
        for reason in rec['match_reasons']:
            print(f"     - {reason}")
        print()
else:
    print(f"✗ Failed to get recommendations: {response.status_code}")
    print(response.text)
```

### Run Test Script
```bash
cd backend
python test_api_recommendations.py
```

---

## Option 3: Manual Database Insert

If user creation is blocked, insert directly to MongoDB:

```python
# backend/create_test_data.py
from database import users_collection, tasks_collection, categories_collection
from datetime import datetime
from bson import ObjectId

# Get category
category = categories_collection.find_one({})
category_id = category["_id"] if category else ObjectId()

# Create tasker
tasker = {
    "_id": ObjectId(),
    "username": "manual_tasker",
    "email": "manual@test.com",
    "full_name": "Charlie Builder",
    "hashed_password": "$2b$12$dummyhash",  # Won't be used for testing
    "role": "tasker",
    "phone_number": "555-0103",
    "location": "Brooklyn, NY",
    "bio": "Expert in all home repairs",
    "skills": ["Everything"],
    "service_categories": [str(category_id)],
    "is_available": True,
    "created_at": datetime.utcnow(),
    "experience_level": 2,
    "completed_tasks_count": 20,
    "avg_rating": 4.7,
    "preferred_locations": ["Brooklyn"],
    "coordinates": {"lat": 40.6782, "lng": -73.9442}
}

users_collection.insert_one(tasker)
print(f"✓ Created tasker: {tasker['username']}")

# Create tasks
tasks = [
    {
        "_id": ObjectId(),
        "title": "Assemble furniture",
        "description": "IKEA furniture assembly needed",
        "location": "Brooklyn, NY",
        "category_id": str(category_id),
        "status": "open",
        "posted_at": datetime.utcnow(),
        "estimated_difficulty": 2,
        "coordinates": {"lat": 40.6782, "lng": -73.9442}
    },
    # Add more tasks...
]

for task in tasks:
    tasks_collection.insert_one(task)
    print(f"✓ Created task: {task['title']}")
```

Run:
```bash
cd backend
python create_test_data.py
```

---

## What to Look For

### Good Results
✅ **Match scores make sense**: Tasks that are closer, more recent, and better skill matches have higher scores
✅ **Reasons are accurate**: Match reasons correctly explain why the task is recommended
✅ **Sorted correctly**: Tasks are in descending order by match_score
✅ **Distance is calculated**: distance_miles shows reasonable values
✅ **No errors**: API responds with 200 status code

### Red Flags
❌ **All scores are identical**: Scoring algorithm not working
❌ **Scores outside 0-100**: Formula error
❌ **No tasks returned**: Check min_score threshold or category matching
❌ **Distances all 0 or wrong**: Geocoding issue
❌ **API errors**: Check authentication, database connection, or logs

---

## Troubleshooting

### Error: 401 Unauthorized
**Solution**:
1. Login again to get fresh token
2. Click Authorize in Swagger UI
3. Ensure token format is `Bearer YOUR_TOKEN`

### Error: 403 Forbidden
**Solution**:
- Only taskers can access recommendations
- Verify user role is "tasker" (not "client")

### Error: No recommendations returned
**Possible causes**:
1. No tasks match tasker's categories
2. min_score threshold too high (try lowering to 0)
3. No open tasks in database

**Solution**:
- Check `total_available` in response
- Lower min_score to 0
- Create more tasks in tasker's categories

### Error: AI/Gemini API failure
**Expected behavior**: Should fallback to keyword matching
**Check**: `match_breakdown.semantic_match` should still have a value

### Error: All distances are 0
**Cause**: Geocoding not working (city not in mapping)
**Solution**:
- Use major cities (Brooklyn, Manhattan, Queens, etc.)
- Or add your cities to `utils/geocoding.py`

---

## Testing Checklist

- [ ] Backend server is running (http://localhost:8000)
- [ ] Created at least 1 tasker user
- [ ] Created at least 3 test tasks
- [ ] Successfully logged in and got JWT token
- [ ] Called /api/tasks/recommendations endpoint
- [ ] Received recommendations with scores
- [ ] Match scores are between 0-100
- [ ] Tasks are sorted by score (descending)
- [ ] Match reasons are present and accurate
- [ ] Distance calculations are reasonable
- [ ] Tested different parameter combinations
- [ ] No errors in response
- [ ] Backend logs show no errors

---

## Next Steps After Testing

Once testing is successful:

1. **Document Results**: Note any issues or unexpected behavior
2. **Tune Algorithm**: Adjust weights if scores don't match expectations
3. **Phase 2**: Begin frontend integration (RecommendationsPage.jsx)
4. **User Testing**: Have real taskers test and provide feedback

---

## Quick Commands Reference

```bash
# Start backend server
cd backend
uvicorn main:app --reload --port 8000

# Run unit tests
cd backend
python test_recommendations.py

# Check database connection
cd backend
python test_db_connection.py

# View server logs
# Check console where uvicorn is running

# Stop server
# Press Ctrl+C in the terminal
```

---

**Status**: Ready for Testing
**Blocker**: Need to create test data (tasker users + tasks)
**Estimated Testing Time**: 15-30 minutes

*Last Updated: February 8, 2026*
