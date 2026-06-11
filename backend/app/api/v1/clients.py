from fastapi import APIRouter, Depends, HTTPException, status, Query, Request
from sqlalchemy.orm import Session, joinedload
from typing import Optional
import uuid
from pydantic import BaseModel, EmailStr
from datetime import datetime

from app.core.database import get_db
from app.core.security import get_current_user
from app.core.permissions import (
    require_firm_member, require_roles, check_object_firm, apply_firm_filter,
    get_user_firm_id, ROLES_ADMIN, ROLES_ADVOCATES
)
from app.models.client import Client, ClientType
from app.models.user import User, UserRole
from app.services.audit_service import log_action, extract_ip, AuditAction

router = APIRouter()


def serialize_client(c: Client, include_cases: bool = False) -> dict:
    data = {
        "id": str(c.id),
        "name": c.name,
        "type": c.type,
        "phone": c.phone,
        "alternate_phone": c.alternate_phone,
        "email": c.email,
        "address": c.address,
        "city": c.city,
        "state": c.state,
        "pincode": c.pincode,
        "pan": c.pan,
        "gstin": c.gstin,
        "aadhaar_number": c.aadhaar_number,
        "occupation": c.occupation,
        "date_of_birth": c.date_of_birth.isoformat() if c.date_of_birth else None,
        "photograph_url": c.photograph_url,
        "company_name": c.company_name,
        "contact_person": c.contact_person,
        "notes": c.notes,
        "tags": c.tags or [],
        "is_active": c.is_active,
        "kyc_verified": c.kyc_verified,
        "fees_outstanding": c.fees_outstanding,
        "firm_id": str(c.firm_id) if c.firm_id else None,
        "created_at": c.created_at.isoformat() if c.created_at else None,
        "updated_at": c.updated_at.isoformat() if c.updated_at else None,
    }
    if include_cases:
        data["cases"] = [
            {
                "id": str(case.id),
                "case_no": case.case_no,
                "title": case.title,
                "court": case.court,
                "practice_area": case.practice_area,
                "status": case.status,
                "stage": case.stage,
                "next_hearing_date": case.next_hearing_date.isoformat() if case.next_hearing_date else None,
                "fees_agreed": case.fees_agreed,
                "fees_received": case.fees_received,
            }
            for case in c.cases
        ]
        data["active_cases_count"] = sum(1 for case in c.cases if case.status == "active")
        data["closed_cases_count"] = sum(1 for case in c.cases if case.status in ("closed", "disposed"))
        data["total_cases_count"] = len(c.cases)
        import datetime as dt
        today = dt.date.today()
        upcoming = []
        for case in c.cases:
            if case.next_hearing_date and case.next_hearing_date >= today:
                upcoming.append(case.next_hearing_date)
        data["upcoming_hearings_count"] = len(upcoming)
        data["invoices"] = [
            {
                "id": str(inv.id),
                "invoice_no": inv.invoice_no,
                "total": inv.total,
                "status": inv.status,
                "due_date": inv.due_date.isoformat() if inv.due_date else None,
            }
            for inv in c.invoices
        ]
        data["documents"] = [
            {
                "id": str(doc.id),
                "name": doc.name,
                "doc_type": doc.doc_type,
                "file_size": doc.file_size,
                "mime_type": doc.mime_type,
                "is_evidence": doc.is_evidence,
                "description": doc.description,
                "created_at": doc.created_at.isoformat() if doc.created_at else None,
            }
            for doc in c.documents
        ]
    return data


class ClientCreate(BaseModel):
    name: str
    type: str = "individual"
    phone: str
    alternate_phone: Optional[str] = None
    email: Optional[EmailStr] = None
    city: Optional[str] = None
    state: Optional[str] = None
    pincode: Optional[str] = None
    address: Optional[str] = None
    pan: Optional[str] = None
    gstin: Optional[str] = None
    company_name: Optional[str] = None
    contact_person: Optional[str] = None
    notes: Optional[str] = None
    tags: list = []


class ClientUpdate(BaseModel):
    name: Optional[str] = None
    phone: Optional[str] = None
    alternate_phone: Optional[str] = None
    email: Optional[EmailStr] = None
    city: Optional[str] = None
    state: Optional[str] = None
    pincode: Optional[str] = None
    address: Optional[str] = None
    pan: Optional[str] = None
    gstin: Optional[str] = None
    aadhaar_number: Optional[str] = None
    occupation: Optional[str] = None
    date_of_birth: Optional[str] = None
    photograph_url: Optional[str] = None
    company_name: Optional[str] = None
    contact_person: Optional[str] = None
    notes: Optional[str] = None
    tags: Optional[list] = None
    kyc_verified: Optional[bool] = None
    is_active: Optional[bool] = None


