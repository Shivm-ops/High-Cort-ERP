"""
app/api/v1/subscriptions.py
===========================
Subscription & Billing API with production-grade Razorpay integration.

Payment flow
------------
1. POST /checkout-order
     Server prices the plan, creates a Razorpay order and stores a PENDING
     PaymentTransaction (plan, cycle, amounts) keyed by razorpay_order_id.
2. Browser opens Razorpay Checkout with that order_id.
3. POST /verify-payment   (browser callback)
     Checkout signature verified -> payment fetched from Razorpay API ->
     order/amount/status checked -> subscription activated.
4. POST /webhook/razorpay (server-to-server, safety net)
     Same activation path if the user closed the tab before step 3.
     Also records payment.failed and refunds.

Activation is idempotent and row-locked, so steps 3 and 4 can race safely
and a replayed request can never extend a subscription twice.
"""

import json
import uuid
import logging
from datetime import datetime, timedelta
from html import escape
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, status, Request, Header, BackgroundTasks
from fastapi.responses import HTMLResponse
from pydantic import BaseModel
from sqlalchemy import func, text
from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.database import get_db
from app.core.permissions import require_firm_member
from app.models.user import User
from app.models.subscription import (
    SubscriptionPlan,
    TenantSubscription,
    SubscriptionStatus,
    PaymentTransaction,
    PaymentStatus,
    GatewayProvider,
)
from app.services.razorpay_service import (
    RazorpayError,
    get_razorpay_credentials,
    is_razorpay_configured,
    is_test_mode,
    calculate_price_breakdown,
    create_razorpay_order,
    ensure_payment_captured,
    verify_payment_signature,
    verify_webhook_signature,
    to_paise,
)
from app.services.subscription_emails import send_subscription_activated_email

logger = logging.getLogger("subscriptions_api")
router = APIRouter()

CYCLE_DAYS = {"monthly": 30, "quarterly": 90, "half_yearly": 180, "yearly": 365}
CYCLE_LABEL = {"monthly": "Monthly", "quarterly": "Quarterly", "half_yearly": "Half-Yearly", "yearly": "Annual"}


# ─── Schemas ──────────────────────────────────────────────────────────────────

class CheckoutOrderRequest(BaseModel):
    plan_id: uuid.UUID
    billing_cycle: str = "monthly"


class PaymentVerifyRequest(BaseModel):
    razorpay_order_id: str
    razorpay_payment_id: str
    razorpay_signature: str
    # Accepted for backwards compatibility but IGNORED — the server uses the
    # plan/cycle stored against the order at checkout time.
    plan_id: Optional[uuid.UUID] = None
    billing_cycle: Optional[str] = None


class PaymentFailedRequest(BaseModel):
    razorpay_order_id: str
    razorpay_payment_id: Optional[str] = None
    reason: Optional[str] = None


# ─── Helpers ──────────────────────────────────────────────────────────────────

def _enum_val(v):
    return v.value if hasattr(v, "value") else str(v)


def _plan_base_price(plan: SubscriptionPlan, cycle: str) -> float:
    if cycle == "quarterly":
        return plan.price_quarterly or round(plan.price_monthly * 3 * 0.9, 2)
    if cycle == "half_yearly":
        return plan.price_half_yearly or round(plan.price_monthly * 6 * 0.85, 2)
    if cycle == "yearly":
        return plan.price_yearly
    return plan.price_monthly


def _financial_year(d: datetime) -> str:
    start = d.year if d.month >= 4 else d.year - 1
    return f"{start}-{str(start + 1)[-2:]}"


def _next_invoice_number(db: Session, when: datetime) -> str:
    """Sequential, per financial year: FC/2026-27/00001 (GST rule 46 compliant format)."""
    prefix = f"FC/{_financial_year(when)}/"
    if db.bind is not None and db.bind.dialect.name == "postgresql":
        # Serialise numbering across concurrent activations (released at commit)
        db.execute(text("SELECT pg_advisory_xact_lock(780031)"))
    count = db.query(func.count(PaymentTransaction.id)).filter(
        PaymentTransaction.invoice_number.like(f"{prefix}%")
    ).scalar() or 0
    return f"{prefix}{count + 1:05d}"


