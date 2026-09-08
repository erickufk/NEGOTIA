# NEGOTIA — Product Requirements Document

## Original Problem
AI Negotiation Simulator: interactive web app where users choose scenario → prepare → negotiate with AI (Chat/Voice/Challenge, 1-4 opponents) → get debrief with score, skill breakdown, critical moments. Landing → Auth → Dashboard → Wizard → Room → Debrief → History → Replay.

## Users
- Career professionals practicing salary/promotion talks
- Sales & procurement teams
- Managers handling conflicts, deadlines, partnerships

## Core Requirements (static)
- Full E2E flow with real DB persistence
- Data-driven scenarios (12 seeded)
- AI hidden interests, BATNA, reservation points (server-only)
- Score + skill radar + AI feedback
- i18n (EN / RU)

## Architecture
- Backend: FastAPI + MongoDB. JWT auth. Claude Sonnet 5 via emergentintegrations.
- Frontend: React 19 + Tailwind + Radix UI + Recharts.
- All secrets in .env. EMERGENT_LLM_KEY for AI calls.

## Implemented (2026-02-08)
- Auth: register, login, JWT protected routes, demo user seed
- 12 scenarios seeded on startup (Career, Sales, Procurement, Management, Partnership, Conflict)
- Negotiation Engine: state (trust/pressure/signals), AI turn, per-participant response, message analyzer heuristics
- 3 modes: Chat (working), Challenge (AI-generated 4-option cards), Voice (browser Web Speech API STT + SpeechSynthesis TTS)
- Debrief: score calc from signals, 8-skill breakdown, AI feedback (did_well/improve/critical/better_alternative)
- Dashboard with KPIs, radar chart, recent, recommended
- Scenario Library with category + difficulty filters
- 6-step Simulation Wizard
- Negotiation Room with participants HUD, trust/pressure meters, make deal / walk away / end
- History list, Debrief page with skill radar
- Profile with strengths/weaknesses + recommended
- Hidden fields (hidden_interests, batna, reservation_point) never sent to client
- i18n (EN/RU) with lang switcher in header

## Backlog (P1)
- OpenAI Whisper server-side voice (currently browser Web Speech API)
- Additional languages (ES, DE) — dictionary structure ready
- Password reset flow
- Admin panel for scenario editing
- Streaming AI responses (SSE) for real-time typing effect

## Backlog (P2)
- More scenarios (target 30+)
- Coalition / multiplayer scenarios
- Emotion detection via voice tone
