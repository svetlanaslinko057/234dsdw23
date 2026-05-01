"""
Pricing Engine — single source of truth for production_mode → price/speed/quality.

Invariants:
  • mode does NOT change UI. mode changes economy + downstream behaviour.
  • Only this module owns price math. Callers must import from here.
  • Project.pricing is a snapshot taken at creation time (historical record).
  • Do NOT duplicate PRODUCTION_MODES anywhere else.
"""
from datetime import datetime, timezone
from typing import Optional


# === PRODUCTION MODES (single source of truth) ===
PRODUCTION_MODES = {
    "ai": {
        "label": "AI build",
        "price_multiplier": 0.60,
        "speed_multiplier": 0.60,
        "quality_band": "standard",
    },
    "hybrid": {
        "label": "AI + Dev",
        "price_multiplier": 0.75,
        "speed_multiplier": 0.80,
        "quality_band": "enhanced",
    },
    "dev": {
        "label": "Full dev",
        "price_multiplier": 1.00,
        "speed_multiplier": 1.00,
        "quality_band": "premium",
    },
}


# === BASE ESTIMATE (deterministic, no AI) ===
def estimate_base_price(goal: Optional[str]) -> float:
    """
    Deterministic base estimate derived from goal length.
    Intentionally simple — replaced later by template/AI-based estimation.
    """
    if not goal:
        return 1000.0
    n = len(goal.strip())
    if n < 40:
        return 800.0
    if n < 120:
        return 1500.0
    return 2500.0


# === CORE PRICING FUNCTION ===
def calculate_project_pricing(base_estimate: float, mode: str) -> dict:
    """Canonical pricing snapshot for a given base estimate + production mode."""
    if mode not in PRODUCTION_MODES:
        raise ValueError(f"Invalid mode: {mode}")
    cfg = PRODUCTION_MODES[mode]
    final_price = round(float(base_estimate) * cfg["price_multiplier"], 2)
    return {
        "mode": mode,
        "base_estimate": round(float(base_estimate), 2),
        "price_multiplier": cfg["price_multiplier"],
        "final_price": final_price,
        "speed_multiplier": cfg["speed_multiplier"],
        "quality_band": cfg["quality_band"],
    }


# === PUBLIC HELPER (used by endpoints) ===
def build_pricing_preview(goal: Optional[str], mode: str) -> dict:
    """Used by POST /api/pricing/preview to preview price before project creation."""
    base_estimate = estimate_base_price(goal)
    pricing = calculate_project_pricing(base_estimate, mode)
    return {
        **pricing,
        "generated_at": datetime.now(timezone.utc).isoformat(),
    }
