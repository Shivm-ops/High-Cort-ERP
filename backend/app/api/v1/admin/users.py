from fastapi import APIRouter, Depends, HTTPException, status, Request
from sqlalchemy.orm import Session
from sqlalchemy import func
from pydantic import BaseModel
from typing import Optional
from app.core.database import get_db
from app.core.security import get_current_superadmin, get_password_hash
from app.models.user import User
from app.models.security import LoginHistory, UserSession
from app.models.subscription import TenantSubscription
from app.api.v1.admin.audit import log_admin_action
from app.models.document import Document

router = APIRouter()

@router.get("/")
def get_users(skip: int = 0, limit: int = 100, db: Session = Depends(get_db), current_admin: User = Depends(get_current_superadmin)):
    users = db.query(User).offset(skip).limit(limit).all()
    return [{"id": u.id, "email": u.email, "full_name": u.full_name, "role": u.user_type, "is_active": u.is_active, "firm_name": u.firm.name if u.firm else "Independent", "is_verified": u.is_verified, "created_at": u.created_at} for u in users]
import uuid
from app.models.user import UserRole

class UserCreate(BaseModel):
    email: str
    full_name: str
    password: str
    phone: str
    address: str
    user_type: str = "associate_advocate"

@router.post("/")
def create_user(payload: UserCreate, db: Session = Depends(get_db), current_admin: User = Depends(get_current_superadmin)):
    # Check if email exists
    if db.query(User).filter(User.email == payload.email).first():
        raise HTTPException(status_code=400, detail="Email already registered")
        
    from app.models.firm import Firm
    
    # Create a new firm (Individual Practice) for the new user
    new_firm = Firm(
        name=f"{payload.full_name}'s Practice",
        type="INDIVIDUAL",
        phone=payload.phone,
        is_active=True
    )
    db.add(new_firm)
    db.flush()

    new_user = User(
        email=payload.email,
        full_name=payload.full_name,
        hashed_password=get_password_hash(payload.password),
        user_type=UserRole(payload.user_type),
        phone=payload.phone,
        address=payload.address,
        is_active=True,
        is_verified=True,  # Auto verify since admin created
        firm_id=new_firm.id,
        is_superadmin=(payload.user_type == "admin")
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    return {"id": new_user.id, "email": new_user.email, "message": "User created successfully"}

@router.get("/{user_id}/profile")
def get_user_profile(user_id: str, db: Session = Depends(get_db), current_admin: User = Depends(get_current_superadmin)):
    uid = uuid.UUID(user_id)
    user = db.query(User).filter(User.id == uid).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
        
    logins = db.query(LoginHistory).filter(LoginHistory.user_id == user.id).order_by(LoginHistory.attempted_at.desc()).limit(10).all()
    sessions = db.query(UserSession).filter(UserSession.user_id == user.id, UserSession.is_active == True).all()
    
    storage_used = db.query(func.sum(Document.file_size)).filter(Document.uploaded_by_id == user.id).scalar() or 0
    
    sub = db.query(TenantSubscription).filter(TenantSubscription.firm_id == user.firm_id).first()
    subscription_data = None
    if sub and sub.plan:
        subscription_data = {
            "firm_id": str(sub.firm_id),
            "plan_id": str(sub.plan.id),
            "plan_name": sub.plan.name,
            "status": sub.status,
            "billing_cycle": sub.billing_cycle,
            "end_date": sub.end_date
        }
    
    return {
        "id": user.id,
        "email": user.email,
        "full_name": user.full_name,
        "phone": user.phone,
        "role": user.user_type,
        "is_active": user.is_active,
        "firm_name": user.firm.name if user.firm else "Independent",
        "created_at": user.created_at,
        "storage_used": storage_used,
        "subscription": subscription_data,
        "logins": [{"ip": l.ip_address, "success": l.success, "date": l.attempted_at} for l in logins],
        "active_sessions": [{"id": s.id, "ip": s.ip_address, "device": s.device_info, "created": s.created_at} for s in sessions]
    }

class ProfileUpdate(BaseModel):
    full_name: Optional[str] = None
    email: Optional[str] = None
    phone: Optional[str] = None

@router.put("/{user_id}")
def update_user_profile(user_id: str, payload: ProfileUpdate, db: Session = Depends(get_db), current_admin: User = Depends(get_current_superadmin)):
    uid = uuid.UUID(user_id)
    user = db.query(User).filter(User.id == uid).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
        
    if payload.full_name: user.full_name = payload.full_name
    if payload.email: user.email = payload.email
    if payload.phone: user.phone = payload.phone
    
    db.commit()
    return {"message": "User updated successfully"}

@router.put("/{user_id}/status")
def toggle_user_status(user_id: str, active: bool, request: Request, db: Session = Depends(get_db), current_admin: User = Depends(get_current_superadmin)):
    uid = uuid.UUID(user_id)
    user = db.query(User).filter(User.id == uid).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    user.is_active = active
    if not active:
        # Suspending also force logs out
        db.query(UserSession).filter(UserSession.user_id == user.id).update({"is_active": False})
        
    db.commit()
    
    log_admin_action(
        db=db,
        admin_id=current_admin.id,
        action="SUSPEND_USER" if not active else "ACTIVATE_USER",
        resource_type="USER",
        resource_id=user_id,
        details=f"User account {'suspended' if not active else 'activated'}",
        request=request
    )
    
    return {"message": "User status updated", "is_active": user.is_active}

@router.post("/{user_id}/force-logout")
def force_logout(user_id: str, request: Request, db: Session = Depends(get_db), current_admin: User = Depends(get_current_superadmin)):
    uid = uuid.UUID(user_id)
    db.query(UserSession).filter(UserSession.user_id == uid).update({"is_active": False})
    db.commit()
    
    log_admin_action(
        db=db,
        admin_id=current_admin.id,
        action="FORCE_LOGOUT",
        resource_type="USER",
        resource_id=user_id,
        details="Forced logout from all devices by invalidating active sessions",
        request=request
    )
    
    return {"message": "User forcefully logged out from all devices"}

from sqlalchemy.exc import IntegrityError

@router.delete("/{user_id}")
def delete_user(user_id: str, request: Request, db: Session = Depends(get_db), current_admin: User = Depends(get_current_superadmin)):
    uid = uuid.UUID(user_id)
    
    # Prevent self-deletion
    if current_admin.id == uid:
        raise HTTPException(status_code=400, detail="Cannot delete your own admin account")
        
    user = db.query(User).filter(User.id == uid).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
        
    try:
        db.delete(user)
        db.commit()
    except IntegrityError:
        db.rollback()
        raise HTTPException(
            status_code=400, 
            detail="Cannot delete user because they have associated records (e.g., cases, documents). Please suspend them instead."
        )
        
    log_admin_action(
        db=db,
        admin_id=current_admin.id,
        action="DELETE_USER",
        resource_type="USER",
        resource_id=user_id,
        details=f"Deleted user account ({user.email})",
        request=request
    )
    
    return {"message": "User deleted successfully"}

class PasswordResetPayload(BaseModel):
    new_password: Optional[str] = None

@router.post("/{user_id}/reset-password")
def reset_password(user_id: str, payload: PasswordResetPayload, request: Request, db: Session = Depends(get_db), current_admin: User = Depends(get_current_superadmin)):
    uid = uuid.UUID(user_id)
    user = db.query(User).filter(User.id == uid).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
        
    # Use custom password or temporary default
    new_pass = payload.new_password if payload.new_password else "LegalOS@2025"
    user.hashed_password = get_password_hash(new_pass)
    db.query(UserSession).filter(UserSession.user_id == uid).update({"is_active": False})
    db.commit()
    
    log_admin_action(
        db=db,
        admin_id=current_admin.id,
        action="RESET_PASSWORD",
        resource_type="USER",
        resource_id=user_id,
        details=f"Password changed to {'custom password' if payload.new_password else 'default'} and all sessions revoked",
        request=request
    )
    
    return {"message": "Password updated successfully and sessions revoked"}

@router.put("/{user_id}/verify")
def verify_user_manually(user_id: str, request: Request, db: Session = Depends(get_db), current_admin: User = Depends(get_current_superadmin)):
    uid = uuid.UUID(user_id)
    user = db.query(User).filter(User.id == uid).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
        
    user.is_verified = True
    db.commit()
    
    log_admin_action(
        db=db,
        admin_id=current_admin.id,
        action="VERIFY_USER",
        resource_type="USER",
        resource_id=user_id,
        details="User manually verified by Super Admin without KYC queue",
        request=request
    )
    
    return {"message": "User verified successfully"}
