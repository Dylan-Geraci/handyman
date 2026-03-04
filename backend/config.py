"""
Application configuration settings.
Loads environment variables and sets up external services.
"""

import os
from dotenv import load_dotenv
from passlib.context import CryptContext
import google.generativeai as genai

# Load environment variables from .env file
load_dotenv()

# --- JWT Configuration ---
SECRET_KEY = os.getenv("SECRET_KEY")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 30

# --- Password Hashing ---
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# --- Database ---
DATABASE_URL = os.getenv("DATABASE_URL")

# --- Google Gemini AI Configuration ---
try:
    gemini_api_key = os.getenv("GOOGLE_API_KEY")
    if not gemini_api_key:
        raise ValueError("GOOGLE_API_KEY not found in .env file. Please add it.")
    genai.configure(api_key=gemini_api_key)
    gemini_model = genai.GenerativeModel(os.getenv("GEMINI_MODEL", "gemini-2.5-flash"))
except Exception as e:
    print(f"CRITICAL ERROR: Could not configure Gemini API. Please check your GOOGLE_API_KEY. Error: {e}")
    gemini_model = None
