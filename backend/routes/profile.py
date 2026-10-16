"""Profile, stats, frameworks and prep routes."""
import asyncio
import json
import uuid
from datetime import datetime, timezone

from fastapi import APIRouter, HTTPException, Depends, UploadFile, File
from fastapi.responses import Response

import storage
from emergentintegrations.llm.chat import LlmChat, UserMessage
from frameworks import FRAMEWORKS
import gamification
from core import (LANG_NAMES, EMERGENT_LLM_KEY, resolve_model, db, logger, get_current_user, now_iso)
from models import (AnalyzePrepIn)
from scenario_utils import _scrub_scenario

api = APIRouter(prefix="/api")

@api.get("/frameworks")
async def list_frameworks():
    return {"frameworks": [{"id": f["id"], "name": f["name"], "tagline": f["tagline"], "chips": f["chips"]} for f in FRAMEWORKS.values()]}


@api.post("/prep/analyze")
async def analyze_prep(body: AnalyzePrepIn, user=Depends(get_current_user)):
    scenario = await db.scenarios.find_one({"slug": body.scenario_slug}, {"_id": 0})
    if not scenario:
        raise HTTPException(404, "Scenario not found")
    fw = FRAMEWORKS.get(body.training_framework, FRAMEWORKS["combined"])
    lang_name = LANG_NAMES.get(body.language, "English")
    # scrub scenario for AI (still has objective/context, but no hidden fields exposed to user response)
    prompt = f"""You are a negotiation coach. Draft a preparation sheet for the user practicing the {fw['name']} framework.
Scenario: {scenario['title']}. Objective: {scenario['objective']}. Context: {scenario['context']}.

Write ALL values ONLY in {lang_name} (natural, fluent; industry terms like BATNA/ZOPA/SLA may stay as-is).
Return ONLY JSON with these fields (short bullet-style, one sentence each):
{{"batna": "...", "priorities": "...", "theirs": "...", "offer": "...", "ideal": "...", "minimum": "..."}}"""
    try:
        provider, model = resolve_model(body.ai_model)
        chat = LlmChat(api_key=EMERGENT_LLM_KEY, session_id=f"prep-{user['id']}-{body.scenario_slug}",
                       system_message="You are a Harvard-trained negotiation coach who writes concise preparation sheets.").with_model(provider, model)
        resp = await chat.send_message(UserMessage(text=prompt))
        text = resp if isinstance(resp, str) else str(resp)
        s = text.find("{"); e = text.rfind("}")
        if s >= 0 and e > s:
            data = json.loads(text[s:e+1])
            return {"preparation": data}
    except Exception:
        logger.exception("Prep analyze failed")
    return {"preparation": {"batna": "", "priorities": "", "theirs": "", "offer": "", "ideal": "", "minimum": ""}}


# ---------- Profile / Stats ----------
@api.get("/users/me/stats")
async def user_stats(user=Depends(get_current_user)):
    negs = await db.negotiations.find({"user_id": user["id"], "status": "completed"}, {"_id": 0}).to_list(500)
    total = len(negs)
    scores = [n.get("score", 0) for n in negs if n.get("score")]
    avg = int(sum(scores) / len(scores)) if scores else 0
    best = max(scores) if scores else 0
    success = sum(1 for n in negs if n.get("outcome") in ("Successful", "Excellent"))
    success_rate = int((success / total) * 100) if total else 0
    # streak: number of days with completed negotiations in last N days
    streak = 0
    if negs:
        dates = sorted({n.get("ended_at", n.get("created_at", ""))[:10] for n in negs}, reverse=True)
        today = datetime.now(timezone.utc).date()
        for i, d in enumerate(dates):
            try:
                dd = datetime.fromisoformat(d).date()
            except Exception:
                continue
            if (today - dd).days == i:
                streak += 1
            else:
                break
    skills_doc = await db.user_skills.find_one({"user_id": user["id"]}, {"_id": 0})
    skills = skills_doc["skills"] if skills_doc else {
        "Questioning": 50, "Active Listening": 50, "Argumentation": 50,
        "Concessions": 50, "BATNA": 50, "Conflict Management": 50, "Strategy": 50, "Relationship": 50,
    }
    return {
        "total": total, "avg_score": avg, "best_score": best,
        "success_rate": success_rate, "streak": streak, "skills": skills,
    }


