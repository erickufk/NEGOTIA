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

## Backlog
- P1: Dynamic coaching hints — pass negotiation history to Claude for context-aware tips
  (`POST /api/coach/hint` currently rule-based).
- P2: Custom user-created scenarios saved to DB (would also need RU/EN authoring).
- P3: Split server.py (~950 lines) into modular routers (auth/scenarios/negotiations/voice/coach).
- Nit: TTS request sends `voice: null` when only gender chosen (harmless).

## Credentials
Demo: demo@negotia.app / Demo1234!
