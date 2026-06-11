from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import Optional
from pydantic import BaseModel
import uuid

from app.core.database import get_db
from app.core.security import get_current_user
from app.models.witness import Witness
from app.models.user import User

router = APIRouter()

class WitnessCreate(BaseModel):
    name: str
    address: Optional[str] = None
    mobile: Optional[str] = None
    statement: Optional[str] = None
    status: Optional[str] = "Pending"

@router.get("/case/{case_id}")
async def list_witnesses(
    case_id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    witnesses = db.query(Witness).filter(Witness.case_id == case_id).all()
    return {"witnesses": witnesses}


@router.post("/case/{case_id}", status_code=status.HTTP_201_CREATED)
async def create_witness(
    case_id: uuid.UUID,
    witness_data: WitnessCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    new_witness = Witness(
        case_id=case_id,
        name=witness_data.name,
        address=witness_data.address,
        mobile=witness_data.mobile,
        statement=witness_data.statement,
        status=witness_data.status
    )
    db.add(new_witness)
    db.commit()
    db.refresh(new_witness)
    return new_witness


@router.delete("/{witness_id}")
async def delete_witness(
    witness_id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    w = db.query(Witness).filter(Witness.id == witness_id).first()
    if not w:
        raise HTTPException(status_code=404, detail="Witness not found")
    db.delete(w)
    db.commit()
    return {"message": "Witness deleted successfully"}
