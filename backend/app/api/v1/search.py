from fastapi import APIRouter, Depends, Query
from typing import Optional
from app.core.security import get_current_user
from app.core.permissions import require_firm_member
from app.models.user import User
from app.services.search_service import SearchService

router = APIRouter()
search_service = SearchService()


@router.get("/")
async def global_search(
    q: str = Query(..., min_length=2, description="Search query"),
    types: Optional[str] = Query("all", description="Comma-separated: cases,acts,caselaws,drafts,clients"),
    language: str = "en",
    limit: int = 20,
    current_user: User = Depends(require_firm_member),
):
    """Unified search across all legal knowledge bases — scoped to current firm."""
    search_types = types.split(",") if types != "all" else ["cases", "acts", "caselaws", "drafts"]
    results = await search_service.search(query=q, types=search_types, language=language, limit=limit)
    return {"query": q, "results": results, "total": sum(len(v) for v in results.values())}



@router.get("/acts")
async def search_acts(
    q: str = Query(..., min_length=2),
    category: Optional[str] = None,
    language: str = "en",
    limit: int = 20,
    current_user: User = Depends(get_current_user),
):
    results = await search_service.search_acts(query=q, category=category, language=language, limit=limit)
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
        query=q, court=court, practice_area=practice_area,
        year_from=year_from, year_to=year_to, limit=limit,
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
    results = await search_service.semantic_search(query=q, collection=collection, limit=limit)
    return {"query": q, "results": results}
