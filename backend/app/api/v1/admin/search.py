from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from sqlalchemy import or_

from app.core.database import get_db
from app.core.security import get_current_superadmin

from app.models.user import User
from app.models.firm import Firm

router = APIRouter()

@router.get("/")
async def global_search(
    q: str = Query(..., min_length=1),
    db: Session = Depends(get_db),
    current_admin: User = Depends(get_current_superadmin),
):
    # Search is protected by strict ORM binding to prevent SQL Injection
    # The 'q' parameter is automatically parameterized by SQLAlchemy
    
    # 1. Search Users
    users = db.query(User).filter(
        or_(
            User.email.ilike(f"%{q}%"),
            User.full_name.ilike(f"%{q}%")
        )
    ).limit(5).all()

    # 2. Search Firms
    firms = db.query(Firm).filter(
        Firm.name.ilike(f"%{q}%")
    ).limit(5).all()

    results = []
    
    for u in users:
        results.append({
            "id": str(u.id),
            "type": "User",
            "title": u.full_name,
            "subtitle": u.email,
            "url": f"/users/{u.id}"
        })
        
    for f in firms:
        results.append({
            "id": str(f.id),
            "type": "Firm",
            "title": f.name,
            "subtitle": f"Status: {'Active' if f.is_active else 'Inactive'}",
            "url": f"/firms"
        })

    return {"results": results}
