"""
Migration script to add recommendation-related fields to users and tasks collections.

Run this script once to add new fields required for the AI recommendation system.

Usage:
    python -m migrations.add_recommendation_fields
"""

import sys
from pathlib import Path
from datetime import datetime

# Add parent directory to path to import database modules
sys.path.append(str(Path(__file__).parent.parent))

from database import users_collection, tasks_collection, reviews_collection
from pymongo import UpdateMany


def add_user_recommendation_fields():
    """Add recommendation fields to users collection (taskers)."""
    print("=" * 60)
    print("ADDING RECOMMENDATION FIELDS TO USERS COLLECTION")
    print("=" * 60)

    # Count taskers before migration
    tasker_count = users_collection.count_documents({"role": "tasker"})
    print(f"\nFound {tasker_count} taskers to update")

    # Define default values for new fields
    default_user_fields = {
        "experience_level": 2,              # Default to intermediate
        "completed_tasks_count": 0,         # Will recalculate below
        "avg_rating": 0.0,                  # Will recalculate below
        "preferred_locations": [],          # Empty array, taskers can set later
        "last_active": datetime.utcnow(),   # Set to now
        "coordinates": {                    # Default coordinates (will geocode later)
            "lat": 0.0,
            "lng": 0.0
        }
    }

    # Update taskers that don't have these fields
    result = users_collection.update_many(
        {
            "role": "tasker",
            "experience_level": {"$exists": False}
        },
        {"$set": default_user_fields}
    )

    print(f"[OK] Added default fields to {result.modified_count} taskers")

    # Recalculate completed_tasks_count for each tasker
    print("\nRecalculating completed_tasks_count...")
    taskers = users_collection.find({"role": "tasker"})
    updated_count = 0

    for tasker in taskers:
        # Count completed tasks for this tasker
        completed_count = tasks_collection.count_documents({
            "tasker_username": tasker["username"],
            "status": "completed"
        })

        # Determine experience level based on completed tasks
        if completed_count >= 50:
            experience_level = 3  # Expert
        elif completed_count >= 10:
            experience_level = 2  # Intermediate
        else:
            experience_level = 1  # Beginner

        # Update the tasker
        users_collection.update_one(
            {"_id": tasker["_id"]},
            {
                "$set": {
                    "completed_tasks_count": completed_count,
                    "experience_level": experience_level
                }
            }
        )
        updated_count += 1

    print(f"[OK] Recalculated task counts for {updated_count} taskers")

    # Recalculate avg_rating from reviews
    print("\nRecalculating avg_rating...")
    rating_updated = 0

    for tasker in users_collection.find({"role": "tasker"}):
        # Get all reviews for this tasker
        reviews = list(reviews_collection.find({"tasker_username": tasker["username"]}))

        if reviews:
            avg_rating = sum(review["rating"] for review in reviews) / len(reviews)
        else:
            avg_rating = 0.0

        users_collection.update_one(
            {"_id": tasker["_id"]},
            {"$set": {"avg_rating": avg_rating}}
        )
        rating_updated += 1

    print(f"[OK] Recalculated ratings for {rating_updated} taskers")
    print()


def add_task_recommendation_fields():
    """Add recommendation fields to tasks collection."""
    print("=" * 60)
    print("ADDING RECOMMENDATION FIELDS TO TASKS COLLECTION")
    print("=" * 60)

    # Count tasks before migration
    task_count = tasks_collection.count_documents({})
    print(f"\nFound {task_count} tasks to update")

    # Define default values for new fields
    default_task_fields = {
        "posted_at": datetime.utcnow(),     # Set to now (not ideal but best we can do)
        "budget_range": None,                # Optional field
        "estimated_difficulty": 2,           # Default to medium
        "coordinates": {                     # Default coordinates
            "lat": 0.0,
            "lng": 0.0
        }
    }

    # Update tasks that don't have these fields
    result = tasks_collection.update_many(
        {"posted_at": {"$exists": False}},
        {"$set": default_task_fields}
    )

    print(f"[OK] Added default fields to {result.modified_count} tasks")
    print()


def create_indexes():
    """Create database indexes for optimal query performance."""
    print("=" * 60)
    print("CREATING DATABASE INDEXES")
    print("=" * 60)
    print()

    # Tasks collection indexes
    print("Creating tasks collection indexes...")
    tasks_collection.create_index([("posted_at", -1)])
    print("[OK] Created index on tasks.posted_at")

    tasks_collection.create_index([("category_id", 1), ("status", 1)])
    print("[OK] Created compound index on tasks.category_id and tasks.status")

    tasks_collection.create_index([("location", "text")])
    print("[OK] Created text index on tasks.location")

    # Users collection indexes
    print("\nCreating users collection indexes...")
    users_collection.create_index([("service_categories", 1)])
    print("[OK] Created index on users.service_categories")

    users_collection.create_index([("role", 1), ("experience_level", 1)])
    print("[OK] Created compound index on users.role and users.experience_level")

    print()


def verify_migration():
    """Verify the migration was successful."""
    print("=" * 60)
    print("VERIFYING MIGRATION")
    print("=" * 60)
    print()

    # Check a sample tasker
    sample_tasker = users_collection.find_one({"role": "tasker"})

    if sample_tasker:
        required_fields = [
            "experience_level",
            "completed_tasks_count",
            "avg_rating",
            "preferred_locations",
            "coordinates"
        ]

        print("Sample Tasker Fields:")
        all_present = True
        for field in required_fields:
            present = field in sample_tasker
            status = "[OK]" if present else "[FAIL]"
            print(f"  {status} {field}: {present}")
            if not present:
                all_present = False

        if all_present:
            print("\n[OK] All user fields present")
        else:
            print("\n[FAIL] Some user fields missing!")
    else:
        print("[WARNING] No taskers found in database")

    print()

    # Check a sample task
    sample_task = tasks_collection.find_one({})

    if sample_task:
        required_fields = [
            "posted_at",
            "estimated_difficulty",
            "coordinates"
        ]

        print("Sample Task Fields:")
        all_present = True
        for field in required_fields:
            present = field in sample_task
            status = "[OK]" if present else "[FAIL]"
            print(f"  {status} {field}: {present}")
            if not present:
                all_present = False

        if all_present:
            print("\n[OK] All task fields present")
        else:
            print("\n[FAIL] Some task fields missing!")
    else:
        print("[WARNING] No tasks found in database")

    print()


def main():
    """Run the migration."""
    print("\n")
    print("=" * 60)
    print("   RECOMMENDATION SYSTEM DATABASE MIGRATION")
    print("=" * 60)
    print("\n")

    try:
        # Step 1: Add user fields
        add_user_recommendation_fields()

        # Step 2: Add task fields
        add_task_recommendation_fields()

        # Step 3: Create indexes
        create_indexes()

        # Step 4: Verify
        verify_migration()

        print("=" * 60)
        print("MIGRATION COMPLETED SUCCESSFULLY")
        print("=" * 60)
        print("\n[OK] Users collection updated")
        print("[OK] Tasks collection updated")
        print("[OK] Database indexes created")
        print("[OK] Migration verified")
        print("\nYou can now use the recommendation system!")
        print()

    except Exception as e:
        print("\n" + "=" * 60)
        print("MIGRATION FAILED")
        print("=" * 60)
        print(f"\nError: {e}")
        print("\nPlease check your database connection and try again.")
        print()
        raise


if __name__ == "__main__":
    main()
