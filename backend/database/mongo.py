import os

from dotenv import load_dotenv
from pymongo import MongoClient

load_dotenv()

MONGO_URI = os.getenv("MONGO_URI")
DB_NAME = os.getenv("MONGO_DB_NAME", "ai_interview_platform")

if not MONGO_URI:
  raise RuntimeError("MONGO_URI is not set in backend/.env")

_client = MongoClient(MONGO_URI)
_db = _client[DB_NAME]

users_col = _db["users"]
jobs_col = _db["jobs"]
results_col = _db["results"]
sessions_col = _db["sessions"]
activity_logs_col = _db["activity_logs"]

