from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy import func
from sqlalchemy.orm import Session
from typing import List
from pydantic import BaseModel

from app.core.database import get_db
from app.core.security import get_current_superadmin, get_password_hash
from app.models.user import User
from app.models.security import UserSession
from app.api.v1.admin.audit import log_admin_action

router = APIRouter()

class SuperAdminCreate(BaseModel):
    full_name: str
    email: str
    password: str
    permissions: List[str] = []

class ProfileUpdate(BaseModel):
    full_name: str = None
    email: str = None
    password: str = None

@router.get("/")
def get_superadmins(db: Session = Depends(get_db), current_admin: User = Depends(get_current_superadmin)):
    admins = db.query(User).filter(User.is_superadmin == True).all()
    return [{
        "id": a.id,
        "full_name": a.full_name,
        "email": a.email,
        "is_active": a.is_active,
        "admin_permissions": a.admin_permissions or [],
        "created_at": a.created_at
    } for a in admins]

@router.post("/")
def create_superadmin(payload: SuperAdminCreate, request: Request, db: Session = Depends(get_db), current_admin: User = Depends(get_current_superadmin)):
    clean_email = (payload.email or "").strip().lower()
    if not clean_email or "@" not in clean_email:
        raise HTTPException(status_code=400, detail="Valid email is required")
    if len(payload.password or "") < 8:
        raise HTTPException(status_code=400, detail="Password must be at least 8 characters long")

    existing = db.query(User).filter(func.lower(User.email) == clean_email).first()
    if existing:
        raise HTTPException(status_code=400, detail="User with this email already exists")

    new_admin = User(
        email=clean_email,
        full_name=payload.full_name,
        hashed_password=get_password_hash(payload.password),
        is_superadmin=True,
        admin_permissions=payload.permissions,
        is_active=True,
        is_verified=True
    )
    db.add(new_admin)
    db.commit()
    db.refresh(new_admin)
    log_admin_action(
        db=db,
        admin_id=current_admin.id,
        action="CREATE_SUPERADMIN",
        resource_type="USER",
        resource_id=str(new_admin.id),
        details=f"Created superadmin account ({clean_email})",
        request=request,
    )
    return {"message": "Super Admin created successfully"}

@router.put("/me")
def update_my_profile(payload: ProfileUpdate, request: Request, db: Session = Depends(get_db), current_admin: User = Depends(get_current_superadmin)):
    if payload.full_name:
        current_admin.full_name = payload.full_name
    if payload.email:
        clean_email = payload.email.strip().lower()
        existing = db.query(User).filter(func.lower(User.email) == clean_email, User.id != current_admin.id).first()
        if existing:
            raise HTTPException(status_code=400, detail="Email already taken")
        current_admin.email = clean_email
    if payload.password:
        if len(payload.password) < 8:
            raise HTTPException(status_code=400, detail="Password must be at least 8 characters long")
        current_admin.hashed_password = get_password_hash(payload.password)

    db.commit()
    log_admin_action(
        db=db,
        admin_id=current_admin.id,
        action="UPDATE_SUPERADMIN_PROFILE",
        resource_type="USER",
        resource_id=str(current_admin.id),
        details="Updated own superadmin profile",
        request=request,
    )
    return {"message": "Profile updated successfully"}

@router.delete("/{admin_id}")
def revoke_superadmin(admin_id: str, request: Request, db: Session = Depends(get_db), current_admin: User = Depends(get_current_superadmin)):
    import uuid
    uid = uuid.UUID(admin_id)
    if uid == current_admin.id:
        raise HTTPException(status_code=400, detail="Cannot revoke your own access")

    target_admin = db.query(User).filter(User.id == uid, User.is_superadmin == True).first()
    if not target_admin:
        raise HTTPException(status_code=404, detail="Super Admin not found")

    target_admin.is_superadmin = False
    db.query(UserSession).filter(UserSession.user_id == target_admin.id).update({"is_active": False})
    db.commit()
    log_admin_action(
        db=db,
        admin_id=current_admin.id,
        action="REVOKE_SUPERADMIN",
        resource_type="USER",
        resource_id=admin_id,
        details=f"Revoked superadmin access and invalidated sessions ({target_admin.email})",
        request=request,
    )
    return {"message": "Superadmin access revoked"}
