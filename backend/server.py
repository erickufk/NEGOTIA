"""NEGOTIA backend — AI Negotiation Simulator."""
import os
import uuid


from fastapi import FastAPI, APIRouter
from starlette.middleware.cors import CORSMiddleware

from scenarios_seed import SCENARIOS
from core import (db, logger, now_iso,
                  hash_password)

from routes import auth, scenarios, negotiations, profile, voice, share
from core import client
import storage

app = FastAPI(title="NEGOTIA API")
api = APIRouter(prefix="/api")


# ---------- Startup: seed scenarios & demo user ----------
@app.on_event("startup")
async def startup():
    # seed scenarios
    for sc in SCENARIOS:
        exists = await db.scenarios.find_one({"slug": sc["slug"]})
        if not exists:
            doc = {
                "id": str(uuid.uuid4()),
                "slug": sc["slug"],
                "title": sc["title"],
                "category": sc["category"],
                "description": sc["description"],
                "difficulty": sc["difficulty"],
                "duration": sc["duration"],
                "default_mode": sc["default_mode"],
                "max_participants": sc["max_participants"],
                "objective": sc["objective"],
                "context": sc["context"],
                "success_conditions": sc["success_conditions"],
                "failure_conditions": sc["failure_conditions"],
                "skills": sc["skills"],
                "participants": sc["participants"],
                "active": True,
                "created_at": now_iso(),
            }
            await db.scenarios.insert_one(doc)
    # seed demo user
    demo = await db.users.find_one({"email": "demo@negotia.app"})
    if not demo:
        uid = str(uuid.uuid4())
        await db.users.insert_one({
            "id": uid, "email": "demo@negotia.app", "name": "Demo User",
            "password_hash": hash_password("Demo1234!"),
            "created_at": now_iso(), "updated_at": now_iso(),
        })
    logger.info("NEGOTIA startup complete: scenarios seeded")
    try:
        await db.badge_shares.create_index([("user_id", 1), ("badge_id", 1)], unique=True)
        await db.badge_shares.create_index("id", unique=True)
    except Exception:
        logger.exception("badge_shares index failed")
    try:
        storage.init_storage()
    except Exception:
        logger.exception("Storage init failed")
    # TTL cleanup on expired reset tokens
    try:
        await db.password_reset_tokens.create_index("expires_at", expireAfterSeconds=0)
    except Exception:
        pass


@app.on_event("shutdown")
async def shutdown():
    client.close()


@api.get("/health")
async def health():
    return {"status": "ok", "ts": now_iso()}


app.include_router(api)
for r in (auth, scenarios, negotiations, profile, voice, share):
    app.include_router(r.api)
app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get("CORS_ORIGINS", "*").split(","),
    allow_methods=["*"], allow_headers=["*"],
)

