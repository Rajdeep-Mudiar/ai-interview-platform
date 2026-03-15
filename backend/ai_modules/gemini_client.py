import os
import google.generativeai as genai
from itertools import cycle
from dotenv import load_dotenv

load_dotenv()

# Strategy: Round-robin API key rotation
API_KEYS = os.getenv("GEMINI_API_KEYS", "").split(",")
API_KEYS = [k.strip() for k in API_KEYS if k.strip()]

if not API_KEYS:
    # Fallback to single key if comma-separated list is not provided
    single_key = os.getenv("GEMINI_API_KEY")
    if single_key:
        API_KEYS = [single_key]

if not API_KEYS:
    print("Warning: No GEMINI_API_KEYS found in environment variables.")

key_iterator = cycle(API_KEYS) if (API_KEYS and "YOUR_API_KEY_HERE" not in API_KEYS) else None
MODEL_NAME = os.getenv("GEMINI_MODEL", "gemini-1.5-flash")

def get_gemini_model():
    if not key_iterator:
        raise RuntimeError("No valid Gemini API keys configured. Please add your key to backend/.env file.")
    
    current_key = next(key_iterator)
    genai.configure(api_key=current_key)
    return genai.GenerativeModel(MODEL_NAME)
