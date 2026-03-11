import os
import logging
from typing import Optional, List, Dict, Any
from dotenv import load_dotenv
from pymongo import MongoClient
from pymongo.database import Database
from pymongo.collection import Collection
from pymongo.errors import ConnectionFailure

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

load_dotenv()

class MongoDB:
    """Centralized MongoDB connection management."""
    _client: Optional[MongoClient] = None
    _db: Optional[Database] = None

    @classmethod
    def get_client(cls) -> MongoClient:
        if cls._client is None:
            uri = os.getenv("MONGO_URI")
            if not uri:
                logger.error("MONGO_URI not found in environment variables.")
                raise RuntimeError("MONGO_URI is not set in backend/.env")
            try:
                cls._client = MongoClient(uri, serverSelectionTimeoutMS=5000)
                # Verify connection
                cls._client.admin.command('ping')
                logger.info("Successfully connected to MongoDB.")
            except ConnectionFailure as e:
                logger.error(f"Could not connect to MongoDB: {e}")
                raise
        return cls._client

    @classmethod
    def get_db(cls) -> Database:
        if cls._db is None:
            db_name = os.getenv("MONGO_DB_NAME", "ai_interview_platform")
            cls._db = cls.get_client()[db_name]
        return cls._db

    @classmethod
    def get_collection(cls, name: str) -> Collection:
        return cls.get_db()[name]

# Helper to get standard collections
def get_users_col() -> Collection:
    return MongoDB.get_collection("users")

def get_jobs_col() -> Collection:
    return MongoDB.get_collection("jobs")

def get_results_col() -> Collection:
    return MongoDB.get_collection("results")

# Legacy compatibility (optional, but good for migration)
db = MongoDB.get_db()
users_col = get_users_col()
jobs_col = get_jobs_col()
results_col = get_results_col()