def _activate_from_transaction(db: Session, txn: PaymentTransaction, payment: dict) -> bool:
    """
    Mark a PENDING transaction as SUCCESS and extend the firm's subscription.
    Caller must hold a row lock on `txn`. Returns True if activation happened
    now, False if it had already been processed (idempotent).
    """
    if txn.status == PaymentStatus.SUCCESS:
        return False

    plan = db.query(SubscriptionPlan).filter(SubscriptionPlan.id == txn.plan_id).first()
    if not plan:
        raise HTTPException(status_code=404, detail="Plan for this order no longer exists")

    cycle = txn.billing_cycle or "monthly"
    days = CYCLE_DAYS.get(cycle, 30)
    now = datetime.utcnow()

    sub = (
        db.query(TenantSubscription)
        .filter(TenantSubscription.firm_id == txn.firm_id)
        .with_for_update()
        .first()
    )
    if sub and sub.end_date and sub.end_date > now and sub.status == SubscriptionStatus.ACTIVE and sub.plan_id == plan.id:
        period_start = sub.end_date          # same plan renewal → stack on top
    else:
        period_start = now                   # new / upgrade / lapsed → start today
    period_end = period_start + timedelta(days=days)

    if sub:
        sub.plan_id = plan.id
        sub.status = SubscriptionStatus.ACTIVE
        sub.billing_cycle = cycle
        if period_start == now:
            sub.start_date = now
        sub.end_date = period_end
        sub.last_reminder_type = None
        sub.auto_renew = True
    else:
        db.add(TenantSubscription(
            firm_id=txn.firm_id,
            plan_id=plan.id,
            status=SubscriptionStatus.ACTIVE,
            billing_cycle=cycle,
            start_date=now,
            end_date=period_end,
            auto_renew=True,
        ))

    txn.status = PaymentStatus.SUCCESS
    txn.razorpay_payment_id = payment.get("id")
    txn.gateway_reference = payment.get("id")
    txn.payment_method = payment.get("method")
    txn.failure_reason = None
    txn.paid_at = now
    txn.period_start = period_start
    txn.period_end = period_end
    txn.invoice_number = _next_invoice_number(db, now)
    txn.invoice_url = f"/api/v1/subscriptions/invoices/{txn.id}/download"
    db.commit()
    db.refresh(txn)
    logger.info(f"Activated {plan.tier}/{cycle} for firm {txn.firm_id} via {txn.razorpay_order_id}")
    return True


def _queue_activation_email(background_tasks: BackgroundTasks, db: Session, txn: PaymentTransaction, user: Optional[User] = None):
    if user is None:
        user = db.query(User).filter(User.firm_id == txn.firm_id, User.is_active.is_(True)).order_by(User.created_at).first()
    if not user or not user.email:
        return
    background_tasks.add_task(
        send_subscription_activated_email,
        user_email=user.email,
        user_name=user.full_name or "Advocate",
        plan_name=txn.plan.name if txn.plan else "Fastcase Plan",
        billing_cycle=txn.billing_cycle or "monthly",
        amount_paid=txn.amount,
        valid_until=txn.period_end,
        invoice_number=txn.invoice_number,
        invoice_url=f"https://app.{settings.DOMAIN}/settings?tab=subscription",
    )


def _serialize_txn(t: PaymentTransaction) -> dict:
    return {
        "id": str(t.id),
        "invoice_number": t.invoice_number,
        "plan_name": t.plan.name if t.plan else None,
        "billing_cycle": t.billing_cycle,
        "base_amount": t.base_amount,
        "gst_amount": t.gst_amount,
        "amount": t.amount,
        "currency": t.currency,
        "status": _enum_val(t.status),
        "gateway": _enum_val(t.gateway),
        "gateway_reference": t.gateway_reference,
        "razorpay_order_id": t.razorpay_order_id,
        "payment_method": t.payment_method,
        "failure_reason": t.failure_reason,
        "period_start": t.period_start.isoformat() if t.period_start else None,
        "period_end": t.period_end.isoformat() if t.period_end else None,
        "created_at": t.created_at.isoformat() if t.created_at else None,
        "paid_at": t.paid_at.isoformat() if t.paid_at else None,
        "invoice_url": t.invoice_url if t.status == PaymentStatus.SUCCESS else None,
    }


