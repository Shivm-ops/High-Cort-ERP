from fastapi import APIRouter, Depends, HTTPException, status, BackgroundTasks
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import or_
from typing import Optional, List
from pydantic import BaseModel
from datetime import date, datetime
import uuid

from app.core.database import get_db
from app.core.security import get_current_user
from app.core.permissions import (
    require_firm_member, require_roles, check_object_firm, apply_firm_filter,
    get_user_firm_id, ROLES_ADMIN, ROLES_WITH_BILLING
)
from app.models.invoice import Invoice, InvoiceStatus
from app.models.client import Client
from app.models.case import Case
from app.models.user import User
from app.models.fee_expense import Fee, Expense
from app.models.advance_payment import AdvancePayment
from app.services.audit_service import log_action, extract_ip, AuditAction
from app.services.whatsapp import WhatsAppService
from fastapi import Request

router = APIRouter()

# --- Schemas ---

class FeeCreate(BaseModel):
    client_id: str
    case_id: Optional[str] = None
    hearing_id: Optional[str] = None
    category: str
    description: Optional[str] = None
    amount: float
    date: date

class ExpenseCreate(BaseModel):
    client_id: str
    case_id: Optional[str] = None
    category: str
    description: Optional[str] = None
    amount: float
    date: date

class AdvancePaymentCreate(BaseModel):
    client_id: str
    case_id: Optional[str] = None
    amount_received: float
    payment_method: str
    reference: Optional[str] = None
    notes: Optional[str] = None
    date: date

class InvoiceItemModel(BaseModel):
    description: str
    quantity: float = 1
    rate: float
    amount: float

class InvoiceCreate(BaseModel):
    client_id: str
    case_id: Optional[str] = None
    items: List[InvoiceItemModel]
    fee_ids: Optional[List[str]] = []
    expense_ids: Optional[List[str]] = []
    gst_rate: float = 18.0
    due_date: Optional[date] = None
    notes: Optional[str] = None
    terms: Optional[str] = None
    place_of_supply: Optional[str] = None

class InvoiceUpdate(BaseModel):
    status: Optional[str] = None
    due_date: Optional[date] = None
    notes: Optional[str] = None
    terms: Optional[str] = None

class PaymentRecord(BaseModel):
    amount: float
    payment_method: str = "bank_transfer"
    payment_reference: Optional[str] = None

# --- Helpers ---

def generate_invoice_no(db: Session) -> str:
    year = datetime.now().year
    count = db.query(Invoice).count() + 1
    return f"INV-{year}-{str(count).zfill(3)}"

def serialize_invoice(i: Invoice) -> dict:
    return {
        "id": str(i.id),
        "invoice_no": i.invoice_no,
        "client_id": str(i.client_id),
        "client_name": i.client.name if i.client else None,
        "case_id": str(i.case_id) if i.case_id else None,
        "case_no": i.case.case_no if i.case else None,
        "case_title": i.case.title if i.case else None,
        "items": i.items or [],
        "subtotal": i.subtotal,
        "gst_rate": i.gst_rate,
        "gst_amount": i.gst_amount,
        "total": i.total,
        "amount_paid": i.amount_paid,
        "balance_due": i.balance_due,
        "status": i.status,
        "due_date": i.due_date.isoformat() if i.due_date else None,
        "paid_date": i.paid_date.isoformat() if i.paid_date else None,
        "payment_method": i.payment_method,
        "payment_reference": i.payment_reference,
        "notes": i.notes,
        "terms": i.terms,
        "place_of_supply": i.place_of_supply,
        "created_at": i.created_at.isoformat() if i.created_at else None,
        "updated_at": i.updated_at.isoformat() if i.updated_at else None,
    }


def _assert_client_firm(client_id: str, current_user: User, db: Session) -> Client:
    """Guard: resolve client and assert it belongs to the current firm."""
    import uuid
    cid = uuid.UUID(client_id) if isinstance(client_id, str) else client_id
    client = apply_firm_filter(db.query(Client), Client, current_user).filter(
        Client.id == cid
    ).first()
    if not client:
        raise HTTPException(status_code=404, detail="Client not found")
    return client


def _assert_case_firm(case_id: uuid.UUID, current_user: User, db: Session) -> Case:
    """Guard: resolve case and assert it belongs to the current firm."""
    case = apply_firm_filter(db.query(Case), Case, current_user).filter(
        Case.id == case_id
    ).first()
    if not case:
        raise HTTPException(status_code=404, detail="Case not found")
    return case


