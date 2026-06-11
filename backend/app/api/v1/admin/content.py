from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.security import get_current_superadmin
from app.models.draft import Draft
from app.models.case_law import CaseLaw
from app.models.user import User

router = APIRouter()

@router.get("/drafts")
def get_global_drafts(db: Session = Depends(get_db), current_admin: User = Depends(get_current_superadmin)):
    # Global Templates Only
    drafts = db.query(Draft).filter(
        (Draft.is_public_template == True) | 
        (Draft.firm_id == None) | 
        (Draft.firm_id == current_admin.firm_id)
    ).all()
    result = []
    for d in drafts:
        result.append({
            "id": d.id,
            "title": d.title,
            "type": d.category.value if d.category else "other",
            "status": d.status,
            "author": d.created_by_user.full_name if d.created_by_user else "Unknown",
            "firm_name": d.created_by_user.firm.name if d.created_by_user and d.created_by_user.firm else "Global Template",
            "created_at": d.created_at,
            "content": d.content # Include content for super admin preview
        })
    return result

@router.get("/tenant-drafts")
def get_tenant_drafts(db: Session = Depends(get_db), current_admin: User = Depends(get_current_superadmin)):
    # Tenant Drafts Only
    drafts = db.query(Draft).filter(
        Draft.is_public_template == False,
        Draft.firm_id != None,
        Draft.firm_id != current_admin.firm_id
    ).all()
    result = []
    for d in drafts:
        result.append({
            "id": d.id,
            "title": d.title,
            "type": d.category.value if d.category else "other",
            "status": d.status,
            "author": d.created_by_user.full_name if d.created_by_user else "Unknown",
            "firm_name": d.created_by_user.firm.name if d.created_by_user and d.created_by_user.firm else "Unknown",
            "created_at": d.created_at,
            "content": d.content # Include content for super admin preview
        })
    return result

@router.get("/case-laws")
def get_global_case_laws(db: Session = Depends(get_db), current_admin: User = Depends(get_current_superadmin)):
    case_laws = db.query(CaseLaw).all()
    result = []
    for c in case_laws:
        result.append({
            "id": c.id,
            "title": c.title,
            "citation": c.citation,
            "court": c.court_name,
            "date": c.judgment_date,
            "summary": c.summary,
            "url": c.document_url
        })
    return result

@router.post("/drafts")
def create_global_draft(payload: dict, db: Session = Depends(get_db), current_admin: User = Depends(get_current_superadmin)):
    draft = Draft(
        title=payload.get("title"),
        content=payload.get("content", ""),
        category="other",
        status="global",
        created_by_id=current_admin.id
    )
    db.add(draft)
    db.commit()
    return {"message": "Global draft created successfully"}

@router.delete("/drafts/{draft_id}")
def delete_draft(draft_id: str, db: Session = Depends(get_db), current_admin: User = Depends(get_current_superadmin)):
    draft = db.query(Draft).filter(Draft.id == draft_id).first()
    if not draft:
        raise HTTPException(status_code=404, detail="Draft not found")
    db.delete(draft)
    db.commit()
    return {"message": "Draft deleted successfully"}

@router.post("/case-laws")
def create_case_law(payload: dict, db: Session = Depends(get_db), current_admin: User = Depends(get_current_superadmin)):
    import datetime
    case_law = CaseLaw(
        title=payload.get("title"),
        citation=payload.get("citation"),
        court_name=payload.get("court"),
        judgment_date=payload.get("date") or datetime.date.today(),
        summary=payload.get("summary", ""),
        document_url=payload.get("url", "")
    )
    db.add(case_law)
    db.commit()
    return {"message": "Case law added successfully"}

@router.delete("/case-laws/{case_law_id}")
def delete_case_law(case_law_id: str, db: Session = Depends(get_db), current_admin: User = Depends(get_current_superadmin)):
    case_law = db.query(CaseLaw).filter(CaseLaw.id == case_law_id).first()
    if not case_law:
        raise HTTPException(status_code=404, detail="Case law not found")
    db.delete(case_law)
    db.commit()
    return {"message": "Case law deleted successfully"}