def _seed_default_plans(db: Session):
    db.add_all([
        SubscriptionPlan(name="Advocate Chambers Basic", tier="basic", price_monthly=0, price_quarterly=0,
                         price_half_yearly=0, price_yearly=0, max_users=1, storage_limit_gb=2.0,
                         features="intake, cases, clients, calendar", is_active=True),
        SubscriptionPlan(name="Advocate Chambers Professional", tier="professional", price_monthly=1999,
                         price_quarterly=5397, price_half_yearly=10195, price_yearly=19990, max_users=5,
                         storage_limit_gb=15.0,
                         features="intake, cases, clients, calendar, drafts, billing, official_cause_lists",
                         is_active=True),
        SubscriptionPlan(name="Law Firm Enterprise", tier="enterprise", price_monthly=4999, price_quarterly=13497,
                         price_half_yearly=25495, price_yearly=49990, max_users=25, storage_limit_gb=100.0,
                         features="intake, cases, clients, calendar, drafts, billing, official_cause_lists, ai_draft_studio, mact_management, priority_support",
                         is_active=True),
    ])
    db.commit()


# ─── Endpoints ────────────────────────────────────────────────────────────────

@router.get("/me")
def get_my_subscription(db: Session = Depends(get_db), current_user: User = Depends(require_firm_member)):
    sub = db.query(TenantSubscription).filter(TenantSubscription.firm_id == current_user.firm_id).first()

    plans = db.query(SubscriptionPlan).filter(SubscriptionPlan.is_active == True).order_by(SubscriptionPlan.price_monthly).all()
    if not plans:
        _seed_default_plans(db)
        plans = db.query(SubscriptionPlan).filter(SubscriptionPlan.is_active == True).order_by(SubscriptionPlan.price_monthly).all()

    if sub and sub.plan:
        days_remaining = max(0, (sub.end_date.date() - datetime.utcnow().date()).days) if sub.end_date else None
        current_plan = {
            "id": str(sub.plan.id), "name": sub.plan.name, "tier": sub.plan.tier,
            "status": _enum_val(sub.status),
            "start_date": sub.start_date.isoformat() if sub.start_date else None,
            "end_date": sub.end_date.isoformat() if sub.end_date else None,
            "days_remaining": days_remaining, "billing_cycle": sub.billing_cycle,
            "auto_renew": sub.auto_renew, "features": sub.plan.features,
            "max_users": sub.plan.max_users, "storage_limit_gb": sub.plan.storage_limit_gb,
        }
    else:
        current_plan = {
            "id": None, "name": "No Active Subscription", "tier": "none", "status": "inactive",
            "start_date": None, "end_date": None, "days_remaining": 0, "billing_cycle": "monthly",
            "auto_renew": False, "features": "", "max_users": 1, "storage_limit_gb": 1.0,
        }

    key_id, _ = get_razorpay_credentials()
    return {
        "current_subscription": current_plan,
        "razorpay_key_id": key_id,
        "payments_enabled": is_razorpay_configured(),
        "test_mode": is_test_mode(),
        "gst_rate": settings.GST_RATE,
        "available_plans": [
            {
                "id": str(p.id), "name": p.name, "tier": p.tier,
                "price_monthly": p.price_monthly,
                "price_quarterly": _plan_base_price(p, "quarterly"),
                "price_half_yearly": _plan_base_price(p, "half_yearly"),
                "price_yearly": p.price_yearly,
                "max_users": p.max_users, "storage_limit_gb": p.storage_limit_gb, "features": p.features,
            }
            for p in plans
        ],
    }


@router.post("/checkout-order")
async def create_checkout_order(
    payload: CheckoutOrderRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_firm_member),
):
    if not current_user.firm_id:
        raise HTTPException(status_code=400, detail="Your account is not linked to a firm")
    if not is_razorpay_configured():
        raise HTTPException(status_code=503, detail="Online payments are not enabled yet. Please contact support@fastcase.in.")

    cycle = (payload.billing_cycle or "monthly").lower()
    if cycle not in CYCLE_DAYS:
        raise HTTPException(status_code=400, detail="Invalid billing cycle")

    plan = db.query(SubscriptionPlan).filter(SubscriptionPlan.id == payload.plan_id, SubscriptionPlan.is_active == True).first()
    if not plan:
        raise HTTPException(status_code=404, detail="Selected plan does not exist")

    base = _plan_base_price(plan, cycle)
    if not base or base <= 0:
        raise HTTPException(status_code=400, detail="This plan is free and does not require payment")

    breakdown = calculate_price_breakdown(base)
    txn_id = uuid.uuid4()
    firm_name = current_user.firm.name if current_user.firm else "Chambers"

    try:
        order = await create_razorpay_order(
            amount_inr=breakdown["total_amount"],
            receipt=f"fc_{txn_id.hex[:20]}",
            notes={
                "txn_id": str(txn_id),
                "firm_id": str(current_user.firm_id),
                "firm_name": firm_name,
                "user_email": current_user.email,
                "plan_tier": plan.tier,
                "billing_cycle": cycle,
            },
        )
    except RazorpayError as exc:
        raise HTTPException(status_code=502, detail=f"Payment gateway error: {exc}")

    db.add(PaymentTransaction(
        id=txn_id,
        firm_id=current_user.firm_id,
        plan_id=plan.id,
        billing_cycle=cycle,
        base_amount=breakdown["base_amount"],
        gst_amount=breakdown["gst_amount"],
        amount=breakdown["total_amount"],
        currency="INR",
        status=PaymentStatus.PENDING,
        gateway=GatewayProvider.RAZORPAY,
        razorpay_order_id=order["id"],
    ))
    db.commit()

    key_id, _ = get_razorpay_credentials()
    return {
        "order_id": order["id"],
        "amount": order["amount"],
        "currency": order.get("currency", "INR"),
        "key_id": key_id,
        "plan_name": plan.name,
        "billing_cycle": cycle,
        "breakdown": breakdown,
        "firm_name": firm_name,
        "prefill": {
            "name": current_user.full_name or "",
            "email": current_user.email,
            "contact": current_user.phone or "",
        },
    }


