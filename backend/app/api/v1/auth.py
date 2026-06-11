"""
app/api/v1/auth.py
===================
Authentication endpoints with full security hardening:
  - Login rate limiting + account lockout (5 failures → 15 min lock)
  - Password strength validation on registration
  - Login / logout audit trail
  - Proper JWT session tracking (JTI-based revocation)
  - Password change with old-password verification
"""

import re
import uuid
from datetime import datetime, timedelta
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, status, Request
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from pydantic import BaseModel, EmailStr, field_validator

from app.core.database import get_db
from app.core.security import (
    verify_password, create_access_token, create_refresh_token,
    get_password_hash, decode_token, get_current_user
)
from app.core.config import settings
from app.models.user import User
from app.models.security import LoginHistory, UserSession
from app.services.audit_service import log_action, extract_ip, AuditAction

router = APIRouter()

# ── Constants ─────────────────────────────────────────────────────────────────
MAX_FAILED_ATTEMPTS = 5
LOCKOUT_MINUTES = 15
MIN_PASSWORD_LENGTH = 8


# ── Helpers ───────────────────────────────────────────────────────────────────

def validate_password_strength(password: str) -> str:
    """Raise ValueError if password doesn't meet policy."""
    if len(password) < MIN_PASSWORD_LENGTH:
        raise ValueError(f"Password must be at least {MIN_PASSWORD_LENGTH} characters")
    if not re.search(r"[A-Z]", password):
        raise ValueError("Password must contain at least one uppercase letter")
    if not re.search(r"[0-9]", password):
        raise ValueError("Password must contain at least one digit")
    if not re.search(r"[!@#$%^&*(),.?\":{}|<>_\-]", password):
        raise ValueError("Password must contain at least one special character (!@#$%^&*...)")
    return password


def _check_account_locked(user: User) -> None:
    """Raise 423 if account is currently locked."""
    if user.locked_until and user.locked_until > datetime.utcnow():
        remaining = int((user.locked_until - datetime.utcnow()).total_seconds() // 60) + 1
        raise HTTPException(
            status_code=status.HTTP_423_LOCKED,
            detail=f"Account is locked due to too many failed attempts. Try again in {remaining} minute(s).",
        )


def _record_failed_attempt(user: User, db: Session, ip: Optional[str], user_agent: Optional[str]) -> None:
    """Increment failure counter and lock account if threshold crossed."""
    user.failed_login_attempts = (user.failed_login_attempts or 0) + 1
    if user.failed_login_attempts >= MAX_FAILED_ATTEMPTS:
        user.locked_until = datetime.utcnow() + timedelta(minutes=LOCKOUT_MINUTES)
        user.failed_login_attempts = 0   # reset counter after locking

    # Write to login_history
    history = LoginHistory(
        user_id=user.id,
        ip_address=ip,
        user_agent=user_agent,
        success=False,
        failure_reason="incorrect_password",
        attempted_at=datetime.utcnow(),
    )
    db.add(history)
    db.commit()


def _record_success(user: User, db: Session, ip: Optional[str], user_agent: Optional[str]) -> None:
    """Reset failure counter and update last_login."""
    user.failed_login_attempts = 0
    user.locked_until = None
    user.last_login = datetime.utcnow()
    user.login_count = (user.login_count or 0) + 1

    history = LoginHistory(
        user_id=user.id,
        ip_address=ip,
        user_agent=user_agent,
        success=True,
        attempted_at=datetime.utcnow(),
    )
    db.add(history)


def _create_session(user: User, access_token: str, db: Session, ip: Optional[str], user_agent: Optional[str]) -> str:
    """Decode the token's JTI and store an active session record."""
    try:
        payload = decode_token(access_token)
        jti = payload.get("jti", str(uuid.uuid4()))
    except Exception:
        jti = str(uuid.uuid4())

    session = UserSession(
        user_id=user.id,
        token_jti=jti,
        device_info=user_agent[:255] if user_agent else None,
        ip_address=ip,
        created_at=datetime.utcnow(),
        expires_at=datetime.utcnow() + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES),
        is_active=True,
    )
    db.add(session)
    return jti