@api.get("/users/me/gamification")
async def user_gamification(user=Depends(get_current_user)):
    state = await gamification.get_state(db, user["id"])
    return gamification.public_view(state)


@api.get("/users/me/weekly-challenge")
async def weekly_challenge(user=Depends(get_current_user)):
    state = await gamification.get_state(db, user["id"])
    wk = await gamification.weekly_progress(db, user["id"])
    wk["claimed"] = wk["week"] in state.get("challenges_done", [])
    return wk


AVATAR_TYPES = {"image/png": "png", "image/jpeg": "jpg", "image/webp": "webp"}
AVATAR_MAX = 1024 * 1024


@api.post("/users/me/avatar")
async def upload_avatar(file: UploadFile = File(...), user=Depends(get_current_user)):
    ext = AVATAR_TYPES.get(file.content_type or "")
    if not ext:
        raise HTTPException(400, "Only PNG, JPG or WEBP images are allowed")
    data = await file.read(AVATAR_MAX + 1)
    if not data:
        raise HTTPException(400, "Empty file")
    if len(data) > AVATAR_MAX:
        raise HTTPException(413, "Image must be smaller than 1 MB")
    path = f"{storage.APP_NAME}/avatars/{user['id']}/{uuid.uuid4()}.{ext}"
    try:
        result = await asyncio.to_thread(storage.put_object, path, data, file.content_type)
    except Exception:
        logger.exception("avatar upload failed")
        raise HTTPException(502, "Upload failed, please try again")
    await db.users.update_one({"id": user["id"]}, {"$set": {
        "avatar": {"path": result["path"], "content_type": file.content_type, "size": len(data), "updated_at": now_iso()}}})
    return {"ok": True}


@api.get("/users/me/avatar")
async def get_avatar(user=Depends(get_current_user)):
    av = user.get("avatar")
    if not av:
        raise HTTPException(404, "No avatar")
    try:
        data, _ = await asyncio.to_thread(storage.get_object, av["path"])
    except Exception:
        logger.exception("avatar fetch failed")
        raise HTTPException(404, "No avatar")
    return Response(content=data, media_type=av["content_type"], headers={"Cache-Control": "private, max-age=300"})


@api.delete("/users/me/avatar")
async def delete_avatar(user=Depends(get_current_user)):
    await db.users.update_one({"id": user["id"]}, {"$unset": {"avatar": ""}})
    return {"ok": True}


@api.get("/users/me/recommended")
async def recommended(lang: str = "en", user=Depends(get_current_user)):
    skills_doc = await db.user_skills.find_one({"user_id": user["id"]}, {"_id": 0})
    weakest = "Questioning"
    if skills_doc:
        weakest = min(skills_doc["skills"], key=skills_doc["skills"].get)
    scenarios = await db.scenarios.find({"active": True, "skills": {"$in": [weakest]}}, {"_id": 0}).limit(3).to_list(3)
    if not scenarios:
        scenarios = await db.scenarios.find({"active": True}, {"_id": 0}).limit(3).to_list(3)
    return {"weakest_skill": weakest, "scenarios": [_scrub_scenario(s, lang=lang) for s in scenarios]}


@api.get("/users/me/framework-stats")
async def framework_stats(user=Depends(get_current_user)):
    negs = await db.negotiations.find({"user_id": user["id"], "status": "completed"}, {"_id": 0}).to_list(500)
    def summarize(fw_key):
        vals = []
        for n in negs:
            fs = n.get("framework_scores", {}).get(fw_key) or {}
            if fs:
                avg = sum(fs.values()) / len(fs)
                vals.append(avg)
        if not vals:
            return {"count": 0, "avg": 0, "best": 0}
        return {"count": len(vals), "avg": int(sum(vals) / len(vals)), "best": int(max(vals))}
    stats = {fw: summarize(fw) for fw in ("harvard", "spin", "batna")}
    weakest = min(stats.keys(), key=lambda k: stats[k]["avg"] if stats[k]["count"] else 999)
    if all(stats[k]["count"] == 0 for k in stats):
        weakest = "combined"
    return {"stats": stats, "weakest": weakest}