# --- Ledger & Stats ---

@router.get("/stats/summary")
async def billing_stats(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_firm_member),
):
    # Tenant-scoped invoices via client FK
    firm_client_ids = [
        c.id for c in apply_firm_filter(db.query(Client), Client, current_user).all()
    ]
    invoices = db.query(Invoice).filter(Invoice.client_id.in_(firm_client_ids)).all()
    total_billed = sum(i.total for i in invoices if i.status != InvoiceStatus.DRAFT) or 0
    total_received = sum(i.amount_paid or 0 for i in invoices) or 0
    overdue_count = db.query(Invoice).filter(
        Invoice.client_id.in_(firm_client_ids), Invoice.status == InvoiceStatus.OVERDUE
    ).count()
    pending_count = db.query(Invoice).filter(
        Invoice.client_id.in_(firm_client_ids),
        Invoice.status.in_([InvoiceStatus.SENT, InvoiceStatus.PARTIAL])
    ).count()
    unbilled_fees = sum(
        f.amount for f in db.query(Fee).filter(
            Fee.client_id.in_(firm_client_ids), Fee.is_billed == False
        ).all()
    )
    unbilled_expenses = sum(
        e.amount for e in db.query(Expense).filter(
            Expense.client_id.in_(firm_client_ids), Expense.is_billed == False
        ).all()
    )
    advances = db.query(AdvancePayment).filter(
        AdvancePayment.client_id.in_(firm_client_ids)
    ).all()
    advance_balance = sum(a.balance for a in advances)
    return {
        "total_billed": total_billed,
        "total_received": total_received,
        "outstanding": total_billed - total_received,
        "overdue_count": overdue_count,
        "pending_count": pending_count,
        "unbilled_fees": unbilled_fees,
        "unbilled_expenses": unbilled_expenses,
        "advance_balance": advance_balance,
    }


@router.get("/ledger/{case_id}")
async def get_matter_ledger(
    case_id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_firm_member),
):
    # ── Object-level security: verify case belongs to firm ────────────────────
    _assert_case_firm(case_id, current_user, db)

    fees = db.query(Fee).filter(Fee.case_id == case_id).all()
    expenses = db.query(Expense).filter(Expense.case_id == case_id).all()
    advances = db.query(AdvancePayment).filter(AdvancePayment.case_id == case_id).all()
    invoices = db.query(Invoice).filter(Invoice.case_id == case_id).all()

    ledger = []
    for f in fees:
        ledger.append({"id": str(f.id), "type": "fee", "date": f.date.isoformat(), "category": f.category, "description": f.description, "amount": f.amount, "is_billed": f.is_billed})
    for e in expenses:
        ledger.append({"id": str(e.id), "type": "expense", "date": e.date.isoformat(), "category": e.category, "description": e.description, "amount": e.amount, "is_billed": e.is_billed})
    for a in advances:
        ledger.append({"id": str(a.id), "type": "advance", "date": a.date.isoformat(), "payment_method": a.payment_method, "amount_received": a.amount_received, "amount_utilized": a.amount_utilized, "balance": a.balance})
    for i in invoices:
        ledger.append({"id": str(i.id), "type": "invoice", "date": i.created_at.isoformat(), "invoice_no": i.invoice_no, "total": i.total, "status": i.status.value, "amount_paid": i.amount_paid})

    ledger.sort(key=lambda x: x["date"], reverse=True)
    summary = {
        "total_fees": sum(f.amount for f in fees),
        "total_expenses": sum(e.amount for e in expenses),
        "advance_balance": sum(a.balance for a in advances),
        "total_invoiced": sum(i.total for i in invoices if i.status != InvoiceStatus.DRAFT),
        "total_paid": sum(i.amount_paid for i in invoices),
    }
    return {"ledger": ledger, "summary": summary}


# --- Fees, Expenses, Advances ---

@router.post("/fees")
async def create_fee(
    data: FeeCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_firm_member),
):
    # ── Verify client belongs to firm ─────────────────────────────────────────
    _assert_client_firm(data.client_id, current_user, db)
    fee = Fee(**data.model_dump())
    db.add(fee)
    db.commit()
    return {"message": "Fee recorded", "id": str(fee.id)}


