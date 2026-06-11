import logging
import asyncio
import uuid

logger = logging.getLogger(__name__)

class ESignService:
    """Mock e-Sign Service for Advocate ERP.
    Simulates integration with DocuSign / Aadhaar eSign providers.
    """

    @staticmethod
    async def request_signature(document_id: str, client_email: str, client_name: str) -> dict:
        """Simulate sending a document for digital signature."""
        logger.info(f"✍️ [e-Sign Mock] Requesting signature for document {document_id} from {client_name} ({client_email})...")
        await asyncio.sleep(1.5) # Simulate API delay
        
        request_id = f"esign_req_{uuid.uuid4().hex[:10]}"
        
        logger.info(f"✅ [e-Sign Mock] Signature request sent successfully. Request ID: {request_id}")
        
        return {
            "request_id": request_id,
            "status": "pending",
            "message": "Signature request sent to client's email."
        }
