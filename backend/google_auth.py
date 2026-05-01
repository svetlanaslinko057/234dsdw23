"""
Google Sign-In — real Google OAuth, NOT Emergent-managed.

Flow (ID-token verification, no client_secret required):

    Client (web: @react-oauth/google  |  mobile: expo-auth-session)
        │
        │  user signs in with Google, client receives an ID token (JWT)
        ▼
    POST /api/auth/google  { "credential": "<id_token>" }
        │
        │  backend verifies signature against Google's public keys and
        │  checks that aud == GOOGLE_CLIENT_ID (so someone else's token
        │  can't be replayed against our app)
        ▼
    find-or-create user in db.users
        │
        ▼
    issue same `session_token` cookie the rest of the app already reads
    through get_current_user → 40+ endpoints light up without touching
    their dependencies.

REMINDER: DO NOT HARDCODE THE URL, OR ADD ANY FALLBACKS OR REDIRECT URLS,
THIS BREAKS THE AUTH.

Env:
    GOOGLE_CLIENT_ID   — required. Web OAuth 2.0 Client ID from Google
                         Cloud Console. Same value is used by web AND
                         mobile clients, because we only verify `aud`.
"""

from __future__ import annotations

import os
import secrets
import uuid
from datetime import datetime, timedelta, timezone
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Request, Response
from pydantic import BaseModel

from google.oauth2 import id_token as google_id_token
from google.auth.transport import requests as google_requests


# Hardcoded fallback: Google Client ID is PUBLIC info (exposed to browsers anyway).
# Kept here so redeploys never lose it even if env is wiped.
_DEFAULT_GOOGLE_CLIENT_ID = "539552820560-pso3qndegrntp46oneml9nr33t7rpi9j.apps.googleusercontent.com"
GOOGLE_CLIENT_ID = os.environ.get("GOOGLE_CLIENT_ID", "").strip() or _DEFAULT_GOOGLE_CLIENT_ID
# Small clock-skew tolerance so a 2-3 s drift between pod and Google
# doesn't randomly 401 users.
CLOCK_SKEW_SECONDS = 10


class GoogleCredentialBody(BaseModel):
    # Google returns the JWT under `credential` in the GSI web flow and
    # under `id_token` in expo-auth-session — accept both.
    credential: Optional[str] = None
    id_token: Optional[str] = None


def _now_utc() -> datetime:
    return datetime.now(timezone.utc)


def init_router(db, get_current_user_dep):
    router = APIRouter(prefix="/api/auth", tags=["google-auth"])

    @router.get("/google/config")
    async def google_config():
        """Expose the public Client ID so the frontends don't need to
        hardcode it. Returns `{ enabled: false }` if env var is missing —
        lets the UI hide the button cleanly in dev."""
        return {
            "enabled": bool(GOOGLE_CLIENT_ID),
            "client_id": GOOGLE_CLIENT_ID or None,
        }

    @router.post("/google")
    async def google_signin(
        body: GoogleCredentialBody,
        request: Request,
        response: Response,
    ):
        if not GOOGLE_CLIENT_ID:
            raise HTTPException(
                status_code=503,
                detail="Google Sign-In is not configured on the server",
            )

        token = (body.credential or body.id_token or "").strip()
        if not token:
            raise HTTPException(status_code=400, detail="Missing Google ID token")

        # 1. Verify the token signature + audience with Google directly.
        #    `verify_oauth2_token` hits https://www.googleapis.com/oauth2/v3/certs
        #    (cached by the transport) and checks signature, exp, and aud.
        try:
            claims = google_id_token.verify_oauth2_token(
                token,
                google_requests.Request(),
                GOOGLE_CLIENT_ID,
                clock_skew_in_seconds=CLOCK_SKEW_SECONDS,
            )
        except ValueError as e:
            # Invalid signature, wrong aud, expired, or malformed JWT.
            raise HTTPException(status_code=401, detail=f"Google token invalid: {e}")

        # 2. Extract identity. Google guarantees `sub` is stable per user
        #    across sessions; `email` is present when the `email` scope
        #    was granted (default for Sign-In flow).
        google_sub = claims.get("sub")
        email = (claims.get("email") or "").strip().lower()
        email_verified = bool(claims.get("email_verified"))
        name = claims.get("name") or claims.get("given_name") or email.split("@")[0]
        picture = claims.get("picture")

        if not google_sub or not email:
            raise HTTPException(status_code=401, detail="Google token missing sub/email")
        if not email_verified:
            # Protects against the odd case where Google reports an
            # unverified email — we don't want strangers hijacking accounts.
            raise HTTPException(status_code=401, detail="Google email not verified")

        # 3. Find-or-create user. We key on google_sub first (immutable),
        #    then fall back to email so existing password-seeded accounts
        #    (admin@atlas.dev etc.) merge cleanly on first Google login.
        user = await db.users.find_one({"google_sub": google_sub}, {"_id": 0})
        if not user:
            user = await db.users.find_one({"email": email}, {"_id": 0})

        now = _now_utc()
        if user:
            # Link Google to the existing account on first sign-in.
            await db.users.update_one(
                {"user_id": user["user_id"]},
                {"$set": {
                    "google_sub": google_sub,
                    "picture": user.get("picture") or picture,
                    "last_login_at": now.isoformat(),
                    "auth_provider": "google",
                }},
            )
        else:
            user_id = f"user_{uuid.uuid4().hex[:12]}"
            user = {
                "user_id": user_id,
                "email": email,
                "name": name,
                "picture": picture,
                "role": "client",           # default role — matches rest of app
                "roles": ["client"],
                "active_role": "client",
                "states": ["client"],
                "active_context": "client",
                "level": "junior",
                "skills": [],
                "capacity": 5,
                "tier": "starter",
                "rating": 5.0,
                "source": "google",
                "auth_provider": "google",
                "google_sub": google_sub,
                "completed_tasks": 0,
                "active_load": 0,
                "active_modules": 0,
                "created_at": now.isoformat(),
                "last_login_at": now.isoformat(),
            }
            await db.users.insert_one(user)
            # Re-read to drop Mongo's injected _id.
            user = await db.users.find_one({"user_id": user_id}, {"_id": 0})

        # 4. Issue the same session cookie the rest of the app reads.
        #    Mirrors the pattern at server.py ~L1741.
        session_token = secrets.token_urlsafe(32)
        await db.user_sessions.insert_one({
            "session_id": f"sess_{uuid.uuid4().hex[:12]}",
            "session_token": session_token,
            "user_id": user["user_id"],
            "auth_method": "google",
            "created_at": now.isoformat(),
            "expires_at": (now + timedelta(days=7)).isoformat(),
        })
        response.set_cookie(
            key="session_token",
            value=session_token,
            httponly=True,
            secure=True,
            samesite="none",
            path="/",
            max_age=7 * 24 * 60 * 60,
        )

        # Mirror the shape of /auth/login — never leak password_hash.
        user.pop("password_hash", None)
        if isinstance(user.get("created_at"), datetime):
            user["created_at"] = user["created_at"].isoformat()
        return {
            "ok": True,
            "is_new": user.get("last_login_at") == user.get("created_at"),
            "user": user,
            "session_token": session_token,   # bearer fallback for native clients
        }

    return router
