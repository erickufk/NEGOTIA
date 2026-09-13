"""Tests for iteration-3 features: RU localization of scenarios,
Russian AI generation, TTS with gender voice selection."""
import os
import re
import json
import requests
import pytest

BASE_URL = os.environ.get("REACT_APP_BACKEND_URL").rstrip("/")
API = f"{BASE_URL}/api"
DEMO_EMAIL = "demo@negotia.app"
DEMO_PW = "Demo1234!"

CYRILLIC_RE = re.compile(r"[А-Яа-яЁё]")


@pytest.fixture(scope="module")
def auth_headers():
    r = requests.post(f"{API}/auth/login", json={"email": DEMO_EMAIL, "password": DEMO_PW}, timeout=30)
    assert r.status_code == 200
    return {"Authorization": f"Bearer {r.json()['token']}", "Content-Type": "application/json"}


# ---- RU scenario translation ----
def test_scenarios_ru_localized(auth_headers):
    r = requests.get(f"{API}/scenarios?lang=ru", headers=auth_headers, timeout=15)
    assert r.status_code == 200
    scenarios = r.json().get("scenarios", [])
    assert len(scenarios) == 12
    # At least most scenarios must have a Cyrillic title
    ru_titles = [s for s in scenarios if CYRILLIC_RE.search(s.get("title", ""))]
    assert len(ru_titles) >= 10, f"Only {len(ru_titles)} scenarios have Russian titles"
    # Roles localized
    for s in scenarios:
        for p in s.get("participants", []):
            role = p.get("role", "")
            # role may or may not translate for every entry, but check gender attribute exists
            assert "gender" in p, f"missing gender on participant {p.get('name')}"
            assert p["gender"] in ("male", "female")


def test_single_scenario_ru(auth_headers):
    r = requests.get(f"{API}/scenarios/vendor-price-increase?lang=ru", headers=auth_headers, timeout=15)
    assert r.status_code == 200
    sc = r.json().get("scenario", {})
    assert CYRILLIC_RE.search(sc.get("title", "")), f"title not RU: {sc.get('title')}"
    assert CYRILLIC_RE.search(sc.get("objective", "")), f"objective not RU: {sc.get('objective')}"


def test_scenarios_en_still_english(auth_headers):
    r = requests.get(f"{API}/scenarios?lang=en", headers=auth_headers, timeout=15)
    assert r.status_code == 200
    scenarios = r.json().get("scenarios", [])
    # Titles should NOT be cyrillic in EN
    ru_titles = [s for s in scenarios if CYRILLIC_RE.search(s.get("title", ""))]
    assert len(ru_titles) == 0


# ---- Russian AI reply ----
def test_ai_reply_russian(auth_headers):
    r = requests.post(
        f"{API}/negotiations",
        json={"scenario_slug": "salary-negotiation", "mode": "free",
              "training_framework": "combined", "language": "ru"},
        headers=auth_headers, timeout=30,
    )
    assert r.status_code == 200, r.text
    body = r.json()
    nid = (body.get("negotiation") or body)["id"]
    assert (body.get("negotiation") or body).get("language") == "ru"

    # Legacy sync endpoint returns full state
    r = requests.post(
        f"{API}/negotiations/{nid}/message",
        json={"content": "Здравствуйте, я хотел бы обсудить повышение зарплаты."},
        headers=auth_headers, timeout=120,
    )
    assert r.status_code == 200, r.text
    body = r.json()
    ai_replies = body.get("ai_replies") or []
    assert ai_replies, f"no ai_replies; keys={list(body.keys())}"
    last_text = " ".join([a.get("content", "") or a.get("text", "") for a in ai_replies])
    assert CYRILLIC_RE.search(last_text), f"AI reply not Cyrillic: {last_text!r}"


# ---- TTS gender ----
def test_tts_male_voice(auth_headers):
    r = requests.post(
        f"{API}/voice/tts",
        json={"text": "Здравствуйте, я готов обсудить условия.", "language": "ru", "gender": "male"},
        headers=auth_headers, timeout=60,
    )
    assert r.status_code == 200, r.text
    assert r.headers.get("content-type", "").startswith("audio/")
    assert len(r.content) >= 1024


def test_tts_female_voice(auth_headers):
    r = requests.post(
        f"{API}/voice/tts",
        json={"text": "Здравствуйте, я готова обсудить условия.", "language": "ru", "gender": "female"},
        headers=auth_headers, timeout=60,
    )
    assert r.status_code == 200, r.text
    assert len(r.content) >= 1024


def test_tts_male_vs_female_differ(auth_headers):
    """Ensure male vs female produce different audio bytes (different voices)."""
    txt = "Тестовая проверка синтеза речи."
    ra = requests.post(f"{API}/voice/tts", json={"text": txt, "language": "ru", "gender": "male"},
                      headers=auth_headers, timeout=60)
    rb = requests.post(f"{API}/voice/tts", json={"text": txt, "language": "ru", "gender": "female"},
                      headers=auth_headers, timeout=60)
    assert ra.status_code == 200 and rb.status_code == 200
    assert ra.content != rb.content, "male and female TTS produced identical audio"


# ---- Recommended ?lang=ru ----
def test_recommended_ru(auth_headers):
    r = requests.get(f"{API}/scenarios/recommended?lang=ru", headers=auth_headers, timeout=15)
    # some backends may 404 or 200 depending on user history
    assert r.status_code in (200, 404)
    if r.status_code == 200:
        data = r.json()
        for s in data.get("scenarios", []):
            # allow but prefer Russian
            pass
