"""
mock_seed.py — extra demo data for `client@atlas.dev`.

Strictly mirrors existing collections used by the client surfaces:

  • projects         (client_id, name, status, production_mode, created_at, …)
  • modules          (project_id, title, status, base_price, final_price,
                       started_at, review_at, completed_at, paused_by, paused_at)
  • payouts          (module_id, amount, status: pending|approved|paid, created_at)
  • auto_actions     (project_id, module_id, type, confidence, reason, impact)
  • system_alerts    (project_id, module_id, type, severity, …)
  • invoices         (project_id, client_id, title, amount, status: paid|pending_payment|draft)
  • deliverables     (project_id, title, summary, status: pending_approval|approved, …)
  • support_tickets  (project_id, user_id, title, description, ticket_type, priority, status)
  • client_notifications (user_id, source, type, payload, read)

Idempotent: keyed off `mock_seed_marker = "extra_demo_v1"` on the client user.
Re-running does nothing if the marker is already set.
"""
from __future__ import annotations

import logging
import uuid
from datetime import datetime, timedelta, timezone
from typing import Any, Dict, List

logger = logging.getLogger(__name__)

MARKER = "extra_demo_v2"


def _now() -> datetime:
    return datetime.now(timezone.utc)


def _iso(dt: datetime) -> str:
    return dt.isoformat()


def _new_id(prefix: str) -> str:
    return f"{prefix}_{uuid.uuid4().hex[:12]}"


