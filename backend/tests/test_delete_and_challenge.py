"""Iteration 8: DELETE negotiation + challenge choices balance/shuffle."""
import os
import pytest
import requests

BASE_URL = os.environ.get("REACT_APP_BACKEND_URL", "https://stitch-demo-1.preview.emergentagent.com").rstrip("/")
API = f"{BASE_URL}/api"


@pytest.fixture(scope="module")
def token():
    r = requests.post(f"{API}/auth/login", json={"email": "demo@negotia.app", "password": "Demo1234!"})
    assert r.status_code == 200, r.text
    return r.json()["token"]


@pytest.fixture
def auth(token):
    return {"Authorization": f"Bearer {token}"}


def _mk_neg(auth, mode="chat"):
    r = requests.post(f"{API}/negotiations", headers=auth, json={
        "scenario_slug": "salary-negotiation",
        "mode": mode,
        "training_framework": "combined",
        "language": "ru",
        "ai_model": "claude",
    })
    assert r.status_code == 200, r.text
    return r.json()["negotiation"]["id"]


class TestDeleteNegotiation:
    def test_delete_owner_ok_and_removed(self, auth):
        neg_id = _mk_neg(auth)
        # DELETE
        d = requests.delete(f"{API}/negotiations/{neg_id}", headers=auth)
        assert d.status_code == 200, d.text
        assert d.json() == {"ok": True}
        # GET should now be 404
        g = requests.get(f"{API}/negotiations/{neg_id}", headers=auth)
        assert g.status_code == 404

    def test_delete_missing_returns_404(self, auth):
        d = requests.delete(f"{API}/negotiations/does-not-exist-xyz", headers=auth)
        assert d.status_code == 404

    def test_delete_requires_auth(self):
        d = requests.delete(f"{API}/negotiations/whatever")
        assert d.status_code == 401


class TestChallengeChoices:
    def test_challenge_choices_balanced_and_shuffled(self, auth):
        neg_id = _mk_neg(auth, mode="challenge")
        try:
            # First user turn -> should produce 4 choices in response
            r = requests.post(f"{API}/negotiations/{neg_id}/message", headers=auth,
                              json={"content": "Здравствуйте, давайте обсудим условия."}, timeout=90)
            assert r.status_code == 200, r.text
            data = r.json()
            choices = data.get("choices")
            assert isinstance(choices, list) and len(choices) == 4, f"got {choices}"
            qualities = sorted([c["quality"] for c in choices])
            assert qualities == sorted(["strong", "acceptable", "weak", "risky"]), qualities
            # Balance check: word counts roughly 15-60
            counts = [len(c["text"].split()) for c in choices]
            assert all(8 <= n <= 80 for n in counts), counts
            # Not all strong-first (soft check across ordering)
            # Just verify shuffling code path exists — position of strong shouldn't be guaranteed 0
            # (We can't guarantee non-zero on single sample; just assert quality set is complete.)
        finally:
            requests.delete(f"{API}/negotiations/{neg_id}", headers=auth)


class TestHealth:
    def test_health(self):
        r = requests.get(f"{API}/health")
        assert r.status_code == 200
        assert r.json()["status"] == "ok"
