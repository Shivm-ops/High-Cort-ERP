from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List, Optional
import uuid
from pydantic import BaseModel

from app.core.database import get_db
from app.models.court import Court
from app.models.user import User
from app.core.security import get_current_user

router = APIRouter()

class CourtCreate(BaseModel):
    name: str
    type: str
    jurisdiction: Optional[str] = None
    address: Optional[str] = None
    presiding_officer: Optional[str] = None
    room_number: Optional[str] = None
    contact_info: Optional[str] = None


@router.get("/")
def get_courts(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    search: Optional[str] = None,
    court_type: Optional[str] = None,
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
):
    query = db.query(Court)
    
    if search:
        query = query.filter(Court.name.ilike(f"%{search}%") | Court.jurisdiction.ilike(f"%{search}%"))
        
    if court_type and court_type != "All":
        query = query.filter(Court.type == court_type)
        
    total = query.count()
    results = query.offset(skip).limit(limit).all()
    
    return {
        "total": total,
        "items": [
            {
                "id": str(c.id),
                "name": c.name,
                "type": c.type,
                "jurisdiction": c.jurisdiction,
                "address": c.address,
                "presiding_officer": c.presiding_officer,
                "room_number": c.room_number,
                "contact_info": c.contact_info
            } for c in results
        ]
    }

@router.get("/{court_id}")
def get_court(
    court_id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    court = db.query(Court).filter(Court.id == court_id).first()
    if not court:
        raise HTTPException(status_code=404, detail="Court not found")
    return court

@router.post("/")
def create_court(
    court_in: CourtCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Create a new court for the tenant."""
    new_court = Court(
        name=court_in.name,
        type=court_in.type,
        jurisdiction=court_in.jurisdiction,
        address=court_in.address,
        presiding_officer=court_in.presiding_officer,
        room_number=court_in.room_number,
        contact_info=court_in.contact_info
    )
    db.add(new_court)
    db.commit()
    db.refresh(new_court)
    return new_court

@router.delete("/{court_id}")
def delete_court(
    court_id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Delete a court (e.g. dummy data)."""
    court = db.query(Court).filter(Court.id == court_id).first()
    if not court:
        raise HTTPException(status_code=404, detail="Court not found")
        
    db.delete(court)
    db.commit()
    return {"status": "success", "message": "Court deleted successfully"}

