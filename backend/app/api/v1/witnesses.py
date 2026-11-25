from typing import Optional
import uuid

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.permissions import (
    ROLES_ADVOCATES,
    check_object_firm,
    require_firm_member,
    require_roles,
)
from app.models.case import Case
from app.models.user import User
from app.models.witness import Witness

router = APIRouter()


class WitnessCreate(BaseModel):
    name: str
    address: Optional[str] = None
    mobile: Optional[str] = None
    statement: Optional[str] = None
    status: Optional[str] = "Pending"


def _assert_firm_case(case_id: uuid.UUID, current_user: User, db: Session) -> Case:
    case = db.query(Case).filter(Case.id == case_id, Case.is_deleted == False).first()
    if not case:
        raise HTTPException(status_code=404, detail="Case not found")
    check_object_firm(case, current_user)
    return case


@router.get("/case/{case_id}")
async def list_witnesses(
    case_id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_firm_member),
):
    _assert_firm_case(case_id, current_user, db)
    witnesses = db.query(Witness).filter(Witness.case_id == case_id).all()
    return {"witnesses": witnesses}


@router.post("/case/{case_id}", status_code=status.HTTP_201_CREATED)
async def create_witness(
    case_id: uuid.UUID,
    witness_data: WitnessCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_firm_member),
):
    _assert_firm_case(case_id, current_user, db)
    new_witness = Witness(
        case_id=case_id,
        name=witness_data.name,
        address=witness_data.address,
        mobile=witness_data.mobile,
        statement=witness_data.statement,
        status=witness_data.status,
    )
    db.add(new_witness)
    db.commit()
    db.refresh(new_witness)
    return new_witness


@router.delete("/{witness_id}")
async def delete_witness(
    witness_id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(*ROLES_ADVOCATES)),
):
    w = db.query(Witness).filter(Witness.id == witness_id).first()
    if not w:
        raise HTTPException(status_code=404, detail="Witness not found")
    _assert_firm_case(w.case_id, current_user, db)
    db.delete(w)
    db.commit()
    return {"message": "Witness deleted successfully"}
