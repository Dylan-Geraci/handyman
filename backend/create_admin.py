# backend/create_admin.py
import os
from pymongo import MongoClient
from dotenv import load_dotenv
from passlib.context import CryptContext

# Load environment variables from .env file
load_dotenv()

# --- Configuration ---
# This is our hashing "recipe". It tells passlib to use the bcrypt algorithm.
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# --- Database Connection ---
DATABASE_URL = os.getenv("DATABASE_URL")
client = MongoClient(DATABASE_URL)
db = client.handyman_db
users_collection = db.users

# --- Main Script Logic ---
def create_admin_user():
    print("Creating a new admin user...")
    
    # Get username and password from the terminal
    username = input("Enter admin username: ")
    password = input("Enter admin password: ")
    
    # Hash the password
    hashed_password = pwd_context.hash(password)
    
    # Check if user already exists
    if users_collection.find_one({"username": username}):
        print(f"User '{username}' already exists.")
        return

    # Insert the new user into the database
    users_collection.insert_one({
        "username": username,
        "hashed_password": hashed_password,
        "role": "admin"
    })
    
    print(f"Admin user '{username}' created successfully!")

# This makes the script runnable from the command line
if __name__ == "__main__":
    create_admin_user()