# NEGOTIA — AI Negotiation Simulator (PRD)

## Original Problem Statement
Develop NEGOTIA, an AI Negotiation Simulator (SaaS). Users register, choose a negotiation
scenario, define parameters, prepare, and negotiate with AI participants via text or voice.
UI follows the "Stitch" design. Features: SSE AI text streaming, RU/EN switcher, Voice Mode
(STT/TTS), dynamic coaching hints. User language: Russian — RUSSIAN IS THE PRIMARY LOCALE
(UI now defaults to Russian). Respond to the user in Russian.

## Stack
React (React Router, Tailwind, shadcn) + FastAPI + MongoDB (Motor). Claude Sonnet 5 text,
OpenAI Whisper STT + OpenAI TTS via Emergent Universal Key. SSE streaming. Context i18n.

## Implemented
- JWT auth, 12 seeded scenarios, framework layer (Harvard/SPIN/BATNA), AI prep autofill.
- Full Stitch neomorphic UI (7 app pages) + rebuilt marketing Landing page.
- SSE token streaming; Voice Mode; RU/EN i18n.
- **2026-06 — Full Russian localization + voice fixes (verified, iteration_3):**
  - Scenarios localized to RU at API layer (`?lang=` -> SCENARIO_RU / ROLE_RU in
    scenarios_seed.py). Participant `gender` exposed for voice.
  - AI generation FORCED to the negotiation's language via `_build_system_prompt`
    (stored `language` on negotiation at creation). Choices, debrief feedback, and
    prep-autofill also generate in the chosen language.
  - Frontend i18n `labels` block (skills, categories, difficulty, outcome, signals,
    frameworkSub) applied across Dashboard/Scenarios/Wizard/Room/Debrief/History/Profile;
    removed hardcoded English strings. UI default language = Russian.
  - Voice input fixed: MediaRecorder mimeType detection, empty-recording guard, and
    AUTO-SEND of transcription in voice mode. Unmount cleanup stops audio + recorder.
  - TTS voice matches opponent gender: `/voice/tts` accepts `gender`
    (male=onyx, female=shimmer); frontend passes opponent gender per AI message.
  - Live signals now sort by value (surface active ones) with localized labels.
  - Verified via curl (RU gen, gender TTS distinct audio, STT round-trip) and testing_agent
    (26/26 backend tests, all frontend flows PASS). Tests: /app/backend/tests/.
- **2026-06 — Russian names + push-to-talk + dynamic coaching (verified, iteration_4):**
  - Russian opponent NAMES (NAME_RU in scenarios_seed.py). Negotiation snapshot stores
    localized name/role + `src_name` (maps back to scenario via `_resolve_parts`) + `gender`;
    state trust/pressure keyed by localized name -> bars update correctly, AI labels & prompt
    use the Russian name. Backward-compatible with old English negotiations.
  - Push-to-talk voice: mic button is HOLD-to-record (pointerdown start / pointerup stop, with
    setPointerCapture); voice mode auto-sends transcription. Placeholder shows 'Слушаю...'.
  - Dynamic coaching: `POST /api/coach/hint` now calls Claude with the live transcript +
    framework and returns a contextual tip in the negotiation's language (rule-based
    `_rule_hint` fallback). Coaching toggle fires an immediate hint (ref-based, no first-msg gap).
  - Verified by testing_agent iteration_4 (3/3 frontend features PASS).
- **2026-06 — Full RU localization completion:** framework name/tagline/chips localized on
  frontend (labels.frameworks); scenario `context` + `success_conditions` localized on backend
  (SCENARIO_RU_CTX, applied in _scrub_scenario for lang=ru); wizard summary + dashboard/history
  badges use localized framework name + short mode labels (labels.modes); Debrief framework
  titles localized; UI default lang = Russian. Verified via screenshots (Методология & Ваша цель
  steps clean) + curl. Remaining intentional English: BATNA/SPIN/SLA terms + brand tagline.

## Backlog
- P2: Custom user-created scenarios saved to DB (would also need RU/EN authoring).

## Learning Materials (2026-06)
- Static bilingual `/learn` page (nav "Обучение"/"Learn"): Harvard, SPIN, BATNA —
  essence, key concepts, scoring rules, tip. Content in `frontend/src/i18n/learnContent.js`,
  page `frontend/src/pages/Learn.jsx`. Zero LLM cost (fully static). Verified via screenshot (RU).
