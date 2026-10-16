"""Negotiation routes (incl. SSE streaming and coach)."""
import uuid
import json

import asyncio

from fastapi import APIRouter, HTTPException, Depends
from fastapi.responses import StreamingResponse

from emergentintegrations.llm.chat import LlmChat, UserMessage
from scenarios_seed import GENDERS, ROLE_RU, SCENARIO_RU, NAME_RU
from frameworks import FRAMEWORKS, classify_spin
import gamification
from core import (LANG_NAMES, EMERGENT_LLM_KEY, resolve_model, db, logger, now_iso,
                  get_current_user)
from models import (MessageIn, CreateNegotiationIn, EndNegotiationIn, CoachIn)
from scenario_utils import _resolve_parts
from engine import (_build_system_prompt, _ai_respond, _analyze_turn, _pick_participants, _neg_out,
                    _generate_choices, _compute_debrief, _update_user_skills,
                    _rule_hint, _chunk_text)

api = APIRouter(prefix="/api")

@api.post("/negotiations")
async def create_negotiation(body: CreateNegotiationIn, user=Depends(get_current_user)):
    scenario = await db.scenarios.find_one({"slug": body.scenario_slug}, {"_id": 0})
    if not scenario:
        raise HTTPException(404, "Scenario not found")
    parts = _pick_participants(scenario, body.participants_count)
    neg_id = str(uuid.uuid4())
    fw = FRAMEWORKS.get(body.training_framework, FRAMEWORKS["combined"])
    title = scenario["title"]
    is_custom = bool(scenario.get("custom"))
    ru_tr = (scenario.get("translations") or {}).get("ru", {}) if is_custom else {}
    if body.language == "ru":
        if is_custom:
            title = ru_tr.get("title") or title
        else:
            title = SCENARIO_RU.get(body.scenario_slug, {}).get("title", title)
    # localized participant snapshot (keeps src_name to map back to scenario)
    snap = []
    for idx, p in enumerate(parts):
        if body.language == "ru":
            if is_custom:
                pt = (ru_tr.get("participants") or [])
                pt_i = pt[idx] if idx < len(pt) else {}
                dn = pt_i.get("name") or p["name"]
                dr = pt_i.get("role") or p["role"]
            else:
                dn, dr = NAME_RU.get(p["name"], p["name"]), ROLE_RU.get(p["role"], p["role"])
        else:
            dn, dr = p["name"], p["role"]
        gender = p.get("gender") or GENDERS.get(p["name"], "female")
        snap.append({"name": dn, "role": dr, "src_name": p["name"], "gender": gender})
    doc = {
        "id": neg_id,
        "user_id": user["id"],
        "scenario_slug": body.scenario_slug,
        "scenario_title": title,
        "language": body.language,
        "mode": body.mode,
        "training_framework": fw["id"],
        "framework_name": fw["name"],
        "ai_model": (body.ai_model or "claude").lower(),
        "participants": snap,
        "preparation": body.preparation or {},
        "state": {
            "round": 0,
            "trust": {s["name"]: 50 for s in snap},
            "pressure": {s["name"]: 30 for s in snap},
            "signals": {"question": 0, "open_question": 0, "concession": 0, "anchoring": 0, "empathy": 0, "pressure": 0, "batna_ref": 0, "objective_criteria": 0, "trades": 0, "personal_attack": 0},
            "spin_counts": {"situation": 0, "problem": 0, "implication": 0, "need_payoff": 0, "other": 0},
            "started_at": now_iso(),
        },
        "messages": [],
        "status": "active",
        "outcome": None,
        "score": None,
        "created_at": now_iso(),
    }
    await db.negotiations.insert_one(doc)
    # opening line from first participant
    return {"negotiation": _neg_out(doc)}


@api.get("/negotiations")
async def list_negotiations(user=Depends(get_current_user)):
    docs = await db.negotiations.find({"user_id": user["id"]}, {"_id": 0}).sort("created_at", -1).to_list(200)
    return {"negotiations": [_neg_out(d) for d in docs]}


@api.get("/negotiations/{neg_id}")
async def get_negotiation(neg_id: str, user=Depends(get_current_user)):
    doc = await db.negotiations.find_one({"id": neg_id, "user_id": user["id"]}, {"_id": 0})
    if not doc:
        raise HTTPException(404, "Not found")
    return {"negotiation": _neg_out(doc)}


