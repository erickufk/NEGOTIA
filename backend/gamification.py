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


async def _replay_history(db, user_id: str, exclude_id: Optional[str] = None) -> Dict[str, Any]:
    state = empty_state()
    q = {"user_id": user_id, "status": "completed"}
    if exclude_id:
        q["id"] = {"$ne": exclude_id}
    negs = await db.negotiations.find(q, {"_id": 0}).to_list(2000)
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
    state = (user or {}).get("gamification")
    if state is None:
        state = await _replay_history(db, user_id, exclude_id=neg["id"])
    result = apply_sim(state, neg, scenario)
    wk = await weekly_progress(db, user_id)
    result["challenge"] = None
    if wk["completed"] and wk["week"] not in state.setdefault("challenges_done", []):
        state["challenges_done"].append(wk["week"])
        state["xp"] += CHALLENGE_XP
        result["xp_gained"] += CHALLENGE_XP
        result["challenge"] = wk
        if state["xp"] >= LEVEL8_XP and "master" not in state["badges"]:
            state["badges"].append("master")
            result["new_badges"].append("master")
    result["xp_total"] = state["xp"]
    await db.users.update_one({"id": user_id}, {"$set": {"gamification": state}})
    return result


def public_view(state: Dict[str, Any]) -> Dict[str, Any]:
    today = datetime.now(timezone.utc).date()
    last = datetime.fromisoformat(state["last_sim_date"]).date() if state.get("last_sim_date") else None
    active = last is not None and (today - last).days <= 1
    return {"xp": state["xp"], "streak": state["streak"] if active else 0, "badges": state["badges"],
            "total": state["total"], "wins": state["wins"]}


CHALLENGE_XP = 100
# id, target, predicate(neg) -> counts toward progress; "days" counts distinct days
CHALLENGES = [
    ("win_spin", 2, lambda n: n.get("training_framework") == "spin" and n.get("outcome") in WIN_OUTCOMES),
    ("complete_n", 3, lambda n: True),
    ("score_80", 1, lambda n: (n.get("score") or 0) >= 80),
    ("win_harvard", 1, lambda n: n.get("training_framework") == "harvard" and n.get("outcome") in WIN_OUTCOMES),
    ("batna_n", 2, lambda n: n.get("training_framework") == "batna"),
    ("days_n", 3, None),
]


def _week_bounds(now: Optional[datetime] = None):
    now = now or datetime.now(timezone.utc)
    start = (now - timedelta(days=now.weekday())).replace(hour=0, minute=0, second=0, microsecond=0)
    iso = start.isocalendar()
    return start, start + timedelta(days=7), f"{iso[0]}-W{iso[1]:02d}", iso[1]


async def weekly_progress(db, user_id: str) -> Dict[str, Any]:
    start, end, key, num = _week_bounds()
    cid, target, pred = CHALLENGES[num % len(CHALLENGES)]
    negs = await db.negotiations.find(
        {"user_id": user_id, "status": "completed", "ended_at": {"$gte": start.isoformat(), "$lt": end.isoformat()}},
        {"_id": 0, "training_framework": 1, "outcome": 1, "score": 1, "ended_at": 1}).to_list(500)
    if pred is None:
        progress = len({n["ended_at"][:10] for n in negs})
    else:
        progress = sum(1 for n in negs if pred(n))
    return {"id": cid, "week": key, "target": target, "progress": min(progress, target),
            "completed": progress >= target, "bonus_xp": CHALLENGE_XP, "ends_at": end.isoformat()}