def _get_user_subscription(user: User, db: Session) -> dict:
    """Helper to extract subscription info for the token payload."""
    if user.is_superadmin:
        return {"tier": "enterprise", "features": ["ai_tools", "mact_management", "billing", "unlimited"], "max_users": 99999}
    if getattr(user, "firm_id", None) is None:
        return {"tier": "none", "features": [], "max_users": 0}

    from app.models.subscription import TenantSubscription
    sub = db.query(TenantSubscription).filter(
        TenantSubscription.firm_id == user.firm_id,
        TenantSubscription.status == "active"
    ).first()

    if not sub or not sub.plan:
        return {"tier": "none", "features": [], "max_users": 0}

    feats = sub.plan.features or ""
    features_list = [f.strip() for f in feats.split(",") if f.strip()]
    return {
        "tier": sub.plan.tier,
        "features": features_list,
        "max_users": sub.plan.max_users
    }


# ── Schemas ───────────────────────────────────────────────────────────────────

class LoginResponse(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"
    user: dict


class RegisterRequest(BaseModel):
    email: EmailStr
    password: str
    full_name: str
    phone: str
    bar_council_no: Optional[str] = None

    @field_validator("password")
    @classmethod
    def password_strength(cls, v):
        return validate_password_strength(v)

    @field_validator("full_name")
    @classmethod
    def full_name_not_empty(cls, v):
        if not v.strip():
            raise ValueError("Full name cannot be empty")
        return v.strip()


class RefreshRequest(BaseModel):
    refresh_token: str


class ChangePasswordRequest(BaseModel):
    current_password: str
    new_password: str

    @field_validator("new_password")
    @classmethod
    def new_password_strength(cls, v):
        return validate_password_strength(v)


class LogoutRequest(BaseModel):
    access_token: Optional[str] = None   # optional: client may pass it explicitly


# ── Endpoints ─────────────────────────────────────────────────────────────────

@router.post("/token", response_model=LoginResponse)
async def login(
    request: Request,
    form_data: OAuth2PasswordRequestForm = Depends(),
    db: Session = Depends(get_db),
):
    ip = extract_ip(request)
    user_agent = request.headers.get("User-Agent", "")

    # 1. Lookup user
    user = db.query(User).filter(User.email == form_data.username).first()

    if not user:
        # Don't reveal whether email exists
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )

    # 2. Account lockout check
    _check_account_locked(user)

    # 2.5 Anomaly detection: >3 unique IPs in last hour
    recent_ips = db.query(LoginHistory.ip_address).filter(
        LoginHistory.user_id == user.id,
        LoginHistory.attempted_at > datetime.utcnow() - timedelta(hours=1)
    ).distinct().count()

    if recent_ips > 3:
        log_action(db, AuditAction.SECURITY_ALERT, "AUTH", str(user.id), user=user, ip=ip,
                   details={"anomaly": "multiple_ips", "unique_ips_last_hour": recent_ips}, status="blocked")
        user.locked_until = datetime.utcnow() + timedelta(minutes=LOCKOUT_MINUTES)
        db.commit()
        raise HTTPException(
            status_code=status.HTTP_423_LOCKED,
            detail="Account temporarily locked due to suspicious login activity.",
        )

    # 3. Verify password
    if not verify_password(form_data.password, user.hashed_password):
        _record_failed_attempt(user, db, ip, user_agent)
        log_action(db, AuditAction.LOGIN_FAILURE, "AUTH", str(user.id), user=user, ip=ip,
                   details={"reason": "incorrect_password"}, status="failure")
        # Re-check lockout (may have just triggered)
        if user.locked_until and user.locked_until > datetime.utcnow():
            log_action(db, AuditAction.ACCOUNT_LOCKED, "USER", str(user.id), user=user, ip=ip,
                       details={"locked_until": str(user.locked_until)}, status="blocked")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )

    if not user.is_active:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Account deactivated")

    # 4. Issue tokens with JTI
    jti = str(uuid.uuid4())
    access_token = create_access_token({"sub": str(user.id), "role": user.user_type, "jti": jti})
    refresh_token = create_refresh_token({"sub": str(user.id)})

    # 5. Record success + session
    _record_success(user, db, ip, user_agent)
    _create_session(user, access_token, db, ip, user_agent)
    db.commit()

    log_action(db, AuditAction.LOGIN_SUCCESS, "AUTH", str(user.id), user=user, ip=ip,
               details={"login_count": user.login_count})
    db.commit()

    sub_data = _get_user_subscription(user, db)

    return LoginResponse(
        access_token=access_token,
        refresh_token=refresh_token,
        user={
            "id": str(user.id),
            "email": user.email,
            "full_name": user.full_name,
            "role": user.user_type,
            "bar_council_no": user.bar_council_no,
            "is_superadmin": user.is_superadmin,
            "firm_id": str(user.firm_id) if user.firm_id else None,
            "subscription": sub_data,
        }
    )


