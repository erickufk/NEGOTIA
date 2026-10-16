"""Emergent object storage client."""
import os

import requests

from core import EMERGENT_LLM_KEY, logger

STORAGE_BASE = (os.environ.get("INTEGRATION_PROXY_URL") or "").strip() or "https://integrations.emergentagent.com"
STORAGE_URL = STORAGE_BASE.rstrip("/") + "/objstore/api/v1/storage"
APP_NAME = "negotia"
storage_key = None


def init_storage(force: bool = False):
    global storage_key
    if storage_key and not force:
        return storage_key
    resp = requests.post(f"{STORAGE_URL}/init", json={"emergent_key": EMERGENT_LLM_KEY}, timeout=30)
    resp.raise_for_status()
    storage_key = resp.json()["storage_key"]
    logger.info("Object storage initialized")
    return storage_key


def _request(method: str, path: str, **kw):
    extra = kw.pop("headers", {})
    for attempt in (0, 1):
        resp = requests.request(method, f"{STORAGE_URL}/objects/{path}",
                                headers={"X-Storage-Key": init_storage(force=attempt == 1), **extra}, **kw)
        if resp.status_code != 404 or attempt == 1:
            resp.raise_for_status()
            return resp


def put_object(path: str, data: bytes, content_type: str) -> dict:
    return _request("PUT", path, headers={"Content-Type": content_type}, data=data, timeout=120).json()


def get_object(path: str) -> tuple:
    resp = _request("GET", path, timeout=60)
    return resp.content, resp.headers.get("Content-Type", "application/octet-stream")
