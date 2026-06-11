from fastapi import APIRouter, Depends, Response
from sqlalchemy.orm import Session
from sqlalchemy import func
from app.core.database import get_db
from app.core.security import get_current_superadmin
from app.models.user import User
from app.models.firm import Firm
from app.models.case import Case
from app.models.subscription import PaymentTransaction
from app.api.v1.admin.audit import log_admin_action
import io
import csv

router = APIRouter()

@router.get("/users/csv")
def download_users_csv(db: Session = Depends(get_db), current_admin: User = Depends(get_current_superadmin)):
    users = db.query(User).all()
    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow(["ID", "Name", "Email", "Phone", "Role", "Firm", "Status", "Joined"])
    
    for u in users:
        writer.writerow([
            str(u.id), 
            u.full_name, 
            u.email, 
            u.phone,
            u.user_type.value if u.user_type else "",
            u.firm.name if u.firm else "",
            "Active" if u.is_active else "Suspended",
            u.created_at.strftime("%Y-%m-%d") if u.created_at else ""
        ])
    
    response = Response(content=output.getvalue(), media_type="text/csv")
    response.headers["Content-Disposition"] = "attachment; filename=users_report.csv"
    
    log_admin_action(db, current_admin.id, "EXPORT_REPORT", "REPORT", "users_csv", "Exported Users CSV", None)
    return response

@router.get("/firms/csv")
def download_firms_csv(db: Session = Depends(get_db), current_admin: User = Depends(get_current_superadmin)):
    firms = db.query(Firm).all()
    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow(["ID", "Firm Name", "Registration Number", "Status", "Joined"])
    
    for f in firms:
        writer.writerow([
            str(f.id), 
            f.name, 
            f.pan_no, 
            "Active" if f.is_active else "Suspended",
            f.created_at.strftime("%Y-%m-%d") if f.created_at else ""
        ])
    
    response = Response(content=output.getvalue(), media_type="text/csv")
    response.headers["Content-Disposition"] = "attachment; filename=firms_report.csv"
    
    log_admin_action(db, current_admin.id, "EXPORT_REPORT", "REPORT", "firms_csv", "Exported Firms CSV", None)
    return response

@router.get("/revenue/csv")
def download_revenue_csv(db: Session = Depends(get_db), current_admin: User = Depends(get_current_superadmin)):
    payments = db.query(PaymentTransaction).order_by(PaymentTransaction.created_at.desc()).all()
    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow(["Transaction ID", "Date", "Firm", "Amount (INR)", "Status", "Gateway Ref"])
    
    for p in payments:
        writer.writerow([
            str(p.id), 
            p.created_at.strftime("%Y-%m-%d %H:%M:%S") if p.created_at else "",
            p.firm.name if p.firm else "",
            p.amount / 100,
            p.status,
            p.gateway_reference
        ])
    
    response = Response(content=output.getvalue(), media_type="text/csv")
    response.headers["Content-Disposition"] = "attachment; filename=revenue_report.csv"
    
    log_admin_action(db, current_admin.id, "EXPORT_REPORT", "REPORT", "revenue_csv", "Exported Revenue CSV", None)
    return response
