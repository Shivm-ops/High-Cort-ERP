from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List, Optional

from app.core.database import get_db
from app.models.act import Act, Section
from app.models.user import User
from app.core.security import get_current_user

router = APIRouter()

@router.get("/")
def get_acts(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    search: Optional[str] = None,
    category: Optional[str] = None,
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
):
    query = db.query(Act)
    
    if search:
        query = query.filter(Act.name.ilike(f"%{search}%") | Act.short_name.ilike(f"%{search}%"))
        
    if category and category != "All":
        query = query.filter(Act.category == category)
        
    total = query.count()
    results = query.offset(skip).limit(limit).all()
    
    return {
        "total": total,
        "items": [
            {
                "id": str(act.id),
                "name": act.name,
                "short_name": act.short_name,
                "category": act.category,
                "sections": act.total_sections
            } for act in results
        ]
    }

@router.get("/{act_id}/sections")
def get_act_sections(
    act_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    sections = db.query(Section).filter(Section.act_id == act_id).all()
    return {
        "sections": [
            {
                "id": str(s.id),
                "number": s.number,
                "title": s.title,
                "content": s.content
            } for s in sections
        ]
    }
