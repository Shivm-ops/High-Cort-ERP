from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.security import get_current_superadmin
from app.models.subscription import SubscriptionPlan, TenantSubscription, SubscriptionUpgradeRequest, RequestStatus, PaymentTransaction, PaymentStatus, GatewayProvider, SubscriptionStatus
from app.models.user import User
from app.api.v1.admin.audit import log_admin_action
from fastapi import Request

router = APIRouter()

from pydantic import BaseModel
from typing import Optional
import uuid

class PlanUpdate(BaseModel):
    price_monthly: Optional[float] = None
    price_yearly: Optional[float] = None
    max_users: Optional[int] = None
    storage_limit_gb: Optional[float] = None
    features: Optional[str] = None

class PlanCreate(BaseModel):
    name: str
    tier: str
    price_monthly: float
    price_yearly: float
    max_users: int
    storage_limit_gb: float
    features: Optional[str] = None

@router.get("/plans")
def get_plans(db: Session = Depends(get_db), current_admin: User = Depends(get_current_superadmin)):
    plans = db.query(SubscriptionPlan).all()
    return plans

@router.put("/plans/{plan_id}")
def update_plan(plan_id: str, payload: PlanUpdate, request: Request, db: Session = Depends(get_db), current_admin: User = Depends(get_current_superadmin)):
    try:
        plan_uuid = uuid.UUID(plan_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid plan ID format")
    plan = db.query(SubscriptionPlan).filter(SubscriptionPlan.id == plan_uuid).first()
    if not plan:
        raise HTTPException(status_code=404, detail="Plan not found")
        
    if payload.price_monthly is not None: plan.price_monthly = payload.price_monthly
    if payload.price_yearly is not None: plan.price_yearly = payload.price_yearly
    if payload.max_users is not None: plan.max_users = payload.max_users
    if payload.storage_limit_gb is not None: plan.storage_limit_gb = payload.storage_limit_gb
    if payload.features is not None: plan.features = payload.features
    
    db.commit()
    
    log_admin_action(
        db=db,
        admin_id=current_admin.id,
        action="UPDATE_PLAN",
        resource_type="PLAN",
        resource_id=str(plan.id),
        details=f"Updated subscription plan {plan.name}",
        request=request
    )
    
    return {"message": "Plan updated successfully"}

@router.post("/plans")
def create_plan(payload: PlanCreate, request: Request, db: Session = Depends(get_db), current_admin: User = Depends(get_current_superadmin)):
    existing = db.query(SubscriptionPlan).filter(SubscriptionPlan.tier == payload.tier).first()
    if existing:
        raise HTTPException(status_code=400, detail="Plan tier already exists")
    
    new_plan = SubscriptionPlan(
        name=payload.name,
        tier=payload.tier,
        price_monthly=payload.price_monthly,
        price_yearly=payload.price_yearly,
        max_users=payload.max_users,
        storage_limit_gb=payload.storage_limit_gb,
        features=payload.features,
        is_active=True
    )
    db.add(new_plan)
    db.commit()
    db.refresh(new_plan)
    
    return {"id": new_plan.id, "message": "Plan created successfully"}

@router.delete("/plans/{plan_id}")
def delete_plan(plan_id: str, request: Request, db: Session = Depends(get_db), current_admin: User = Depends(get_current_superadmin)):
    try:
        plan_uuid = uuid.UUID(plan_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid plan ID format")
    plan = db.query(SubscriptionPlan).filter(SubscriptionPlan.id == plan_uuid).first()
    if not plan:
        raise HTTPException(status_code=404, detail="Plan not found")
        
    db.delete(plan)
    db.commit()
    
    return {"message": "Plan deleted successfully"}

@router.get("/tenants")
def get_tenant_subscriptions(db: Session = Depends(get_db), current_admin: User = Depends(get_current_superadmin)):
    subs = db.query(TenantSubscription).all()
    
    result = []
    for s in subs:
        result.append({
            "id": s.id,
            "firm_name": s.firm.name if s.firm else "Unknown",
            "plan_name": s.plan.name if s.plan else "Unknown",
            "status": s.status,
            "billing_cycle": s.billing_cycle,
            "start_date": s.start_date,
            "end_date": s.end_date,
            "auto_renew": s.auto_renew
        })
    return result

@router.put("/tenants/{sub_id}/status")
def update_subscription_status(sub_id: str, active: bool, db: Session = Depends(get_db), current_admin: User = Depends(get_current_superadmin)):
    try:
        sub_uuid = uuid.UUID(sub_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid subscription ID format")
    sub = db.query(TenantSubscription).filter(TenantSubscription.id == sub_uuid).first()
    if not sub:
        raise HTTPException(status_code=404, detail="Subscription not found")
        
    sub.status = "active" if active else "canceled"
    db.commit()
    return {"message": "Subscription status updated"}

@router.post("/tenant/{firm_id}/override")
def override_tenant_subscription(firm_id: str, payload: dict, request: Request, db: Session = Depends(get_db), current_admin: User = Depends(get_current_superadmin)):
    """Manually override a firm's subscription (Upgrade, Downgrade, Extend, Trial)"""
    plan_id = payload.get("plan_id")
    action = payload.get("action") # upgrade, downgrade, extend, trial, cancel
    
    sub = db.query(TenantSubscription).filter(TenantSubscription.firm_id == firm_id).first()
    if not sub:
        raise HTTPException(status_code=404, detail="Subscription not found for this firm")
        
    if action in ['upgrade', 'downgrade', 'trial']:
        try:
            plan_uuid = uuid.UUID(plan_id)
        except ValueError:
            raise HTTPException(status_code=400, detail="Invalid plan ID format")
        plan = db.query(SubscriptionPlan).filter(SubscriptionPlan.id == plan_uuid).first()
        if not plan:
            raise HTTPException(status_code=404, detail="Target plan not found")
        sub.plan_id = plan.id
        sub.status = "active"
        if action == "trial":
            import datetime
            sub.end_date = datetime.datetime.utcnow() + datetime.timedelta(days=14)
            
    elif action == 'extend':
        import datetime
        days = payload.get("days", 30)
        if sub.end_date:
            sub.end_date = sub.end_date + datetime.timedelta(days=days)
            
    elif action == 'cancel':
        sub.status = "canceled"
        
    db.commit()
    
    log_admin_action(
        db=db,
        admin_id=current_admin.id,
        action=f"SUBSCRIPTION_{action.upper()}",
        resource_type="SUBSCRIPTION",
        resource_id=str(sub.id),
        details=f"Subscription action {action} applied manually by Super Admin",
        request=request
    )
    
    return {"message": f"Subscription action '{action}' executed successfully"}

@router.get("/upgrade-requests")
def get_upgrade_requests(db: Session = Depends(get_db), current_admin: User = Depends(get_current_superadmin)):
    requests = db.query(SubscriptionUpgradeRequest).filter(SubscriptionUpgradeRequest.status == RequestStatus.PENDING).all()
    result = []
    for r in requests:
        result.append({
            "id": r.id,
            "firm_name": r.firm.name if r.firm else "Unknown",
            "requested_plan_name": r.requested_plan.name if r.requested_plan else "Unknown",
            "requested_plan_price": r.requested_plan.price_yearly if r.billing_cycle == 'yearly' else r.requested_plan.price_monthly,
            "billing_cycle": r.billing_cycle,
            "created_at": r.created_at,
            "status": r.status
        })
    return result

@router.post("/upgrade-requests/{request_id}/approve")
def approve_upgrade_request(request_id: str, request: Request, db: Session = Depends(get_db), current_admin: User = Depends(get_current_superadmin)):
    try:
        req_uuid = uuid.UUID(request_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid request ID")
        
    import datetime
    upgrade_req = db.query(SubscriptionUpgradeRequest).filter(SubscriptionUpgradeRequest.id == req_uuid).first()
    if not upgrade_req or upgrade_req.status != RequestStatus.PENDING:
        raise HTTPException(status_code=404, detail="Pending upgrade request not found")
        
    # Get firm's current subscription
    sub = db.query(TenantSubscription).filter(TenantSubscription.firm_id == upgrade_req.firm_id).first()
    
    if not sub:
        # Create new subscription
        sub = TenantSubscription(
            firm_id=upgrade_req.firm_id,
            plan_id=upgrade_req.requested_plan_id,
            status=SubscriptionStatus.ACTIVE,
            billing_cycle=upgrade_req.billing_cycle,
            start_date=datetime.datetime.utcnow(),
            end_date=datetime.datetime.utcnow() + datetime.timedelta(days=30 if upgrade_req.billing_cycle == 'monthly' else 365)
        )
        db.add(sub)
    else:
        # Upgrade existing
        sub.plan_id = upgrade_req.requested_plan_id
        sub.billing_cycle = upgrade_req.billing_cycle
        sub.status = SubscriptionStatus.ACTIVE
        sub.start_date = datetime.datetime.utcnow()
        sub.end_date = datetime.datetime.utcnow() + datetime.timedelta(days=30 if upgrade_req.billing_cycle == 'monthly' else 365)
        
    upgrade_req.status = RequestStatus.APPROVED
    upgrade_req.updated_at = datetime.datetime.utcnow()
    
    # Log a mock payment transaction
    payment = PaymentTransaction(
        firm_id=upgrade_req.firm_id,
        amount=upgrade_req.requested_plan.price_yearly if upgrade_req.billing_cycle == 'yearly' else upgrade_req.requested_plan.price_monthly,
        currency="INR",
        status=PaymentStatus.SUCCESS,
        gateway=GatewayProvider.MANUAL,
        gateway_reference=f"MANUAL_APPROVAL_{upgrade_req.id}",
    )
    db.add(payment)
    
    db.commit()
    
    log_admin_action(
        db=db,
        admin_id=current_admin.id,
        action="APPROVE_UPGRADE",
        resource_type="UPGRADE_REQUEST",
        resource_id=str(upgrade_req.id),
        details=f"Approved upgrade request for firm ID {upgrade_req.firm_id} to plan ID {upgrade_req.requested_plan_id}",
        request=request
    )
    
    return {"message": "Upgrade request approved and subscription activated."}

@router.post("/upgrade-requests/{request_id}/reject")
def reject_upgrade_request(request_id: str, request: Request, db: Session = Depends(get_db), current_admin: User = Depends(get_current_superadmin)):
    try:
        req_uuid = uuid.UUID(request_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid request ID")
        
    import datetime
    upgrade_req = db.query(SubscriptionUpgradeRequest).filter(SubscriptionUpgradeRequest.id == req_uuid).first()
    if not upgrade_req or upgrade_req.status != RequestStatus.PENDING:
        raise HTTPException(status_code=404, detail="Pending upgrade request not found")
        
    upgrade_req.status = RequestStatus.REJECTED
    upgrade_req.updated_at = datetime.datetime.utcnow()
    
    db.commit()
    
    log_admin_action(
        db=db,
        admin_id=current_admin.id,
        action="REJECT_UPGRADE",
        resource_type="UPGRADE_REQUEST",
        resource_id=str(upgrade_req.id),
        details=f"Rejected upgrade request for firm ID {upgrade_req.firm_id}",
        request=request
    )
    
    return {"message": "Upgrade request rejected."}
