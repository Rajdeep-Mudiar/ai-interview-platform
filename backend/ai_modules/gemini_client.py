import os
from itertools import cycle

import google.generativeai as genai


# Prefer GEMINI_API_KEYS (comma-separated) but fall back to a single GEMINI-API-KEY
_keys_raw = os.getenv("GEMINI_API_KEYS") or os.getenv("GEMINI-API-KEY", "")
_keys = [k.strip() for k in _keys_raw.split(",") if k.strip()]
if not _keys:
    raise RuntimeError(
        "Gemini API key not configured. "
        "Set GEMINI_API_KEYS=\"key1,key2,...\" or GEMINI-API-KEY=\"your_key\" in backend/.env"
    )

_key_cycle = cycle(_keys)
_model_name = os.getenv("GEMINI_MODEL", "gemini-1.5-flash")


def get_model():
    """
    Return a configured Gemini model instance, rotating API keys round-robin.
    """
    api_key = next(_key_cycle)
    genai.configure(api_key=api_key)
    return genai.GenerativeModel(_model_name)


