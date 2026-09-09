# NEGOTIA — Product Requirements

## Vision
NEGOTIA is an AI Negotiation Simulator (SaaS). Users register, choose a business scenario, define preparation, and negotiate with AI opponents via chat, voice, or tactical multi-choice. Every session ends with a Harvard/SPIN/BATNA-informed AI debrief and updates a personal skill radar.

## Tech Stack
- **Frontend**: React 19 SPA, React Router, Tailwind CSS, Shadcn UI, Recharts
- **Backend**: FastAPI + Motor (Mongo async)
- **DB**: MongoDB (users, scenarios, negotiations, user_skills)
- **AI**: Claude Sonnet 5 (text) + OpenAI Whisper (STT) + OpenAI TTS — all via Emergent Universal Key
- **Auth**: JWT email/password (bcrypt hashed)

## Design System (Stitch neomorphic light)
- Background `#FAF9F6`, text `#1E293B`
- Primary indigo `#4F46E5` / hover `#4338CA`
- Fonts: `Plus Jakarta Sans` (display/body) + `JetBrains Mono` (labels/metrics)
- Custom CSS classes in `/app/frontend/src/index.css`: `.neo-raised`, `.neo-raised-sm`, `.neo-raised-hover`, `.neo-inset`, `.neo-inset-deep`, `.btn-primary`, `.chip-*`, `.typing-caret`, `.pulse-dot`

## Implemented (2026-02)
- ✅ JWT auth (register/login/me), demo user seeded (`demo@negotia.app` / `Demo1234!`)
- ✅ 12 seeded scenarios (career, sales, procurement, management, partnership, conflict)
- ✅ Frameworks: Harvard, SPIN, BATNA, Combined (chosen in wizard step 2)
- ✅ 7-step Simulation Wizard with AI autofill for preparation
- ✅ Chat / Voice / Challenge modes
- ✅ AI-driven signal detection (empathy, pressure, anchoring, open questions, trades, objective_criteria, personal_attack) + SPIN classifier
- ✅ Live trust/pressure per participant, live-signals side panel
- ✅ Debrief: overall score, skill radar, framework breakdown, did well / improve, critical moment, better alternative
- ✅ Profile: KPI grid, radar, strengths/weaknesses, framework performance, recommended training
- ✅ History list with outcome/framework/mode chips
- ✅ Landing page (Stitch UI) — cream + indigo, hero + 4 steps + video + differentiation + frameworks + modes + debrief preview + scenarios grid + final CTA
- ✅ **Server-Sent Events streaming** on `POST /api/negotiations/{id}/message-stream` — token-by-token typing effect (user → ai_start → ai_chunk × N → ai_end → done)
- ✅ **Voice Mode**: `POST /api/voice/transcribe` (Whisper-1) + `POST /api/voice/tts` (tts-1, nova voice, Russian & English)
- ✅ **RU/EN language switcher** in the AppShell header (persisted in localStorage)
- ✅ **All 6 app pages rewritten** to neomorphic Stitch design while preserving APIs, data-testids, and i18n hooks

## Architecture

```
/app/
├── backend/
│   ├── server.py              # FastAPI (auth, scenarios, negotiations + SSE, voice, coach, stats)
│   ├── frameworks.py          # Harvard/SPIN/BATNA logic + SPIN classifier
│   ├── scenarios_seed.py      # 12 seed scenarios
│   └── tests/test_negotia_api.py  # 18 pytest cases (all green)
├── frontend/
│   ├── src/
│   │   ├── components/AppShell.jsx     # Neomorphic sticky header + RU/EN switcher
│   │   ├── pages/                       # Landing/Auth/Dashboard/Scenarios/SimulationWizard/NegotiationRoom/Debrief/Profile/History
│   │   ├── auth/AuthProvider.jsx       # Eager axios auth header (fixes 401 race on hard reload)
│   │   ├── i18n/                       # translations.js (en, ru)
│   │   ├── lib/api.js                  # api client incl. transcribe/tts helpers
│   │   └── index.css                   # Neomorphic tokens + typography
└── memory/
    ├── PRD.md, test_credentials.md
```

## Key APIs
- `POST /api/auth/{register,login}` · `GET /api/auth/me`
- `GET /api/scenarios` · `GET /api/scenarios/{slug}`
- `GET /api/frameworks`
- `POST /api/prep/analyze`
- `POST /api/negotiations` · `GET /api/negotiations` · `GET /api/negotiations/{id}`
- `POST /api/negotiations/{id}/message` (legacy JSON)
- `POST /api/negotiations/{id}/message-stream` (SSE — token streaming)
- `POST /api/negotiations/{id}/end`
- `POST /api/voice/transcribe` (multipart: `file`, `language`)
- `POST /api/voice/tts` (json: `text`, `language`, `voice`) — returns `audio/mpeg`
- `POST /api/coach/hint`
- `GET /api/users/me/{stats,recommended,framework-stats}`

## Test Coverage
- Backend pytest suite: 18/18 pass — `/app/backend/tests/test_negotia_api.py`
- Frontend smoke via Playwright: all pages render, SSE streaming caret confirmed, EN/RU switcher confirmed
- Iterations: `/app/test_reports/iteration_2.json`

## Roadmap (P0 → P3)
- **P0 — DONE**: Stitch UI applied everywhere, SSE token streaming, Voice Mode STT/TTS, RU/EN switcher
- **P1**: Realtime Claude token streaming (currently server chunks post-completion; could stream via Anthropic SSE inside emergentintegrations if supported)
- **P1**: Replace static coach hint with live personalized Claude inference
- **P2**: Backend split into `routes/` package (server.py is now ~883 lines)
- **P2**: Response envelope normalization (`{scenario}`, `{scenarios}`, `{negotiation}` today are inconsistent)
- **P2**: Voice waveform / audio playback UI polish (queue, mute per-message)
- **P3**: Session replay + comparison across attempts of the same scenario
- **P3**: Multiplayer mode (2 real users vs AI)
- **P3**: Custom scenario builder in-app
