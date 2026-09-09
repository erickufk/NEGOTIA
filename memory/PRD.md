# NEGOTIA — AI Negotiation Simulator (PRD)

## Original Problem Statement
Develop NEGOTIA, an AI Negotiation Simulator (SaaS). Users register, choose a negotiation
scenario, define parameters, prepare, and negotiate with AI participants via text or voice.
UI must follow the "Stitch" design (Warm Silk palette, Inter + JetBrains Mono, Material
Symbols). Features: SSE AI text streaming, RU/EN switcher, Voice Mode (STT/TTS RU), dynamic
coaching hints. User language: Russian (respond in Russian).

## Stack
React (React Router, Tailwind, shadcn) + FastAPI + MongoDB (Motor). Claude Sonnet 5, OpenAI
Whisper STT + OpenAI TTS via Emergent Universal Key. SSE for streaming. Context i18n.

## Implemented
- JWT auth, 12 seeded scenarios, training framework layer (Harvard/SPIN/BATNA), AI autofill.
- Full Stitch neomorphic rewrite of 7 app pages.
- SSE token streaming for AI replies; Voice Mode (Whisper STT + TTS RU); RU/EN i18n.
- **2026-06: Landing page fully rebuilt to match the provided "Stitch" reference HTML**
  (Warm Silk palette via arbitrary hex classes, Inter font, Material Symbols icons,
  waveform CSS). Sections: interactive hero simulation mockup, market-reality problem,
  4-step architecture, multi-party committee showcase, differentiation matrix, frameworks,
  modes, scorecard + AI debrief editorial, replay + scenarios library, profile preview,
  final CTA. Bilingual via inline `t(ru,en)` helper; CTAs wired to auth/dashboard.
  Uses 3 user-supplied photos: executive (42tlayq6), boardroom group (2v4l1j4x),
  1-on-1 debrief (nye6dg94). File: `/app/frontend/src/pages/Landing.jsx`.
  index.css: added Inter @import (cyrillic subset) + `pulse-wave` keyframes.

## Backlog
- P1: Dynamic coaching hints — `POST /api/coach/hint` should pass negotiation history to
  Claude for context-aware tips (currently static). Files: backend/server.py,
  frontend/src/pages/NegotiationRoom.jsx.
- P1: Voice Mode playback safety on unmount (audio.pause cleanup in NegotiationRoom.jsx).
- P2: Custom user-created scenarios saved to DB.
- P3: Split server.py into modular routers.

## Credentials
Demo: demo@negotia.app / Demo1234!
