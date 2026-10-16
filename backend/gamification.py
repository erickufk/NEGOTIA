from datetime import datetime, timezone, timedelta
from typing import Any, Dict, Optional

WIN_OUTCOMES = ("Successful", "Excellent")
AGGRESSIVE_WORDS = ("aggressive", "hardball", "tough", "impatient", "hostile", "агрессив", "жёстк", "жестк")
ALL_FRAMEWORKS = {"harvard", "spin", "batna", "combined"}
LEVEL8_XP = 3000


def empty_state() -> Dict[str, Any]:
    return {"xp": 0, "streak": 0, "best_streak": 0, "last_sim_date": None, "total": 0, "wins": 0,
            "best_score": 0, "frameworks_tried": [], "win_frameworks": [], "aggressive_win": False, "badges": []}


def is_aggressive(scenario: Optional[dict]) -> bool:
    if not scenario:
        return False
    for p in scenario.get("participants", []):
        txt = f"{p.get('personality', '')} {p.get('style', '')}".lower()
        if any(w in txt for w in AGGRESSIVE_WORDS):
            return True
    return False


def _date_of(iso: Optional[str]):
    try:
        return datetime.fromisoformat(iso).date()
    except Exception:
        return datetime.now(timezone.utc).date()


def apply_sim(state: Dict[str, Any], neg: dict, scenario: Optional[dict]) -> Dict[str, Any]:
    score = neg.get("score") or 0
    win = neg.get("outcome") in WIN_OUTCOMES
    fw = neg.get("training_framework", "combined")
    day = _date_of(neg.get("ended_at") or neg.get("created_at"))
    last = datetime.fromisoformat(state["last_sim_date"]).date() if state.get("last_sim_date") else None

    xp = 50 + (30 if score >= 90 else 20 if score >= 80 else 0) + (20 if win else 0)
    if last != day:
        xp += 10
        state["streak"] = state["streak"] + 1 if last == day - timedelta(days=1) else 1
        state["last_sim_date"] = day.isoformat()
    state["best_streak"] = max(state.get("best_streak", 0), state["streak"])
    state["xp"] += xp
    state["total"] += 1
    state["best_score"] = max(state["best_score"], score)
    if fw not in state["frameworks_tried"]:
        state["frameworks_tried"].append(fw)
    if win:
        state["wins"] += 1
        if fw not in state["win_frameworks"]:
            state["win_frameworks"].append(fw)
        if is_aggressive(scenario):
            state["aggressive_win"] = True

    checks = {
        "first_step": state["total"] >= 1,
        "first_win": state["wins"] >= 1,
        "on_a_roll": state["best_streak"] >= 7,
        "sharp_mind": state["best_score"] >= 90,
        "tough_crowd": state["aggressive_win"],
        "methodologist": ALL_FRAMEWORKS.issubset(set(state["frameworks_tried"])),
        "practitioner": state["total"] >= 10,
        "veteran": state["total"] >= 25,
        "versatile": len(state["win_frameworks"]) >= 3,
        "master": state["xp"] >= LEVEL8_XP,
    }
    new_badges = [b for b, ok in checks.items() if ok and b not in state["badges"]]
    state["badges"].extend(new_badges)
    return {"xp_gained": xp, "new_badges": new_badges}


async def _replay_history(db, user_id: str) -> Dict[str, Any]:
    state = empty_state()
    negs = await db.negotiations.find({"user_id": user_id, "status": "completed"}, {"_id": 0}).to_list(2000)
    negs.sort(key=lambda n: n.get("ended_at") or n.get("created_at") or "")
    cache: Dict[str, Optional[dict]] = {}
    for n in negs:
        slug = n.get("scenario_slug")
        if slug not in cache:
            cache[slug] = await db.scenarios.find_one({"slug": slug}, {"_id": 0, "participants": 1})
        apply_sim(state, n, cache[slug])
    return state


async def get_state(db, user_id: str) -> Dict[str, Any]:
    user = await db.users.find_one({"id": user_id}, {"_id": 0, "gamification": 1})
    state = (user or {}).get("gamification")
    if state is None:
        state = await _replay_history(db, user_id)
        await db.users.update_one({"id": user_id}, {"$set": {"gamification": state}})
    return state


async def award(db, user_id: str, neg: dict, scenario: Optional[dict]) -> Dict[str, Any]:
    user = await db.users.find_one({"id": user_id}, {"_id": 0, "gamification": 1})
    if (user or {}).get("gamification") is None:
        # first time: replay full history (already includes this completed sim)
        state = await _replay_history(db, user_id)
        await db.users.update_one({"id": user_id}, {"$set": {"gamification": state}})
        return {"xp_gained": 0, "new_badges": state["badges"]}
    state = user["gamification"]
    result = apply_sim(state, neg, scenario)
    await db.users.update_one({"id": user_id}, {"$set": {"gamification": state}})
    return result


def public_view(state: Dict[str, Any]) -> Dict[str, Any]:
    today = datetime.now(timezone.utc).date()
    last = datetime.fromisoformat(state["last_sim_date"]).date() if state.get("last_sim_date") else None
    active = last is not None and (today - last).days <= 1
    return {"xp": state["xp"], "streak": state["streak"] if active else 0, "badges": state["badges"],
            "total": state["total"], "wins": state["wins"]}
