"""Auth routes."""
import os
import uuid
from datetime import datetime, timezone, timedelta

import secrets

from fastapi import APIRouter, HTTPException, Depends

from core import (db, logger, now_iso,
                  get_current_user, hash_password, verify_password, create_token)
from models import (RegisterIn, LoginIn, ForgotPasswordIn,
                    ResetPasswordIn, MagicLoginIn)

api = APIRouter(prefix="/api")

# ---------- Auth ----------
@api.post("/auth/register")
async def register(body: RegisterIn):
    if await db.users.find_one({"email": body.email.lower()}):
        raise HTTPException(status_code=400, detail="Email already registered")
    uid = str(uuid.uuid4())
    doc = {
        "id": uid, "email": body.email.lower(), "name": body.name,
        "password_hash": hash_password(body.password),
        "created_at": now_iso(), "updated_at": now_iso(),
    }
    await db.users.insert_one(doc)
    token = create_token(uid)
    return {"token": token, "user": {"id": uid, "email": body.email.lower(), "name": body.name, "created_at": doc["created_at"]}}


@api.post("/auth/login")
async def login(body: LoginIn):
    user = await db.users.find_one({"email": body.email.lower()})
    if not user or not verify_password(body.password, user["password_hash"]):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    token = create_token(user["id"])
    return {"token": token, "user": {"id": user["id"], "email": user["email"], "name": user["name"], "created_at": user["created_at"]}}


@api.get("/auth/me")
async def me(user=Depends(get_current_user)):
    return {"user": user}


# ---------- Password reset / Magic Link ----------
@api.post("/auth/forgot-password")
async def forgot_password(body: ForgotPasswordIn):
    """Generate a one-time magic link token. Returns the link so it can be shown in-app
    (dev/demo mode — no SMTP configured). In production this URL would be emailed."""
    email = body.email.lower()
    user = await db.users.find_one({"email": email})
    # Always respond success (avoid email enumeration), but only create token if user exists.
    magic_link = None
    if user:
        token = secrets.token_urlsafe(32)
        expires = datetime.now(timezone.utc) + timedelta(hours=1)
        await db.password_reset_tokens.insert_one({
            "token": token,
            "user_id": user["id"],
            "email": email,
            "expires_at": expires,
            "used": False,
            "created_at": now_iso(),
        })
        frontend = os.environ.get("FRONTEND_URL", "").rstrip("/")
        magic_link = f"{frontend}/reset-password?token={token}" if frontend else f"/reset-password?token={token}"
        logger.info("Password reset link for %s: %s", email, magic_link)
    return {"ok": True, "magic_link": magic_link}


@api.post("/auth/reset-password")
async def reset_password(body: ResetPasswordIn):
    doc = await db.password_reset_tokens.find_one({"token": body.token})
    if not doc or doc.get("used"):
        raise HTTPException(400, "Ссылка недействительна или уже использована")
    exp = doc.get("expires_at")
    if isinstance(exp, datetime):
        if exp.tzinfo is None:
            exp = exp.replace(tzinfo=timezone.utc)
        if exp < datetime.now(timezone.utc):
            raise HTTPException(400, "Срок действия ссылки истёк")
    user = await db.users.find_one({"id": doc["user_id"]})
    if not user:
        raise HTTPException(404, "Пользователь не найден")
    await db.users.update_one({"id": user["id"]}, {"$set": {"password_hash": hash_password(body.password), "updated_at": now_iso()}})
    await db.password_reset_tokens.update_one({"token": body.token}, {"$set": {"used": True, "used_at": now_iso()}})
    token = create_token(user["id"])
    return {"token": token, "user": {"id": user["id"], "email": user["email"], "name": user["name"], "created_at": user["created_at"]}}


@api.post("/auth/magic-login")
async def magic_login(body: MagicLoginIn):
    """Sign in via one-time magic link token (does NOT change password)."""
    doc = await db.password_reset_tokens.find_one({"token": body.token})
    if not doc or doc.get("used"):
        raise HTTPException(400, "Ссылка недействительна или уже использована")
    exp = doc.get("expires_at")
    if isinstance(exp, datetime):
        if exp.tzinfo is None:
            exp = exp.replace(tzinfo=timezone.utc)
        if exp < datetime.now(timezone.utc):
            raise HTTPException(400, "Срок действия ссылки истёк")
    user = await db.users.find_one({"id": doc["user_id"]})
    if not user:
        raise HTTPException(404, "Пользователь не найден")
    await db.password_reset_tokens.update_one({"token": body.token}, {"$set": {"used": True, "used_at": now_iso()}})
    token = create_token(user["id"])
    return {"token": token, "user": {"id": user["id"], "email": user["email"], "name": user["name"], "created_at": user["created_at"]}}


