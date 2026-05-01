"""
Resend email delivery — single point for all transactional mail.

Synchronous Resend SDK is wrapped in `asyncio.to_thread` to keep the FastAPI
event loop responsive. Helpers raise on hard errors so callers can decide
between fail-open (log + fallback) and fail-closed (deny the action).
"""
from __future__ import annotations

import asyncio
import logging
import os
from typing import Optional

import resend

logger = logging.getLogger("email_service")

# One-shot configuration. Reads env at import time; restart the process
# after rotating keys.
_API_KEY = os.environ.get("RESEND_API_KEY", "")
_FROM_EMAIL = os.environ.get("RESEND_FROM_EMAIL", "onboarding@resend.dev")
_FROM_NAME = os.environ.get("RESEND_FROM_NAME", "EVA-X")
_FROM = f"{_FROM_NAME} <{_FROM_EMAIL}>" if _FROM_NAME else _FROM_EMAIL

if _API_KEY:
    resend.api_key = _API_KEY
else:
    logger.warning("RESEND_API_KEY not set — email delivery disabled")


def is_configured() -> bool:
    return bool(_API_KEY)


# ---------------------------------------------------------------- OTP email
def _otp_html(code: str, ttl_minutes: int = 10) -> str:
    # Inline CSS only. No external assets. Tested in Gmail / Apple Mail.
    return f"""
<!DOCTYPE html>
<html>
<body style="margin:0;padding:0;background:#0B0F14;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#0B0F14;padding:40px 16px;">
    <tr><td align="center">
      <table width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width:480px;background:#11161D;border:1px solid #1E2631;border-radius:14px;overflow:hidden;">
        <tr><td style="padding:32px 28px 12px 28px;">
          <div style="font-size:11px;font-weight:800;letter-spacing:1.8px;color:#2FE6A6;text-transform:uppercase;">EVA-X · sign-in</div>
          <h1 style="margin:12px 0 6px 0;font-size:24px;line-height:1.25;color:#F1F5F9;font-weight:800;letter-spacing:-0.5px;">Continue to your product</h1>
          <p style="margin:0;font-size:14px;color:#94A3B8;line-height:1.6;">Use this 6-digit code to sign in. It expires in {ttl_minutes} minutes.</p>
        </td></tr>
        <tr><td style="padding:24px 28px;">
          <div style="background:#0B0F14;border:1px solid #2C3746;border-radius:12px;padding:20px;text-align:center;">
            <div style="font-family:'SF Mono','Menlo',monospace;font-size:36px;font-weight:800;letter-spacing:8px;color:#F1F5F9;">{code}</div>
          </div>
        </td></tr>
        <tr><td style="padding:0 28px 28px 28px;">
          <p style="margin:0;font-size:12px;color:#64748B;line-height:1.6;">
            If you didn't request this code, ignore this email. Someone may have entered your address by mistake — your account is safe.
          </p>
        </td></tr>
        <tr><td style="background:#0B0F14;border-top:1px solid #1E2631;padding:16px 28px;">
          <div style="font-size:11px;color:#64748B;letter-spacing:0.4px;">EVA-X · Build products. Not tickets.</div>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>
""".strip()


async def send_otp_email(email: str, code: str, ttl_minutes: int = 10) -> Optional[str]:
    """Deliver a 6-digit code via Resend.

    Returns the Resend message id on success. Raises on transport / API errors;
    callers decide whether to surface the error or fall back to logging.
    """
    if not is_configured():
        raise RuntimeError("RESEND_API_KEY not configured")

    params = {
        "from": _FROM,
        "to": [email],
        "subject": f"Your EVA-X code is {code}",
        "html": _otp_html(code, ttl_minutes),
        "text": f"Your EVA-X sign-in code is {code}. It expires in {ttl_minutes} minutes.",
    }
    try:
        result = await asyncio.to_thread(resend.Emails.send, params)
        msg_id = (result or {}).get("id")
        logger.info(f"RESEND OTP sent → {email} id={msg_id}")
        return msg_id
    except Exception as e:
        # Don't leak stack to clients; log full server-side, raise opaque.
        logger.exception(f"RESEND OTP failed → {email}: {e}")
        raise