@router.get("/")
async def list_clients(
    skip: int = 0,
    limit: int = 50,
    search: Optional[str] = None,
    type: Optional[str] = None,
    is_active: Optional[bool] = True,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_firm_member),
):
    # ── Tenant isolation: scope to current firm ──────────────────────────────
    query = apply_firm_filter(db.query(Client), Client, current_user).filter(Client.is_deleted == False)
    if is_active is not None:
        query = query.filter(Client.is_active == is_active)
    if search:
        query = query.filter(
            Client.name.ilike(f"%{search}%") | Client.phone.ilike(f"%{search}%") | Client.email.ilike(f"%{search}%")
        )
    if type:
        query = query.filter(Client.type == type)
    total = query.count()
    clients = query.order_by(Client.created_at.desc()).offset(skip).limit(limit).all()
    return {"total": total, "clients": [serialize_client(c) for c in clients]}


@router.post("/", status_code=status.HTTP_201_CREATED)
async def create_client(
    data: ClientCreate,
    request: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_firm_member),
):
    client = Client(
        **data.model_dump(),
        assigned_advocate_id=current_user.id,
        firm_id=get_user_firm_id(current_user),
        created_by_id=current_user.id,
        updated_by_id=current_user.id,
    )
    db.add(client)
    db.flush()
    log_action(db, AuditAction.CLIENT_CREATE, "CLIENT", str(client.id),
               user=current_user, ip=extract_ip(request),
               details={"name": client.name, "type": client.type})
    db.commit()
    db.refresh(client)
    return serialize_client(client)


@router.get("/stats")
async def client_stats(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_firm_member),
):
    # ── Tenant isolation ──────────────────────────────────────────────────────
    base_q = apply_firm_filter(db.query(Client), Client, current_user).filter(Client.is_deleted == False)
    total = base_q.filter(Client.is_active == True).count()
    individual = base_q.filter(Client.type == "individual", Client.is_active == True).count()
    corporate = base_q.filter(Client.type == "corporate", Client.is_active == True).count()
    fees_outstanding = sum(
        c.fees_outstanding or 0 for c in base_q.filter(Client.is_active == True).all()
    )
    return {
        "total": total,
        "individual": individual,
        "corporate": corporate,
        "fees_outstanding": fees_outstanding,
    }


@router.get("/{client_id}")
async def get_client(
    client_id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_firm_member),
):
    client = (
        db.query(Client)
        .options(joinedload(Client.cases), joinedload(Client.invoices))
        .filter(Client.id == client_id)
        .filter(Client.is_deleted == False)
        .first()
    )
    if not client:
        raise HTTPException(status_code=404, detail="Client not found")
    # ── Object-level security ─────────────────────────────────────────────────
    check_object_firm(client, current_user)
    return serialize_client(client, include_cases=True)


@router.put("/{client_id}")
async def update_client(
    client_id: uuid.UUID,
    data: ClientUpdate,
    request: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_firm_member),
):
    client = db.query(Client).filter(Client.id == client_id, Client.is_deleted == False).first()
    if not client:
        raise HTTPException(status_code=404, detail="Client not found")
    check_object_firm(client, current_user)
    for field, value in data.model_dump(exclude_unset=True).items():
        setattr(client, field, value)
    client.updated_at = datetime.utcnow()
    client.updated_by_id = current_user.id
    log_action(db, AuditAction.CLIENT_UPDATE, "CLIENT", str(client_id),
               user=current_user, ip=extract_ip(request),
               details=data.model_dump(exclude_unset=True))
    db.commit()
    db.refresh(client)
    return serialize_client(client)


@router.delete("/{client_id}")
async def delete_client(
    client_id: uuid.UUID,
    request: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(*ROLES_ADVOCATES)),
):
    client = db.query(Client).filter(Client.id == client_id, Client.is_deleted == False).first()
    if not client:
        raise HTTPException(status_code=404, detail="Client not found")
    check_object_firm(client, current_user)
    client.is_deleted = True
    client.updated_at = datetime.utcnow()
    client.updated_by_id = current_user.id
    log_action(db, AuditAction.CLIENT_DELETE, "CLIENT", str(client_id),
               user=current_user, ip=extract_ip(request),
               details={"name": client.name})
    db.commit()
    return {"message": "Client deactivated successfully"}