@router.post("/verify-payment")
async def verify_payment(
    payload: PaymentVerifyRequest,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_firm_member),
):
    if not verify_payment_signature(payload.razorpay_order_id, payload.razorpay_payment_id, payload.razorpay_signature):
        raise HTTPException(status_code=400, detail="Payment verification failed: invalid signature")

    txn = (
        db.query(PaymentTransaction)
        .filter(PaymentTransaction.razorpay_order_id == payload.razorpay_order_id,
                PaymentTransaction.firm_id == current_user.firm_id)
        .with_for_update()
        .first()
    )
    if not txn:
        raise HTTPException(status_code=404, detail="Order not found for your account")

    if txn.status != PaymentStatus.SUCCESS:
        try:
            payment = await ensure_payment_captured(payload.razorpay_payment_id, txn.razorpay_order_id, to_paise(txn.amount))
        except RazorpayError as exc:
            db.rollback()
            raise HTTPException(status_code=400, detail=f"Payment could not be confirmed: {exc}")
        if _activate_from_transaction(db, txn, payment):
            _queue_activation_email(background_tasks, db, txn, current_user)

    plan_name = txn.plan.name if txn.plan else "Plan"
    return {
        "success": True,
        "message": f"Payment received! {plan_name} is active until {txn.period_end.strftime('%d %b %Y')}.",
        "plan_name": plan_name,
        "valid_until": txn.period_end.isoformat(),
        "invoice_number": txn.invoice_number,
        "transaction_id": str(txn.id),
        "amount": txn.amount,
    }


@router.post("/payment-failed")
def report_payment_failed(
    payload: PaymentFailedRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_firm_member),
):
    """Browser-side failure report (informational; webhook is authoritative)."""
    txn = db.query(PaymentTransaction).filter(
        PaymentTransaction.razorpay_order_id == payload.razorpay_order_id,
        PaymentTransaction.firm_id == current_user.firm_id,
    ).first()
    if txn and txn.status == PaymentStatus.PENDING:
        txn.failure_reason = (payload.reason or "Payment failed")[:500]
        if payload.razorpay_payment_id:
            txn.razorpay_payment_id = payload.razorpay_payment_id
        db.commit()
    return {"ok": True}


