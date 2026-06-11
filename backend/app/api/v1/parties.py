from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Optional, List
import uuid

from app.core.database import get_db
from app.core.permissions import require_firm_member, check_object_firm, get_user_firm_id
from app.models.party import Party
from app.models.case import Case
from app.models.user import User

router = APIRouter()

class PartyBase(BaseModel):
    name: str
    party_type: str = "respondent"
    advocate_name: Optional[str] = None
    mobile: Optional[str] = None
    email: Optional[str] = None
    address: Optional[str] = None

class PartyCreate(PartyBase):
    pass

class PartyUpdate(BaseModel):
    name: Optional[str] = None
    party_type: Optional[str] = None
    advocate_name: Optional[str] = None
    mobile: Optional[str] = None
    email: Optional[str] = None
    address: Optional[str] = None

class PartyResponse(PartyBase):
    id: uuid.UUID
    case_id: uuid.UUID

    class Config:
        from_attributes = True

@router.post("/{case_id}/parties", response_model=PartyResponse, status_code=status.HTTP_201_CREATED)
async def create_party(
    case_id: uuid.UUID,
    party: PartyCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_firm_member)
):
    case = db.query(Case).filter(Case.id == case_id, Case.is_deleted == False).first()
    if not case:
        raise HTTPException(status_code=404, detail="Case not found")
    check_object_firm(case, current_user)

    db_party = Party(
        **party.model_dump(),
        case_id=case.id,
        firm_id=get_user_firm_id(current_user),
        created_by_id=current_user.id
    )
    db.add(db_party)
    db.commit()
    db.refresh(db_party)
    return db_party

@router.get("/{case_id}/parties", response_model=List[PartyResponse])
async def list_parties(
    case_id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_firm_member)
):
    case = db.query(Case).filter(Case.id == case_id, Case.is_deleted == False).first()
    if not case:
        raise HTTPException(status_code=404, detail="Case not found")
    check_object_firm(case, current_user)

    parties = db.query(Party).filter(Party.case_id == case.id).all()
    return parties

@router.patch("/parties/{party_id}", response_model=PartyResponse)
async def update_party(
    party_id: uuid.UUID,
    party_update: PartyUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_firm_member)
):
    db_party = db.query(Party).filter(Party.id == party_id).first()
    if not db_party:
        raise HTTPException(status_code=404, detail="Party not found")
    
    case = db.query(Case).filter(Case.id == db_party.case_id).first()
    check_object_firm(case, current_user)

    for key, value in party_update.model_dump(exclude_unset=True).items():
        setattr(db_party, key, value)
    
    db.commit()
    db.refresh(db_party)
    return db_party

@router.delete("/parties/{party_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_party(
    party_id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_firm_member)
):
    db_party = db.query(Party).filter(Party.id == party_id).first()
    if not db_party:
        raise HTTPException(status_code=404, detail="Party not found")
    
    case = db.query(Case).filter(Case.id == db_party.case_id).first()
    check_object_firm(case, current_user)

    db.delete(db_party)
    db.commit()
    return None