@router.post("/client-login", response_model=LoginResponse)
async def client_login(
    request: Request,
    form_data: OAuth2PasswordRequestForm = Depends(),
    db: Session = Depends(get_db),
):
    ip = extract_ip(request)
    user_agent = request.headers.get("User-Agent", "")

    # Local import to avoid circular dependency
    from app.models.client import Client

    client = db.query(Client).filter(Client.email == form_data.username).first()

    if not client or not client.portal_access_enabled:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password, or portal access disabled.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    if not client.hashed_password or not verify_password(form_data.password, client.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )

    if not client.is_active or client.is_deleted:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Client account deactivated")

    jti = str(uuid.uuid4())
    access_token = create_access_token({"sub": str(client.id), "role": "client", "jti": jti})
    refresh_token = create_refresh_token({"sub": str(client.id)})

    client.last_login = datetime.utcnow()
    db.commit()

    return LoginResponse(
        access_token=access_token,
        refresh_token=refresh_token,
        user={
            "id": str(client.id),
            "email": client.email,
            "full_name": client.name,
            "role": "client",
            "is_superadmin": False,
            "firm_id": str(client.firm_id) if client.firm_id else None,
            "subscription": _get_user_subscription(client, db),
        }
    )



@router.post("/register", status_code=status.HTTP_201_CREATED)
async def register(data: RegisterRequest, db: Session = Depends(get_db)):
    if db.query(User).filter(User.email == data.email).first():
        raise HTTPException(status_code=400, detail="Email already registered")

    from app.models.firm import Firm
    from app.models.subscription import SubscriptionPlan, TenantSubscription, SubscriptionStatus

    # Create a new firm (Individual Practice)
    new_firm = Firm(
        name=f"{data.full_name}'s Practice",
        type="INDIVIDUAL",
        phone=data.phone,
        is_active=True
    )
    db.add(new_firm)
    db.flush()

    # Assign free trial plan if exists
    trial_plan = db.query(SubscriptionPlan).filter(SubscriptionPlan.tier == "free_trial").first()
    if trial_plan:
        sub = TenantSubscription(
            firm_id=new_firm.id,
            plan_id=trial_plan.id,
            status=SubscriptionStatus.ACTIVE,
            end_date=datetime.utcnow() + timedelta(days=14)
        )
        db.add(sub)

    user = User(
        email=data.email,
        hashed_password=get_password_hash(data.password),
        full_name=data.full_name,
        phone=data.phone,
        bar_council_no=data.bar_council_no,
        firm_id=new_firm.id,
        user_type="admin" # Firm admin
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return {"message": "Registration successful", "user_id": str(user.id)}


@router.post("/refresh")
async def refresh_token(data: RefreshRequest, db: Session = Depends(get_db)):
    payload = decode_token(data.refresh_token)
    if payload.get("type") != "refresh":
        raise HTTPException(status_code=400, detail="Invalid refresh token")

    try:
        uid = uuid.UUID(payload["sub"])
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid token subject")
        
    user = db.query(User).filter(User.id == uid).first()
    if not user or not user.is_active:
        raise HTTPException(status_code=401, detail="User not found or inactive")

    _check_account_locked(user)

    jti = str(uuid.uuid4())
    access_token = create_access_token({"sub": str(user.id), "role": user.user_type, "jti": jti})
    return {"access_token": access_token, "token_type": "bearer"}


@router.post("/logout")
async def logout(
    request: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Invalidate the current session by deactivating its JTI."""
    ip = extract_ip(request)
    auth_header = request.headers.get("Authorization", "")
    token = auth_header.replace("Bearer ", "").strip() if auth_header.startswith("Bearer ") else None

    if token:
        try:
            payload = decode_token(token)
            jti = payload.get("jti")
            if jti:
                session = db.query(UserSession).filter(
                    UserSession.token_jti == jti,
                    UserSession.user_id == current_user.id,
                ).first()
                if session:
                    session.is_active = False
        except Exception:
            pass  # Token already invalid — that's fine

    log_action(db, AuditAction.LOGOUT, "AUTH", str(current_user.id), user=current_user, ip=ip)
    db.commit()
    return {"message": "Logged out successfully"}


@router.post("/change-password")
async def change_password(
    request: Request,
    data: ChangePasswordRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Change password — requires old password verification."""
    ip = extract_ip(request)

    if not verify_password(data.current_password, current_user.hashed_password):
        log_action(db, AuditAction.PASSWORD_CHANGED, "USER", str(current_user.id),
                   user=current_user, ip=ip, details={"result": "wrong_current_password"}, status="failure")
        db.commit()
        raise HTTPException(status_code=400, detail="Current password is incorrect")

    if data.current_password == data.new_password:
        raise HTTPException(status_code=400, detail="New password must differ from current password")

    current_user.hashed_password = get_password_hash(data.new_password)
    current_user.updated_at = datetime.utcnow()

    # Invalidate all active sessions (force re-login on all devices)
    db.query(UserSession).filter(
        UserSession.user_id == current_user.id,
        UserSession.is_active == True,
    ).update({"is_active": False})

    log_action(db, AuditAction.PASSWORD_CHANGED, "USER", str(current_user.id),
               user=current_user, ip=ip, details={"all_sessions_revoked": True})
    db.commit()
    return {"message": "Password changed successfully. All active sessions have been revoked."}


@router.get("/me")
async def get_me(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    sub_data = _get_user_subscription(current_user, db)
    return {
        "id": str(current_user.id),
        "email": current_user.email,
        "full_name": current_user.full_name,
        "role": current_user.user_type,
        "phone": current_user.phone,
        "bar_council_no": current_user.bar_council_no,
        "is_active": current_user.is_active,
        "is_superadmin": current_user.is_superadmin,
        "firm_id": str(current_user.firm_id) if current_user.firm_id else None,
        "last_login": current_user.last_login.isoformat() if current_user.last_login else None,
        "subscription": sub_data,
    }


@router.get("/login-history")
async def get_login_history(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Return the last 20 login attempts for the current user."""
    history = (
        db.query(LoginHistory)
        .filter(LoginHistory.user_id == current_user.id)
        .order_by(LoginHistory.attempted_at.desc())
        .limit(20)
        .all()
    )
    return {
        "history": [
            {
                "id": str(h.id),
                "success": h.success,
                "ip_address": h.ip_address,
                "failure_reason": h.failure_reason,
                "attempted_at": h.attempted_at.isoformat() if h.attempted_at else None,
            }
            for h in history
        ]
    }

import pyotp

class VerifyMFARequest(BaseModel):
    token: str

@router.post("/mfa/setup")
async def setup_mfa(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """Generate MFA secret and provisioning URI for the user."""
    if current_user.mfa_enabled:
        raise HTTPException(status_code=400, detail="MFA is already enabled.")
    
    secret = pyotp.random_base32()
    current_user.mfa_secret = secret
    db.commit()
    
    totp = pyotp.TOTP(secret)
    provisioning_uri = totp.provisioning_uri(name=current_user.email, issuer_name="LegalOS")
    
    return {"secret": secret, "provisioning_uri": provisioning_uri}

@router.post("/mfa/verify")
async def verify_mfa(data: VerifyMFARequest, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """Verify MFA token and enable MFA for the user."""
    if not current_user.mfa_secret:
        raise HTTPException(status_code=400, detail="MFA secret not set up.")
    
    totp = pyotp.TOTP(current_user.mfa_secret)
    if not totp.verify(data.token):
        raise HTTPException(status_code=400, detail="Invalid MFA token.")
    
    current_user.mfa_enabled = True
    db.commit()
    return {"message": "MFA enabled successfully."}