@api.post("/negotiations/{neg_id}/message")
async def post_message(neg_id: str, body: MessageIn, user=Depends(get_current_user)):
    doc = await db.negotiations.find_one({"id": neg_id, "user_id": user["id"]}, {"_id": 0})
    if not doc:
        raise HTTPException(404, "Not found")
    if doc["status"] != "active":
        raise HTTPException(400, "Negotiation ended")

    scenario = await db.scenarios.find_one({"slug": doc["scenario_slug"]}, {"_id": 0})
    parts = _resolve_parts(scenario, doc)

    # analyze user turn
    signals = await _analyze_turn(body.content)
    for k, v in signals.items():
        if v:
            doc["state"]["signals"][k] = doc["state"]["signals"].get(k, 0) + 1
    # extended signals
    tl = body.content.lower()
    if any(w in tl for w in ["benchmark", "market rate", "industry standard", "standard practice", "рынок"]):
        doc["state"]["signals"]["objective_criteria"] = doc["state"]["signals"].get("objective_criteria", 0) + 1
    if any(w in tl for w in ["in exchange", "in return", "if you", "trade", "swap"]):
        doc["state"]["signals"]["trades"] = doc["state"]["signals"].get("trades", 0) + 1
    if any(w in tl for w in ["stupid", "ridiculous", "you people", "your fault", "incompetent"]):
        doc["state"]["signals"]["personal_attack"] = doc["state"]["signals"].get("personal_attack", 0) + 1
    # SPIN classification
    spin_cat = classify_spin(body.content)
    doc["state"].setdefault("spin_counts", {"situation": 0, "problem": 0, "implication": 0, "need_payoff": 0, "other": 0})
    doc["state"]["spin_counts"][spin_cat] = doc["state"]["spin_counts"].get(spin_cat, 0) + 1

    # append user msg
    user_msg = {"id": str(uuid.uuid4()), "role": "user", "content": body.content, "at": now_iso()}
    doc["messages"].append(user_msg)
    doc["state"]["round"] = doc["state"].get("round", 0) + 1

    # generate AI responses from each participant (or just first if multi-party gets too long)
    ai_replies = []
    fw_id = doc.get("training_framework", "combined")
    lang = doc.get("language", "en")
    ai_m = doc.get("ai_model", "claude")
    for p in parts[:2]:  # cap at 2 concurrent to keep responses tight
        sys_prompt = _build_system_prompt(scenario, p, doc["state"], parts, fw_id, lang)
        try:
            ai_text = await _ai_respond(sys_prompt, doc["messages"][:-1], body.content, f"{neg_id}-{p['name']}", ai_m)
        except Exception as e:
            logger.exception("AI error")
            ai_text = f"[{p['name']} pauses] Let me think about your offer."
        ai_msg = {"id": str(uuid.uuid4()), "role": "ai", "participant": p["name"], "content": ai_text, "at": now_iso()}
        doc["messages"].append(ai_msg)
        ai_replies.append(ai_msg)
        # update trust/pressure
        if signals.get("empathy"):
            doc["state"]["trust"][p["name"]] = min(100, doc["state"]["trust"].get(p["name"], 50) + 5)
        if signals.get("pressure"):
            doc["state"]["pressure"][p["name"]] = min(100, doc["state"]["pressure"].get(p["name"], 30) + 8)

    # generate multiple choice options if challenge mode
    choices = None
    if doc["mode"] == "challenge" and doc["status"] == "active":
        try:
            choices = await _generate_choices(scenario, doc)
        except Exception:
            choices = None

    await db.negotiations.update_one(
        {"id": neg_id},
        {"$set": {"messages": doc["messages"], "state": doc["state"]}},
    )
    return {"user_message": user_msg, "ai_replies": ai_replies, "state": doc["state"], "choices": choices}


@api.delete("/negotiations/{neg_id}")
async def delete_negotiation(neg_id: str, user=Depends(get_current_user)):
    doc = await db.negotiations.find_one({"id": neg_id, "user_id": user["id"]}, {"_id": 0})
    if not doc:
        raise HTTPException(404, "Not found")
    await db.negotiations.delete_one({"id": neg_id, "user_id": user["id"]})
    return {"ok": True}



