from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
from typing import Optional, List, Dict, Any
from pydantic import BaseModel
import json

from app.core.database import get_db
from app.core.security import get_current_user
from app.models.user import User
from app.models.case import Case
from app.services.ai_service import AIService
import uuid

router = APIRouter()

ai_service = AIService()


def get_user_openai_key(user: User) -> Optional[str]:
    if user and user.firm:
        if user.firm.ai_provider == "openai" and user.firm.ai_api_key:
            return user.firm.ai_api_key
    return None


class DraftRequest(BaseModel):
    draft_type: str  # bail, writ, notice, etc.
    language: str = "en"
    context: dict = {}
    prompt: str
    case_id: Optional[str] = None
    client_id: Optional[str] = None


class ResearchRequest(BaseModel):
    query: str
    language: str = "en"
    include_acts: bool = True
    include_case_laws: bool = True


class ResearchContextPayload(BaseModel):
    title: Optional[str] = None
    court: Optional[str] = None
    facts: Optional[str] = None
    acts_involved: Optional[str] = None
    key_issues: Optional[str] = None


@router.post("/draft/stream")
async def stream_draft(
    request: DraftRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Stream AI draft generation SSE."""
    api_key = get_user_openai_key(current_user)

    async def event_generator():
        try:
            async for chunk in ai_service.generate_draft_stream(
                draft_type=request.draft_type,
                prompt=request.prompt,
                context=request.context,
                language=request.language,
                api_key=api_key,
            ):
                yield f"data: {json.dumps({'content': chunk})}\n\n"
            yield f"data: {json.dumps({'done': True})}\n\n"
        except Exception as e:
            yield f"data: {json.dumps({'error': str(e)})}\n\n"

    return StreamingResponse(
        event_generator(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no",
        }
    )


@router.post("/research")
async def legal_research(
    request: ResearchRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Semantic legal research across Acts and Case Laws."""
    api_key = get_user_openai_key(current_user)
    results = await ai_service.legal_research(
        query=request.query,
        language=request.language,
        include_acts=request.include_acts,
        include_case_laws=request.include_case_laws,
        api_key=api_key,
    )
    return results


@router.post("/analyze-order")
async def analyze_court_order(
    order_text: str,
    current_user: User = Depends(get_current_user)
):
    """Analyze a court order: extract operative part, directions, next date, compliance items."""
    api_key = get_user_openai_key(current_user)
    analysis = await ai_service.analyze_court_order(order_text, api_key=api_key)
    return analysis


@router.post("/notice-reply-strategy")
async def generate_reply_strategy(
    notice_text: str,
    key_defences: List[str] = [],
    current_user: User = Depends(get_current_user)
):
    """Generate reply strategy and rebuttal points for a legal notice."""
    api_key = get_user_openai_key(current_user)
    strategy = await ai_service.generate_reply_strategy(
        notice_text=notice_text,
        key_defences=key_defences,
        api_key=api_key,
    )
    return strategy


@router.post("/translate")
async def translate_legal_text(
    text: str,
    source_lang: str,
    target_lang: str,
    current_user: User = Depends(get_current_user)
):
    """Translate legal text preserving statutory terms."""
    translated = await ai_service.translate_legal(
        text=text,
        source_lang=source_lang,
        target_lang=target_lang,
    )
    return {"original": text, "translated": translated, "source": source_lang, "target": target_lang}


@router.get("/suggestions/clauses")
async def get_clause_suggestions(
    draft_type: str,
    context: str = "",
    current_user: User = Depends(get_current_user)
):
    """Get AI-suggested clauses for a draft type."""
    suggestions = await ai_service.get_clause_suggestions(
        draft_type=draft_type,
        context=context,
    )
    return {"suggestions": suggestions}


@router.get("/case/{case_id}/suggestions")
async def get_matter_suggestions(
    case_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get AI generated legal research suggestions for a specific case."""
    try:
        case_uuid = uuid.UUID(case_id)
        query = db.query(Case).filter(Case.id == case_uuid)
        if not current_user.is_superadmin and current_user.firm_id:
            query = query.filter(Case.firm_id == current_user.firm_id)
        case = query.first()
        if not case:
            raise HTTPException(status_code=404, detail="Case not found")
        
        # Build context string
        acts = ", ".join(case.acts_involved or []) if case.acts_involved else ""
        secs = ", ".join(case.sections_involved or []) if case.sections_involved else ""
        case_info = f"Title: {case.title}\nType: {case.case_type or 'General'}\nCourt: {case.court or 'High Court'}\nActs: {acts}\nSections: {secs}\nDescription: {case.description or 'No description provided'}"
        
        api_key = get_user_openai_key(current_user)
        suggestions = await ai_service.get_case_suggestions(case_info, api_key=api_key)
        return suggestions
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid case ID format")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to generate suggestions: {str(e)}")


@router.post("/research/context-suggestions")
async def get_custom_context_suggestions(
    payload: ResearchContextPayload,
    current_user: User = Depends(get_current_user)
):
    """Get AI generated legal research suggestions for a custom research context."""
    try:
        title = payload.title or "General Legal Research"
        court = payload.court or ""
        facts = payload.facts or ""
        acts = payload.acts_involved or ""
        issues = payload.key_issues or ""

        context_info = f"Title: {title}\nCourt: {court}\nActs & Sections: {acts}\nKey Issues: {issues}\nFacts: {facts}"
        api_key = get_user_openai_key(current_user)
        suggestions = await ai_service.get_case_suggestions(context_info, api_key=api_key)
        return suggestions
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to generate context suggestions: {str(e)}")
