from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from sqlalchemy.orm import Session
import pypdf
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
        
        if file.filename.lower().endswith('.pdf'):
            pdf_reader = pypdf.PdfReader(io.BytesIO(content))
            for page in pdf_reader.pages:
                extracted_text += page.extract_text() + "\n"
        else:
            # Fallback for other files (mock text extraction)
            extracted_text = "MOCK EXTRACTED TEXT FROM NON-PDF FILE.\n" + str(content[:500])
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Failed to process file: {str(e)}")
        
    if not extracted_text.strip():
        extracted_text = "No readable text found in document. Please upload a searchable PDF."

    try:
        analysis = await ai_service.analyze_court_order(extracted_text)
        return analysis
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"AI Analysis failed: {str(e)}")
