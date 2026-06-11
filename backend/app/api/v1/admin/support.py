from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.security import get_current_superadmin
from app.models.support import SupportTicket, TicketMessage, TicketStatus
from app.models.user import User
from pydantic import BaseModel

router = APIRouter()

class MessagePayload(BaseModel):
    message: str

class StatusPayload(BaseModel):
    status: str

@router.get("/")
def get_all_tickets(status: str = "all", db: Session = Depends(get_db), current_admin: User = Depends(get_current_superadmin)):
    query = db.query(SupportTicket)
    if status != "all":
        query = query.filter(SupportTicket.status == status)
    
    tickets = query.order_by(SupportTicket.created_at.desc()).all()
    
    result = []
    for t in tickets:
        result.append({
            "id": t.id,
            "subject": t.subject,
            "category": t.category,
            "priority": t.priority,
            "status": t.status,
            "created_at": t.created_at,
            "user_name": t.user.full_name if t.user else "Unknown",
            "firm_name": t.firm.name if t.firm else "Unknown"
        })
    return result

@router.get("/{ticket_id}")
def get_ticket_details(ticket_id: str, db: Session = Depends(get_db), current_admin: User = Depends(get_current_superadmin)):
    ticket = db.query(SupportTicket).filter(SupportTicket.id == ticket_id).first()
    if not ticket:
        raise HTTPException(status_code=404, detail="Ticket not found")
        
    messages = []
    for m in ticket.messages:
        messages.append({
            "id": m.id,
            "message": m.message,
            "created_at": m.created_at,
            "sender_name": m.sender.full_name,
            "is_admin": m.sender.is_superadmin
        })
        
    return {
        "id": ticket.id,
        "subject": ticket.subject,
        "category": ticket.category,
        "priority": ticket.priority,
        "status": ticket.status,
        "created_at": ticket.created_at,
        "user_name": ticket.user.full_name if ticket.user else "Unknown",
        "firm_name": ticket.firm.name if ticket.firm else "Unknown",
        "messages": messages
    }

@router.post("/{ticket_id}/reply")
def reply_to_ticket(ticket_id: str, payload: MessagePayload, db: Session = Depends(get_db), current_admin: User = Depends(get_current_superadmin)):
    ticket = db.query(SupportTicket).filter(SupportTicket.id == ticket_id).first()
    if not ticket:
        raise HTTPException(status_code=404, detail="Ticket not found")
        
    msg = TicketMessage(
        ticket_id=ticket.id,
        sender_id=current_admin.id,
        message=payload.message
    )
    db.add(msg)
    
    # Auto-update status to in_progress if it was open
    if ticket.status == TicketStatus.OPEN:
        ticket.status = TicketStatus.IN_PROGRESS
        
    import datetime
    ticket.updated_at = datetime.datetime.utcnow()
        
    db.commit()
    return {"message": "Reply sent successfully"}

@router.put("/{ticket_id}/status")
def update_ticket_status(ticket_id: str, payload: StatusPayload, db: Session = Depends(get_db), current_admin: User = Depends(get_current_superadmin)):
    ticket = db.query(SupportTicket).filter(SupportTicket.id == ticket_id).first()
    if not ticket:
        raise HTTPException(status_code=404, detail="Ticket not found")
        
    ticket.status = payload.status
    import datetime
    ticket.updated_at = datetime.datetime.utcnow()
    db.commit()
    
    return {"message": f"Ticket status updated to {payload.status}"}
