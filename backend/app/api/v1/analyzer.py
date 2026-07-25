from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from sqlalchemy.orm import Session
try:
    import pypdf
    PYPDF_AVAILABLE = True
except ImportError:
    pypdf = None
    PYPDF_AVAILABLE = False
import io

from app.core.database import get_db
from app.core.security import get_current_user
from app.core.permissions import require_feature
from app.models.user import User
from app.services.ai_service import AIService

router = APIRouter()
ai_service = AIService()

@router.post("/upload")
async def analyze_court_order_file(
    file: UploadFile = File(...),
    current_user: User = Depends(require_feature("ai_tools"))
):
    if not file.filename.lower().endswith('.pdf'):
        # For simplicity in this implementation, we handle PDF only.
        # Images would use pytesseract, word docs use python-docx.
        # But we'll accept anything and just do a basic text extract or fallback.
        pass

    extracted_text = ""
    try:
        content = await file.read()
        
        if file.filename.lower().endswith('.pdf') and PYPDF_AVAILABLE:
            pdf_reader = pypdf.PdfReader(io.BytesIO(content))
            for page in pdf_reader.pages:
                extracted_text += page.extract_text() + "\n"
        elif file.filename.lower().endswith('.pdf') and not PYPDF_AVAILABLE:
            extracted_text = "PDF parsing library not installed. Please install pypdf."
        else:
            # Fallback for other files (mock text extraction)
            extracted_text = "MOCK EXTRACTED TEXT FROM NON-PDF FILE.\n" + str(content[:500])
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Failed to process file: {str(e)}")
        
    if not extracted_text.strip():
        extracted_text = "No readable text found in document. Please upload a searchable PDF."

    api_key = None
    if current_user and current_user.firm:
        if current_user.firm.ai_provider == "openai" and current_user.firm.ai_api_key:
            api_key = current_user.firm.ai_api_key

    try:
        analysis = await ai_service.analyze_court_order(extracted_text, api_key=api_key)
        return analysis
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"AI Analysis failed: {str(e)}")
