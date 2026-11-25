from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
from typing import Optional, List, Dict, Any, Tuple
from pydantic import BaseModel
import json

from app.core.config import settings
from app.core.database import get_db
from app.core.permissions import apply_firm_filter
from app.core.security import get_current_user
from app.models.user import User
from app.models.case import Case
from app.models.client import Client
from app.services.ai_service import AIService
import uuid

router = APIRouter()

ai_service = AIService()


def get_user_ai_config(user: User) -> Tuple[Optional[str], Optional[str], Optional[str], str]:
    if user and user.firm and user.firm.ai_api_key:
        return (
            user.firm.ai_api_key,
            getattr(user.firm, "ai_api_base", None),
            getattr(user.firm, "ai_model", None),
            getattr(user.firm, "ai_provider", None) or "openai",
        )
    return None, None, None, "openai"


def get_user_openai_key(user: User) -> Optional[str]:
    api_key, _, _, _ = get_user_ai_config(user)
    return api_key


class DraftRequest(BaseModel):
    draft_type: str  # bail, writ, notice, etc.
    language: str = "en"
    context: dict = {}
    prompt: str
    case_id: Optional[str] = None
    client_id: Optional[str] = None


class EnhanceDraftRequest(BaseModel):
    content: str
    action: str
    instructions: Optional[str] = None
    language: str = "en"


class TranslateRequest(BaseModel):
    text: str
    source_lang: str = "en"
    target_lang: str = "mr"


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


class NoticeReplyStrategyRequest(BaseModel):
    notice_text: str
    key_defences: List[str] = []


def _enrich_draft_context(
    request: DraftRequest,
    current_user: User,
    db: Session,
) -> dict:
    merged = dict(request.context or {})
    if current_user.full_name and not merged.get("advocate_name"):
        merged["advocate_name"] = current_user.full_name
    if getattr(current_user, "bar_council_no", None) and not merged.get("bar_no"):
        merged["bar_no"] = current_user.bar_council_no

    if request.client_id:
        try:
            client_uuid = uuid.UUID(request.client_id)
            client = apply_firm_filter(db.query(Client), Client, current_user).filter(
                Client.id == client_uuid
            ).first()
            if client:
                merged.setdefault("client_name", client.name)
                address_parts = [p for p in [client.address, client.city, client.state, client.pincode] if p]
                if address_parts:
                    merged.setdefault("client_address", ", ".join(address_parts))
                    merged.setdefault("recipient_address", ", ".join(address_parts))
                if client.phone:
                    merged.setdefault("client_phone", client.phone)
        except ValueError:
            pass

    if request.case_id:
        try:
            case_uuid = uuid.UUID(request.case_id)
            case = apply_firm_filter(db.query(Case), Case, current_user).filter(
                Case.id == case_uuid
            ).first()
            if case:
                merged.setdefault("case_number", case.case_no)
                merged.setdefault("court", case.court)
                merged.setdefault("judge", case.judge)
                merged.setdefault("practice_area", case.practice_area)
                merged.setdefault("petitioner", case.petitioner or (case.client.name if case.client else None))
                merged.setdefault("respondent", case.respondent)
                merged.setdefault("opponent", case.respondent or case.petitioner)
                if case.client and not merged.get("client_name"):
                    merged["client_name"] = case.client.name
                if case.acts_involved:
                    merged.setdefault("acts", case.acts_involved)
                if case.sections_involved:
                    merged.setdefault("sections", case.sections_involved)
        except ValueError:
            pass

    return merged


@router.get("/status")
async def get_ai_status(current_user: User = Depends(get_current_user)):
    """Check whether live AI is configured for the current firm or server."""
    api_key, _, model, provider = get_user_ai_config(current_user)
    return {
        "configured": ai_service.is_configured(api_key),
        "provider": provider,
        "model": model or settings.OPENAI_MODEL,
    }