@router.post("/webhook/razorpay")
async def razorpay_webhook(
    request: Request,
    background_tasks: BackgroundTasks,
    x_razorpay_signature: Optional[str] = Header(None),
    db: Session = Depends(get_db),
):
    body = await request.body()
    if not verify_webhook_signature(body, x_razorpay_signature):
        logger.warning("Rejected Razorpay webhook: bad or missing signature")
        raise HTTPException(status_code=400, detail="Invalid signature")

    try:
        event = json.loads(body.decode("utf-8"))
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid JSON")

    name = event.get("event")
    data = event.get("payload", {})
    payment = (data.get("payment") or {}).get("entity") or {}
    order_id = payment.get("order_id") or ((data.get("order") or {}).get("entity") or {}).get("id")
    logger.info(f"Razorpay webhook: {name} order={order_id} payment={payment.get('id')}")

    if not order_id:
        return {"status": "ignored"}

    txn = db.query(PaymentTransaction).filter(PaymentTransaction.razorpay_order_id == order_id).with_for_update().first()
    if not txn:
        logger.warning(f"Webhook for unknown order {order_id}")
        return {"status": "unknown_order"}  # 200 so Razorpay stops retrying

    try:
        if name in ("payment.captured", "order.paid"):
            if txn.status != PaymentStatus.SUCCESS:
                if int(payment.get("amount", 0)) != to_paise(txn.amount):
                    logger.error(f"Amount mismatch on order {order_id}: {payment.get('amount')} vs {to_paise(txn.amount)}")
                    db.rollback()
                    return {"status": "amount_mismatch"}
                if _activate_from_transaction(db, txn, payment):
                    _queue_activation_email(background_tasks, db, txn)

        elif name == "payment.authorized":
            # Auto-capture disabled in dashboard → capture now; payment.captured will follow.
            if txn.status == PaymentStatus.PENDING:
                try:
                    captured = await ensure_payment_captured(payment["id"], order_id, to_paise(txn.amount))
                    if _activate_from_transaction(db, txn, captured):
                        _queue_activation_email(background_tasks, db, txn)
                except RazorpayError as exc:
                    logger.error(f"Capture failed for {payment.get('id')}: {exc}")
                    db.rollback()

        elif name == "payment.failed":
            if txn.status == PaymentStatus.PENDING:
                txn.status = PaymentStatus.FAILED
                txn.razorpay_payment_id = payment.get("id")
                txn.payment_method = payment.get("method")
                txn.failure_reason = (payment.get("error_description") or "Payment failed")[:500]
                db.commit()

        elif name in ("refund.processed", "refund.created"):
            if txn.status == PaymentStatus.SUCCESS:
                txn.status = PaymentStatus.REFUNDED
                db.commit()
        else:
            db.rollback()
    except HTTPException:
        db.rollback()
        raise
    except Exception as exc:
        db.rollback()
        logger.exception(f"Webhook processing error: {exc}")
        raise HTTPException(status_code=500, detail="Webhook processing error")  # Razorpay will retry

    return {"status": "ok"}


@router.get("/invoices")
def list_firm_invoices(db: Session = Depends(get_db), current_user: User = Depends(require_firm_member)):
    txns = (
        db.query(PaymentTransaction)
        .filter(PaymentTransaction.firm_id == current_user.firm_id)
        .order_by(PaymentTransaction.created_at.desc())
        .all()
    )
    # Hide abandoned checkouts (pending with no payment attempt) older than 1 hour
    cutoff = datetime.utcnow() - timedelta(hours=1)
    visible = [
        t for t in txns
        if not (t.status == PaymentStatus.PENDING and not t.razorpay_payment_id and t.created_at and t.created_at < cutoff)
    ]
    return [_serialize_txn(t) for t in visible]


@router.get("/invoices/{txn_id}/download", response_class=HTMLResponse)
def download_invoice(txn_id: uuid.UUID, db: Session = Depends(get_db), current_user: User = Depends(require_firm_member)):
    q = db.query(PaymentTransaction).filter(PaymentTransaction.id == txn_id)
    if not current_user.is_superadmin:
        q = q.filter(PaymentTransaction.firm_id == current_user.firm_id)
    t = q.first()
    if not t or t.status not in (PaymentStatus.SUCCESS, PaymentStatus.REFUNDED):
        raise HTTPException(status_code=404, detail="Invoice not found")
    return HTMLResponse(_render_invoice_html(t))


@router.post("/cancel")
def cancel_subscription(db: Session = Depends(get_db), current_user: User = Depends(require_firm_member)):
    sub = db.query(TenantSubscription).filter(TenantSubscription.firm_id == current_user.firm_id).first()
    if not sub:
        raise HTTPException(status_code=404, detail="No active subscription found")
    sub.auto_renew = False
    db.commit()
    return {"message": "Auto-renewal disabled. Your plan stays active until the expiry date."}


# ─── Invoice rendering ────────────────────────────────────────────────────────

def _inr(v: Optional[float]) -> str:
    return f"₹{(v or 0):,.2f}"


