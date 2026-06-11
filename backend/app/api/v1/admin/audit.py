from fastapi import APIRouter, Depends, Request
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.security import get_current_superadmin
from app.models.security import SystemAuditLog
from app.models.user import User

router = APIRouter()

@router.get("/")
def get_audit_logs(skip: int = 0, limit: int = 100, db: Session = Depends(get_db), current_admin: User = Depends(get_current_superadmin)):
    logs = db.query(SystemAuditLog).order_by(SystemAuditLog.created_at.desc()).offset(skip).limit(limit).all()
    
    result = []
    for log in logs:
        result.append({
            "id": log.id,
            "admin_name": log.admin.full_name if log.admin else "System",
            "action": log.action,
            "resource_type": log.resource_type,
            "resource_id": log.resource_id,
            "details": log.details,
            "ip_address": log.ip_address,
            "created_at": log.created_at
        })
    return result

def log_admin_action(db: Session, admin_id: str, action: str, resource_type: str, resource_id: str, details: str, request: Request):
    ip_address = request.client.host if request and request.client else "Unknown"
    log_entry = SystemAuditLog(
        admin_id=admin_id,
        action=action,
        resource_type=resource_type,
        resource_id=resource_id,
        details=details,
        ip_address=ip_address
    )
    db.add(log_entry)
    db.commit()
