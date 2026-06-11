from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.security import get_current_superadmin
from app.models.kyc import KycRecord, KycStatus
from app.models.user import User
from pydantic import BaseModel
import datetime
import uuid

router = APIRouter()

class KycActionRequest(BaseModel):
    action: str # 'approve' or 'reject'
    rejection_reason: str = None

@router.get("/")
def get_kyc_queue(status: str = "pending", db: Session = Depends(get_db), current_admin: User = Depends(get_current_superadmin)):
    query = db.query(KycRecord)
    if status != "all":
        query = query.filter(KycRecord.status == status)
    records = query.order_by(KycRecord.submitted_at.desc()).all()
    
    result = []
    for r in records:
        entity_name = "Unknown"
        if r.entity_type == "user" and r.user:
            entity_name = r.user.full_name
        elif r.entity_type == "firm" and r.firm:
            entity_name = r.firm.name
            
        result.append({
            "id": r.id,
            "entity_type": r.entity_type,
            "entity_name": entity_name,
            "document_type": r.document_type,
            "document_number": r.document_number,
            "document_url": r.document_url,
            "status": r.status,
            "submitted_at": r.submitted_at
        })
    return result

@router.put("/{kyc_id}")
def review_kyc(kyc_id: str, payload: KycActionRequest, db: Session = Depends(get_db), current_admin: User = Depends(get_current_superadmin)):
    try:
        kid = uuid.UUID(kyc_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid KYC ID format")
        
    kyc = db.query(KycRecord).filter(KycRecord.id == kid).first()
    if not kyc:
        raise HTTPException(status_code=404, detail="KYC record not found")
        
    if payload.action == "approve":
        kyc.status = KycStatus.APPROVED
        kyc.rejection_reason = None
        
        # Mark user/firm as verified
        if kyc.entity_type == "user" and kyc.user:
            kyc.user.is_verified = True
        elif kyc.entity_type == "firm" and kyc.firm:
            kyc.firm.kyc_verified = True
            
    elif payload.action == "reject":
        if not payload.rejection_reason:
            raise HTTPException(status_code=400, detail="Rejection reason is required")
        kyc.status = KycStatus.REJECTED
        kyc.rejection_reason = payload.rejection_reason
    else:
        raise HTTPException(status_code=400, detail="Invalid action")
        
    kyc.reviewed_at = datetime.datetime.utcnow()
    kyc.reviewed_by_id = current_admin.id
    
    db.commit()
    return {"message": f"KYC record {payload.action}d successfully"}
