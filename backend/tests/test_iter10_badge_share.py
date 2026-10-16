# Iteration 10: Badge sharing - POST /api/share/badge, public badge JSON/image, OG landing page
import io
import os
import re

import pytest
import requests
from PIL import Image

BASE_URL = os.environ.get("REACT_APP_BACKEND_URL").rstrip("/")
API = f"{BASE_URL}/api"


def _png(size=(1200, 630)):
    buf = io.BytesIO()
    Image.new("RGB", size, (79, 70, 229)).save(buf, format="PNG")
    return buf.getvalue()


@pytest.fixture(scope="module")
def h():
    r = requests.post(f"{API}/auth/login", json={"email": "demo@negotia.app", "password": "Demo1234!"})
    assert r.status_code == 200, r.text
    return {"Authorization": f"Bearer {r.json()['token']}"}


def _share(h, badge_id="first_step", data=None, ctype="image/png", lang="ru", name="Первый шаг"):
    files = {"image": ("card.png", data if data is not None else _png(), ctype)}
    return requests.post(f"{API}/share/badge", headers=h, files=files,
                         data={"badge_id": badge_id, "badge_name": name, "lang": lang})


@pytest.fixture(scope="module")
def share(h):
    r = _share(h)
    assert r.status_code == 200, r.text
    return r.json()


# Create share
class TestCreateShare:
    def test_create(self, share):
        assert isinstance(share["share_id"], str) and share["share_id"]
        assert share["url"] == f"{BASE_URL}/api/share/b/{share['share_id']}"

    def test_idempotent(self, h, share):
        r = _share(h)
        assert r.status_code == 200
        assert r.json()["share_id"] == share["share_id"]

    def test_practitioner_en(self, h):
        r = _share(h, "practitioner", lang="en", name="Practitioner")
        assert r.status_code == 200, r.text

    def test_unknown_badge(self, h):
        assert _share(h, "nope").status_code == 400

    def test_unearned(self, h):
        assert _share(h, "master").status_code == 403

    def test_non_png(self, h):
        assert _share(h, data=b"\xff\xd8\xff jpeg", ctype="image/jpeg").status_code == 400

    def test_too_large(self, h):
        assert _share(h, data=b"\x89PNG" + os.urandom(2 * 1024 * 1024 + 10)).status_code == 413

    def test_no_auth(self):
        assert _share({}).status_code == 401

    def test_badge_name_too_long(self, h):
        assert _share(h, name="x" * 200).status_code == 422


# Public endpoints
class TestPublic:
    def test_public_json(self, share):
        r = requests.get(f"{API}/public/badge/{share['share_id']}")
        assert r.status_code == 200
        d = r.json()
        for k in ("id", "badge_id", "badge_name", "name", "xp", "lang", "created_at", "image_url"):
            assert k in d
        assert d["badge_id"] == "first_step"
        assert d["image_url"] == f"{BASE_URL}/api/public/badge/{share['share_id']}/image.png"
        assert "_id" not in d and "user_id" not in d

    def test_public_image(self, share):
        r = requests.get(f"{API}/public/badge/{share['share_id']}/image.png")
        assert r.status_code == 200
        assert r.headers["content-type"].startswith("image/png")
        assert r.content[:4] == b"\x89PNG"

    def test_unknown_404(self):
        assert requests.get(f"{API}/public/badge/doesnotexist123").status_code == 404
        assert requests.get(f"{API}/public/badge/doesnotexist123/image.png").status_code == 404
        assert requests.get(f"{API}/share/b/doesnotexist123").status_code == 404

    def test_og_landing(self, share):
        sid = share["share_id"]
        r = requests.get(f"{API}/share/b/{sid}", allow_redirects=False)
        assert r.status_code == 200
        assert "text/html" in r.headers["content-type"]
        t = r.text
        assert 'property="og:title"' in t and 'property="og:description"' in t
        assert f'property="og:image" content="{BASE_URL}/api/public/badge/{sid}/image.png"' in t
        assert 'name="twitter:card" content="summary_large_image"' in t
        assert f"url={BASE_URL}/badge/{sid}" in t
        assert re.search(r"location\.replace\(", t)
