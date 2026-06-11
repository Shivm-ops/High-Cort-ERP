from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import func
from app.core.database import get_db
from app.core.security import get_current_superadmin
from app.models.firm import Firm
from app.models.user import User
from app.models.case import Case
from app.models.document import Document
from app.models.subscription import TenantSubscription, PaymentTransaction
from app.api.v1.admin.audit import log_admin_action
from fastapi import Request
from sqlalchemy.exc import IntegrityError
import uuid

from pydantic import BaseModel
from typing import Optional

class FirmCreate(BaseModel):
    name: str
    type: str = "PARTNERSHIP"
    email: Optional[str] = None
    phone: Optional[str] = None
    pan_no: Optional[str] = None
    address: Optional[str] = None

class FirmUpdate(BaseModel):
    name: Optional[str] = None
    type: Optional[str] = None
    email: Optional[str] = None
    phone: Optional[str] = None
    pan_no: Optional[str] = None
    address: Optional[str] = None

router = APIRouter()

@router.post("/")
def create_firm(payload: FirmCreate, db: Session = Depends(get_db), current_admin: User = Depends(get_current_superadmin)):
    new_firm = Firm(
        name=payload.name,
        type=payload.type,
        email=payload.email,
        phone=payload.phone,
        pan_no=payload.pan_no,
        address=payload.address,
        is_active=True
    )
    db.add(new_firm)
    db.commit()
    db.refresh(new_firm)
    return {"id": new_firm.id, "name": new_firm.name, "message": "Firm created successfully"}

@router.put("/{firm_id}")
def update_firm(firm_id: str, payload: FirmUpdate, db: Session = Depends(get_db), current_admin: User = Depends(get_current_superadmin)):
    try:
        firm_uuid = uuid.UUID(firm_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid firm ID format")
    firm = db.query(Firm).filter(Firm.id == firm_uuid).first()
    if not firm:
        raise HTTPException(status_code=404, detail="Firm not found")
        
    if payload.name: firm.name = payload.name
    if payload.type: firm.type = payload.type
    if payload.email is not None: firm.email = payload.email
    if payload.phone is not None: firm.phone = payload.phone
    if payload.pan_no is not None: firm.pan_no = payload.pan_no
    if payload.address is not None: firm.address = payload.address
    
    db.commit()
    return {"id": firm.id, "name": firm.name, "message": "Firm updated successfully"}

@router.get("/")
def get_firms(skip: int = 0, limit: int = 100, db: Session = Depends(get_db), current_admin: User = Depends(get_current_superadmin)):
    firms = db.query(Firm).offset(skip).limit(limit).all()
    result = []
    for f in firms:
        # Calculate metrics
        user_ids = [u.id for u in f.users]
        active_users = len([u for u in f.users if u.is_active])
        total_cases = 0
        storage_bytes = 0
        if user_ids:
            total_cases = db.query(Case).filter(Case.primary_advocate_id.in_(user_ids)).count()
            storage_bytes = db.query(func.sum(Document.file_size)).filter(Document.uploaded_by_id.in_(user_ids)).scalar() or 0
        
        # Revenue
        revenue = db.query(func.sum(PaymentTransaction.amount)).filter(PaymentTransaction.firm_id == f.id, PaymentTransaction.status == 'success').scalar() or 0
        
        # Subscription
        sub = db.query(TenantSubscription).filter(TenantSubscription.firm_id == f.id, TenantSubscription.status == 'active').first()
        
        result.append({
            "id": f.id,
            "name": f.name,
            "type": f.type,
            "email": f.email,
            "phone": f.phone,
            "pan_no": f.pan_no,
            "address": f.address,
            "is_active": f.is_active,
            "created_at": f.created_at,
            "metrics": {
                "total_users": len(f.users),
                "active_users": active_users,
                "total_cases": total_cases,
                "storage_bytes": storage_bytes,
                "total_revenue": revenue
            },
            "subscription": {
                "plan_name": sub.plan.name if sub and sub.plan else "None",
                "status": sub.status if sub else "inactive"
            }
        })
    return result

@router.put("/{firm_id}/status")
def toggle_firm_status(firm_id: str, active: bool, request: Request, db: Session = Depends(get_db), current_admin: User = Depends(get_current_superadmin)):
    try:
        firm_uuid = uuid.UUID(firm_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid firm ID format")
    firm = db.query(Firm).filter(Firm.id == firm_uuid).first()
    if not firm:
        raise HTTPException(status_code=404, detail="Firm not found")
    
    firm.is_active = active
    
    # Suspend/Activate all users in this firm
    users = db.query(User).filter(User.firm_id == firm_uuid).all()
    from app.models.security import UserSession
    for user in users:
        user.is_active = active
        if not active:
            db.query(UserSession).filter(UserSession.user_id == user.id).update({"is_active": False})
        
    db.commit()
    
    log_admin_action(
        db=db,
        admin_id=current_admin.id,
        action="SUSPEND_FIRM" if not active else "ACTIVATE_FIRM",
        resource_type="FIRM",
        resource_id=firm_id,
        details=f"Firm {'suspended' if not active else 'activated'}, affecting {len(users)} users.",
        request=request
    )
    
    
    return {"message": f"Firm and its {len(users)} users status updated", "is_active": firm.is_active}

@router.delete("/{firm_id}")
def delete_firm(firm_id: str, request: Request, db: Session = Depends(get_db), current_admin: User = Depends(get_current_superadmin)):
    try:
        firm_uuid = uuid.UUID(firm_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid firm ID format")
    firm = db.query(Firm).filter(Firm.id == firm_uuid).first()
    if not firm:
        raise HTTPException(status_code=404, detail="Firm not found")
        
    try:
        db.delete(firm)
        db.commit()
        log_admin_action(
            db=db,
            admin_id=current_admin.id,
            action="DELETE_FIRM",
            resource_type="FIRM",
            resource_id=firm_id,
            details=f"Deleted firm {firm.name}.",
            request=request
        )
        return {"message": "Firm deleted successfully"}
    except IntegrityError:
        db.rollback()
        raise HTTPException(
            status_code=400, 
            detail="Cannot delete this firm because it has active users, cases, or subscriptions. Please remove them first."
        )
