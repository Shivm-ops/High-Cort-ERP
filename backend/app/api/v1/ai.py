from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
from typing import Optional, List
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


class ChatMessage(BaseModel):
    role: str  # user, assistant, system
    content: str


class ChatRequest(BaseModel):
    messages: List[ChatMessage]
    context: dict = {}
    language: str = "en"


class SummarizeRequest(BaseModel):
    text: str
    doc_type: str = "general"  # fir, judgment, contract, general
    language: str = "en"


class TranslateRequest(BaseModel):
    text: str
    source_language: str
    target_language: str
    doc_type: str = "legal"


class LimitationRequest(BaseModel):
    act: str
    section: str
    trigger_date: str
    case_type: str


@router.post("/draft/generate")
async def generate_draft(
    data: DraftRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Generate AI legal draft based on type and context."""
    try:
        api_key = get_user_openai_key(current_user)
        draft_content = await ai_service.generate_draft(
            draft_type=data.draft_type,
            language=data.language,
            context=data.context,
            prompt=data.prompt,
            api_key=api_key,
        )
        return {
            "draft": draft_content,
            "language": data.language,
            "draft_type": data.draft_type,
            "word_count": len(draft_content.split()),
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"AI draft generation failed: {str(e)}")


@router.post("/research")
async def legal_research(
    data: ResearchRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """AI-powered legal research with RAG."""
    try:
        api_key = get_user_openai_key(current_user)
        results = await ai_service.legal_research(
            query=data.query,
            language=data.language,
            include_acts=data.include_acts,
            include_case_laws=data.include_case_laws,
            api_key=api_key,
        )
        return results
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Research failed: {str(e)}")


@router.post("/chat")
async def ai_chat(
    data: ChatRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """AI legal assistant chat endpoint."""
    try:
        api_key = get_user_openai_key(current_user)
        response = await ai_service.chat(
            messages=[{"role": m.role, "content": m.content} for m in data.messages],
            context=data.context,
            language=data.language,
            api_key=api_key,
        )
        return {"response": response, "sources": []}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"AI chat failed: {str(e)}")


@router.post("/summarize")
async def summarize_document(
    data: SummarizeRequest,
    current_user: User = Depends(get_current_user),
):
    """Summarize legal documents (FIR, judgment, etc.)."""
    try:
        api_key = get_user_openai_key(current_user)
        summary = await ai_service.summarize(
            text=data.text,
            doc_type=data.doc_type,
            language=data.language,
            api_key=api_key,
        )
        return {"summary": summary, "doc_type": data.doc_type}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Summarization failed: {str(e)}")


@router.post("/translate")
async def translate_document(
    data: TranslateRequest,
    current_user: User = Depends(get_current_user),
):
    """Translate legal documents between Indian languages."""
    try:
        api_key = get_user_openai_key(current_user)
        translated = await ai_service.translate(
            text=data.text,
            source=data.source_language,
            target=data.target_language,
            doc_type=data.doc_type,
            api_key=api_key,
        )
        return {
            "original": data.text,
            "translated": translated,
            "source_language": data.source_language,
            "target_language": data.target_language,
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Translation failed: {str(e)}")


@router.post("/limitation/calculate")
async def calculate_limitation(
    data: LimitationRequest,
    current_user: User = Depends(get_current_user),
):
    """Calculate limitation period for filing."""
    try:
        result = await ai_service.calculate_limitation(
            act=data.act,
            section=data.section,
            trigger_date=data.trigger_date,
            case_type=data.case_type,
        )
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Calculation failed: {str(e)}")


@router.get("/suggestions/clauses")
async def get_clause_suggestions(
    draft_type: str,
    context: Optional[str] = None,
    current_user: User = Depends(get_current_user),
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
        case = db.query(Case).filter(Case.id == case_uuid, Case.tenant_id == current_user.tenant_id).first()
        if not case:
            raise HTTPException(status_code=404, detail="Case not found")
        
        # Build context string
        case_info = f"Title: {case.title}\nType: {case.case_type}\nDescription: {case.description or 'No description provided'}"
        
        api_key = get_user_openai_key(current_user)
        suggestions = await ai_service.get_case_suggestions(case_info, api_key=api_key)
        return suggestions
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid case ID format")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to generate suggestions: {str(e)}")
