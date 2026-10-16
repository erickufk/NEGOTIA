# Iteration 9: XP awards on /end, weekly challenge, avatar upload/get/delete
import io
import os
import uuid
from datetime import datetime, timezone

import pytest
import requests
from pymongo import MongoClient
from PIL import Image

BASE_URL = os.environ.get("REACT_APP_BACKEND_URL").rstrip("/")
API = f"{BASE_URL}/api"


def _png(size=(32, 32), color=(200, 30, 30)):
    buf = io.BytesIO()
    Image.new("RGB", size, color).save(buf, format="PNG")
    return buf.getvalue()


@pytest.fixture(scope="module")
def mongo():
    from dotenv import dotenv_values
    env = dotenv_values("/app/backend/.env")
    c = MongoClient(env["MONGO_URL"])
    yield c[env["DB_NAME"]]
    c.close()


@pytest.fixture(scope="module")
def fresh_user(mongo):
    email = f"test_iter9_{uuid.uuid4().hex[:8]}@example.com"
    r = requests.post(f"{API}/auth/register", json={"email": email, "password": "Test1234!", "name": "TEST Iter9"})
    assert r.status_code == 200, r.text
    tok = r.json()["token"]
    uid = r.json()["user"]["id"]
    yield {"h": {"Authorization": f"Bearer {tok}"}, "id": uid, "email": email}
    mongo.negotiations.delete_many({"user_id": uid})
    mongo.users.delete_one({"id": uid})


def _end_new(h, fw="combined", action="end"):
    r = requests.post(f"{API}/negotiations", headers=h, json={
        "scenario_slug": "salary-negotiation", "mode": "chat", "training_framework": fw, "language": "en"}, timeout=60)
    assert r.status_code == 200, r.text
    nid = r.json()["negotiation"]["id"]
    r = requests.post(f"{API}/negotiations/{nid}/end", headers=h, json={"action": action}, timeout=120)
    assert r.status_code == 200, r.text
    return r.json()


# --- XP rules
class TestXP:
    def test_first_sim_awards_60_and_first_step(self, fresh_user):
        g0 = requests.get(f"{API}/users/me/gamification", headers=fresh_user["h"]).json()
        assert g0["xp"] == 0 and g0["total"] == 0
        data = _end_new(fresh_user["h"])
        assert "negotiation" in data and "gamification" in data
        n, g = data["negotiation"], data["gamification"]
        assert n["score"] == 48 and n["outcome"] == "Weak outcome"
        assert g["xp_gained"] == 60  # 50 base + 10 first of day
        assert "first_step" in g["new_badges"]
        assert g["challenge"] is None
        assert g["xp_total"] == 60
        g1 = requests.get(f"{API}/users/me/gamification", headers=fresh_user["h"]).json()
        assert g1["xp"] == 60 and g1["total"] == 1 and g1["streak"] == 1

    def test_second_sim_same_day_awards_50(self, fresh_user):
        g = _end_new(fresh_user["h"])["gamification"]
        assert g["xp_gained"] == 50
        assert g["new_badges"] == []
        assert g["xp_total"] == 110

    def test_end_twice_no_double_award(self, fresh_user):
        h = fresh_user["h"]
        r = requests.post(f"{API}/negotiations", headers=h, json={"scenario_slug": "salary-negotiation"}, timeout=60)
        nid = r.json()["negotiation"]["id"]
        requests.post(f"{API}/negotiations/{nid}/end", headers=h, json={"action": "end"}, timeout=120)
        r2 = requests.post(f"{API}/negotiations/{nid}/end", headers=h, json={"action": "end"}, timeout=60)
        assert r2.status_code == 200
        assert "gamification" not in r2.json() or not r2.json().get("gamification")
        g = requests.get(f"{API}/users/me/gamification", headers=h).json()
        assert g["xp"] == 160


# --- Weekly challenge
class TestWeekly:
    def test_weekly_shape(self, fresh_user):
        r = requests.get(f"{API}/users/me/weekly-challenge", headers=fresh_user["h"])
        assert r.status_code == 200
        w = r.json()
        for k in ("id", "week", "target", "progress", "completed", "bonus_xp", "ends_at", "claimed"):
            assert k in w
        iso = datetime.now(timezone.utc).isocalendar()
        assert w["week"] == f"{iso[0]}-W{iso[1]:02d}"
        assert w["bonus_xp"] == 100
        print("weekly:", w)

    def test_weekly_same_for_everyone(self, fresh_user):
        tok = requests.post(f"{API}/auth/login", json={"email": "demo@negotia.app", "password": "Demo1234!"}).json()["token"]
        d = requests.get(f"{API}/users/me/weekly-challenge", headers={"Authorization": f"Bearer {tok}"}).json()
        f = requests.get(f"{API}/users/me/weekly-challenge", headers=fresh_user["h"]).json()
        assert d["id"] == f["id"] and d["week"] == f["week"] and d["target"] == f["target"]

    def test_weekly_requires_auth(self):
        assert requests.get(f"{API}/users/me/weekly-challenge").status_code == 401

    def test_challenge_completion_awards_100_once(self, fresh_user, mongo):
        h = fresh_user["h"]
        w = requests.get(f"{API}/users/me/weekly-challenge", headers=h).json()
        if w["id"] != "win_spin":
            pytest.skip(f"this test seeds win_spin data; current={w['id']}")
        assert w["progress"] == 0 and not w["completed"]
        now = datetime.now(timezone.utc).isoformat()
        for _ in range(2):
            mongo.negotiations.insert_one({"id": f"TEST_{uuid.uuid4()}", "user_id": fresh_user["id"], "status": "completed",
                                           "training_framework": "spin", "outcome": "Successful", "score": 75,
                                           "scenario_slug": "salary-negotiation", "scenario_title": "TEST seeded", "mode": "chat", "language": "en", "ended_at": now, "created_at": now,
                                           "messages": [], "state": {}})
        w = requests.get(f"{API}/users/me/weekly-challenge", headers=h).json()
        assert w["progress"] == 2 and w["completed"] is True and w["claimed"] is False
        before = requests.get(f"{API}/users/me/gamification", headers=h).json()["xp"]
        g = _end_new(h)["gamification"]
        assert g["challenge"] is not None and g["challenge"]["id"] == "win_spin"
        assert g["xp_gained"] == 150  # 50 + 100 bonus
        assert g["xp_total"] == before + 150
        w = requests.get(f"{API}/users/me/weekly-challenge", headers=h).json()
        assert w["claimed"] is True
        g2 = _end_new(h)["gamification"]
        assert g2["challenge"] is None and g2["xp_gained"] == 50