@router.get("/fees/unbilled")
async def get_unbilled_fees(
    case_id: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_firm_member),
):
    firm_client_ids = [
        c.id for c in apply_firm_filter(db.query(Client), Client, current_user).all()
    ]
    query = db.query(Fee).filter(Fee.is_billed == False, Fee.client_id.in_(firm_client_ids))
    if case_id:
        query = query.filter(Fee.case_id == case_id)
    return query.all()


@router.post("/expenses")
async def create_expense(
    data: ExpenseCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_firm_member),
):
    _assert_client_firm(data.client_id, current_user, db)
    expense = Expense(**data.model_dump())
    db.add(expense)
    db.commit()
    return {"message": "Expense recorded", "id": str(expense.id)}


@router.get("/expenses/unbilled")
async def get_unbilled_expenses(
    case_id: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_firm_member),
):
    firm_client_ids = [
        c.id for c in apply_firm_filter(db.query(Client), Client, current_user).all()
    ]
    query = db.query(Expense).filter(Expense.is_billed == False, Expense.client_id.in_(firm_client_ids))
    if case_id:
        query = query.filter(Expense.case_id == case_id)
    return query.all()


@router.post("/advances")
async def record_advance(
    data: AdvancePaymentCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_firm_member),
):
    _assert_client_firm(data.client_id, current_user, db)
    advance = AdvancePayment(
        **data.model_dump(),
        amount_utilized=0.0,
        balance=data.amount_received
    )
    db.add(advance)
    db.commit()
    return {"message": "Advance payment recorded", "id": str(advance.id)}


# --- Invoices ---

@router.get("/")
async def list_invoices(
    skip: int = 0,
    limit: int = 50,
    status: Optional[str] = None,
    case_id: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_firm_member),
):
    # ── Tenant isolation: scope by firm clients ───────────────────────────────
    firm_client_ids = [
        c.id for c in apply_firm_filter(db.query(Client), Client, current_user).all()
    ]
    query = db.query(Invoice).options(
        joinedload(Invoice.client), joinedload(Invoice.case)
    ).filter(Invoice.client_id.in_(firm_client_ids))
    if status:
        query = query.filter(Invoice.status == status)
    if case_id:
        # Also verify the case belongs to the firm
        _assert_case_firm(case_id, current_user, db)
        query = query.filter(Invoice.case_id == case_id)
    total = query.count()
    invoices = query.order_by(Invoice.created_at.desc()).offset(skip).limit(limit).all()
    return {"total": total, "invoices": [serialize_invoice(i) for i in invoices]}


@router.post("/", status_code=status.HTTP_201_CREATED)
async def create_invoice(
    data: InvoiceCreate,
    request: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(*ROLES_WITH_BILLING)),
):
    # ── Verify client and optional case belong to firm ────────────────────────
    _assert_client_firm(data.client_id, current_user, db)
    if data.case_id:
        _assert_case_firm(data.case_id, current_user, db)

    subtotal = sum(item.amount for item in data.items)
    gst_amount = subtotal * (data.gst_rate / 100)
    total = subtotal + gst_amount

    import uuid
    invoice = Invoice(
        invoice_no=generate_invoice_no(db),
        client_id=uuid.UUID(data.client_id) if isinstance(data.client_id, str) else data.client_id,
        case_id=uuid.UUID(data.case_id) if isinstance(data.case_id, str) and data.case_id else data.case_id,
        created_by_id=current_user.id,
        items=[item.model_dump() for item in data.items],
        subtotal=subtotal,
        gst_rate=data.gst_rate,
        gst_amount=gst_amount,
        total=total,
        amount_paid=0.0,
        balance_due=total,
        status=InvoiceStatus.DRAFT,
        due_date=data.due_date,
    )
    db.add(invoice)
    db.flush()

    if data.fee_ids:
        for fee_id in data.fee_ids:
            f = db.query(Fee).filter(Fee.id == fee_id).first()
            if f:
                f.is_billed = True
                f.invoice_id = invoice.id

    if data.expense_ids:
        for exp_id in data.expense_ids:
            e = db.query(Expense).filter(Expense.id == exp_id).first()
            if e:
                e.is_billed = True
                e.invoice_id = invoice.id

    db.commit()
    db.refresh(invoice)
    log_action(db, AuditAction.INVOICE_CREATE, "INVOICE", str(invoice.id),
               user=current_user, ip=extract_ip(request),
               details={"invoice_no": invoice.invoice_no, "total": invoice.total})
    db.commit()
    return serialize_invoice(invoice)


