"""Training framework configurations."""

FRAMEWORKS = {
    "harvard": {
        "id": "harvard", "name": "Harvard Negotiation",
        "tagline": "Focus on interests, options and mutual value.",
        "chips": ["Interests", "Options", "Criteria"],
        "objectives": ["Separate people from problem", "Focus on interests not positions", "Create options for mutual gain", "Use objective criteria"],
        "sub_skills": ["People vs Problem", "Interests vs Positions", "Options for Mutual Gain", "Objective Criteria"],
        "ai_instructions": """FRAMEWORK: Harvard Principled Negotiation.
- Reveal your true interests only when the user asks probing questions about WHY you want what you want (not WHAT you want).
- If user attacks personally or blames — react defensively, hardening your position.
- If user proposes creative trades (contract length, payment terms, scope, SLA, volume, exclusivity) that expand the pie — respond warmly and consider concessions.
- If user cites objective criteria (market data, benchmarks, industry standards) — treat them seriously.
- Do NOT immediately accept positional demands. Stay firm on positions but be flexible on interests.""",
    },
    "spin": {
        "id": "spin", "name": "SPIN",
        "tagline": "Learn to uncover needs through better questions.",
        "chips": ["Situation", "Problem", "Implication", "Need-Payoff"],
        "objectives": ["Understand current situation", "Identify problems and pain", "Explore consequences", "Articulate value of solution"],
        "sub_skills": ["Situation Questions", "Problem Questions", "Implication Questions", "Need-Payoff Questions"],
        "ai_instructions": """FRAMEWORK: SPIN Selling questioning.
- Only reveal deeper information when the user asks the right TYPE of question:
  * Situation questions (facts about current state) → answer factually, minimal depth
  * Problem questions (about pains, dissatisfactions) → reveal ONE small pain
  * Implication questions (about consequences of the problem) → reveal urgency and cost of inaction
  * Need-Payoff questions (about value of a solution) → become receptive and open to trade
- If user asks only Situation questions repeatedly — become impatient, less cooperative.
- Reward depth over volume of questioning.""",
    },
    "batna": {
        "id": "batna", "name": "BATNA",
        "tagline": "Strengthen your alternatives and negotiation boundaries.",
        "chips": ["Alternatives", "Leverage", "Reservation Point"],
        "objectives": ["Identify alternatives", "Understand leverage", "Define reservation point", "Manage concessions", "Know when to walk"],
        "sub_skills": ["BATNA Clarity", "Leverage", "Reservation Discipline", "Concession Management", "Walk-Away Decision"],
        "ai_instructions": """FRAMEWORK: BATNA (Best Alternative To a Negotiated Agreement).
- You have your own hidden BATNA (specified in your role) — never reveal it.
- Test the user's BATNA by pressuring for concessions and testing walk-away limits.
- If user makes unilateral concessions without trading — become more aggressive, sense weakness.
- If user references their alternatives credibly — soften slightly, respect leverage.
- If user trades concessions (I give X for your Y) — respond in kind.
- Push toward endgame decisions where user must trade, concede, or walk.""",
    },
    "combined": {
        "id": "combined", "name": "Combined",
        "tagline": "Practice all three frameworks in one negotiation.",
        "chips": ["Harvard", "SPIN", "BATNA"],
        "objectives": ["Discover via SPIN", "Create value via Harvard", "Protect value via BATNA"],
        "sub_skills": ["Discovery", "Value Creation", "Leverage Discipline"],
        "ai_instructions": """FRAMEWORK: Combined (SPIN → Harvard → BATNA layered).
- Reveal information ONLY through good SPIN-style questioning (Problem/Implication/Need-Payoff).
- Reward trades and creative options (Harvard).
- Test the user's BATNA and concession discipline.
- Behave like a realistic seasoned negotiator across all three dimensions.""",
    },
}


def classify_spin(text: str) -> str:
    t = text.lower()
    if not "?" in text:
        return "other"
    if any(w in t for w in ["what if", "imagine", "how much would", "if you could", "would it help"]):
        return "need_payoff"
    if any(w in t for w in ["consequence", "impact", "effect", "what happens if", "how does that affect", "cost of"]):
        return "implication"
    if any(w in t for w in ["difficult", "problem", "challenge", "pain", "frustrat", "concern", "issue", "trouble"]):
        return "problem"
    if any(w in t for w in ["current", "how do you", "what do you", "tell me about", "how many", "how often"]):
        return "situation"
    return "other"