# --- Avatar
class TestAvatar:
    def test_get_404_when_none(self, fresh_user):
        assert requests.get(f"{API}/users/me/avatar", headers=fresh_user["h"]).status_code == 404

    def test_upload_png_and_get_bytes(self, fresh_user):
        png = _png()
        r = requests.post(f"{API}/users/me/avatar", headers=fresh_user["h"],
                          files={"file": ("a.png", png, "image/png")}, timeout=60)
        assert r.status_code == 200, r.text
        assert r.json()["ok"] is True
        g = requests.get(f"{API}/users/me/avatar", headers=fresh_user["h"], timeout=60)
        assert g.status_code == 200
        assert g.headers["content-type"].startswith("image/png")
        assert g.content == png

    def test_upload_jpeg_and_webp(self, fresh_user):
        for fmt, ct in (("JPEG", "image/jpeg"), ("WEBP", "image/webp")):
            buf = io.BytesIO(); Image.new("RGB", (16, 16), (0, 100, 0)).save(buf, format=fmt)
            r = requests.post(f"{API}/users/me/avatar", headers=fresh_user["h"],
                              files={"file": (f"a.{fmt.lower()}", buf.getvalue(), ct)}, timeout=60)
            assert r.status_code == 200, (ct, r.text)
            g = requests.get(f"{API}/users/me/avatar", headers=fresh_user["h"], timeout=60)
            assert g.headers["content-type"].startswith(ct)

    def test_reject_gif_and_text(self, fresh_user):
        for name, ct in (("a.gif", "image/gif"), ("a.txt", "text/plain")):
            r = requests.post(f"{API}/users/me/avatar", headers=fresh_user["h"],
                              files={"file": (name, b"GIF89a....", ct)}, timeout=30)
            assert r.status_code == 400, (ct, r.status_code)

    def test_reject_over_1mb(self, fresh_user):
        big = b"\x89PNG" + os.urandom(1024 * 1024 + 10)
        r = requests.post(f"{API}/users/me/avatar", headers=fresh_user["h"],
                          files={"file": ("big.png", big, "image/png")}, timeout=60)
        assert r.status_code == 413

    def test_upload_requires_auth(self):
        r = requests.post(f"{API}/users/me/avatar", files={"file": ("a.png", _png(), "image/png")})
        assert r.status_code == 401

    def test_delete_then_404(self, fresh_user):
        r = requests.delete(f"{API}/users/me/avatar", headers=fresh_user["h"])
        assert r.status_code == 200
        assert requests.get(f"{API}/users/me/avatar", headers=fresh_user["h"]).status_code == 404


# --- Auth regression after refactor (forgot / magic-login / reset / me)
class TestAuthRegression:
    def test_me_and_reset_flows(self, fresh_user):
        me = requests.get(f"{API}/auth/me", headers=fresh_user["h"]).json()["user"]
        assert me["email"] == fresh_user["email"]
        assert "password_hash" not in me and "_id" not in me
        r = requests.post(f"{API}/auth/forgot-password", json={"email": fresh_user["email"]})
        assert r.status_code == 200 and r.json()["magic_link"]
        tok = r.json()["magic_link"].split("token=")[1]
        r = requests.post(f"{API}/auth/magic-login", json={"token": tok})
        assert r.status_code == 200 and r.json()["user"]["email"] == fresh_user["email"]
        assert requests.post(f"{API}/auth/magic-login", json={"token": tok}).status_code == 400
        tok2 = requests.post(f"{API}/auth/forgot-password", json={"email": fresh_user["email"]}).json()["magic_link"].split("token=")[1]
        r = requests.post(f"{API}/auth/reset-password", json={"token": tok2, "password": "NewPass123!"})
        assert r.status_code == 200
        assert requests.post(f"{API}/auth/login", json={"email": fresh_user["email"], "password": "NewPass123!"}).status_code == 200
        assert requests.post(f"{API}/auth/login", json={"email": fresh_user["email"], "password": "Test1234!"}).status_code == 401

    def test_forgot_unknown_email_no_enum(self):
        r = requests.post(f"{API}/auth/forgot-password", json={"email": "nobody_x9@example.com"})
        assert r.status_code == 200 and r.json()["magic_link"] is None