def _render_invoice_html(t: PaymentTransaction) -> str:
    firm = t.firm
    plan_name = t.plan.name if t.plan else "Fastcase Subscription"
    base = t.base_amount if t.base_amount is not None else round(t.amount / (1 + (settings.GST_RATE or 0)), 2)
    gst = t.gst_amount if t.gst_amount is not None else round(t.amount - base, 2)
    gst_registered = bool(settings.COMPANY_GSTIN) and gst > 0
    title = "TAX INVOICE" if gst_registered else "PAYMENT RECEIPT"
    rate_pct = round((settings.GST_RATE or 0) * 100 / 2, 2)
    period = ""
    if t.period_start and t.period_end:
        period = f"{t.period_start.strftime('%d %b %Y')} – {t.period_end.strftime('%d %b %Y')}"
    e = lambda s: escape(str(s or ""))

    tax_rows = ""
    if gst > 0:
        half = round(gst / 2, 2)
        tax_rows = f"""
        <tr><td colspan="2" class="r">CGST @ {rate_pct}%</td><td class="r">{_inr(half)}</td></tr>
        <tr><td colspan="2" class="r">SGST @ {rate_pct}%</td><td class="r">{_inr(gst - half)}</td></tr>"""

    return f"""<!doctype html><html><head><meta charset="utf-8"><title>{e(t.invoice_number)}</title>
<style>
 body{{font-family:-apple-system,Segoe UI,Roboto,Arial,sans-serif;color:#0f172a;max-width:780px;margin:24px auto;padding:0 16px}}
 .hdr{{display:flex;justify-content:space-between;border-bottom:3px solid #059669;padding-bottom:16px}}
 h1{{margin:0;color:#059669;font-size:22px}} h2{{margin:0;font-size:18px;letter-spacing:1px}}
 .muted{{color:#64748b;font-size:12px;line-height:1.6}} .grid{{display:flex;justify-content:space-between;margin:24px 0}}
 table{{width:100%;border-collapse:collapse;font-size:13px}} th{{background:#f1f5f9;text-align:left;padding:10px}}
 td{{padding:10px;border-bottom:1px solid #e2e8f0}} .r{{text-align:right}} .tot td{{font-weight:700;font-size:15px;border-top:2px solid #0f172a}}
 .badge{{display:inline-block;padding:2px 8px;border-radius:10px;font-size:11px;font-weight:700;background:#d1fae5;color:#065f46}}
 .refund{{background:#fee2e2;color:#991b1b}} .btn{{margin:24px 0;padding:10px 18px;background:#059669;color:#fff;border:0;border-radius:8px;cursor:pointer}}
 @media print{{.btn{{display:none}}}}
</style></head><body>
<div class="hdr">
  <div><h1>{e(settings.COMPANY_LEGAL_NAME)}</h1>
    <div class="muted">{e(settings.COMPANY_ADDRESS)}<br>State: {e(settings.COMPANY_STATE)}
    {"<br>GSTIN: " + e(settings.COMPANY_GSTIN) if settings.COMPANY_GSTIN else ""}<br>{e(settings.COMPANY_SUPPORT_EMAIL)}</div></div>
  <div style="text-align:right"><h2>{title}</h2>
    <div class="muted">Invoice No: <b>{e(t.invoice_number)}</b><br>Date: {t.paid_at.strftime('%d %b %Y') if t.paid_at else ''}<br>
    <span class="badge {'refund' if t.status == PaymentStatus.REFUNDED else ''}">{'REFUNDED' if t.status == PaymentStatus.REFUNDED else 'PAID'}</span></div></div>
</div>
<div class="grid">
  <div><div class="muted">BILLED TO</div><b>{e(firm.name if firm else '')}</b>
    <div class="muted">{e(firm.address if firm else '')}{"<br>GSTIN: " + e(firm.gst_no) if firm and firm.gst_no else ""}<br>{e(firm.email if firm else '')}</div></div>
  <div style="text-align:right" class="muted">Payment ID: {e(t.razorpay_payment_id)}<br>Order ID: {e(t.razorpay_order_id)}<br>Method: {e((t.payment_method or '').upper())}</div>
</div>
<table>
 <tr><th>Description</th><th>SAC</th><th class="r">Amount</th></tr>
 <tr><td><b>{e(plan_name)}</b> — {e(CYCLE_LABEL.get(t.billing_cycle or '', t.billing_cycle))} plan<br><span class="muted">{period}</span></td><td>998314</td><td class="r">{_inr(base)}</td></tr>
 {tax_rows}
 <tr class="tot"><td colspan="2" class="r">Total</td><td class="r">{_inr(t.amount)}</td></tr>
</table>
<p class="muted">This is a computer-generated document and does not require a signature. Payment processed securely by Razorpay.</p>
<button class="btn" onclick="window.print()">Print / Save as PDF</button>
</body></html>"""
