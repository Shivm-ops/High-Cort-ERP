"""Document Service — OCR, PDF processing, S3 upload for LegalOS"""

import hashlib
import logging
from typing import Optional, Tuple
from app.core.config import settings

logger = logging.getLogger(__name__)


class DocumentService:
    def __init__(self):
        self.s3_client = None
        self.azure_client = None
        self._init_storage()

    def _init_storage(self):
        if settings.AWS_ACCESS_KEY_ID:
            try:
                import boto3
                self.s3_client = boto3.client(
                    "s3",
                    aws_access_key_id=settings.AWS_ACCESS_KEY_ID,
                    aws_secret_access_key=settings.AWS_SECRET_ACCESS_KEY,
                    region_name=settings.AWS_REGION,
                )
                logger.info("AWS S3 client initialized")
            except ImportError:
                logger.warning("boto3 not installed")

    async def upload_to_storage(self, content: bytes, filename: str, content_type: str) -> Tuple[str, str]:
        """Upload file to S3 or Azure and return URL and hash."""
        file_hash = hashlib.sha256(content).hexdigest()
        safe_filename = self._sanitize_filename(filename)
        object_key = f"documents/{file_hash[:2]}/{file_hash}/{safe_filename}"

        if self.s3_client:
            try:
                self.s3_client.put_object(
                    Bucket=settings.AWS_S3_BUCKET,
                    Key=object_key,
                    Body=content,
                    ContentType=content_type,
                )
                url = f"https://{settings.AWS_S3_BUCKET}.s3.{settings.AWS_REGION}.amazonaws.com/{object_key}"
                return url, file_hash
            except Exception as e:
                logger.error(f"S3 upload failed: {e}")

        # Fallback: local storage for development
        import os
        local_path = f"/tmp/lagalos_docs/{object_key}"
        os.makedirs(os.path.dirname(local_path), exist_ok=True)
        with open(local_path, "wb") as f:
            f.write(content)
        return f"local://{local_path}", file_hash

    async def extract_text(self, content: bytes, content_type: str) -> Optional[str]:
        """Extract text from PDF or image using OCR."""
        if content_type == "application/pdf":
            return await self._extract_from_pdf(content)
        elif content_type in ["image/jpeg", "image/png", "image/tiff"]:
            return await self._extract_from_image(content)
        return None

    async def _extract_from_pdf(self, content: bytes) -> Optional[str]:
        try:
            import fitz  # PyMuPDF
            doc = fitz.open(stream=content, filetype="pdf")
            text = ""
            for page in doc:
                text += page.get_text()
            doc.close()
            if len(text.strip()) < 50:
                # Likely scanned PDF — use OCR
                return await self._ocr_pdf(content)
            return text.strip()
        except ImportError:
            logger.warning("PyMuPDF not installed")
            return None
        except Exception as e:
            logger.error(f"PDF extraction error: {e}")
            return None

    async def _extract_from_image(self, content: bytes) -> Optional[str]:
        try:
            import pytesseract
            from PIL import Image
            import io
            image = Image.open(io.BytesIO(content))
            text = pytesseract.image_to_string(image, lang="eng+hin+mar+guj")
            return text.strip()
        except ImportError:
            logger.warning("pytesseract/Pillow not installed")
            return None
        except Exception as e:
            logger.error(f"OCR error: {e}")
            return None

    async def _ocr_pdf(self, content: bytes) -> Optional[str]:
        """OCR for scanned PDFs — convert pages to images then OCR."""
        try:
            import fitz
            from PIL import Image
            import pytesseract
            import io

            doc = fitz.open(stream=content, filetype="pdf")
            text = ""
            for page in doc:
                mat = fitz.Matrix(2.0, 2.0)  # 2x zoom for better OCR
                pix = page.get_pixmap(matrix=mat)
                img = Image.frombytes("RGB", [pix.width, pix.height], pix.samples)
                page_text = pytesseract.image_to_string(img, lang="eng+hin+mar+guj")
                text += page_text + "\n"
            doc.close()
            return text.strip()
        except Exception as e:
            logger.error(f"PDF OCR error: {e}")
            return None

    def _sanitize_filename(self, filename: str) -> str:
        import re
        safe = re.sub(r"[^\w\-_\. ]", "_", filename)
        return safe.replace(" ", "_")

    async def generate_download_url(self, object_key: str, expiry_seconds: int = 3600) -> str:
        """Generate presigned URL for secure download."""
        if self.s3_client:
            try:
                url = self.s3_client.generate_presigned_url(
                    "get_object",
                    Params={"Bucket": settings.AWS_S3_BUCKET, "Key": object_key},
                    ExpiresIn=expiry_seconds,
                )
                return url
            except Exception as e:
                logger.error(f"Presigned URL generation failed: {e}")
        return object_key
