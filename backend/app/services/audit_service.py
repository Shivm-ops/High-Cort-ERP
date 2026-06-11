"""
app/services/audit_service.py
==============================
Lightweight utility to write audit log entries.

Usage
-----
    from app.services.audit_service import log_action
    
    log_action(
        db=db,
        user=current_user,
        action="CLIENT_CREATE",
        resource_type="CLIENT",
        resource_id=str(client.id),
        ip=request.client.host if request else None,
        details={"name": client.name},
    )
"""

import json
import logging
from typing import Optional, Any, Dict
from sqlalchemy.orm import Session
from datetime import datetime

logger = logging.getLogger(__name__)


# ── Action constant registry ──────────────────────────────────────────────────
class AuditAction:
    # Auth
    LOGIN_SUCCESS = "LOGIN_SUCCESS"
    LOGIN_FAILURE = "LOGIN_FAILURE"
    LOGIN_BLOCKED = "LOGIN_BLOCKED"
    LOGOUT = "LOGOUT"
    TOKEN_REFRESHED = "TOKEN_REFRESHED"
    PASSWORD_CHANGED = "PASSWORD_CHANGED"
    ACCOUNT_LOCKED = "ACCOUNT_LOCKED"
    ACCOUNT_UNLOCKED = "ACCOUNT_UNLOCKED"

    # Clients
    CLIENT_CREATE = "CLIENT_CREATE"
    CLIENT_UPDATE = "CLIENT_UPDATE"
    CLIENT_DELETE = "CLIENT_DELETE"
    CLIENT_VIEW = "CLIENT_VIEW"

    # Cases
    CASE_CREATE = "CASE_CREATE"
    CASE_UPDATE = "CASE_UPDATE"
    CASE_CLOSE = "CASE_CLOSE"
    CASE_VIEW = "CASE_VIEW"

    # Documents
    DOCUMENT_UPLOAD = "DOCUMENT_UPLOAD"
    DOCUMENT_DOWNLOAD = "DOCUMENT_DOWNLOAD"
    DOCUMENT_DELETE = "DOCUMENT_DELETE"

    # Invoices
    INVOICE_CREATE = "INVOICE_CREATE"
    INVOICE_UPDATE = "INVOICE_UPDATE"
    INVOICE_SEND = "INVOICE_SEND"
    PAYMENT_RECORDED = "PAYMENT_RECORDED"

    # Users / KYC
    USER_INVITE = "USER_INVITE"
    USER_SUSPEND = "USER_SUSPEND"
    USER_ACTIVATE = "USER_ACTIVATE"
    KYC_APPROVE = "KYC_APPROVE"
    KYC_REJECT = "KYC_REJECT"

    # Admin
    ADMIN_ACTION = "ADMIN_ACTION"
    FIRM_CREATE = "FIRM_CREATE"
    FIRM_SUSPEND = "FIRM_SUSPEND"


def log_action(
    db: Session,
    action: str,
    resource_type: Optional[str] = None,
    resource_id: Optional[str] = None,
    user=None,
    ip: Optional[str] = None,
    user_agent: Optional[str] = None,
    details: Optional[Dict[str, Any]] = None,
    status: str = "success",
) -> None:
    """
    Write a single audit log entry. Never raises — failures are logged but silently ignored
    so they don't break the main request flow.
    """
    try:
        from app.models.audit_log import AuditLog

        entry = AuditLog(
            user_id=user.id if user else None,
            firm_id=user.firm_id if user else None,
            action=action,
            resource_type=resource_type,
            resource_id=str(resource_id) if resource_id else None,
            ip_address=ip,
            user_agent=user_agent,
            details=json.dumps(details, default=str) if details else None,
            status=status,
            created_at=datetime.utcnow(),
        )
        db.add(entry)
        db.flush()   # write within existing transaction; caller commits
    except Exception as e:
        logger.warning(f"Audit log write failed (non-fatal): {e}")


def extract_ip(request) -> Optional[str]:
    """Extract real IP from request, respecting X-Forwarded-For proxy headers."""
    if request is None:
        return None
    forwarded_for = request.headers.get("X-Forwarded-For")
    if forwarded_for:
        return forwarded_for.split(",")[0].strip()
    return getattr(getattr(request, "client", None), "host", None)
