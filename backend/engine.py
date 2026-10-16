"""Negotiation AI engine: prompts, scoring, debrief."""
import json
from typing import List, Optional, Dict, Any

import re
import random


from emergentintegrations.llm.chat import LlmChat, UserMessage
from frameworks import FRAMEWORKS
from core import (LANG_NAMES, EMERGENT_LLM_KEY, resolve_model, db, logger, now_iso)


# ---------- AI helpers ----------
def _build_system_prompt(scenario: dict, participant: dict, state: dict, all_participants: List[dict], framework_id: str = "combined", language: str = "en") -> str:
    others = ", ".join([f"{p['name']} ({p['role']})" for p in all_participants if p['name'] != participant['name']])
    fw = FRAMEWORKS.get(framework_id, FRAMEWORKS["combined"])
    lang_name = LANG_NAMES.get(language, "English")
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
7. CRITICAL LANGUAGE RULE: You MUST write EVERY reply ONLY in {lang_name}. The scenario notes above are in English, but your spoken replies must ALWAYS be natural, fluent {lang_name}. Never mix languages (industry terms like BATNA, SLA, SPIN may stay as-is)."""


async def _ai_respond(system_prompt: str, history: List[dict], user_text: str, session_id: str, ai_model: str = "claude") -> str:
    provider, model = resolve_model(ai_model)
    chat = LlmChat(
        api_key=EMERGENT_LLM_KEY,
        session_id=session_id,
        system_message=system_prompt,
    ).with_model(provider, model)
    # replay short history to preserve context (token-efficient)
    for msg in history[-6:]:
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


def _pick_participants(scenario: dict, requested: Optional[int]) -> List[dict]:
    available = scenario["participants"]
    if requested is None:
        return available
    return available[: max(1, min(requested, len(available)))]

def _neg_out(doc: dict) -> dict:
    return {
        "id": doc["id"], "scenario_slug": doc["scenario_slug"], "scenario_title": doc["scenario_title"],
        "mode": doc["mode"], "participants": doc["participants"], "state": doc["state"],
        "training_framework": doc.get("training_framework", "combined"),
        "framework_name": doc.get("framework_name", "Combined"),
        "language": doc.get("language", "en"),
        "ai_model": doc.get("ai_model", "claude"),
        "framework_scores": doc.get("framework_scores"),
        "messages": doc.get("messages", []), "status": doc["status"], "outcome": doc.get("outcome"),
        "score": doc.get("score"), "created_at": doc["created_at"], "preparation": doc.get("preparation", {}),
        "feedback": doc.get("feedback"), "skill_scores": doc.get("skill_scores"),
        "ended_at": doc.get("ended_at"),
    }


async def _generate_choices(scenario: dict, doc: dict) -> Optional[List[dict]]:
    lang_name = LANG_NAMES.get(doc.get("language", "en"), "English")
    sys = f"""You generate 4 possible next responses for a user in a negotiation practice app.
Scenario: {scenario['title']}. User objective: {scenario['objective']}
Rules:
- Write every "text" and "hint" value ONLY in {lang_name}.
- Keep all four "text" values balanced in length (25-45 words each). Do NOT make weak/risky ones shorter — they should feel just as complete as strong ones.
- Cover distinct tactical directions (e.g., probing question, direct anchor, empathy move, ultimatum) so quality is judged on substance, not verbosity.
Return ONLY JSON array of 4 objects, each: {{"text": "...", "quality": "strong|acceptable|weak|risky", "hint": "short reason"}}. Include exactly one of each quality."""
    history_txt = "\n".join([f"{m['role'].upper()}: {m['content']}" for m in doc["messages"][-6:]])
    provider, model = resolve_model(doc.get("ai_model", "claude"))
    chat = LlmChat(api_key=EMERGENT_LLM_KEY, session_id=f"choices-{doc['id']}", system_message=sys).with_model(provider, model)
    resp = await chat.send_message(UserMessage(text=f"Latest conversation:\n{history_txt}\n\nGenerate 4 possible user responses now."))
    try:
        text = resp if isinstance(resp, str) else str(resp)
        start = text.find("[")
        end = text.rfind("]")
        if start >= 0 and end > start:
            choices = json.loads(text[start:end+1])
            if isinstance(choices, list) and choices:
                random.shuffle(choices)
                return choices
    except Exception:
        pass
    return None


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
    lang = doc.get("language", "en")
    lang_name = LANG_NAMES.get(lang, "English")
    transcript = "\n".join([f"{m.get('participant') or m['role'].upper()}: {m['content']}" for m in doc["messages"]])
    feedback_prompt = f"""Analyze this negotiation transcript. User was practicing: {scenario['title']}.
