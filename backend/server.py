"""NEGOTIA backend — AI Negotiation Simulator."""
import os
import uuid
import json
import logging
from datetime import datetime, timezone, timedelta
from pathlib import Path
from typing import List, Optional, Dict, Any

import bcrypt
import jwt
from fastapi import FastAPI, APIRouter, HTTPException, Depends, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
from pydantic import BaseModel, Field, EmailStr

from emergentintegrations.llm.chat import LlmChat, UserMessage

from scenarios_seed import SCENARIOS
from frameworks import FRAMEWORKS, classify_spin

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

client = AsyncIOMotorClient(MONGO_URL)
db = client[DB_NAME]

app = FastAPI(title="NEGOTIA API")
api = APIRouter(prefix="/api")
security = HTTPBearer(auto_error=False)

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("negotia")


def now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


# ---------- Models ----------
class RegisterIn(BaseModel):
    email: EmailStr
    password: str = Field(min_length=6)
    name: str = Field(min_length=1, max_length=100)


class LoginIn(BaseModel):
    email: EmailStr
    password: str


class UserOut(BaseModel):
    id: str
    email: str
    name: str
    created_at: str


class MessageIn(BaseModel):
    content: str


class CreateNegotiationIn(BaseModel):
    scenario_slug: str
    mode: str = "chat"  # chat | voice | challenge
    participants_count: Optional[int] = None
    preparation: Optional[Dict[str, Any]] = None
    training_framework: str = "combined"  # harvard | spin | batna | combined


class AnalyzePrepIn(BaseModel):
    scenario_slug: str
    training_framework: str = "combined"


class EndNegotiationIn(BaseModel):
    action: str = "end"  # end | walk_away | make_deal


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


@app.on_event("shutdown")
async def shutdown():
    client.close()


# ---------- Auth ----------
@api.post("/auth/register")
async def register(body: RegisterIn):
    if await db.users.find_one({"email": body.email.lower()}):
        raise HTTPException(status_code=400, detail="Email already registered")
    uid = str(uuid.uuid4())
    doc = {
        "id": uid, "email": body.email.lower(), "name": body.name,
        "password_hash": hash_password(body.password),
        "created_at": now_iso(), "updated_at": now_iso(),
    }
    await db.users.insert_one(doc)
    token = create_token(uid)
    return {"token": token, "user": {"id": uid, "email": body.email.lower(), "name": body.name, "created_at": doc["created_at"]}}


@api.post("/auth/login")
async def login(body: LoginIn):
    user = await db.users.find_one({"email": body.email.lower()})
    if not user or not verify_password(body.password, user["password_hash"]):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    token = create_token(user["id"])
    return {"token": token, "user": {"id": user["id"], "email": user["email"], "name": user["name"], "created_at": user["created_at"]}}


@api.get("/auth/me")
async def me(user=Depends(get_current_user)):
    return {"user": user}


# ---------- Scenarios ----------
def _scrub_scenario(sc: dict, hide_hidden: bool = True) -> dict:
    """Remove hidden AI information before sending to client."""
    out = {k: v for k, v in sc.items() if k != "_id"}
    if hide_hidden:
        safe_parts = []
        for p in out.get("participants", []):
            sp = {k: v for k, v in p.items() if k not in ("hidden_interests", "reservation_point", "batna")}
            safe_parts.append(sp)
        out["participants"] = safe_parts
    return out


@api.get("/scenarios")
async def list_scenarios(user=Depends(get_current_user)):
    docs = await db.scenarios.find({"active": True}, {"_id": 0}).to_list(500)
    return {"scenarios": [_scrub_scenario(d) for d in docs]}


@api.get("/scenarios/{slug}")
async def get_scenario(slug: str, user=Depends(get_current_user)):
    doc = await db.scenarios.find_one({"slug": slug}, {"_id": 0})
    if not doc:
        raise HTTPException(404, "Scenario not found")
    return {"scenario": _scrub_scenario(doc)}


