"""Scenario routes."""
import uuid


from fastapi import APIRouter, HTTPException, Depends

from core import (db, now_iso,
                  get_current_user)
from models import (CustomScenarioIn)
from scenario_utils import _scrub_scenario

api = APIRouter(prefix="/api")

@api.get("/scenarios")
async def list_scenarios(lang: str = "en", user=Depends(get_current_user)):
    docs = await db.scenarios.find({
        "active": True,
        "$or": [{"owner_id": None}, {"owner_id": {"$exists": False}}, {"owner_id": user["id"]}],
    }, {"_id": 0}).to_list(500)
    return {"scenarios": [_scrub_scenario(d, lang=lang) for d in docs]}


@api.get("/scenarios/{slug}")
async def get_scenario(slug: str, lang: str = "en", user=Depends(get_current_user)):
    doc = await db.scenarios.find_one({"slug": slug}, {"_id": 0})
    if not doc:
        raise HTTPException(404, "Scenario not found")
    # If custom, ensure it belongs to this user
    if doc.get("custom") and doc.get("owner_id") not in (None, user["id"]):
        raise HTTPException(404, "Scenario not found")
    return {"scenario": _scrub_scenario(doc, lang=lang)}


@api.post("/scenarios/custom")
async def create_custom_scenario(body: CustomScenarioIn, user=Depends(get_current_user)):
    slug = f"custom-{uuid.uuid4().hex[:10]}"
    op = body.opponent
    doc = {
        "id": str(uuid.uuid4()),
        "slug": slug,
        "owner_id": user["id"],
        "custom": True,
        "title": body.title_en,
        "description": body.description_en,
        "category": body.category,
        "difficulty": body.difficulty,
        "duration": max(3, min(60, body.duration)),
        "default_mode": "chat",
        "max_participants": 1,
        "objective": body.objective_en,
        "context": body.context_en,
        "success_conditions": [s for s in body.success_en if s.strip()],
        "failure_conditions": [],
        "skills": body.skills,
        "participants": [{
            "name": op.name_en,
            "role": op.role_en,
            "description": op.description,
            "goals": op.goals,
            "interests": op.interests,
            "hidden_interests": op.hidden_interests,
            "constraints": op.constraints,
            "batna": op.batna,
            "personality": op.personality,
            "priorities": op.priorities,
            "gender": (op.gender or "female").lower(),
        }],
        "translations": {
            "ru": {
                "title": body.title_ru or body.title_en,
                "description": body.description_ru or body.description_en,
                "objective": body.objective_ru or body.objective_en,
                "context": body.context_ru or body.context_en,
                "success_conditions": [s for s in (body.success_ru or []) if s.strip()] or [s for s in body.success_en if s.strip()],
                "participants": [{
                    "name": op.name_ru or op.name_en,
                    "role": op.role_ru or op.role_en,
                }],
            }
        },
        "active": True,
        "created_at": now_iso(),
    }
    await db.scenarios.insert_one(doc)
    return {"scenario": _scrub_scenario({k: v for k, v in doc.items() if k != "_id"}, lang="en")}


@api.delete("/scenarios/custom/{slug}")
async def delete_custom_scenario(slug: str, user=Depends(get_current_user)):
    doc = await db.scenarios.find_one({"slug": slug}, {"_id": 0})
    if not doc:
        raise HTTPException(404, "Not found")
    if not doc.get("custom") or doc.get("owner_id") != user["id"]:
        raise HTTPException(403, "Only your custom scenarios can be deleted")
    await db.scenarios.delete_one({"slug": slug})
    return {"ok": True}


