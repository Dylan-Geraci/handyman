"""
Database connection and collection references.
All MongoDB collections are defined here for easy importing.
"""

from pymongo import MongoClient
from config import DATABASE_URL

# --- Database Connection ---
client = MongoClient(DATABASE_URL)
db = client.handyman_db

# --- Collection References ---
users_collection = db.users
tasks_collection = db.tasks
reviews_collection = db.reviews
messages_collection = db.messages
notifications_collection = db.notifications
services_collection = db.services
portfolio_collection = db.portfolio_items
contact_requests_collection = db.contact_requests
categories_collection = db.categories
task_types_collection = db.task_types