User objective: {scenario['objective']}
Final action: {action}. Score: {score}.

Write ALL string values ONLY in {lang_name} (natural, fluent).
Return ONLY JSON with keys:
- "did_well": array of 3 short specific observations quoting behavior
- "improve": array of 3 short specific improvement observations
- "critical_moment": one sentence identifying a key turn
- "better_alternative": one specific better phrasing user could have used
- "final_agreement": one sentence summarizing outcome

Transcript:
{transcript[:2000]}"""
    if lang == "ru":
        feedback = {
            "did_well": ["Вы последовательно вели диалог на протяжении всех переговоров.",
                         "Вы сохраняли профессиональный тон.",
                         "Вы чётко обозначили свою позицию."],
            "improve": ["Задавайте больше открытых исследующих вопросов.",
                        "Явно ссылайтесь на свою BATNA.",
                        "Обменивайте уступки, а не отдавайте их в одностороннем порядке."],
            "critical_moment": "Момент, когда оппонент надавил на цену, был ключевым для изучения его интересов.",
            "better_alternative": "Попробуйте: «Помогите мне понять, что стоит за этой цифрой для вас».",
            "final_agreement": "Переговоры завершены.",
        }
    else:
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
        provider, model = resolve_model(doc.get("ai_model", "claude"))
        chat = LlmChat(api_key=EMERGENT_LLM_KEY, session_id=f"debrief-{doc['id']}", system_message="You are a Harvard-trained negotiation coach.").with_model(provider, model)
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


async def _update_user_skills(user_id: str, new_scores: Dict[str, int]):
    existing = await db.user_skills.find_one({"user_id": user_id}, {"_id": 0})
    if not existing:
        await db.user_skills.insert_one({"user_id": user_id, "skills": new_scores, "count": 1, "updated_at": now_iso()})
        return
    count = existing["count"]
    avg = {k: int((existing["skills"].get(k, 50) * count + new_scores.get(k, 50)) / (count + 1)) for k in new_scores}
    await db.user_skills.update_one({"user_id": user_id}, {"$set": {"skills": avg, "count": count + 1, "updated_at": now_iso()}})


def _rule_hint(doc: dict, lang: str = "en") -> str:
    sig = doc["state"].get("signals", {})
    spin = doc["state"].get("spin_counts", {})
    fw = doc.get("training_framework", "combined")
    ru = lang == "ru"
    hint = ("Сохраняйте любопытство — выявляйте реальные интересы до того, как делать предложения."
            if ru else "Stay curious — probe their real interests before making offers.")
    if fw == "spin":
        if spin.get("implication", 0) == 0:
            hint = ("Спросите о последствиях их проблемы — что будет, если её не решить?" if ru
                    else "Ask about the consequences of their current problem — what happens if it isn't solved?")
        elif spin.get("need_payoff", 0) == 0 and spin.get("problem", 0) > 0:
            hint = ("Вы нашли проблему — теперь помогите увидеть ценность её решения." if ru
                    else "You've uncovered a problem — now help them see the value of solving it.")
    elif fw == "harvard":
        if sig.get("trades", 0) == 0:
            hint = ("Введите ещё одну переменную (срок, оплата, SLA), чтобы обменять её на нужное вам." if ru
                    else "Introduce another variable (term length, payment, SLA) to trade for what you want.")
        elif sig.get("objective_criteria", 0) == 0:
            hint = ("Сошлитесь на объективный критерий — рыночную ставку или отраслевой стандарт." if ru
                    else "Try referencing an objective benchmark — market rate, industry standard, or comparable.")
    elif fw == "batna":
        if sig.get("batna_ref", 0) == 0:
            hint = ("Обозначьте свою альтернативу — напомните, что у вас есть варианты." if ru
                    else "Signal your alternative — remind them you have options if this deal doesn't work.")
    return hint


def _chunk_text(text: str, target_chunks: int = 30) -> List[str]:
    """Split text into small chunks that look like token streaming."""
    if not text:
        return []
    tokens = re.findall(r"\S+\s*", text)
    if not tokens:
        return [text]
    if len(tokens) <= target_chunks:
        return tokens
    # group tokens
    size = max(1, len(tokens) // target_chunks)
    grouped = []
    for i in range(0, len(tokens), size):
        grouped.append("".join(tokens[i:i + size]))
    return grouped


