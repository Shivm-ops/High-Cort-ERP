from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func, and_, or_
from datetime import date, timedelta
from app.core.database import get_db
from app.core.security import get_current_user
from app.models.user import User
from app.models.case import Case, CaseStatus

router = APIRouter()

@router.get("/")
async def get_limitations_dashboard(
    court_filter: str = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    today = date.today()
    tomorrow = today + timedelta(days=1)
    
    query = db.query(Case).filter(Case.limitation_date != None)
    
    if court_filter and court_filter != "All":
        query = query.filter(Case.court.ilike(f"%{court_filter}%"))
        
    all_cases = query.all()
    
    today_count = sum(1 for c in all_cases if c.limitation_date == today)
    tomorrow_count = sum(1 for c in all_cases if c.limitation_date == tomorrow)
    overdue_count = sum(1 for c in all_cases if c.limitation_date < today and c.status != CaseStatus.CLOSED)
    
    matters = []
    for c in all_cases:
        days_left = (c.limitation_date - today).days
        
        if days_left < 0:
            status = "overdue"
            risk = "Critical"
        elif days_left <= 7:
            status = "critical"
            risk = "Critical"
        elif days_left <= 15:
            status = "warning"
            risk = "Warning"
        elif days_left <= 30:
            status = "upcoming"
            risk = "Upcoming"
        else:
            status = "safe"
            risk = "Safe"
            
        matters.append({
            "id": str(c.id),
            "case_no": c.case_no,
            "title": c.title,
            "court": c.court,
            "limitation_date": c.limitation_date.isoformat(),
            "incident_date": c.incident_date.isoformat() if c.incident_date else None,
            "days_left": days_left,
            "status": status,
            "risk": risk,
            "limitation_act": c.limitation_act or "Standard Limitation",
            "limitation_section": c.limitation_section or "General",
            "practice_area": c.practice_area
        })
        
    # Sort matters by urgency (days left)
    matters.sort(key=lambda x: x["days_left"])

    return {
        "widgets": {
            "today": today_count,
            "tomorrow": tomorrow_count,
            "overdue": overdue_count
        },
        "matters": matters
    }