async def seed_extra_client_demo(db) -> None:
    """Populate richer client-side data for `client@atlas.dev`.

    Skips silently if the marker is set or the user is missing.
    """
    client = await db.users.find_one({"email": "client@atlas.dev"}, {"_id": 0})
    if not client:
        return
    if (client.get("mock_seed_markers") or {}).get(MARKER):
        return

    client_id = client["user_id"]
    dev = await db.users.find_one({"email": "john@atlas.dev"}, {"_id": 0, "user_id": 1})
    dev_id = dev["user_id"] if dev else None

    now = _now()

    # ──────────────────────────────────────────────────────────
    # 2 extra projects (alongside seeded "Acme Analytics Platform")
    # ──────────────────────────────────────────────────────────
    p1_id = _new_id("proj")
    p2_id = _new_id("proj")

    p1 = {
        "project_id": p1_id,
        "client_id": client_id,
        "name": "Mobile App Refresh",
        "title": "Mobile App Refresh",
        "current_stage": "development",
        "progress": 35,
        "status": "active",
        "production_mode": "hybrid",
        "created_at": _iso(now - timedelta(days=8)),
    }
    p2 = {
        "project_id": p2_id,
        "client_id": client_id,
        "name": "Internal Ops Tool",
        "title": "Internal Ops Tool",
        "current_stage": "delivered",
        "progress": 100,
        "status": "active",
        "production_mode": "dev",
        "created_at": _iso(now - timedelta(days=22)),
    }
    await db.projects.insert_many([p1, p2])

    # ──────────────────────────────────────────────────────────
    # Modules — varied lifecycle so /activity/live has movement.
    # Each module lifecycle field maps directly to an Activity row:
    #   started_at   → "started"   (blue)
    #   review_at    → "moved to review" (yellow)
    #   completed_at → "completed" (green)
    # ──────────────────────────────────────────────────────────
    modules: List[Dict[str, Any]] = []

    # P1 — Mobile App Refresh: 4 modules, mid-flight, 1 warning
    p1_mods = [
        {
            "title": "Onboarding Flow",
            "description": "5-step intro screens, value prop, sign-up",
            "scope": ["splash", "intro carousel", "sign-up form"],
            "deliverables": ["Figma handoff", "RN screens", "analytics events"],
            "template_type": "onboarding",
            "base_price": 800, "price": 1100, "final_price": 1100,
            "estimated_hours": 12, "status": "done",
            "qa_status": "passed",
            "started_at":   _iso(now - timedelta(days=7, hours=4)),
            "review_at":    _iso(now - timedelta(days=4, hours=2)),
            "completed_at": _iso(now - timedelta(days=3, hours=6)),
            "earned_amt": 800,  # for payout below
            "payout_status": "paid",
        },
        {
            "title": "Push Notifications",
            "description": "FCM/APNs integration, server-side dispatcher",
            "scope": ["expo-notifications", "device tokens", "topic routing"],
            "deliverables": ["test push", "in-app permission UX"],
            "template_type": "notifications",
            "base_price": 700, "price": 950, "final_price": 950,
            "estimated_hours": 10, "status": "review",
            "qa_status": "pending",
            "started_at": _iso(now - timedelta(days=4)),
            "review_at":  _iso(now - timedelta(hours=18)),
            "earned_amt": 700,
            "payout_status": "approved",
        },
        {
            "title": "Profile & Settings",
            "description": "Account screen, edit profile, preferences",
            "scope": ["avatar upload", "edit form", "language switch"],
            "deliverables": ["form validation", "settings persistence"],
            "template_type": "profile",
            "base_price": 600, "price": 800, "final_price": 800,
            "estimated_hours": 9, "status": "in_progress",
            "qa_status": "pending",
            "started_at": _iso(now - timedelta(days=2)),
            "earned_amt": 520,  # 65% — warning territory
            "payout_status": "approved",
        },
        {
            "title": "Deep Links & Universal Links",
            "description": "iOS/Android deep links, fallback web URLs",
            "scope": ["URL schemes", "associated domains", "router glue"],
            "deliverables": ["deep link tests", "fallback page"],
            "template_type": "infra",
            "base_price": 500, "price": 700, "final_price": 700,
            "estimated_hours": 7, "status": "pending",
            "qa_status": "pending",
            "earned_amt": 0,
            "payout_status": None,
        },
    ]
    for m in p1_mods:
        m["module_id"] = _new_id("mod")
        m["project_id"] = p1_id
        m["assigned_to"] = dev_id
        m["assignment_mode"] = "auto"
        m["created_at"] = _iso(now - timedelta(days=8))
        modules.append(m)

    # P2 — Internal Ops Tool: completed end-to-end, all green
    p2_mods = [
        {
            "title": "Admin Auth & Roles",
            "description": "Admin login, role-based middleware",
            "scope": ["JWT", "role guards", "audit log"],
            "deliverables": ["login screen", "role tests"],
            "template_type": "auth",
            "base_price": 900, "price": 1200, "final_price": 1200,
            "estimated_hours": 12, "status": "done",
            "qa_status": "passed",
            "started_at":   _iso(now - timedelta(days=22)),
            "review_at":    _iso(now - timedelta(days=18)),
            "completed_at": _iso(now - timedelta(days=17, hours=4)),
            "earned_amt": 900, "payout_status": "paid",
        },
        {
            "title": "Tickets Pipeline",
            "description": "Kanban board for ops requests",
            "scope": ["columns", "drag-and-drop", "filters"],
            "deliverables": ["board UI", "audit log"],
            "template_type": "kanban",
            "base_price": 1100, "price": 1500, "final_price": 1500,
            "estimated_hours": 18, "status": "done",
            "qa_status": "passed",
            "started_at":   _iso(now - timedelta(days=18)),
            "review_at":    _iso(now - timedelta(days=12)),
            "completed_at": _iso(now - timedelta(days=10)),
            "earned_amt": 1100, "payout_status": "paid",
        },
        {
            "title": "Reporting & Exports",
            "description": "CSV/PDF reports, scheduled email digests",
            "scope": ["CSV export", "PDF templates", "cron"],
            "deliverables": ["weekly digest", "filter UI"],
            "template_type": "reporting",
            "base_price": 1000, "price": 1400, "final_price": 1400,
            "estimated_hours": 16, "status": "done",
            "qa_status": "passed",
            "started_at":   _iso(now - timedelta(days=12)),
            "review_at":    _iso(now - timedelta(days=6)),
            "completed_at": _iso(now - timedelta(days=4, hours=3)),
            "earned_amt": 1000, "payout_status": "paid",
        },
    ]
    for m in p2_mods:
        m["module_id"] = _new_id("mod")
        m["project_id"] = p2_id
        m["assigned_to"] = dev_id
        m["assignment_mode"] = "auto"
        m["created_at"] = _iso(now - timedelta(days=22))
        modules.append(m)

    # Persist modules — but BEFORE stripping side-fields, materialise demo
    # earnings into the CANONICAL money store: dev_wallets + dev_earning_log.
    # This is the same path used by client_approve_module → _credit_module_reward
    # in production. We DO NOT write to db.payouts (legacy / parallel store).
    earned_lifetime = 0.0
    withdrawn_lifetime = 0.0
    earning_logs: List[Dict[str, Any]] = []
    for src in (p1_mods + p2_mods):
        st = src.get("payout_status")
        amt = float(src.get("earned_amt") or 0)
        if not st or amt <= 0:
            continue
        # Tag the module with what dev was promised, so /dev/work shows correct budget
        src["dev_reward"] = amt
        # All credited entries go to the audit log (single source of truth)
        earning_logs.append({
            "log_id": _new_id("de"),
            "user_id": dev_id,
            "module_id": src["module_id"],
            "project_id": src["project_id"],
            "amount": round(amt, 2),
            "reason": "module_approved",
            "created_at": _iso(now - timedelta(days=2)),
        })
        earned_lifetime += amt
        if st == "paid":
            withdrawn_lifetime += amt

    # Strip side-data we won't store on the module document
    for m in modules:
        m.pop("earned_amt", None)
        m.pop("payout_status", None)
    await db.modules.insert_many(modules)
    if earning_logs:
        await db.dev_earning_log.insert_many(earning_logs)
        await db.dev_wallets.update_one(
            {"user_id": dev_id},
            {
                "$set": {
                    "user_id": dev_id,
                    "earned_lifetime": round(earned_lifetime, 2),
                    "withdrawn_lifetime": round(withdrawn_lifetime, 2),
                    "available_balance": round(earned_lifetime - withdrawn_lifetime, 2),
                    "pending_withdrawal": 0.0,
                    "updated_at": _iso(now),
                },
                "$setOnInsert": {"created_at": _iso(now)},
            },
            upsert=True,
        )

    # ──────────────────────────────────────────────────────────
    # (payouts already inserted above — see derivation block)
    # ──────────────────────────────────────────────────────────

    # ──────────────────────────────────────────────────────────
    # auto_actions — system intelligence visible on Home + Operator
    # ──────────────────────────────────────────────────────────
    profile_mod = next(m for m in p1_mods if m["title"] == "Profile & Settings")
    push_mod    = next(m for m in p1_mods if m["title"] == "Push Notifications")

    actions = [
        {
            "action_id": _new_id("auto"),
            "type": "auto_review_flag",
            "source": "guardian",
            "project_id": p1_id,
            "module_id": profile_mod["module_id"],
            "confidence": 0.78,
            "reason": "Earned 65% of cap — flagging for extra QA before completion",
            "impact": "Prevents over-budget surprise on completion",
            "created_at": _iso(now - timedelta(hours=4)),
        },
        {
            "action_id": _new_id("auto"),
            "type": "auto_add_support",
            "source": "guardian",
            "project_id": p1_id,
            "module_id": push_mod["module_id"],
            "confidence": 0.85,
            "reason": "Module in review > 18h — adding reviewer to keep timeline",
            "impact": "Restores timeline by ~1 day",
            "created_at": _iso(now - timedelta(hours=2)),
        },
        {
            "action_id": _new_id("auto"),
            "type": "auto_rebalance",
            "source": "guardian",
            "project_id": p2_id,
            "module_id": None,
            "confidence": 0.91,
            "reason": "Project shipped — releasing developer capacity to scaling pool",
            "impact": "Frees 1 senior dev seat",
            "created_at": _iso(now - timedelta(days=4)),
        },
    ]
    await db.auto_actions.insert_many(actions)

    # ──────────────────────────────────────────────────────────
    # system_alerts — picked up by /client/operator feed
    # ──────────────────────────────────────────────────────────
    alerts = [
        {
            "alert_id": _new_id("alert"),
            "project_id": p1_id,
            "module_id": push_mod["module_id"],
            "type": "task_waiting_review",
            "severity": "medium",
            "message": "Push Notifications has been in review for over 18 hours",
            "resolved": False,
            "created_at": _iso(now - timedelta(hours=18)),
        },
    ]
    await db.system_alerts.insert_many(alerts)

    # ──────────────────────────────────────────────────────────
    # invoices — Billing tab content
    # Mix of paid / pending / draft maps to backend Invoice schema
    # ──────────────────────────────────────────────────────────
    invoices = [
        {
            "invoice_id": _new_id("inv"),
            "project_id": p2_id,
            "client_id": client_id,
            "title": "Internal Ops Tool — Sprint 1",
            "amount": 1200.0,
            "currency": "USD",
            "status": "paid",
            "payment_provider": "stripe",
            "created_at": _iso(now - timedelta(days=18)),
            "paid_at": _iso(now - timedelta(days=17)),
        },
        {
            "invoice_id": _new_id("inv"),
            "project_id": p2_id,
            "client_id": client_id,
            "title": "Internal Ops Tool — Sprint 2",
            "amount": 1500.0,
            "currency": "USD",
            "status": "paid",
            "payment_provider": "stripe",
            "created_at": _iso(now - timedelta(days=11)),
            "paid_at": _iso(now - timedelta(days=10)),
        },
        {
            "invoice_id": _new_id("inv"),
            "project_id": p2_id,
            "client_id": client_id,
            "title": "Internal Ops Tool — Final delivery",
            "amount": 1400.0,
            "currency": "USD",
            "status": "paid",
            "payment_provider": "stripe",
            "created_at": _iso(now - timedelta(days=4)),
            "paid_at": _iso(now - timedelta(days=3)),
        },
        {
            "invoice_id": _new_id("inv"),
            "project_id": p1_id,
            "client_id": client_id,
            "title": "Mobile App Refresh — Onboarding milestone",
            "amount": 1100.0,
            "currency": "USD",
            "status": "paid",
            "payment_provider": "stripe",
            "created_at": _iso(now - timedelta(days=3)),
            "paid_at": _iso(now - timedelta(days=2)),
        },
        {
            "invoice_id": _new_id("inv"),
            "project_id": p1_id,
            "client_id": client_id,
            "title": "Mobile App Refresh — Push notifications milestone",
            "amount": 950.0,
            "currency": "USD",
            "status": "pending_payment",
            "payment_provider": "stripe",
            "created_at": _iso(now - timedelta(hours=18)),
        },
        {
            "invoice_id": _new_id("inv"),
            "project_id": p1_id,
            "client_id": client_id,
            "title": "Mobile App Refresh — Deep links (estimate)",
            "amount": 700.0,
            "currency": "USD",
            "status": "draft",
            "created_at": _iso(now - timedelta(hours=4)),
        },
    ]
    await db.invoices.insert_many(invoices)

    # ──────────────────────────────────────────────────────────
    # deliverables — items awaiting client approval (Decision Engine fuel)
    # ──────────────────────────────────────────────────────────
    deliverables = [
        {
            "deliverable_id": _new_id("del"),
            "project_id": p1_id,
            "client_id": client_id,
            "module_id": next(m["module_id"] for m in p1_mods if m["title"] == "Push Notifications"),
            "title": "Push Notifications — review build",
            "summary": "TestFlight build ready. Tap-to-open routing implemented, "
                       "permission UX uses native prompt with fallback rationale.",
            "blocks": [
                {"type": "checklist", "items": [
                    "Permission prompt copy approved",
                    "Topic routing covers 4 channels",
                    "Analytics event 'push_received' fires",
                ]},
            ],
            "resources": [
                {"type": "build", "label": "TestFlight v0.4.2", "url": "#"},
                {"type": "video", "label": "Walkthrough (1:42)",  "url": "#"},
            ],
            "version": "v0.4",
            "status": "pending_approval",
            "price": 950.0,
            "created_at": _iso(now - timedelta(hours=18)),
        },
        {
            "deliverable_id": _new_id("del"),
            "project_id": p2_id,
            "title": "Reporting & Exports — final delivery",
            "summary": "All exports verified. CSV + PDF generation tested across "
                       "1k-row dataset. Weekly digest dispatched on Mondays 09:00 UTC.",
            "blocks": [
                {"type": "checklist", "items": [
                    "CSV export passes column validation",
                    "PDF template matches brand book",
                    "Cron schedule confirmed",
                ]},
            ],
            "resources": [
                {"type": "doc", "label": "Acceptance report", "url": "#"},
            ],
            "version": "v1.0",
            "status": "approved",
            "price": 1400.0,
            "approved_at": now - timedelta(days=3),
            "created_at": _iso(now - timedelta(days=4)),
        },
    ]
    await db.deliverables.insert_many(deliverables)

    # ──────────────────────────────────────────────────────────
    # support_tickets — Profile → Support sheet content
    # ──────────────────────────────────────────────────────────
    tickets = [
        {
            "ticket_id": _new_id("tkt"),
            "project_id": p1_id,
            "user_id": client_id,
            "title": "Login fails on Android 13 emulator",
            "description": "Tapping 'Continue' returns to the email field with no error.",
            "ticket_type": "bug",
            "priority": "high",
            "status": "open",
            "messages": [
                {"author": "client", "text": "Tapping 'Continue' returns to the email field with no error.",
                 "at": _iso(now - timedelta(hours=6))},
            ],
            "created_at": _iso(now - timedelta(hours=6)),
        },
        {
            "ticket_id": _new_id("tkt"),
            "project_id": p2_id,
            "user_id": client_id,
            "title": "Add a 'Mark all as read' button on the digest",
            "description": "Would save us a click each Monday.",
            "ticket_type": "improvement",
            "priority": "low",
            "status": "in_progress",
            "messages": [
                {"author": "client", "text": "Would save us a click each Monday.",
                 "at": _iso(now - timedelta(days=3))},
                {"author": "support", "text": "Logged — picking this up after the current sprint.",
                 "at": _iso(now - timedelta(days=2))},
            ],
            "created_at": _iso(now - timedelta(days=3)),
        },
        {
            "ticket_id": _new_id("tkt"),
            "project_id": p2_id,
            "user_id": client_id,
            "title": "How do I export the audit log?",
            "description": "Looking for a CSV of admin actions for compliance.",
            "ticket_type": "question",
            "priority": "medium",
            "status": "resolved",
            "messages": [
                {"author": "client", "text": "Looking for a CSV of admin actions for compliance.",
                 "at": _iso(now - timedelta(days=11))},
                {"author": "support", "text": "Settings → Audit log → 'Export CSV' (top-right).",
                 "at": _iso(now - timedelta(days=10))},
            ],
            "created_at": _iso(now - timedelta(days=11)),
        },
    ]
    await db.support_tickets.insert_many(tickets)

    # ──────────────────────────────────────────────────────────
    # client_notifications — Magic Client Pull feed
    # ──────────────────────────────────────────────────────────
    notifs = [
        {
            "notification_id": _new_id("cn"),
            "user_id": client_id,
            "source": "magic_client_pull",
            "type": "review_required",
            "title": "Push Notifications is ready for your review",
            "body": "Tap to walk through the new build and approve it.",
            "project_id": p1_id,
            "deliverable_id": deliverables[0]["deliverable_id"],
            "read": False,
            "created_at": _iso(now - timedelta(hours=18)),
        },
        {
            "notification_id": _new_id("cn"),
            "user_id": client_id,
            "source": "magic_client_pull",
            "type": "module_completed",
            "title": "Onboarding Flow shipped",
            "body": "Full release notes inside.",
            "project_id": p1_id,
            "module_id": p1_mods[0]["module_id"],
            "read": False,
            "created_at": _iso(now - timedelta(days=3)),
        },
        {
            "notification_id": _new_id("cn"),
            "user_id": client_id,
            "source": "magic_client_pull",
            "type": "system_action",
            "title": "System added a reviewer to keep timeline",
            "body": "Auto-add support kicked in on Push Notifications.",
            "project_id": p1_id,
            "module_id": push_mod["module_id"],
            "read": True,
            "created_at": _iso(now - timedelta(hours=2)),
        },
    ]
    await db.client_notifications.insert_many(notifs)

    # ──────────────────────────────────────────────────────────
    # Mark client so we never re-seed
    # ──────────────────────────────────────────────────────────
    await db.users.update_one(
        {"user_id": client_id},
        {"$set": {f"mock_seed_markers.{MARKER}": True}},
    )
    logger.info(
        "MOCK SEED: 2 projects, %d modules, %d earnings, %d invoices, "
        "%d deliverables, %d tickets, %d notifications planted for %s",
        len(modules), len(earning_logs), len(invoices),
        len(deliverables), len(tickets), len(notifs),
        client.get("email"),
    )