# ---------- AI helpers ----------
def _build_system_prompt(scenario: dict, participant: dict, state: dict, all_participants: List[dict], framework_id: str = "combined") -> str:
    others = ", ".join([f"{p['name']} ({p['role']})" for p in all_participants if p['name'] != participant['name']])
    fw = FRAMEWORKS.get(framework_id, FRAMEWORKS["combined"])
    return f"""You are {participant['name']}, {participant['role']} in a business negotiation.

{fw['ai_instructions']}

SCENARIO CONTEXT (private):
{scenario['context']}

YOUR ROLE: {participant['description']}
YOUR GOALS: {participant['goals']}
YOUR INTERESTS: {participant['interests']}
YOUR HIDDEN INTERESTS (never reveal unless user asks great probing questions): {participant.get('hidden_interests', '')}
YOUR CONSTRAINTS: {participant['constraints']}
YOUR BATNA (private): {participant.get('batna', '')}
YOUR PERSONALITY: {participant['personality']}
YOUR PRIORITIES: {', '.join(participant.get('priorities', []))}
OTHER PARTICIPANTS: {others or 'Just you and the user.'}

CURRENT NEGOTIATION STATE:
- Round: {state.get('round', 1)}
- Trust in user: {state.get('trust', {}).get(participant['name'], 50)}/100
- Pressure: {state.get('pressure', {}).get(participant['name'], 30)}/100

RULES:
1. Stay strictly in character. Never say "as an AI".
2. Never reveal hidden interests, BATNA, or reservation point unless user demonstrates skilled probing.
3. Keep responses concise (2-4 sentences max), realistic, professional.
4. Push back, ask counter-questions, use silence as leverage — behave like a real negotiator.
5. React to user's tone: if they anchor aggressively, defend; if they show empathy, warm slightly.
6. If user asks smart open-ended questions, gradually reveal ONE interest at a time.
7. Speak in the same language the user writes in (English, Russian, Spanish, or German)."""


async def _ai_respond(system_prompt: str, history: List[dict], user_text: str, session_id: str) -> str:
    chat = LlmChat(
        api_key=EMERGENT_LLM_KEY,
        session_id=session_id,
        system_message=system_prompt,
    ).with_model(AI_PROVIDER, AI_MODEL)
    # replay history
    for msg in history[-10:]:
        if msg["role"] == "user":
            await chat.send_message(UserMessage(text=msg["content"]))
    resp = await chat.send_message(UserMessage(text=user_text))
    return resp if isinstance(resp, str) else str(resp)


async def _analyze_turn(user_msg: str) -> Dict[str, Any]:
    """Detect strategies used in user's message using a fast heuristic + AI."""
    txt = user_msg.lower()
    signals = {
        "question": "?" in user_msg,
        "open_question": any(w in txt for w in ["what", "how", "why", "tell me", "help me understand", "что", "как", "почему"]),
        "concession": any(w in txt for w in ["i can offer", "willing to", "agree to", "могу предложить", "готов"]),
        "anchoring": any(c.isdigit() for c in user_msg) and any(w in txt for w in ["$", "%", "price", "rate", "цена"]),
        "empathy": any(w in txt for w in ["understand", "appreciate", "hear you", "понимаю"]),
        "pressure": any(w in txt for w in ["must", "have to", "otherwise", "or else", "должны"]),
        "batna_ref": any(w in txt for w in ["alternative", "walk", "other option", "альтернатива"]),
    }
    return signals


# ---------- Negotiations ----------
def _pick_participants(scenario: dict, requested: Optional[int]) -> List[dict]:
    available = scenario["participants"]
    if requested is None:
        return available
    return available[: max(1, min(requested, len(available)))]


