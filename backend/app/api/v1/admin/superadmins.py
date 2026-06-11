from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.orm import Session
from typing import List
from pydantic import BaseModel

from app.core.database import get_db
from app.core.security import get_current_superadmin, get_password_hash
from app.models.user import User

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
def create_superadmin(payload: SuperAdminCreate, db: Session = Depends(get_db), current_admin: User = Depends(get_current_superadmin)):
    existing = db.query(User).filter(User.email == payload.email).first()
    if existing:
        raise HTTPException(status_code=400, detail="User with this email already exists")
    
    new_admin = User(
        email=payload.email,
        full_name=payload.full_name,
        hashed_password=get_password_hash(payload.password),
        is_superadmin=True,
        admin_permissions=payload.permissions,
        is_active=True,
        is_verified=True
    )
    db.add(new_admin)
    db.commit()
    return {"message": "Super Admin created successfully"}

@router.put("/me")
def update_my_profile(payload: ProfileUpdate, db: Session = Depends(get_db), current_admin: User = Depends(get_current_superadmin)):
    if payload.full_name:
        current_admin.full_name = payload.full_name
    if payload.email:
        # check unique
        existing = db.query(User).filter(User.email == payload.email, User.id != current_admin.id).first()
        if existing:
            raise HTTPException(status_code=400, detail="Email already taken")
        current_admin.email = payload.email
    if payload.password:
        current_admin.hashed_password = get_password_hash(payload.password)
        
    db.commit()
    return {"message": "Profile updated successfully"}

@router.delete("/{admin_id}")
def revoke_superadmin(admin_id: str, db: Session = Depends(get_db), current_admin: User = Depends(get_current_superadmin)):
    import uuid
    uid = uuid.UUID(admin_id)
    if uid == current_admin.id:
        raise HTTPException(status_code=400, detail="Cannot revoke your own access")
        
    target_admin = db.query(User).filter(User.id == uid, User.is_superadmin == True).first()
    if not target_admin:
        raise HTTPException(status_code=404, detail="Super Admin not found")
        
    # Just remove superadmin privileges, or deactivate
    target_admin.is_superadmin = False
    db.commit()
    return {"message": "Superadmin access revoked"}
