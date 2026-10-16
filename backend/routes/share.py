"""Badge sharing: share records, card images, public badge page + OG preview."""
import asyncio
import html
import os
import secrets

from fastapi import APIRouter, HTTPException, Depends, UploadFile, File, Form
from fastapi.responses import Response, HTMLResponse

from pymongo import ReturnDocument

import storage
import gamification
from core import db, logger, now_iso, get_current_user

api = APIRouter(prefix="/api")

BADGE_IDS = {"first_step", "first_win", "on_a_roll", "sharp_mind", "tough_crowd",
             "methodologist", "practitioner", "veteran", "versatile", "master"}
IMG_MAX = 2 * 1024 * 1024
OG_TEXT = {
    "ru": ("{name} получил(а) достижение «{badge}» в NEGOTIA", "AI-симулятор переговоров. Тренируйтесь с реалистичными AI-оппонентами."),
    "en": ("{name} unlocked “{badge}” on NEGOTIA", "AI negotiation simulator. Practice with realistic AI opponents."),
}


def _frontend() -> str:
    return os.environ["FRONTEND_URL"].rstrip("/")


@api.post("/share/badge")
async def create_badge_share(badge_id: str = Form(...), badge_name: str = Form(..., max_length=80),
                             lang: str = Form("ru"), image: UploadFile = File(...), user=Depends(get_current_user)):
    if badge_id not in BADGE_IDS:
        raise HTTPException(400, "Unknown badge")
    state = await gamification.get_state(db, user["id"])
    if badge_id not in state.get("badges", []):
        raise HTTPException(403, "Badge not earned yet")
    if image.content_type != "image/png":
        raise HTTPException(400, "Card must be PNG")
    data = await image.read(IMG_MAX + 1)
    if not data or len(data) > IMG_MAX:
        raise HTTPException(413, "Card image too large")
    if not data.startswith(b"\x89PNG\r\n\x1a\n"):
        raise HTTPException(400, "Card must be PNG")
    lang = "en" if lang == "en" else "ru"
    doc = await db.badge_shares.find_one_and_update(
        {"user_id": user["id"], "badge_id": badge_id},
        {"$setOnInsert": {"id": secrets.token_urlsafe(8), "created_at": now_iso()}},
        upsert=True, return_document=ReturnDocument.AFTER, projection={"_id": 0})
    share_id = doc["id"]
    path = f"{storage.APP_NAME}/badge-cards/{user['id']}/{share_id}.png"
    try:
        result = await asyncio.to_thread(storage.put_object, path, data, "image/png")
    except Exception:
        logger.exception("badge card upload failed")
        raise HTTPException(502, "Upload failed, please try again")
    await db.badge_shares.update_one({"id": share_id}, {"$set": {
        "image_path": result["path"], "badge_name": badge_name, "lang": lang, "name": user.get("name", ""),
        "level_xp": state.get("xp", 0), "updated_at": now_iso()}})
    return {"share_id": share_id, "url": f"{_frontend()}/api/share/b/{share_id}"}


async def _get_share(share_id: str) -> dict:
    doc = await db.badge_shares.find_one({"id": share_id}, {"_id": 0})
    if not doc or not doc.get("badge_name"):
        raise HTTPException(404, "Not found")
    return doc


@api.get("/public/badge/{share_id}")
async def public_badge(share_id: str):
    d = await _get_share(share_id)
    return {"id": d["id"], "badge_id": d["badge_id"], "badge_name": d["badge_name"], "name": d["name"],
            "xp": d.get("level_xp", 0), "lang": d.get("lang", "ru"), "created_at": d["created_at"],
            "image_url": f"{_frontend()}/api/public/badge/{d['id']}/image.png"}


@api.get("/public/badge/{share_id}/image.png")
async def public_badge_image(share_id: str):
    d = await _get_share(share_id)
    if not d.get("image_path"):
        raise HTTPException(404, "Image not found")
    try:
        data, _ = await asyncio.to_thread(storage.get_object, d["image_path"])
    except Exception:
        logger.exception("badge card fetch failed")
        raise HTTPException(404, "Image not found")
    return Response(content=data, media_type="image/png", headers={"Cache-Control": "public, max-age=600"})


@api.get("/share/b/{share_id}", response_class=HTMLResponse)
async def share_landing(share_id: str):
    """Crawler-friendly page with OG tags; humans are redirected to the SPA badge page."""
    d = await _get_share(share_id)
    title_t, desc = OG_TEXT.get(d.get("lang"), OG_TEXT["ru"])
    title = html.escape(title_t.format(name=d["name"], badge=d["badge_name"]))
    desc = html.escape(desc)
    img = f"{_frontend()}/api/public/badge/{share_id}/image.png"
    target = f"{_frontend()}/badge/{share_id}"
    page = f"""<!doctype html><html lang="{d.get('lang', 'ru')}"><head><meta charset="utf-8">
<title>{title}</title>
<meta name="description" content="{desc}">
<meta property="og:type" content="website"><meta property="og:site_name" content="NEGOTIA">
<meta property="og:title" content="{title}"><meta property="og:description" content="{desc}">
<meta property="og:image" content="{img}"><meta property="og:image:width" content="1200"><meta property="og:image:height" content="630">
<meta property="og:url" content="{_frontend()}/api/share/b/{share_id}">
<meta name="twitter:card" content="summary_large_image"><meta name="twitter:title" content="{title}">
<meta name="twitter:description" content="{desc}"><meta name="twitter:image" content="{img}">
<meta http-equiv="refresh" content="0;url={target}"></head>
<body><script>location.replace({target!r});</script><a href="{target}">{title}</a></body></html>"""
    return HTMLResponse(page)