- P3: Split server.py (~950 lines) into modular routers (auth/scenarios/negotiations/voice/coach).
- Nit: TTS request sends `voice: null` when only gender chosen (harmless).

## 2026-07 — GPT-5.6 Luna + Magic Link + UX polish (verified, iteration_5)
- **ChatGPT (GPT-5.6 Luna)** as alternative AI provider via Universal Key. `MODEL_MAP` +
  `resolve_model()` route `ai_model` field ("claude" | "gpt") into `LlmChat.with_model()`.
  Selector on Wizard Ready step (`w-ai-claude` / `w-ai-gpt`) + Profile AI-настройки card
  (persists to localStorage `negotia_ai_model`). Stored per-negotiation → propagates through
  streaming replies, choices, coach hint, prep autofill, debrief feedback.
- **Magic Link password reset**: `POST /api/auth/forgot-password` generates one-time token
  (secrets.token_urlsafe, 1h TTL via MongoDB `password_reset_tokens` expireAfterSeconds index),
  returns `magic_link` URL (demo mode — no SMTP). `POST /api/auth/reset-password` verifies
  token + updates bcrypt hash + issues JWT. `POST /api/auth/magic-login` for sign-in-only.
  Auth page has "Забыли пароль?" mode with in-app link display; new `/reset-password` page.
- **UX polish**: prep textareas rows=5 (min-h-[120px]), msg-input rows=4 (min-h-[100px]),
  NegotiationRoom right aside no longer `hidden lg:block` → mobile users see preparation +
  live-signals stacked below conversation. Favicon SVG (gradient N monogram) + updated
  document title.
- **Token optimization**: history replay 10→6 turns in `_ai_respond`, transcript slice
  3000→2000 chars in debrief. Coach transcript 8→6 msgs.

## 2026-07 — Custom Scenario Builder (verified, iteration_6)
- New endpoints `POST /api/scenarios/custom` and `DELETE /api/scenarios/custom/{slug}`.
  Custom scenarios stored in `scenarios` collection with `custom:true`, `owner_id=user.id`
  and a `translations.ru` block containing title/description/objective/context/success + per-
  participant name/role. `list_scenarios` filters `owner_id ∈ {null, user.id}`. `_scrub_scenario`
  picks translations.ru for custom docs (built-ins keep SCENARIO_RU/SCENARIO_RU_CTX path).
  Participant `gender` stored on the participant (falls back to `GENDERS` lookup for built-ins).
- New page `/scenarios/new` (CustomScenarioBuilder.jsx): 3 sections (Основное, Детали, Оппонент),
  bilingual RU/EN inputs for title/description/objective/context/success_conditions and
  opponent name/role, single-lang inputs for opponent internals (description/goals/interests/
  hidden/constraints/BATNA/personality), and gender toggle (female/male) that drives TTS voice.
  Save → `/simulate?scenario=<slug>` with the scenario pre-selected in wizard Step 2.
- `/scenarios` page: `+ Создать сценарий` button, dedicated "Ваши сценарии" section above the
  built-in library with per-card delete button (confirm-dialog protected).
- Files: `server.py` (models CustomOpponent/CustomScenarioIn + endpoints + _scrub_scenario/
  create_negotiation updates), `CustomScenarioBuilder.jsx` (new), rewritten `Scenarios.jsx`,
  `App.js` (route), `lib/api.js`, `translations.js` (t.custom.*).
- Verified iteration_6: 12/12 PASS (7/7 backend + 12/12 frontend E2E). Test file added at
  `/app/backend/tests/test_custom_scenarios.py`.

## Backlog
- P2: Multi-opponent custom scenarios (currently single opponent).
- P2: Server-side Pydantic min_length constraints on required *_en fields (frontend-only now).
- P3: Split server.py (>1000 lines) into modular routers (auth/scenarios/negotiations/voice/coach).
- P4: Session share-card (view+download debrief summary).
- Files: `server.py` (auth+magic, MODEL_MAP), `Auth.jsx`, `ResetPassword.jsx` (new),
  `SimulationWizard.jsx`, `NegotiationRoom.jsx`, `Profile.jsx`, `translations.js`,
  `lib/api.js`, `AuthProvider.jsx` (setSession), `App.js` (route), `favicon.svg` (new),
  `public/index.html`. Verified iteration_5: 9/9 PASS.

## Credentials
Demo: demo@negotia.app / Demo1234!