@api.post("/negotiations/{neg_id}/end")
async def end_negotiation(neg_id: str, body: EndNegotiationIn, user=Depends(get_current_user)):
    doc = await db.negotiations.find_one({"id": neg_id, "user_id": user["id"]}, {"_id": 0})
    if not doc:
        raise HTTPException(404, "Not found")
    if doc["status"] != "active":
        return {"negotiation": _neg_out(doc)}
    scenario = await db.scenarios.find_one({"slug": doc["scenario_slug"]}, {"_id": 0})

    result = await _compute_debrief(scenario, doc, body.action)
    doc.update(result)
    doc["status"] = "completed"
    doc["ended_at"] = now_iso()
    await db.negotiations.update_one({"id": neg_id}, {"$set": {
        "status": "completed", "outcome": doc["outcome"], "score": doc["score"],
        "skill_scores": doc["skill_scores"], "feedback": doc["feedback"], "ended_at": doc["ended_at"],
        "framework_scores": doc.get("framework_scores"),
    }})
    # update user skill aggregate
    await _update_user_skills(user["id"], doc["skill_scores"])
    game = await gamification.award(db, user["id"], doc, scenario)
    return {"negotiation": _neg_out(doc), "gamification": game}


@api.post("/coach/hint")
async def coach_hint(body: CoachIn, user=Depends(get_current_user)):
    doc = await db.negotiations.find_one({"id": body.negotiation_id, "user_id": user["id"]}, {"_id": 0})
    if not doc:
        raise HTTPException(404, "Not found")
    fw = FRAMEWORKS.get(doc.get("training_framework", "combined"), FRAMEWORKS["combined"])
    lang = doc.get("language", "en")
    lang_name = LANG_NAMES.get(lang, "English")
    fallback = _rule_hint(doc, lang)
    try:
        history_txt = "\n".join([f"{m.get('participant') or m['role'].upper()}: {m['content']}" for m in doc["messages"][-6:]])
        scenario = await db.scenarios.find_one({"slug": doc["scenario_slug"]}, {"_id": 0})
        objective = (scenario or {}).get("objective", "")
        if lang == "ru":
            if (scenario or {}).get("custom"):
                objective = ((scenario.get("translations") or {}).get("ru", {}).get("objective")) or objective
            else:
                objective = SCENARIO_RU.get(doc["scenario_slug"], {}).get("objective", objective)
        sys = f"""You are an elite negotiation coach watching a live practice session.
Training framework: {fw['name']} — {fw['tagline']}
User's objective: {objective}
Framework focus: {', '.join(fw.get('objectives', []))}
Give exactly ONE short, specific, actionable coaching tip (max 22 words) for the user's NEXT move, grounded in what just happened in the transcript. No greetings, no preamble, no quotes. Write ONLY in {lang_name}."""
        provider, model = resolve_model(doc.get("ai_model", "claude"))
        chat = LlmChat(api_key=EMERGENT_LLM_KEY, session_id=f"coach-{doc['id']}-{doc['state'].get('round', 0)}", system_message=sys).with_model(provider, model)
        resp = await chat.send_message(UserMessage(text=f"Transcript so far:\n{history_txt or '(no messages yet — user is about to open)'}\n\nGive the single next-move tip now."))
        tip = (resp if isinstance(resp, str) else str(resp)).strip().strip('"').strip()
        if tip:
            return {"hint": tip[:300], "framework": fw["name"], "dynamic": True}
    except Exception:
        logger.exception("coach hint AI failed, using rule-based fallback")
    return {"hint": fallback, "framework": fw["name"], "dynamic": False}