@api.post("/negotiations")
async def create_negotiation(body: CreateNegotiationIn, user=Depends(get_current_user)):
    scenario = await db.scenarios.find_one({"slug": body.scenario_slug}, {"_id": 0})
    if not scenario:
        raise HTTPException(404, "Scenario not found")
    parts = _pick_participants(scenario, body.participants_count)
    neg_id = str(uuid.uuid4())
    fw = FRAMEWORKS.get(body.training_framework, FRAMEWORKS["combined"])
    doc = {
        "id": neg_id,
        "user_id": user["id"],
        "scenario_slug": body.scenario_slug,
        "scenario_title": scenario["title"],
        "mode": body.mode,
        "training_framework": fw["id"],
        "framework_name": fw["name"],
        "participants": [{"name": p["name"], "role": p["role"]} for p in parts],
        "preparation": body.preparation or {},
        "state": {
            "round": 0,
            "trust": {p["name"]: 50 for p in parts},
            "pressure": {p["name"]: 30 for p in parts},
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


def _neg_out(doc: dict) -> dict:
    return {
        "id": doc["id"], "scenario_slug": doc["scenario_slug"], "scenario_title": doc["scenario_title"],
        "mode": doc["mode"], "participants": doc["participants"], "state": doc["state"],
        "training_framework": doc.get("training_framework", "combined"),
        "framework_name": doc.get("framework_name", "Combined"),
        "framework_scores": doc.get("framework_scores"),
        "messages": doc.get("messages", []), "status": doc["status"], "outcome": doc.get("outcome"),
        "score": doc.get("score"), "created_at": doc["created_at"], "preparation": doc.get("preparation", {}),
        "feedback": doc.get("feedback"), "skill_scores": doc.get("skill_scores"),
        "ended_at": doc.get("ended_at"),
    }


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
    parts = [p for p in scenario["participants"] if any(pp["name"] == p["name"] for pp in doc["participants"])]

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
    for p in parts[:2]:  # cap at 2 concurrent to keep responses tight
        sys_prompt = _build_system_prompt(scenario, p, doc["state"], parts, fw_id)
        try:
            ai_text = await _ai_respond(sys_prompt, doc["messages"][:-1], body.content, f"{neg_id}-{p['name']}")
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


async def _generate_choices(scenario: dict, doc: dict) -> Optional[List[dict]]:
    sys = f"""You generate 4 possible next responses for a user in a negotiation practice app.
Scenario: {scenario['title']}. User objective: {scenario['objective']}
Return ONLY JSON array of 4 objects, each: {{"text": "...", "quality": "strong|acceptable|weak|risky", "hint": "short reason"}}"""
    history_txt = "\n".join([f"{m['role'].upper()}: {m['content']}" for m in doc["messages"][-8:]])
    chat = LlmChat(api_key=EMERGENT_LLM_KEY, session_id=f"choices-{doc['id']}", system_message=sys).with_model(AI_PROVIDER, AI_MODEL)
    resp = await chat.send_message(UserMessage(text=f"Latest conversation:\n{history_txt}\n\nGenerate 4 possible user responses now."))
    try:
        text = resp if isinstance(resp, str) else str(resp)
        start = text.find("[")
        end = text.rfind("]")
        if start >= 0 and end > start:
            return json.loads(text[start:end+1])
    except Exception:
        pass
    return None


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
    return {"negotiation": _neg_out(doc)}


async def _compute_debrief(scenario: dict, doc: dict, action: str) -> Dict[str, Any]:
    sig = doc["state"]["signals"]
    rounds = max(1, doc["state"].get("round", 1))
    # baseline skill scores from signals
    def clamp(v):
        return max(0, min(100, int(v)))
    skill_scores = {
        "Questioning": clamp(40 + sig.get("open_question", 0) * 12 + sig.get("question", 0) * 4),
        "Active Listening": clamp(45 + sig.get("empathy", 0) * 10 + sig.get("open_question", 0) * 5),
        "Argumentation": clamp(50 + sig.get("anchoring", 0) * 8 - sig.get("pressure", 0) * 2),
        "Concessions": clamp(50 + sig.get("concession", 0) * 10),
        "BATNA": clamp(45 + sig.get("batna_ref", 0) * 15),
        "Conflict Management": clamp(55 + sig.get("empathy", 0) * 7 - sig.get("pressure", 0) * 5),
        "Strategy": clamp(45 + sig.get("open_question", 0) * 4 + sig.get("anchoring", 0) * 6),
        "Relationship": clamp(55 + sig.get("empathy", 0) * 8 - sig.get("pressure", 0) * 6),
    }
    score = int(sum(skill_scores.values()) / len(skill_scores))
    if action == "walk_away":
        outcome = "Walk Away"
        score = max(30, score - 15)
    elif action == "make_deal":
        outcome = "Successful" if score >= 70 else ("Compromise" if score >= 55 else "Weak outcome")
    else:
        outcome = "Successful" if score >= 75 else ("Compromise" if score >= 60 else ("Weak outcome" if score >= 45 else "Failed"))
    if score >= 88:
        outcome = "Excellent"

    # AI feedback
    transcript = "\n".join([f"{m.get('participant') or m['role'].upper()}: {m['content']}" for m in doc["messages"]])
    feedback_prompt = f"""Analyze this negotiation transcript. User was practicing: {scenario['title']}.
User objective: {scenario['objective']}
Final action: {action}. Score: {score}.

Return ONLY JSON with keys:
- "did_well": array of 3 short specific observations quoting behavior
- "improve": array of 3 short specific improvement observations
- "critical_moment": one sentence identifying a key turn
- "better_alternative": one specific better phrasing user could have used
- "final_agreement": one sentence summarizing outcome

Transcript:
{transcript[:3000]}"""
    feedback = {
        "did_well": ["You engaged consistently throughout the negotiation.",
                     "You maintained a professional tone.",
                     "You made your position clear."],
        "improve": ["Ask more open-ended discovery questions.",
                    "Reference your BATNA explicitly.",
                    "Trade concessions instead of giving unilaterally."],
        "critical_moment": "The turn where the counterparty pushed on price was a key moment to explore their interests.",
        "better_alternative": "Try: 'Help me understand what's driving that number for you.'",
        "final_agreement": "Negotiation ended.",
    }
    try:
        chat = LlmChat(api_key=EMERGENT_LLM_KEY, session_id=f"debrief-{doc['id']}", system_message="You are a Harvard-trained negotiation coach.").with_model(AI_PROVIDER, AI_MODEL)
        resp = await chat.send_message(UserMessage(text=feedback_prompt))
        text = resp if isinstance(resp, str) else str(resp)
        s = text.find("{"); e = text.rfind("}")
        if s >= 0 and e > s:
            parsed = json.loads(text[s:e+1])
            feedback.update({k: v for k, v in parsed.items() if k in feedback})
    except Exception:
        logger.exception("Debrief AI failed, using fallback")

    return {"outcome": outcome, "score": score, "skill_scores": skill_scores, "feedback": feedback,
            "framework_scores": _compute_framework_scores(doc)}


def _compute_framework_scores(doc: dict) -> Dict[str, Any]:
    sig = doc["state"].get("signals", {})
    spin = doc["state"].get("spin_counts", {})
    fw = doc.get("training_framework", "combined")
    def clamp(v): return max(0, min(100, int(v)))
    harvard = {
        "People vs Problem": clamp(70 - sig.get("personal_attack", 0) * 20 + sig.get("empathy", 0) * 5),
        "Interests vs Positions": clamp(45 + sig.get("open_question", 0) * 10),
        "Options for Mutual Gain": clamp(45 + sig.get("trades", 0) * 15),
        "Objective Criteria": clamp(40 + sig.get("objective_criteria", 0) * 20),
    }
    spin_scores = {
        "Situation": clamp(50 + spin.get("situation", 0) * 8),
        "Problem": clamp(50 + spin.get("problem", 0) * 12),
        "Implication": clamp(40 + spin.get("implication", 0) * 18),
        "Need-Payoff": clamp(40 + spin.get("need_payoff", 0) * 20),
    }
    batna = {
        "BATNA Clarity": clamp(45 + sig.get("batna_ref", 0) * 15 + (10 if (doc.get("preparation") or {}).get("batna") else 0)),
        "Leverage": clamp(45 + sig.get("batna_ref", 0) * 10 + sig.get("anchoring", 0) * 5),
        "Reservation Discipline": clamp(50 + (10 if (doc.get("preparation") or {}).get("minimum") else 0)),
        "Concession Management": clamp(50 + sig.get("trades", 0) * 10 - max(0, sig.get("concession", 0) - sig.get("trades", 0)) * 8),
    }
    return {"framework": fw, "harvard": harvard, "spin": spin_scores, "batna": batna}


@api.get("/frameworks")
async def list_frameworks():
    return {"frameworks": [{"id": f["id"], "name": f["name"], "tagline": f["tagline"], "chips": f["chips"]} for f in FRAMEWORKS.values()]}


@api.post("/prep/analyze")
async def analyze_prep(body: AnalyzePrepIn, user=Depends(get_current_user)):
    scenario = await db.scenarios.find_one({"slug": body.scenario_slug}, {"_id": 0})
    if not scenario:
        raise HTTPException(404, "Scenario not found")
    fw = FRAMEWORKS.get(body.training_framework, FRAMEWORKS["combined"])
    # scrub scenario for AI (still has objective/context, but no hidden fields exposed to user response)
    prompt = f"""You are a negotiation coach. Draft a preparation sheet for the user practicing the {fw['name']} framework.
Scenario: {scenario['title']}. Objective: {scenario['objective']}. Context: {scenario['context']}.

Return ONLY JSON with these fields (short bullet-style, one sentence each):
{{"batna": "...", "priorities": "...", "theirs": "...", "offer": "...", "ideal": "...", "minimum": "..."}}"""
    try:
        chat = LlmChat(api_key=EMERGENT_LLM_KEY, session_id=f"prep-{user['id']}-{body.scenario_slug}",
                       system_message="You are a Harvard-trained negotiation coach who writes concise preparation sheets.").with_model(AI_PROVIDER, AI_MODEL)
        resp = await chat.send_message(UserMessage(text=prompt))
        text = resp if isinstance(resp, str) else str(resp)
        s = text.find("{"); e = text.rfind("}")
        if s >= 0 and e > s:
            data = json.loads(text[s:e+1])
            return {"preparation": data}
    except Exception:
        logger.exception("Prep analyze failed")
    return {"preparation": {"batna": "", "priorities": "", "theirs": "", "offer": "", "ideal": "", "minimum": ""}}


async def _update_user_skills(user_id: str, new_scores: Dict[str, int]):
    existing = await db.user_skills.find_one({"user_id": user_id}, {"_id": 0})
    if not existing:
        await db.user_skills.insert_one({"user_id": user_id, "skills": new_scores, "count": 1, "updated_at": now_iso()})
        return
    count = existing["count"]
    avg = {k: int((existing["skills"].get(k, 50) * count + new_scores.get(k, 50)) / (count + 1)) for k in new_scores}
    await db.user_skills.update_one({"user_id": user_id}, {"$set": {"skills": avg, "count": count + 1, "updated_at": now_iso()}})


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


@api.get("/users/me/recommended")
async def recommended(user=Depends(get_current_user)):
    skills_doc = await db.user_skills.find_one({"user_id": user["id"]}, {"_id": 0})
    weakest = "Questioning"
    if skills_doc:
        weakest = min(skills_doc["skills"], key=skills_doc["skills"].get)
    scenarios = await db.scenarios.find({"active": True, "skills": {"$in": [weakest]}}, {"_id": 0}).limit(3).to_list(3)
    if not scenarios:
        scenarios = await db.scenarios.find({"active": True}, {"_id": 0}).limit(3).to_list(3)
    return {"weakest_skill": weakest, "scenarios": [_scrub_scenario(s) for s in scenarios]}


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


class CoachIn(BaseModel):
    negotiation_id: str


@api.post("/coach/hint")
async def coach_hint(body: CoachIn, user=Depends(get_current_user)):
    doc = await db.negotiations.find_one({"id": body.negotiation_id, "user_id": user["id"]}, {"_id": 0})
    if not doc:
        raise HTTPException(404, "Not found")
    fw = FRAMEWORKS.get(doc.get("training_framework", "combined"), FRAMEWORKS["combined"])
    sig = doc["state"].get("signals", {})
    spin = doc["state"].get("spin_counts", {})
    hint = "Stay curious — probe their real interests before making offers."
    if doc["training_framework"] == "spin":
        if spin.get("implication", 0) == 0:
            hint = "Ask about the consequences of their current problem — what happens if it isn't solved?"
        elif spin.get("need_payoff", 0) == 0 and spin.get("problem", 0) > 0:
            hint = "You've uncovered a problem — now help them see the value of solving it."
    elif doc["training_framework"] == "harvard":
        if sig.get("trades", 0) == 0:
            hint = "Introduce another variable (term length, payment, SLA) to trade for what you want."
        elif sig.get("objective_criteria", 0) == 0:
            hint = "Try referencing an objective benchmark — market rate, industry standard, or comparable."
    elif doc["training_framework"] == "batna":
        if sig.get("batna_ref", 0) == 0:
            hint = "Signal your alternative — remind them you have options if this deal doesn't work."
    return {"hint": hint, "framework": fw["name"]}


@api.get("/health")
async def health():
    return {"status": "ok", "ts": now_iso()}


app.include_router(api)
app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get("CORS_ORIGINS", "*").split(","),
    allow_methods=["*"], allow_headers=["*"],
)
