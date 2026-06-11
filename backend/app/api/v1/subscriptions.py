from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.permissions import require_firm_member
from app.models.user import User
from app.models.subscription import SubscriptionPlan, TenantSubscription, SubscriptionStatus, SubscriptionUpgradeRequest, RequestStatus
from pydantic import BaseModel
import datetime
import uuid

router = APIRouter()

class UpgradeRequest(BaseModel):
    plan_id: uuid.UUID
    billing_cycle: str = "monthly"

@router.get("/me")
def get_my_subscription(db: Session = Depends(get_db), current_user: User = Depends(require_firm_member)):
    # Get current firm's subscription
    sub = db.query(TenantSubscription).filter(TenantSubscription.firm_id == current_user.firm_id).first()
    
    # Get all active plans to display for upgrade options
    plans = db.query(SubscriptionPlan).filter(SubscriptionPlan.is_active == True).order_by(SubscriptionPlan.price_monthly).all()
    
    # Auto-seed if no plans exist
    if not plans:
        seed_plans = [
            SubscriptionPlan(name="Basic Plan", tier="basic", price_monthly=0, price_yearly=0, max_users=1, storage_limit_gb=2.0, features="intake, cases, clients, calendar", is_active=True),
            SubscriptionPlan(name="Professional", tier="professional", price_monthly=1999, price_yearly=19990, max_users=5, storage_limit_gb=10.0, features="intake, cases, clients, calendar, drafts, billing", is_active=True),
            SubscriptionPlan(name="Enterprise", tier="enterprise", price_monthly=4999, price_yearly=49990, max_users=20, storage_limit_gb=50.0, features="intake, cases, clients, calendar, drafts, billing, ai_tools, mact_management", is_active=True),
        ]
        db.add_all(seed_plans)
        db.commit()
        plans = db.query(SubscriptionPlan).filter(SubscriptionPlan.is_active == True).order_by(SubscriptionPlan.price_monthly).all()
        
    current_plan = None
    if sub and sub.plan:
        current_plan = {
            "id": str(sub.plan.id),
            "name": sub.plan.name,
            "tier": sub.plan.tier,
            "status": sub.status.value if hasattr(sub.status, 'value') else sub.status,
            "end_date": sub.end_date.isoformat() if sub.end_date else None,
            "billing_cycle": sub.billing_cycle,
            "features": sub.plan.features,
            "max_users": sub.plan.max_users,
            "storage_limit_gb": sub.plan.storage_limit_gb,
        }
    else:
        # If no active subscription found, return empty or fallback
        current_plan = {
            "id": None,
            "name": "No Active Plan",
            "tier": "none",
            "status": "inactive",
            "end_date": None,
            "billing_cycle": "monthly",
            "features": "",
            "max_users": 0,
            "storage_limit_gb": 0,
        }
        
    return {
        "current_subscription": current_plan,
            "available_plans": [
            {
                "id": str(p.id),
                "name": p.name,
                "tier": p.tier,
                "price_monthly": p.price_monthly,
                "price_yearly": p.price_yearly,
                "max_users": p.max_users,
                "storage_limit_gb": p.storage_limit_gb,
                "features": p.features
            } for p in plans
        ]
    }

@router.post("/me/upgrade")
def request_upgrade_subscription(payload: UpgradeRequest, db: Session = Depends(get_db), current_user: User = Depends(require_firm_member)):
    # Get the target plan
    plan_uuid = uuid.UUID(str(payload.plan_id))
    plan = db.query(SubscriptionPlan).filter(SubscriptionPlan.id == plan_uuid).first()
    if not plan:
        raise HTTPException(status_code=404, detail="Plan not found")
        
    # Check if a pending request already exists
    existing_request = db.query(SubscriptionUpgradeRequest).filter(
        SubscriptionUpgradeRequest.firm_id == current_user.firm_id,
        SubscriptionUpgradeRequest.status == RequestStatus.PENDING
    ).first()
    
    if existing_request:
        existing_request.requested_plan_id = plan.id
        existing_request.billing_cycle = payload.billing_cycle
        existing_request.updated_at = datetime.datetime.utcnow()
    else:
        new_request = SubscriptionUpgradeRequest(
            firm_id=current_user.firm_id,
            requested_plan_id=plan.id,
            billing_cycle=payload.billing_cycle,
            status=RequestStatus.PENDING
        )
        db.add(new_request)
        
    db.commit()
    return {"message": f"Upgrade request to {plan.name} submitted and is pending approval."}

@router.get("/me/upgrade-request")
def get_upgrade_request(db: Session = Depends(get_db), current_user: User = Depends(require_firm_member)):
    req = db.query(SubscriptionUpgradeRequest).filter(
        SubscriptionUpgradeRequest.firm_id == current_user.firm_id,
        SubscriptionUpgradeRequest.status == RequestStatus.PENDING
    ).first()
    
    if not req:
        return {"has_pending_request": False}
        
    return {
        "has_pending_request": True,
        "requested_plan_name": req.requested_plan.name if req.requested_plan else "Unknown Plan",
        "requested_plan_id": str(req.requested_plan_id)
    }
