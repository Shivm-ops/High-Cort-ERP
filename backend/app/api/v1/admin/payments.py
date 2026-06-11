from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.security import get_current_superadmin
from app.models.subscription import PaymentTransaction
from app.models.user import User

router = APIRouter()

@router.get("/")
def get_payments(db: Session = Depends(get_db), current_admin: User = Depends(get_current_superadmin)):
    payments = db.query(PaymentTransaction).order_by(PaymentTransaction.created_at.desc()).all()
    
    result = []
    for p in payments:
        result.append({
            "id": p.id,
            "firm_name": p.firm.name if p.firm else "Unknown",
            "amount": p.amount,
            "currency": p.currency,
            "status": p.status,
            "gateway": p.gateway,
            "reference": p.gateway_reference,
            "created_at": p.created_at
        })
    return result

@router.post("/{payment_id}/refund")
def initiate_refund(payment_id: str, payload: dict, db: Session = Depends(get_db), current_admin: User = Depends(get_current_superadmin)):
    payment = db.query(PaymentTransaction).filter(PaymentTransaction.id == payment_id).first()
    if not payment:
        raise HTTPException(status_code=404, detail="Payment not found")
        
    if payment.status != "success":
        raise HTTPException(status_code=400, detail="Only successful payments can be refunded")
        
    payment.status = "refunded"
    db.commit()
    return {"message": "Refund initiated successfully"}

@router.get("/revenue")
def get_revenue_report(db: Session = Depends(get_db), current_admin: User = Depends(get_current_superadmin)):
    from sqlalchemy import func
    total_revenue = db.query(func.sum(PaymentTransaction.amount)).filter(PaymentTransaction.status == 'success').scalar() or 0
    total_refunds = db.query(func.sum(PaymentTransaction.amount)).filter(PaymentTransaction.status == 'refunded').scalar() or 0
    
    return {
        "total_revenue": total_revenue,
        "total_refunds": total_refunds,
        "net_revenue": total_revenue - total_refunds
    }
