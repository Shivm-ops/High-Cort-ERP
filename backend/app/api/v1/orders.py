from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Optional, List
import uuid
from datetime import date

from app.core.database import get_db
from app.core.permissions import require_firm_member, check_object_firm, get_user_firm_id
from app.models.order import CourtOrder
from app.models.case import Case
from app.models.user import User

router = APIRouter()

class OrderBase(BaseModel):
    hearing_id: Optional[uuid.UUID] = None
    order_type: str = "Interim Order"
    order_date: date
    summary: Optional[str] = None
    compliance_required: bool = False
    compliance_due_date: Optional[date] = None
    compliance_status: str = "pending"
    next_action: Optional[str] = None

class OrderCreate(OrderBase):
    pass

class OrderUpdate(BaseModel):
    order_type: Optional[str] = None
    order_date: Optional[date] = None
    summary: Optional[str] = None
    compliance_required: Optional[bool] = None
    compliance_due_date: Optional[date] = None
    compliance_status: Optional[str] = None
    next_action: Optional[str] = None

class OrderResponse(OrderBase):
    id: uuid.UUID
    case_id: uuid.UUID

    class Config:
        from_attributes = True

@router.post("/{case_id}/orders", response_model=OrderResponse, status_code=status.HTTP_201_CREATED)
async def create_order(
    case_id: uuid.UUID,
    order: OrderCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_firm_member)
):
    case = db.query(Case).filter(Case.id == case_id, Case.is_deleted == False).first()
    if not case:
        raise HTTPException(status_code=404, detail="Case not found")
    check_object_firm(case, current_user)

    db_order = CourtOrder(
        **order.model_dump(),
        case_id=case.id,
        firm_id=get_user_firm_id(current_user),
        created_by_id=current_user.id
    )
    db.add(db_order)
    db.commit()
    db.refresh(db_order)
    return db_order

@router.get("/{case_id}/orders", response_model=List[OrderResponse])
async def list_orders(
    case_id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_firm_member)
):
    case = db.query(Case).filter(Case.id == case_id, Case.is_deleted == False).first()
    if not case:
        raise HTTPException(status_code=404, detail="Case not found")
    check_object_firm(case, current_user)

    orders = db.query(CourtOrder).filter(CourtOrder.case_id == case.id).order_by(CourtOrder.order_date.desc()).all()
    return orders

@router.patch("/orders/{order_id}", response_model=OrderResponse)
async def update_order(
    order_id: uuid.UUID,
    order_update: OrderUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_firm_member)
):
    db_order = db.query(CourtOrder).filter(CourtOrder.id == order_id).first()
    if not db_order:
        raise HTTPException(status_code=404, detail="Order not found")
    
    case = db.query(Case).filter(Case.id == db_order.case_id).first()
    check_object_firm(case, current_user)

    for key, value in order_update.model_dump(exclude_unset=True).items():
        setattr(db_order, key, value)
    
    db.commit()
    db.refresh(db_order)
    return db_order

@router.delete("/orders/{order_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_order(
    order_id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_firm_member)
):
    db_order = db.query(CourtOrder).filter(CourtOrder.id == order_id).first()
    if not db_order:
        raise HTTPException(status_code=404, detail="Order not found")
    
    case = db.query(Case).filter(Case.id == db_order.case_id).first()
    check_object_firm(case, current_user)

    db.delete(db_order)
    db.commit()
    return None
