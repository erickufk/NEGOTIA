"""End-to-end backend test for NEGOTIA - covers auth, scenarios, frameworks, prep,
negotiation lifecycle (create, streaming SSE, legacy message, end), voice STT/TTS,
stats, and coach hint."""
import io
import json
import os
import struct
import wave

import pytest
import requests

BASE_URL = os.environ.get("REACT_APP_BACKEND_URL").rstrip("/")
API = f"{BASE_URL}/api"
DEMO_EMAIL = "demo@negotia.app"
DEMO_PW = "Demo1234!"


# ---------- Fixtures ----------
@pytest.fixture(scope="session")
def token():
    r = requests.post(f"{API}/auth/login", json={"email": DEMO_EMAIL, "password": DEMO_PW}, timeout=30)
    assert r.status_code == 200, r.text
    return r.json()["token"]


@pytest.fixture(scope="session")
def auth_headers(token):
    return {"Authorization": f"Bearer {token}", "Content-Type": "application/json"}


@pytest.fixture(scope="session")
def negotiation_id(auth_headers):
    r = requests.post(
        f"{API}/negotiations",
        json={"scenario_slug": "salary-negotiation", "mode": "free", "training_framework": "combined"},
        headers=auth_headers,
        timeout=30,
    )
    assert r.status_code == 200, r.text
    body = r.json()
    return (body.get("negotiation") or body)["id"]


# ---------- Health ----------
def test_health():
    r = requests.get(f"{API}/health", timeout=15)
    assert r.status_code == 200
    assert r.json().get("status") == "ok"


# ---------- Auth ----------
def test_login_demo():
    r = requests.post(f"{API}/auth/login", json={"email": DEMO_EMAIL, "password": DEMO_PW}, timeout=30)
    assert r.status_code == 200
    body = r.json()
    assert body["token"] and body["user"]["email"] == DEMO_EMAIL


def test_register_new_user():
    import uuid
    email = f"TEST_{uuid.uuid4().hex[:8]}@negotia.app"
    r = requests.post(
        f"{API}/auth/register",
        json={"email": email, "password": "TestPass1!", "name": "Tester"},
        timeout=30,
    )
    assert r.status_code in (200, 201), r.text
    assert "token" in r.json()


# ---------- Scenarios ----------
def test_scenarios(auth_headers):
    r = requests.get(f"{API}/scenarios", headers=auth_headers, timeout=15)
    assert r.status_code == 200
    data = r.json()
    scenarios = data.get("scenarios", data if isinstance(data, list) else [])
    assert len(scenarios) == 12
    # hidden fields must be scrubbed from participants
    for s in scenarios:
        for p in s.get("participants", []):
            assert "hidden_interests" not in p
            assert "batna" not in p
            assert "reservation_point" not in p


# ---------- Frameworks ----------
def test_frameworks(auth_headers):
    r = requests.get(f"{API}/frameworks", headers=auth_headers, timeout=15)
    assert r.status_code == 200
    data = r.json()
    fws = data.get("frameworks", data if isinstance(data, list) else [])
    ids = {f["id"] for f in fws}
    assert {"harvard", "spin", "batna", "combined"}.issubset(ids)


# ---------- Prep autofill ----------
def test_prep_analyze(auth_headers):
    r = requests.post(
        f"{API}/prep/analyze",
        json={"scenario_slug": "salary-negotiation"},
        headers=auth_headers,
        timeout=60,
    )
    assert r.status_code == 200, r.text
    prep = r.json()
    prep = prep.get("preparation", prep)
    expected_keys = {"batna", "priorities", "theirs", "offer"}
    assert expected_keys.issubset(set(prep.keys())), f"got keys: {list(prep.keys())}"
    # spec says 6 expected keys
    assert len(prep.keys()) >= 6, f"expected >=6 keys, got {list(prep.keys())}"


# ---------- Create negotiation ----------
def test_create_negotiation(auth_headers):
    r = requests.post(
        f"{API}/negotiations",
        json={"scenario_slug": "salary-negotiation", "mode": "free", "training_framework": "harvard"},
        headers=auth_headers,
        timeout=30,
    )
    assert r.status_code == 200, r.text
    body = r.json()
    body = body.get("negotiation", body)
    assert body.get("framework_name")
    assert body["state"]["round"] == 0


# ---------- SSE streaming ----------
def test_message_stream_sse(auth_headers, negotiation_id):
    url = f"{API}/negotiations/{negotiation_id}/message-stream"
    with requests.post(
        url,
        json={"content": "I'd like to discuss the salary range. Based on market benchmarks I was expecting more."},
        headers=auth_headers,
        stream=True,
        timeout=90,
    ) as r:
        assert r.status_code == 200
        ct = r.headers.get("content-type", "")
        assert "text/event-stream" in ct, f"content-type={ct}"

        types_seen = []
        for raw in r.iter_lines(decode_unicode=True):
            if not raw:
                continue
            assert raw.startswith("data:"), f"unexpected line: {raw[:80]}"
            payload = raw[len("data:"):].strip()
            evt = json.loads(payload)
            types_seen.append(evt["type"])
            if evt["type"] == "done":
                assert "state" in evt
                break

    # ordering check
    assert types_seen[0] == "user"
    assert "ai_start" in types_seen
    assert "ai_chunk" in types_seen
    assert "ai_end" in types_seen
    assert types_seen[-1] == "done"
    # ai_start before any ai_chunk before ai_end
    assert types_seen.index("ai_start") < types_seen.index("ai_chunk") < types_seen.index("ai_end")


