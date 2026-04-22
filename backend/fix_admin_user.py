import os
from pymongo import MongoClient
from dotenv import load_dotenv

load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL")
client = MongoClient(DATABASE_URL)
db = client.handyman_db
users_collection = db.users

result = users_collection.update_one(
    {"username": "admin2"},
    {
        "$set": {
            "full_name": "Admin User",
            "role": "admin"
        }
    }
)

if result.matched_count == 0:
    print("User not found.")
else:
    print("Admin user updated successfully.")