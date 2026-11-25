from typing import Optional

from fastapi import APIRouter, Depends, Query
from sqlalchemy import or_ as sql_or
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.permissions import apply_firm_filter, require_firm_member
from app.core.security import get_current_user
from app.models.case import Case
from app.models.client import Client
from app.models.document import Document
from app.models.draft import Draft
from app.models.invoice import Invoice
from app.models.notice import LegalNotice
from app.models.user import User
from app.services.search_service import SearchService

router = APIRouter()
search_service = SearchService()


@router.get("/")
async def global_search(
    q: str = Query(..., min_length=2, description="Search query"),
    types: Optional[str] = Query(
        "all",
        description="Comma-separated: cases,clients,notices,drafts,documents,invoices",
    ),
    limit: int = 10,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_firm_member),
):
    """Unified firm-scoped search across matters, clients, notices, drafts, documents, and invoices."""
    per_cat_limit = max(1, min(limit, 10))
    requested = (
        {t.strip().lower() for t in types.split(",") if t.strip()}
        if types and types != "all"
        else {"cases", "clients", "notices", "drafts", "documents", "invoices"}
    )
    pattern = f"%{q.strip()}%"

    firm_case_ids = [
        row[0]
        for row in apply_firm_filter(db.query(Case.id), Case, current_user)
        .filter(Case.is_deleted == False)
        .all()
    ]
    firm_client_ids = [
        row[0]
        for row in apply_firm_filter(db.query(Client.id), Client, current_user).all()
    ]

    results = {}

    if "cases" in requested:
        case_rows = (
            apply_firm_filter(db.query(Case), Case, current_user)
            .filter(
                Case.is_deleted == False,
                sql_or(
                    Case.case_no.ilike(pattern),
                    Case.title.ilike(pattern),
                    Case.ecourts_cnr.ilike(pattern),
                    Case.court.ilike(pattern),
                    Case.petitioner.ilike(pattern),
                    Case.respondent.ilike(pattern),
                ),
            )
            .order_by(Case.updated_at.desc())
            .limit(per_cat_limit)
            .all()
        )
        results["cases"] = [
            {
                "id": str(c.id),
                "title": c.title,
                "subtitle": f"{c.case_no or 'No Case No.'} · {c.court or 'Court TBD'}",
                "badge": str(
                    c.status.value if hasattr(c.status, "value") else c.status
                ),
                "href": f"/cases/{c.id}",
            }
            for c in case_rows
        ]

    if "clients" in requested:
        client_rows = (
            apply_firm_filter(db.query(Client), Client, current_user)
            .filter(
                sql_or(
                    Client.name.ilike(pattern),
                    Client.phone.ilike(pattern),
                    Client.email.ilike(pattern),
                    Client.company_name.ilike(pattern),
                )
            )
            .order_by(Client.created_at.desc())
            .limit(per_cat_limit)
            .all()
        )
        results["clients"] = [
            {
                "id": str(cl.id),
                "title": cl.name,
                "subtitle": cl.phone or cl.email or "",
                "badge": str(
                    cl.type.value if hasattr(cl.type, "value") else cl.type
                ),
                "href": f"/clients/{cl.id}",
            }
            for cl in client_rows
        ]

    if "notices" in requested:
        notice_rows = (
            apply_firm_filter(db.query(LegalNotice), LegalNotice, current_user)
            .filter(
                LegalNotice.is_deleted == False,
                sql_or(
                    LegalNotice.subject.ilike(pattern),
                    LegalNotice.opponent_name.ilike(pattern),
                    LegalNotice.reference_no.ilike(pattern),
                    LegalNotice.tracking_number.ilike(pattern),
                    LegalNotice.notice_type.ilike(pattern),
                ),
            )
            .order_by(LegalNotice.created_at.desc())
            .limit(per_cat_limit)
            .all()
        )
        results["notices"] = [
            {
                "id": str(n.id),
                "title": n.subject,
                "subtitle": f"{n.notice_type} · Opponent: {n.opponent_name}",
                "badge": n.status,
                "href": f"/notices/reply-builder?noticeId={n.id}",
            }
            for n in notice_rows
        ]

    if "drafts" in requested:
        draft_rows = (
            apply_firm_filter(db.query(Draft), Draft, current_user)
            .filter(
                Draft.is_deleted == False,
                Draft.is_template == False,
                Draft.title.ilike(pattern),
            )
            .order_by(Draft.updated_at.desc())
            .limit(per_cat_limit)
            .all()
        )
        results["drafts"] = [
            {
                "id": str(d.id),
                "title": d.title,
                "subtitle": f"{d.category.value if hasattr(d.category, 'value') else d.category} · {(d.language.value if hasattr(d.language, 'value') else str(d.language or 'en')).upper()}",
                "badge": d.status or "draft",
                "href": f"/draft-workspace?draftId={d.id}",
            }
            for d in draft_rows
        ]

    if "documents" in requested:
        tenant_conds = [Document.uploaded_by_id == current_user.id]
        if firm_case_ids:
            tenant_conds.append(Document.case_id.in_(firm_case_ids))
        if firm_client_ids:
            tenant_conds.append(Document.client_id.in_(firm_client_ids))

        doc_rows = (
            db.query(Document)
            .filter(
                Document.is_deleted == False,
                sql_or(*tenant_conds),
                sql_or(
                    Document.name.ilike(pattern),
                    Document.exhibit_number.ilike(pattern),
                    Document.description.ilike(pattern),
                ),
            )
            .order_by(Document.created_at.desc())
            .limit(per_cat_limit)
            .all()
        )
        results["documents"] = [
            {
                "id": str(doc.id),
                "title": doc.name,
                "subtitle": doc.exhibit_number
                or str(
                    doc.doc_type.value
                    if hasattr(doc.doc_type, "value")
                    else doc.doc_type
                ),
                "badge": "Exhibit" if doc.is_evidence else "Document",
                "href": "/evidence",
            }
            for doc in doc_rows
        ]

    if "invoices" in requested:
        if firm_client_ids:
            inv_rows = (
                db.query(Invoice)
                .filter(
                    Invoice.client_id.in_(firm_client_ids),
                    sql_or(
                        Invoice.invoice_no.ilike(pattern),
                        Invoice.notes.ilike(pattern),
                    ),
                )
                .order_by(Invoice.created_at.desc())
                .limit(per_cat_limit)
                .all()
            )
        else:
            inv_rows = []
        results["invoices"] = [
            {
                "id": str(inv.id),
                "title": inv.invoice_no,
                "subtitle": f"Total: ₹{inv.total or 0:,.0f} · Balance: ₹{inv.balance_due or 0:,.0f}",
                "badge": str(
                    inv.status.value
                    if hasattr(inv.status, "value")
                    else inv.status
                ),
                "href": "/billing",
            }
            for inv in inv_rows
        ]

    return {
        "query": q,
        "results": results,
        "total": sum(len(v) for v in results.values()),
    }


@router.get("/acts")
async def search_acts(
    q: str = Query(..., min_length=2),
    category: Optional[str] = None,
    language: str = "en",
    limit: int = 20,
    current_user: User = Depends(get_current_user),
):
    results = await search_service.search_acts(
        query=q, category=category, language=language, limit=limit
    )
    return {"results": results}


@router.get("/caselaws")
async def search_case_laws(
    q: str = Query(..., min_length=2),
    court: Optional[str] = None,
    practice_area: Optional[str] = None,
    year_from: Optional[int] = None,
    year_to: Optional[int] = None,
    limit: int = 20,
    current_user: User = Depends(get_current_user),
):
    results = await search_service.search_case_laws(
        query=q,
        court=court,
        practice_area=practice_area,
        year_from=year_from,
        year_to=year_to,
        limit=limit,
    )
    return {"results": results}


@router.get("/semantic")
async def semantic_search(
    q: str = Query(..., min_length=5),
    collection: str = "all",
    limit: int = 10,
    current_user: User = Depends(get_current_user),
):
    """Vector similarity search using embeddings."""
    results = await search_service.semantic_search(
        query=q, collection=collection, limit=limit
    )
    return {"query": q, "results": results}