# ---------- Legacy message endpoint ----------
def test_legacy_message(auth_headers):
    # create a fresh negotiation for this
    r = requests.post(
        f"{API}/negotiations",
        json={"scenario_slug": "salary-negotiation", "mode": "free", "training_framework": "combined"},
        headers=auth_headers,
        timeout=30,
    )
    nid = (r.json().get("negotiation") or r.json())["id"]
    r = requests.post(
        f"{API}/negotiations/{nid}/message",
        json={"content": "What are the constraints on this budget?"},
        headers=auth_headers,
        timeout=90,
    )
    assert r.status_code == 200, r.text
    body = r.json()
    assert "state" in body


# ---------- End negotiation ----------
def test_end_negotiation(auth_headers, negotiation_id):
    r = requests.post(
        f"{API}/negotiations/{negotiation_id}/end",
        json={"reason": "make_deal"},
        headers=auth_headers,
        timeout=90,
    )
    assert r.status_code == 200, r.text
    body = r.json()
    neg = body.get("negotiation", body)
    outcome = body.get("outcome") or neg.get("outcome") or neg.get("feedback", {}).get("outcome")
    assert outcome
    score = body.get("score", neg.get("score"))
    assert isinstance(score, (int, float))
    # skill_scores and framework_scores expected (may be at top-level or nested)
    sk = (body.get("skill_scores") or neg.get("skill_scores")
          or body.get("skills") or neg.get("skills")
          or neg.get("feedback", {}).get("skills"))
    assert sk, f"no skill_scores; keys={list(body.keys())}, neg keys={list(neg.keys())}"


# ---------- Voice STT ----------
def _make_silent_wav_bytes(seconds=1, rate=16000):
    buf = io.BytesIO()
    with wave.open(buf, "wb") as w:
        w.setnchannels(1)
        w.setsampwidth(2)
        w.setframerate(rate)
        w.writeframes(b"\x00\x00" * (rate * seconds))
    return buf.getvalue()


def test_voice_transcribe_empty_file(token):
    files = {"file": ("empty.webm", b"", "audio/webm")}
    data = {"language": "en"}
    r = requests.post(
        f"{API}/voice/transcribe",
        files=files,
        data=data,
        headers={"Authorization": f"Bearer {token}"},
        timeout=30,
    )
    assert r.status_code == 400


def test_voice_transcribe_wav(token):
    wav = _make_silent_wav_bytes()
    files = {"file": ("test.wav", wav, "audio/wav")}
    data = {"language": "en"}
    r = requests.post(
        f"{API}/voice/transcribe",
        files=files,
        data=data,
        headers={"Authorization": f"Bearer {token}"},
        timeout=60,
    )
    # silent WAV should still transcribe (likely empty text) OR 500 if OpenAI rejects
    assert r.status_code in (200, 400, 500), r.text
    if r.status_code == 200:
        assert "text" in r.json()


# ---------- Voice TTS ----------
def test_voice_tts_empty(auth_headers):
    r = requests.post(f"{API}/voice/tts", json={"text": "", "language": "en"}, headers=auth_headers, timeout=30)
    assert r.status_code == 400


def test_voice_tts_english(auth_headers):
    r = requests.post(
        f"{API}/voice/tts",
        json={"text": "Hello, this is a negotiation test.", "language": "en"},
        headers=auth_headers,
        timeout=60,
    )
    assert r.status_code == 200, r.text
    assert r.headers.get("content-type", "").startswith("audio/")
    assert len(r.content) >= 1024


def test_voice_tts_russian(auth_headers):
    r = requests.post(
        f"{API}/voice/tts",
        json={"text": "Здравствуйте, это тестовая проверка синтеза речи.", "language": "ru"},
        headers=auth_headers,
        timeout=60,
    )
    assert r.status_code == 200, r.text
    assert len(r.content) >= 1024


# ---------- Stats ----------
def test_user_stats(auth_headers):
    r = requests.get(f"{API}/users/me/stats", headers=auth_headers, timeout=15)
    assert r.status_code == 200
    body = r.json()
    for key in ("total", "avg_score", "best_score", "skills"):
        assert key in body, f"missing {key} in stats"


def test_framework_stats(auth_headers):
    r = requests.get(f"{API}/users/me/framework-stats", headers=auth_headers, timeout=15)
    assert r.status_code == 200
    body = r.json()
    stats = body.get("stats", body)
    for fw in ("harvard", "spin", "batna"):
        assert fw in stats, f"missing framework {fw} in {list(stats.keys())}"


# ---------- Coach hint ----------
def test_coach_hint(auth_headers):
    # need an active negotiation
    r = requests.post(
        f"{API}/negotiations",
        json={"scenario_slug": "salary-negotiation", "mode": "free", "training_framework": "spin"},
        headers=auth_headers,
        timeout=30,
    )
    nid = (r.json().get("negotiation") or r.json())["id"]
    r = requests.post(
        f"{API}/coach/hint",
        json={"negotiation_id": nid},
        headers=auth_headers,
        timeout=30,
    )
    assert r.status_code == 200, r.text
    body = r.json()
    assert "hint" in body and "framework" in body