@router.get("/{invoice_id}")
async def get_invoice(
    invoice_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_firm_member),
):
    invoice = db.query(Invoice).options(
        joinedload(Invoice.client), joinedload(Invoice.case)
    ).filter(Invoice.id == invoice_id).first()
    if not invoice:
        raise HTTPException(status_code=404)
    # ── Object-level security via client's firm ───────────────────────────────
    client = db.query(Client).filter(Client.id == invoice.client_id).first()
    if client:
        check_object_firm(client, current_user)
    return serialize_invoice(invoice)


@router.put("/{invoice_id}")
async def update_invoice(
    invoice_id: str,
    data: InvoiceUpdate,
    request: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_firm_member),
):
    invoice = db.query(Invoice).filter(Invoice.id == invoice_id).first()
    if not invoice:
        raise HTTPException(status_code=404)
    client = db.query(Client).filter(Client.id == invoice.client_id).first()
    if client:
        check_object_firm(client, current_user)
    for field, value in data.model_dump(exclude_unset=True).items():
        setattr(invoice, field, value)
    db.commit()
    log_action(db, AuditAction.INVOICE_UPDATE, "INVOICE", invoice_id,
               user=current_user, ip=extract_ip(request),
               details=data.model_dump(exclude_unset=True))
    db.commit()
    return serialize_invoice(invoice)


@router.post("/{invoice_id}/send")
async def send_invoice(
    invoice_id: str,
    request: Request,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_firm_member),
):
    invoice = db.query(Invoice).filter(Invoice.id == invoice_id).first()
    if not invoice:
        raise HTTPException(status_code=404)
    client = db.query(Client).filter(Client.id == invoice.client_id).first()
    if client:
        check_object_firm(client, current_user)
    invoice.status = InvoiceStatus.SENT
    db.commit()
    
    if client and client.phone:
        background_tasks.add_task(
            WhatsAppService.send_invoice_alert,
            phone_number=client.phone,
            client_name=client.name,
            invoice_no=invoice.invoice_no,
            amount=invoice.total,
            due_date=invoice.due_date.isoformat() if invoice.due_date else "Upon Receipt"
        )

    log_action(db, AuditAction.INVOICE_SEND, "INVOICE", invoice_id,
               user=current_user, ip=extract_ip(request))
    db.commit()
    return {"message": "Invoice marked as sent and notifications triggered"}


@router.post("/{invoice_id}/record-payment")
async def record_payment(
    invoice_id: str,
    data: PaymentRecord,
    request: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(*ROLES_WITH_BILLING)),
):
    invoice = db.query(Invoice).filter(Invoice.id == invoice_id).first()
    if not invoice:
        raise HTTPException(status_code=404)
    client = db.query(Client).filter(Client.id == invoice.client_id).first()
    if client:
        check_object_firm(client, current_user)

    invoice.amount_paid = (invoice.amount_paid or 0) + data.amount
    invoice.balance_due = max(0, invoice.total - invoice.amount_paid)
    invoice.payment_method = data.payment_method
    invoice.payment_reference = data.payment_reference

    if invoice.balance_due == 0:
        invoice.status = InvoiceStatus.PAID
        invoice.paid_date = date.today()
    elif invoice.amount_paid > 0:
        invoice.status = InvoiceStatus.PARTIAL

    db.commit()
    log_action(db, AuditAction.PAYMENT_RECORDED, "INVOICE", invoice_id,
               user=current_user, ip=extract_ip(request),
               details={"amount": data.amount, "method": data.payment_method})
    db.commit()
    return serialize_invoice(invoice)


@router.post("/{invoice_id}/remind")
async def send_reminder(
    invoice_id: str,
    type: str = "whatsapp",
    db: Session = Depends(get_db),
    current_user: User = Depends(require_firm_member),
):
    invoice = db.query(Invoice).filter(Invoice.id == invoice_id).first()
    if not invoice:
        raise HTTPException(status_code=404)
    client = db.query(Client).filter(Client.id == invoice.client_id).first()
    if client:
        check_object_firm(client, current_user)
    return {"message": f"{type.capitalize()} reminder sent successfully!"}
