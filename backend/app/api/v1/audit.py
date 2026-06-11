from fastapi import APIRouter, Depends, HTTPException, Response
from sqlalchemy.orm import Session
import csv
import io

from app.core.database import get_db
from app.core.security import get_current_user
from app.models.user import User, UserRole
from app.models.audit_log import AuditLog

router = APIRouter()

@router.get("/export")
async def export_audit_logs(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Export audit logs as CSV for the firm."""
    if current_user.user_type not in [UserRole.ADMIN, UserRole.SENIOR_ADVOCATE]:
        raise HTTPException(status_code=403, detail="Not authorized to export audit logs")

    logs = db.query(AuditLog).filter(
        AuditLog.firm_id == current_user.firm_id
    ).order_by(AuditLog.created_at.desc()).all()

    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow([
        "ID", "User ID", "Action", "Resource Type", "Resource ID", 
        "Status", "IP Address", "Created At", "Details"
    ])

    for log in logs:
        writer.writerow([
            str(log.id),
            str(log.user_id) if log.user_id else "",
            log.action,
            log.resource_type or "",
            log.resource_id or "",
            log.status,
            log.ip_address or "",
            log.created_at.isoformat(),
            log.details or ""
        ])

    response = Response(content=output.getvalue(), media_type="text/csv")
    response.headers["Content-Disposition"] = "attachment; filename=audit_logs.csv"
    return response
