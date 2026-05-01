"""
Quick script to create test data for the recommendation system.

Usage:
    python create_test_data.py

This will create:
- 2 tasker users with different skills and locations
- 8 test tasks across different categories and locations
"""

from database import users_collection, tasks_collection, categories_collection, task_types_collection
from config import pwd_context
from datetime import datetime, timedelta
from bson import ObjectId
import random

DEMO_PASSWORD = "demo123"
DEMO_HASH = pwd_context.hash(DEMO_PASSWORD)

def create_test_data():
    print("\n" + "="*60)
    print("   CREATING TEST DATA FOR RECOMMENDATION SYSTEM")
    print("="*60 + "\n")

    # Get existing categories and task types
    categories = list(categories_collection.find({}))
    task_types = list(task_types_collection.find({}))

    if not categories:
        print("[WARNING] No categories found in database!")
        print("Please create categories first via the API")
        return

    print(f"Found {len(categories)} categories")
    print(f"Found {len(task_types)} task types\n")

    # Sample category and task type IDs
    category_ids = [str(cat["_id"]) for cat in categories]
    task_type_ids = [str(tt["_id"]) for tt in task_types] if task_types else []

    # Create test taskers
    print("Creating test taskers...")

    # Sarah covers ALL categories so she always has matches for whichever
    # category the demo task gets posted under
    tasker_1 = {
        "_id": ObjectId(),
        "username": "alice_builder",
        "email": "sarah@testhandyman.com",
        "full_name": "Sarah Builder",
        "hashed_password": DEMO_HASH,
        "role": "tasker",
        "phone_number": "555-0101",
        "location": "Brooklyn, NY",
        "bio": "Experienced handyman specializing in furniture assembly, carpentry, and home repairs. 5 years of professional experience.",
        "skills": ["Furniture Assembly", "Carpentry", "Drywall Repair", "Painting", "TV Mounting", "General Repairs"],
        "service_categories": category_ids,  # all categories for demo coverage
        "is_available": True,
        "created_at": datetime.utcnow(),
        "experience_level": 2,
        "completed_tasks_count": 25,
        "avg_rating": 4.7,
        "preferred_locations": ["Brooklyn", "Manhattan"],
        "last_active": datetime.utcnow(),
        "coordinates": {"lat": 40.6782, "lng": -73.9442}
    }

    tasker_2 = {
        "_id": ObjectId(),
        "username": "bob_fixer",
        "email": "bob@testhandyman.com",
        "full_name": "Bob Fixer",
        "hashed_password": DEMO_HASH,
        "role": "tasker",
        "phone_number": "555-0102",
        "location": "Manhattan, NY",
        "bio": "Expert plumber and electrician with 10+ years experience. Licensed and insured.",
        "skills": ["Plumbing", "Electrical Work", "HVAC", "Appliance Repair"],
        "service_categories": category_ids[2:4] if len(category_ids) >= 4 else category_ids,
        "is_available": True,
        "created_at": datetime.utcnow(),
        "experience_level": 3,
        "completed_tasks_count": 78,
        "avg_rating": 4.9,
        "preferred_locations": ["Manhattan", "Queens"],
        "last_active": datetime.utcnow(),
        "coordinates": {"lat": 40.7831, "lng": -73.9712}
    }

    # Customer for demo (posts the TV-mount task during walkthrough)
    customer_demo = {
        "_id": ObjectId(),
        "username": "mike_customer",
        "email": "mike@testhandyman.com",
        "full_name": "Mike Carter",
        "hashed_password": DEMO_HASH,
        "role": "client",
        "phone_number": "555-0200",
        "location": "Brooklyn, NY",
        "bio": "",
        "skills": [],
        "service_categories": [],
        "is_available": True,
        "created_at": datetime.utcnow(),
    }

    # Admin for demo
    admin_demo = {
        "_id": ObjectId(),
        "username": "admin",
        "email": "admin@testhandyman.com",
        "full_name": "Demo Admin",
        "hashed_password": DEMO_HASH,
        "role": "admin",
        "phone_number": "555-0001",
        "location": "Brooklyn, NY",
        "bio": "",
        "skills": [],
        "service_categories": [],
        "is_available": True,
        "created_at": datetime.utcnow(),
    }

    def upsert_user(user_doc):
        existing = users_collection.find_one({"username": user_doc["username"]})
        if existing:
            # Refresh password + key demo fields so re-runs always work
            users_collection.update_one(
                {"username": user_doc["username"]},
                {"$set": {
                    "hashed_password": DEMO_HASH,
                    "role": user_doc["role"],
                    "service_categories": user_doc.get("service_categories", []),
                }}
            )
            print(f"[REFRESH] User updated: {user_doc['username']}")
        else:
            users_collection.insert_one(user_doc)
            print(f"[OK] Created user: {user_doc['username']}")

    upsert_user(tasker_1)
    upsert_user(tasker_2)
    upsert_user(customer_demo)
    upsert_user(admin_demo)

    print()

    # Create test tasks
    print("Creating test tasks...\n")

    now = datetime.utcnow()

    tasks = [
        {
            "title": "Assemble IKEA bed frame",
            "description": "Need help assembling a MALM king bed frame. All parts and tools included. Should take 1-2 hours.",
            "location": "Brooklyn, NY",
            "category_id": category_ids[0] if category_ids else None,
            "task_type_id": task_type_ids[0] if task_type_ids else None,
            "status": "open",
            "posted_at": now - timedelta(minutes=30),  # 30 min ago
            "estimated_difficulty": 2,
            "coordinates": {"lat": 40.6782, "lng": -73.9442},
            "budget_range": "$50-$75"
        },
        {
            "title": "Fix leaking kitchen faucet",
            "description": "Kitchen faucet has been dripping for a week. Need it fixed ASAP. Might need new parts.",
            "location": "Manhattan, NY",
            "category_id": category_ids[1] if len(category_ids) > 1 else category_ids[0],
            "task_type_id": task_type_ids[1] if len(task_type_ids) > 1 else task_type_ids[0],
            "status": "open",
            "posted_at": now - timedelta(hours=2),  # 2 hours ago
            "estimated_difficulty": 2,
            "coordinates": {"lat": 40.7831, "lng": -73.9712},
            "budget_range": "$75-$150"
        },
        {
            "title": "Paint bedroom walls",
            "description": "Need 3 walls painted in master bedroom. Paint and supplies will be provided. About 200 sq ft total.",
            "location": "Queens, NY",
            "category_id": category_ids[0] if category_ids else None,
            "task_type_id": task_type_ids[2] if len(task_type_ids) > 2 else task_type_ids[0],
            "status": "open",
            "posted_at": now - timedelta(hours=6),  # 6 hours ago
            "estimated_difficulty": 2,
            "coordinates": {"lat": 40.7282, "lng": -73.7949},
            "budget_range": "$200-$300"
        },
        {
            "title": "Install ceiling fan",
            "description": "Replace old light fixture with new ceiling fan. Fan purchased, just need installation. Wiring already in place.",
            "location": "Brooklyn, NY",
            "category_id": category_ids[1] if len(category_ids) > 1 else category_ids[0],
            "task_type_id": task_type_ids[3] if len(task_type_ids) > 3 else task_type_ids[0],
            "status": "open",
            "posted_at": now - timedelta(hours=12),  # 12 hours ago
            "estimated_difficulty": 3,
            "coordinates": {"lat": 40.6500, "lng": -73.9500},
            "budget_range": "$100-$150"
        },
        {
            "title": "Repair drywall holes",
            "description": "3 small holes in living room wall from removed shelving. Need patching, sanding, and painting to match.",
            "location": "Manhattan, NY",
            "category_id": category_ids[0] if category_ids else None,
            "task_type_id": task_type_ids[0] if task_type_ids else None,
            "status": "open",
            "posted_at": now - timedelta(days=1),  # 1 day ago
            "estimated_difficulty": 1,
            "coordinates": {"lat": 40.7500, "lng": -73.9800},
            "budget_range": "$50-$100"
        },
        {
            "title": "Build custom bookshelf",
            "description": "Need custom bookshelf built for home office. 6 feet tall, 4 feet wide. Design already planned. Materials will be provided.",
            "location": "Brooklyn, NY",
            "category_id": category_ids[0] if category_ids else None,
            "task_type_id": task_type_ids[0] if task_type_ids else None,
            "status": "open",
            "posted_at": now - timedelta(days=2),  # 2 days ago
            "estimated_difficulty": 3,
            "coordinates": {"lat": 40.6900, "lng": -73.9800},
            "budget_range": "$300-$500"
        },
        {
            "title": "Replace toilet",
            "description": "Old toilet cracked and needs replacement. New toilet purchased. Need removal of old and installation of new.",
            "location": "Queens, NY",
            "category_id": category_ids[1] if len(category_ids) > 1 else category_ids[0],
            "task_type_id": task_type_ids[1] if len(task_type_ids) > 1 else task_type_ids[0],
            "status": "open",
            "posted_at": now - timedelta(days=3),  # 3 days ago
            "estimated_difficulty": 2,
            "coordinates": {"lat": 40.7000, "lng": -73.8000},
            "budget_range": "$150-$250"
        },
        {
            "title": "Assemble office desk",
            "description": "Large L-shaped office desk from Wayfair needs assembly. Heavy pieces, might need 2 people.",
            "location": "Manhattan, NY",
            "category_id": category_ids[0] if category_ids else None,
            "task_type_id": task_type_ids[0] if task_type_ids else None,
            "status": "open",
            "posted_at": now - timedelta(minutes=15),  # 15 min ago (very recent!)
            "estimated_difficulty": 2,
            "coordinates": {"lat": 40.7600, "lng": -73.9700},
            "budget_range": "$75-$125"
        }
    ]

    tasks_created = 0
    for task in tasks:
        task["_id"] = ObjectId()
        task["created_at"] = task["posted_at"]

        # Check if similar task exists
        existing = tasks_collection.find_one({
            "title": task["title"],
            "location": task["location"]
        })

        if not existing:
            tasks_collection.insert_one(task)
            print(f"[OK] Created task: {task['title']}")
            tasks_created += 1
        else:
            print(f"[SKIP] Task already exists: {task['title']}")

    print()
    print("="*60)
    print("TEST DATA CREATION COMPLETE")
    print("="*60)
    print(f"\n[OK] Created {tasks_created} new tasks")
    print(f"[OK] Total users (taskers): {users_collection.count_documents({'role': 'tasker'})}")
    print(f"[OK] Total tasks (open): {tasks_collection.count_documents({'status': 'open'})}")

    print("\n" + "="*60)
    print("NEXT STEPS")
    print("="*60)
    print("\n1. Start backend server (if not running):")
    print("   uvicorn main:app --reload --port 8000")
    print("\n2. Open API docs:")
    print("   http://localhost:8000/docs")
    print("\n3. Demo login credentials (all use password: demo123):")
    print("   Customer:  mike_customer")
    print("   Tasker:    alice_builder  (Sarah)")
    print("   Admin:     admin")
    print("   (Use POST /token endpoint)")
    print("\n4. Test recommendations:")
    print("   GET /api/tasks/recommendations")
    print("   (Remember to authorize with the token first!)")
    print()


if __name__ == "__main__":
    try:
        create_test_data()
    except Exception as e:
        print(f"\n[ERROR] Failed to create test data: {e}")
        import traceback
        traceback.print_exc()
