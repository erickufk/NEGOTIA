"""Shared config, DB, logging and auth helpers."""
import os
import logging
from datetime import datetime, timezone, timedelta
from pathlib import Path
from typing import Optional, Dict, Any


import bcrypt
import jwt
from fastapi import HTTPException, Depends
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from dotenv import load_dotenv
from motor.motor_asyncio import AsyncIOMotorClient


LANG_NAMES = {"ru": "РУССКОМ (Russian)", "en": "English", "es": "Spanish", "de": "German"}
# OpenAI TTS voices mapped by gender
VOICE_BY_GENDER = {"male": "onyx", "female": "shimmer"}

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / ".env")

# ---------- Config ----------
MONGO_URL = os.environ["MONGO_URL"]
DB_NAME = os.environ["DB_NAME"]
EMERGENT_LLM_KEY = os.environ["EMERGENT_LLM_KEY"]
JWT_SECRET = os.environ["JWT_SECRET"]
JWT_ALGORITHM = os.environ.get("JWT_ALGORITHM", "HS256")
JWT_EXPIRE_MINUTES = int(os.environ.get("JWT_EXPIRE_MINUTES", "10080"))
AI_PROVIDER = os.environ.get("AI_MODEL_PROVIDER", "anthropic")
AI_MODEL = os.environ.get("AI_MODEL_NAME", "claude-sonnet-5")

# Alternative AI model choices exposed to the user.
MODEL_MAP = {
    "claude": ("anthropic", "claude-sonnet-5"),
    "gpt": ("openai", "gpt-5.6-luna"),
}

def resolve_model(ai_model: Optional[str]) -> tuple:
    return MODEL_MAP.get((ai_model or "claude").lower(), MODEL_MAP["claude"])

client = AsyncIOMotorClient(MONGO_URL)
db = client[DB_NAME]

security = HTTPBearer(auto_error=False)

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("negotia")


def now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


# ---------- Auth utils ----------
def hash_password(pw: str) -> str:
    return bcrypt.hashpw(pw.encode(), bcrypt.gensalt()).decode()


def verify_password(pw: str, hashed: str) -> bool:
    try:
        return bcrypt.checkpw(pw.encode(), hashed.encode())
    except Exception:
        return False


def create_token(user_id: str) -> str:
    payload = {
        "sub": user_id,
        "exp": datetime.now(timezone.utc) + timedelta(minutes=JWT_EXPIRE_MINUTES),
        "iat": datetime.now(timezone.utc),
    }
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)


async def get_current_user(creds: Optional[HTTPAuthorizationCredentials] = Depends(security)) -> Dict[str, Any]:
    if not creds:
        raise HTTPException(status_code=401, detail="Not authenticated")
    try:
        payload = jwt.decode(creds.credentials, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        user_id = payload["sub"]
    except jwt.PyJWTError:
        raise HTTPException(status_code=401, detail="Invalid token")
    user = await db.users.find_one({"id": user_id}, {"_id": 0, "password_hash": 0})
    if not user:
        raise HTTPException(status_code=401, detail="User not found")
    return user