@router.post("/draft/generate")
async def generate_draft(
    request: DraftRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Generate a legal draft with optional firm Client/Case context."""
    api_key, base_url, model, _ = get_user_ai_config(current_user)
    enriched_context = _enrich_draft_context(request, current_user, db)
    draft_text = await ai_service.generate_draft(
        draft_type=request.draft_type,
        language=request.language,
        context=enriched_context,
        prompt=request.prompt,
        api_key=api_key,
        base_url=base_url,
        model=model,
    )
    return {
        "draft": draft_text,
        "word_count": len(draft_text.split()),
        "ai_powered": ai_service.is_configured(api_key),
    }


@router.post("/draft/stream")
async def stream_draft(
    request: DraftRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Stream AI draft generation SSE."""
    api_key, base_url, model, _ = get_user_ai_config(current_user)
    enriched_context = _enrich_draft_context(request, current_user, db)

    async def event_generator():
        try:
            async for chunk in ai_service.generate_draft_stream(
                draft_type=request.draft_type,
                prompt=request.prompt,
                context=enriched_context,
                language=request.language,
                api_key=api_key,
                base_url=base_url,
                model=model,
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


@router.post("/draft/enhance")
async def enhance_draft(
    request: EnhanceDraftRequest,
    current_user: User = Depends(get_current_user),
):
    """Enhance, rewrite, expand, or format an existing legal draft."""
    api_key, base_url, model, _ = get_user_ai_config(current_user)
    try:
        updated_text = await ai_service.enhance_draft(
            content=request.content,
            action=request.action,
            instructions=request.instructions,
            language=request.language,
            api_key=api_key,
            base_url=base_url,
            model=model,
        )
        return {"draft": updated_text, "word_count": len(updated_text.split())}
    except ValueError as e:
        if str(e) == "AI_NOT_CONFIGURED":
            raise HTTPException(
                status_code=503,
                detail="No AI API key configured. Please add your OpenAI or compatible API key in Settings to use AI editing tools.",
            )
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/research")
async def legal_research(
    request: ResearchRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Semantic legal research across Acts and Case Laws."""
    api_key, base_url, model, _ = get_user_ai_config(current_user)
    results = await ai_service.legal_research(
        query=request.query,
        language=request.language,
        include_acts=request.include_acts,
        include_case_laws=request.include_case_laws,
        api_key=api_key,
        base_url=base_url,
        model=model,
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
    request: NoticeReplyStrategyRequest,
    current_user: User = Depends(get_current_user)
):
    """Generate reply strategy and rebuttal points for a legal notice."""
    api_key, base_url, model, _ = get_user_ai_config(current_user)
    try:
        strategy = await ai_service.generate_reply_strategy(
            notice_text=request.notice_text,
            key_defences=request.key_defences,
            api_key=api_key,
            base_url=base_url,
            model=model,
        )
        return strategy
    except ValueError as e:
        if str(e) == "AI_NOT_CONFIGURED":
            raise HTTPException(
                status_code=503,
                detail="No AI API key configured. Please add your OpenAI or compatible API key in Settings to generate reply strategies.",
            )
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/translate")
async def translate_legal_text(
    request: TranslateRequest,
    current_user: User = Depends(get_current_user)
):
    """Translate legal text preserving statutory terms."""
    api_key, base_url, model, _ = get_user_ai_config(current_user)
    try:
        translated = await ai_service.translate_legal(
            text=request.text,
            source_lang=request.source_lang,
            target_lang=request.target_lang,
            api_key=api_key,
            base_url=base_url,
            model=model,
        )
        return {
            "original": request.text,
            "translated": translated,
            "source": request.source_lang,
            "target": request.target_lang,
        }
    except ValueError as e:
        if str(e) == "AI_NOT_CONFIGURED":
            raise HTTPException(
                status_code=503,
                detail="No AI API key configured. Please add your OpenAI or compatible API key in Settings to use AI translation.",
            )
        raise HTTPException(status_code=400, detail=str(e))


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
        
        api_key, base_url, model, _ = get_user_ai_config(current_user)
        suggestions = await ai_service.get_case_suggestions(
            case_info, api_key=api_key, base_url=base_url, model=model
        )
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
        api_key, base_url, model, _ = get_user_ai_config(current_user)
        suggestions = await ai_service.get_case_suggestions(
            context_info, api_key=api_key, base_url=base_url, model=model
        )
        return suggestions
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to generate context suggestions: {str(e)}")
