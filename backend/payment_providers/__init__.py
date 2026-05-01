"""Phase 4 — Payment Provider Layer.

Provider-agnostic facade. Pick provider via env `PAYMENT_PROVIDER`
(values: `wayforpay`, `mock`). UI never knows which provider runs —
backend just hands it a `payment_url`.
"""
from .base import BasePaymentProvider, PaymentResult, CallbackResult
from .wayforpay import WayForPayProvider
from .mock import MockPaymentProvider
import os


def get_provider() -> BasePaymentProvider:
    name = (os.getenv("PAYMENT_PROVIDER") or "mock").lower()
    if name == "wayforpay" and os.getenv("WAYFORPAY_MERCHANT_ACCOUNT") and os.getenv("WAYFORPAY_SECRET_KEY"):
        return WayForPayProvider()
    return MockPaymentProvider()


__all__ = ["BasePaymentProvider", "PaymentResult", "CallbackResult", "get_provider"]