@api.post("/negotiations/{neg_id}/message-stream")
async def post_message_stream(neg_id: str, body: MessageIn, user=Depends(get_current_user)):
    doc = await db.negotiations.find_one({"id": neg_id, "user_id": user["id"]}, {"_id": 0})
    if not doc:
        raise HTTPException(404, "Not found")
    if doc["status"] != "active":
        raise HTTPException(400, "Negotiation ended")

    scenario = await db.scenarios.find_one({"slug": doc["scenario_slug"]}, {"_id": 0})
    parts = _resolve_parts(scenario, doc)

    async def event_gen():
        try:
            # analyze user turn
            signals = await _analyze_turn(body.content)
            for k, v in signals.items():
                if v:
                    doc["state"]["signals"][k] = doc["state"]["signals"].get(k, 0) + 1
            tl = body.content.lower()
            if any(w in tl for w in ["benchmark", "market rate", "industry standard", "standard practice", "рынок"]):
                doc["state"]["signals"]["objective_criteria"] = doc["state"]["signals"].get("objective_criteria", 0) + 1
            if any(w in tl for w in ["in exchange", "in return", "if you", "trade", "swap"]):
                doc["state"]["signals"]["trades"] = doc["state"]["signals"].get("trades", 0) + 1
            if any(w in tl for w in ["stupid", "ridiculous", "you people", "your fault", "incompetent"]):
                doc["state"]["signals"]["personal_attack"] = doc["state"]["signals"].get("personal_attack", 0) + 1
            spin_cat = classify_spin(body.content)
            doc["state"].setdefault("spin_counts", {"situation": 0, "problem": 0, "implication": 0, "need_payoff": 0, "other": 0})
            doc["state"]["spin_counts"][spin_cat] = doc["state"]["spin_counts"].get(spin_cat, 0) + 1

            user_msg = {"id": str(uuid.uuid4()), "role": "user", "content": body.content, "at": now_iso()}
            doc["messages"].append(user_msg)
            doc["state"]["round"] = doc["state"].get("round", 0) + 1

            yield f"data: {json.dumps({'type': 'user', 'message': user_msg})}\n\n"

            ai_replies = []
            fw_id = doc.get("training_framework", "combined")
            lang = doc.get("language", "en")
            ai_m = doc.get("ai_model", "claude")
            for p in parts[:2]:
                sys_prompt = _build_system_prompt(scenario, p, doc["state"], parts, fw_id, lang)
                try:
                    ai_text = await _ai_respond(sys_prompt, doc["messages"][:-1], body.content, f"{neg_id}-{p['name']}", ai_m)
                except Exception:
                    logger.exception("AI error")
                    ai_text = f"[{p['name']} pauses] Let me think about your offer."

                ai_msg_id = str(uuid.uuid4())
                ai_msg = {"id": ai_msg_id, "role": "ai", "participant": p["name"], "content": ai_text, "at": now_iso()}
                doc["messages"].append(ai_msg)
                ai_replies.append(ai_msg)

                # stream token chunks
                yield f"data: {json.dumps({'type': 'ai_start', 'message': {'id': ai_msg_id, 'role': 'ai', 'participant': p['name'], 'at': ai_msg['at']}})}\n\n"
                for chunk in _chunk_text(ai_text, target_chunks=24):
                    yield f"data: {json.dumps({'type': 'ai_chunk', 'id': ai_msg_id, 'chunk': chunk})}\n\n"
                    await asyncio.sleep(0.04)
                yield f"data: {json.dumps({'type': 'ai_end', 'id': ai_msg_id})}\n\n"

                if signals.get("empathy"):
                    doc["state"]["trust"][p["name"]] = min(100, doc["state"]["trust"].get(p["name"], 50) + 5)
                if signals.get("pressure"):
                    doc["state"]["pressure"][p["name"]] = min(100, doc["state"]["pressure"].get(p["name"], 30) + 8)

            choices = None
            if doc["mode"] == "challenge" and doc["status"] == "active":
                try:
                    choices = await _generate_choices(scenario, doc)
                except Exception:
                    choices = None

            await db.negotiations.update_one(
                {"id": neg_id},
                {"$set": {"messages": doc["messages"], "state": doc["state"]}},
            )
            yield f"data: {json.dumps({'type': 'done', 'state': doc['state'], 'choices': choices})}\n\n"
        except Exception as e:
            logger.exception("stream failed")
            yield f"data: {json.dumps({'type': 'error', 'message': str(e)})}\n\n"

    return StreamingResponse(event_gen(), media_type="text/event-stream", headers={
        "Cache-Control": "no-cache",
        "Connection": "keep-alive",
        "X-Accel-Buffering": "no",
    })


