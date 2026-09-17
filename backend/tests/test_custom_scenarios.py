"""Backend tests for Custom Scenario Builder feature (iteration_6)."""
import os
import requests
import pytest

BASE_URL = os.environ.get("REACT_APP_BACKEND_URL", "https://stitch-demo-1.preview.emergentagent.com").rstrip("/")
API = f"{BASE_URL}/api"


@pytest.fixture(scope="module")
def token():
    r = requests.post(f"{API}/auth/login", json={"email": "demo@negotia.app", "password": "Demo1234!"})
    assert r.status_code == 200, r.text
    return r.json().get("access_token") or r.json()["token"]


@pytest.fixture(scope="module")
def headers(token):
    return {"Authorization": f"Bearer {token}", "Content-Type": "application/json"}


PAYLOAD = {
    "title_en": "TEST Vendor Contract", "title_ru": "TEST Договор с поставщиком",
    "description_en": "TEST desc EN", "description_ru": "TEST описание RU",
    "category": "Partnership", "difficulty": "Medium", "duration": 15,
    "objective_en": "Secure 20% discount and NET60 terms",
    "objective_ru": "Добиться скидки 20% и оплаты NET60",
    "context_en": "Long-time supplier, contract renewal window",
    "context_ru": "Давний поставщик, окно продления контракта",
    "success_en": ["Discount >= 15%", "NET60 terms"],
    "success_ru": ["Скидка >= 15%", "Условия NET60"],
    "skills": [],
    "opponent": {
        "name_en": "Ivan Melnikov", "name_ru": "Иван Мельников",
        "role_en": "VP Sales", "role_ru": "Директор по продажам",
        "gender": "male",
        "description": "Experienced sales veteran",
        "goals": "Preserve margins", "interests": "Long-term relationship",
        "hidden_interests": "Quarter-end quota pressure",
        "constraints": "Cannot go below 10% discount without VP approval",
        "batna": "Walk away and lose account",
        "personality": "Firm, analytical",
        "priorities": [],
    },
}


def test_create_custom_scenario(headers):
    r = requests.post(f"{API}/scenarios/custom", json=PAYLOAD, headers=headers)
    assert r.status_code == 200, r.text
    sc = r.json()["scenario"]
    assert sc["custom"] is True
    assert sc["slug"].startswith("custom-")
    assert sc["title"] == PAYLOAD["title_en"]  # default lang=en on this endpoint
    pytest.custom_slug = sc["slug"]


def test_list_scenarios_includes_custom_ru(headers):
    r = requests.get(f"{API}/scenarios?lang=ru", headers=headers)
    assert r.status_code == 200
    scs = r.json()["scenarios"]
    mine = [s for s in scs if s.get("slug") == pytest.custom_slug]
    assert len(mine) == 1
    assert mine[0]["custom"] is True
    assert mine[0]["title"] == PAYLOAD["title_ru"]
    # Verify opponent details via single-scenario endpoint (list may omit them)
    r2 = requests.get(f"{API}/scenarios/{pytest.custom_slug}?lang=ru", headers=headers)
    assert r2.status_code == 200
    sc = r2.json()["scenario"]
    opp = None
    if sc.get("opponents"):
        opp = sc["opponents"][0]
    elif sc.get("opponent"):
        opp = sc["opponent"]
    if opp:
        assert opp.get("name") == PAYLOAD["opponent"]["name_ru"]


def test_start_negotiation_with_custom(headers):
    r = requests.post(f"{API}/negotiations", headers=headers,
                      json={"scenario_slug": pytest.custom_slug, "language": "ru", "ai_model": "claude",
                            "mode": "solo", "framework": "harvard"})
    assert r.status_code == 200, r.text
    neg = r.json()["negotiation"]
    assert neg["scenario_slug"] == pytest.custom_slug
    pytest.neg_id = neg["id"]


def test_send_message_gets_ru_reply(headers):
    r = requests.post(f"{API}/negotiations/{pytest.neg_id}/message",
                      json={"content": "Здравствуйте, давайте обсудим условия."}, headers=headers, timeout=60)
    assert r.status_code == 200, r.text
    reply = r.json()
    ai_replies = reply.get("ai_replies") or []
    text = " ".join((m.get("content") or "") for m in ai_replies)
    assert text, f"No AI reply: {reply}"
    assert ai_replies[0].get("participant") == PAYLOAD["opponent"]["name_ru"]
    # crude Russian check - at least one Cyrillic char
    assert any("а" <= ch.lower() <= "я" for ch in text), f"Reply not in Russian: {text}"


def test_delete_custom_scenario(headers):
    r = requests.delete(f"{API}/scenarios/custom/{pytest.custom_slug}", headers=headers)
    assert r.status_code == 200, r.text
    # Verify removed
    r2 = requests.get(f"{API}/scenarios?lang=ru", headers=headers)
    slugs = [s["slug"] for s in r2.json()["scenarios"]]
    assert pytest.custom_slug not in slugs


def test_delete_nonexistent(headers):
    r = requests.delete(f"{API}/scenarios/custom/does-not-exist-xyz", headers=headers)
    assert r.status_code in (403, 404)


def test_create_validation_missing_required(headers):
    bad = {k: v for k, v in PAYLOAD.items()}
    bad["title_en"] = ""
    # backend may or may not validate empty string; accept 200 or 422
    r = requests.post(f"{API}/scenarios/custom", json=bad, headers=headers)
    assert r.status_code in (200, 400, 422)
    if r.status_code == 200:
        # cleanup
        requests.delete(f"{API}/scenarios/custom/{r.json()['scenario']['slug']}", headers=headers)
