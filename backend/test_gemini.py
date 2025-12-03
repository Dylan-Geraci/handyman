"""
Quick test script to check if Gemini API is working.
"""

import os
from dotenv import load_dotenv
import google.generativeai as genai

# Load environment variables
load_dotenv()

def test_gemini_api():
    """Test if Gemini API is accessible and working."""
    try:
        # Get API key
        api_key = os.getenv("GOOGLE_API_KEY")
        if not api_key:
            print("[ERROR] GOOGLE_API_KEY not found in .env file")
            return False

        print("[OK] API key found in .env file")

        # Configure Gemini
        genai.configure(api_key=api_key)
        print("[OK] Gemini API configured")

        # Create model
        model = genai.GenerativeModel('gemini-2.5-pro')
        print("[OK] Gemini model created (gemini-2.5-pro)")

        # Test with simple prompt
        print("\n[TESTING] Testing API with simple prompt...")
        response = model.generate_content("Say 'Hello, the API is working!'")

        print("\n[SUCCESS] Gemini API is working!")
        print(f"Response: {response.text}")
        return True

    except Exception as e:
        print(f"\n[ERROR] {e}")
        if "429" in str(e):
            print("\n[WARNING] Rate limit/quota exceeded. The API key may need more quota or time to reset.")
        elif "401" in str(e) or "403" in str(e):
            print("\n[WARNING] Authentication error. Check if the API key is valid.")
        return False

if __name__ == "__main__":
    print("=" * 60)
    print("GEMINI API TEST")
    print("=" * 60)
    test_gemini_api()
    print("=" * 60)
