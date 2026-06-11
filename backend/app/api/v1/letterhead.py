from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import Optional
from pydantic import BaseModel

from app.core.database import get_db
from app.core.security import get_current_user
from app.models.user import User
from app.models.letterhead import Letterhead

router = APIRouter()

class LetterheadSchema(BaseModel):
    id: Optional[str] = None
    name: Optional[str] = "Primary Letterhead"
    is_default: Optional[bool] = False
    advocate_name: Optional[str] = None
    firm_name: Optional[str] = None
    enrollment_number: Optional[str] = None
    office_address: Optional[str] = None
    mobile_number: Optional[str] = None
    email_id: Optional[str] = None
    website: Optional[str] = None
    gst_number: Optional[str] = None
    logo_base64: Optional[str] = None
    signature_base64: Optional[str] = None
    stamp_base64: Optional[str] = None
    template_type: Optional[str] = "standard"
    custom_header_html: Optional[str] = None
    custom_footer_html: Optional[str] = None

def serialize_letterhead(l: Letterhead) -> dict:
    return {
        "id": str(l.id),
        "user_id": str(l.user_id),
        "name": l.name,
        "is_default": l.is_default,
        "advocate_name": l.advocate_name,
        "firm_name": l.firm_name,
        "enrollment_number": l.enrollment_number,
        "office_address": l.office_address,
        "mobile_number": l.mobile_number,
        "email_id": l.email_id,
        "website": l.website,
        "gst_number": l.gst_number,
        "logo_base64": l.logo_base64,
        "signature_base64": l.signature_base64,
        "stamp_base64": l.stamp_base64,
        "template_type": l.template_type,
        "custom_header_html": l.custom_header_html,
        "custom_footer_html": l.custom_footer_html,
    }

@router.get("/", response_model=list[dict])
async def get_my_letterheads(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    letterheads = db.query(Letterhead).filter(Letterhead.user_id == current_user.id).all()
    return [serialize_letterhead(l) for l in letterheads]

@router.post("/", response_model=dict)
async def create_letterhead(
    data: LetterheadSchema,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if data.is_default:
        db.query(Letterhead).filter(Letterhead.user_id == current_user.id).update({"is_default": False})
        
    l = Letterhead(user_id=current_user.id)
    db.add(l)
    
    for field, val in data.model_dump(exclude_unset=True, exclude={"id"}).items():
        setattr(l, field, val)
    
    db.commit()
    db.refresh(l)
    return serialize_letterhead(l)

@router.put("/{letterhead_id}", response_model=dict)
async def update_letterhead(
    letterhead_id: str,
    data: LetterheadSchema,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    l = db.query(Letterhead).filter(Letterhead.id == letterhead_id, Letterhead.user_id == current_user.id).first()
    if not l:
        raise HTTPException(status_code=404, detail="Letterhead not found")
        
    if data.is_default:
        db.query(Letterhead).filter(Letterhead.user_id == current_user.id).update({"is_default": False})
        
    for field, val in data.model_dump(exclude_unset=True, exclude={"id"}).items():
        setattr(l, field, val)
        
    db.commit()
    db.refresh(l)
    return serialize_letterhead(l)

@router.delete("/{letterhead_id}")
async def delete_letterhead(
    letterhead_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    l = db.query(Letterhead).filter(Letterhead.id == letterhead_id, Letterhead.user_id == current_user.id).first()
    if not l:
        raise HTTPException(status_code=404, detail="Letterhead not found")
        
    db.delete(l)
    db.commit()
    return {"status": "success"}
