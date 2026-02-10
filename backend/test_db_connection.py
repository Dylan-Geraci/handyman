"""
Quick database connection diagnostic tool.
Tests MongoDB connection and provides troubleshooting guidance.
"""

import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

def test_connection():
    """Test MongoDB connection and diagnose issues."""
    print("\n" + "=" * 60)
    print("MONGODB CONNECTION DIAGNOSTIC")
    print("=" * 60 + "\n")

    # Check if DATABASE_URL exists
    database_url = os.getenv("DATABASE_URL")

    if not database_url:
        print("❌ ERROR: DATABASE_URL not found in .env file")
        print("\nPlease add DATABASE_URL to your .env file:")
        print('DATABASE_URL="mongodb+srv://user:password@cluster.mongodb.net/"')
        return False

    print(f"[OK] DATABASE_URL found in .env")
    print(f"  Cluster: handyman-platform.jhln37e.mongodb.net")
    print()

    # Try to import pymongo
    try:
        from pymongo import MongoClient
        print("[OK] pymongo library installed")
    except ImportError:
        print("❌ ERROR: pymongo not installed")
        print("\nRun: pip install pymongo")
        return False

    # Try to connect
    print("\nAttempting connection...")
    print("This may take 10-30 seconds...")

    try:
        client = MongoClient(
            database_url,
            serverSelectionTimeoutMS=10000  # 10 second timeout
        )

        # Test the connection
        server_info = client.server_info()

        print("\n[SUCCESS] CONNECTION SUCCESSFUL!")
        print(f"\nMongoDB Version: {server_info['version']}")

        # Get database info
        db = client.handyman_db
        print(f"Database: handyman_db")
        print(f"Collections: {db.list_collection_names()}")

        # Count documents
        users_count = db.users.count_documents({})
        tasks_count = db.tasks.count_documents({})

        print(f"\nDocument Counts:")
        print(f"  Users: {users_count}")
        print(f"  Tasks: {tasks_count}")

        print("\n" + "=" * 60)
        print("[SUCCESS] Database is ready for migration!")
        print("=" * 60 + "\n")

        return True

    except Exception as e:
        error_message = str(e)
        print(f"\n[ERROR] CONNECTION FAILED")
        print(f"\nError: {error_message}\n")

        # Diagnose common issues
        if "DNS" in error_message or "name does not exist" in error_message:
            print("POSSIBLE CAUSES:")
            print("1. MongoDB Atlas cluster is paused or deleted")
            print("2. Cluster name changed")
            print("3. Network/firewall blocking connection")
            print()
            print("SOLUTIONS:")
            print("-> Log into MongoDB Atlas: https://cloud.mongodb.com")
            print("-> Check if cluster 'handyman-platform' exists and is running")
            print("-> If cluster was deleted, create a new one and update .env")
            print("-> Check Network Access settings (whitelist your IP)")

        elif "authentication failed" in error_message.lower():
            print("POSSIBLE CAUSES:")
            print("1. Incorrect username or password")
            print("2. Database user doesn't exist")
            print()
            print("SOLUTIONS:")
            print("-> Check Database Access in MongoDB Atlas")
            print("-> Verify username: dylangeracidev_db_user")
            print("-> Reset password if needed")

        elif "timeout" in error_message.lower():
            print("POSSIBLE CAUSES:")
            print("1. Network connectivity issues")
            print("2. Firewall blocking MongoDB port (27017)")
            print("3. VPN interfering with connection")
            print()
            print("SOLUTIONS:")
            print("-> Check your internet connection")
            print("-> Disable VPN temporarily")
            print("-> Whitelist IP 0.0.0.0/0 in Network Access (for testing)")

        else:
            print("GENERAL TROUBLESHOOTING:")
            print("-> Verify MongoDB Atlas cluster is running")
            print("-> Check Network Access whitelist")
            print("-> Try connecting from MongoDB Compass GUI")
            print("-> Check MongoDB Atlas status page")

        print("\n" + "=" * 60 + "\n")
        return False

if __name__ == "__main__":
    success = test_connection()

    if success:
        print("Next step: Run the migration script")
        print("  python -m migrations.add_recommendation_fields")
    else:
        print("Fix the connection issue first, then retry this test.")
