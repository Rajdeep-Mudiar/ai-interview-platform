import os
import logging
from typing import Optional, List, Dict, Any
from pathlib import Path
from dotenv import load_dotenv
from pymongo import MongoClient
from pymongo.database import Database
from pymongo.collection import Collection
from pymongo.errors import ConnectionFailure

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

# Robustly load .env from the backend/ directory
env_path = Path(__file__).resolve().parents[1] / ".env"
if env_path.exists():
    load_dotenv(dotenv_path=env_path)
    logger.info(f"Loaded environment variables from {env_path}")
else:
    load_dotenv() # Fallback to standard search
    logger.warning(f".env file not found at {env_path}, falling back to default search.")

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
                # Use a longer timeout for the initial Atlas connection
                cls._client = MongoClient(
                    uri, 
                    serverSelectionTimeoutMS=10000,
                    connectTimeoutMS=10000,
                    retryWrites=True,
                    w="majority"
                )
                # Verify connection
                cls._client.admin.command('ping')
                logger.info("✅ Successfully connected to MongoDB Atlas!")
                
                db_name = os.getenv("MONGO_DB_NAME", "ai_interview_platform")
                logger.info(f"📁 Using database: '{db_name}'")
            except ConnectionFailure as e:
                logger.error(f"❌ Could not connect to MongoDB Atlas: {e}")
                logger.info("💡 Tip: Check your MONGO_URI in backend/.env and ensure your IP address is whitelisted in Atlas.")
                raise
        return cls._client

    @classmethod
    def get_db(cls) -> Database:
        if cls._db is None:
            # Defaults to 'ai_interview_platform' unless MONGO_DB_NAME is in .env
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
