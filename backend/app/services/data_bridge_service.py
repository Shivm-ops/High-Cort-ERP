"""
app/services/data_bridge_service.py
===================================
Production-grade Data Bridge service for Fastcase:
- Local document validation, sanitization, and SHA-256 integrity hashing
- Intelligent document classification and case/client linking suggestions
- Legacy CSV & XLSX parsing with zero-dependency XML/ZIP sheet extractor
- Guided data migration with schema mapping and duplicate detection
- Secure streaming case document ZIP exports and practice backups
- Tenant isolation and formula-injection defenses
"""

import os
import io
import re
import csv
import json
import zipfile
import hashlib
import logging
from datetime import datetime, timezone, date
from typing import Optional, List, Dict, Any, Tuple
import xml.etree.ElementTree as ET

from sqlalchemy.orm import Session
from app.models.document import Document, DocumentType, EvidenceStatus
from app.models.case import Case, CaseStatus, CaseStage, CasePriority
from app.models.client import Client, ClientType
from app.models.user import User
from app.services.document_service import DocumentService
from app.core.permissions import apply_firm_filter, check_object_firm

logger = logging.getLogger(__name__)

ALLOWED_EXTENSIONS = {"pdf", "docx", "doc", "txt", "jpg", "jpeg", "png", "tiff"}
DANGEROUS_EXTENSIONS = {"exe", "bat", "cmd", "sh", "py", "js", "vbs", "scr", "dll", "msi", "ps1"}
MAX_FILE_SIZE_BYTES = 50 * 1024 * 1024  # 50 MB per file
MAX_ZIP_EXTRACT_BYTES = 500 * 1024 * 1024  # 500 MB safe limit

MIME_TYPE_MAP = {
    "pdf": "application/pdf",
    "docx": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "doc": "application/msword",
    "txt": "text/plain",
    "jpg": "image/jpeg",
    "jpeg": "image/jpeg",
    "png": "image/png",
    "tiff": "image/tiff",
}

# Regex for common Indian court case numbers and CNR formats
CASE_NO_PATTERNS = [
    re.compile(r"\b([A-Z]{4}\d{12})\b", re.IGNORECASE),  # CNR number (e.g. MHCC010012342021)
    re.compile(r"\b(WP|W\.P\.|SLP|CRL|CIVIL|BAIL|MACT|OS|CS|COMPLAINT|ARB|FA|SA|RFA)[\s\.-]*([A-Z]*)[\s\.-]*(\d+)[\s\.-]*(?:OF[\s\.-]*)?(\d{2,4})\b", re.IGNORECASE),
    re.compile(r"\b(CC|FIR|CR|RCS|Spl\.?Case)[\s\.-]*No\.?[\s\.-]*(\d+)[\s\.-]*(?:/|OF)[\s\.-]*(\d{2,4})\b", re.IGNORECASE),
]


class DataBridgeService:
    def __init__(self):
        self.doc_service = DocumentService()

    @staticmethod
    def sanitize_filename(filename: str) -> str:
        """Strip path traversal, control characters, and dangerous characters."""
        if not filename:
            return "unnamed_file"
        # Normalize slashes and take basename
        name = os.path.basename(filename.replace("\\", "/"))
        # Strip path traversal indicators
        name = re.sub(r"\.\.+", ".", name)
        # Replace forbidden chars with underscore
        name = re.sub(r'[^a-zA-Z0-9_\-\. ()\[\]]', "_", name).strip()
        # Truncate length
        if len(name) > 200:
            ext = os.path.splitext(name)[1]
            name = name[:190] + ext
        return name or "unnamed_file"

    @staticmethod
    def get_extension(filename: str) -> str:
        parts = filename.rsplit(".", 1)
        if len(parts) > 1:
            return parts[1].lower().strip()
        return ""

    @staticmethod
    def sanitize_csv_cell(value: Any) -> str:
        """Prevent spreadsheet formula injection (=, +, -, @)."""
        if value is None:
            return ""
        s = str(value)
        if s and s[0] in ("=", "+", "-", "@"):
            return "'" + s
        return s

    def validate_file_metadata(self, filename: str, file_size: int) -> Tuple[bool, Optional[str]]:
        """Validate filename and file size."""
        ext = self.get_extension(filename)
        if ext in DANGEROUS_EXTENSIONS:
            return False, f"File format '{ext}' is forbidden for security reasons."
        if ext not in ALLOWED_EXTENSIONS:
            return False, f"Unsupported file type '.{ext}'. Supported formats: PDF, DOCX, DOC, TXT, JPG, PNG."
        if file_size <= 0:
            return False, "File is empty (0 bytes)."
        if file_size > MAX_FILE_SIZE_BYTES:
            return False, f"File size exceeds the 50 MB limit ({file_size / (1024*1024):.1f} MB)."
        return True, None

    def classify_document(self, filename: str, text_sample: Optional[str] = None) -> Tuple[str, float]:
        """
        Classify document based on filename heuristics and text sample.
        Returns: (doc_type, confidence_score)
        """
        content = (filename + " " + (text_sample or "")).lower().replace("_", " ").replace("-", " ")

        patterns = [
            ("order", [r"\border\w*\b", r"\bjudgment\w*\b", r"\bdecree\b", r"\bruling\b", r"\binterim order\b", r"\bstay\b", r"\bdisposed\b"], 0.85),
            ("notice", [r"\blegal notice\b", r"\bnotice\b", r"\bdemand notice\b", r"\bshow cause\b", r"\bu/s 138\b"], 0.85),
            ("reply", [r"\breply\b", r"\brejoinder\b", r"\bwritten statement\b", r"\bresponse\b"], 0.80),
            ("court_document", [r"\bpetition\b", r"\bplaint\b", r"\bapplication\b", r"\baffidavit\b", r"\bvakalatnama\b", r"\bwrit\b", r"\bbail\b", r"\bappeal\b"], 0.80),
            ("evidence_document", [r"\bevidence\b", r"\bannexure\b", r"\bexhibit\b", r"\breceipt\b", r"\bagreement\b", r"\bcontract\b", r"\bdeed\b", r"\bfir\b", r"\bchargesheet\b"], 0.75),
            ("identity_document", [r"\baadhaar\b", r"\bpan card\b", r"\bpassport\b", r"\bvoter\b", r"\bdriving licence\b", r"\bkyc\b"], 0.90),
            ("medical_record", [r"\bmedical\b", r"\bhospital\b", r"\bdischarge\b", r"\bdoctor\b", r"\bautopsy\b", r"\bpml\b", r"\binjury\b"], 0.85),
            ("bank_record", [r"\bbank\b", r"\bstatement\b", r"\bcheque\b", r"\bpassbook\b", r"\btransaction\b"], 0.85),
        ]

        for doc_type, regexes, conf in patterns:
            for pat in regexes:
                if re.search(pat, content):
                    return doc_type, conf

        return "other", 0.40

    def extract_case_and_client_hints(
        self,
        filename: str,
        text_sample: Optional[str],
        firm_cases: List[Case],
        firm_clients: List[Client],
    ) -> Dict[str, Any]:
        """
        Match detected patterns or text against existing cases and clients of the firm.
        """
        content = filename + " " + (text_sample or "")
        detected_case_id = None
        detected_case_title = None
        detected_client_id = None
        detected_client_name = None
        matched_case_no = None

        # 1. Match case numbers from regex
        for pat in CASE_NO_PATTERNS:
            match = pat.search(content)
            if match:
                matched_case_no = match.group(0).strip()
                break

        # 2. Check if matched case number or case title matches an existing firm case
        for case in firm_cases:
            if matched_case_no and (case.case_no.lower() in matched_case_no.lower() or matched_case_no.lower() in case.case_no.lower()):
                detected_case_id = str(case.id)
                detected_case_title = f"{case.case_no} — {case.title}"
                detected_client_id = str(case.client_id) if case.client_id else None
                if case.client:
                    detected_client_name = case.client.name
                break
            # Match case title in filename
            clean_title = re.sub(r'[^a-zA-Z0-9 ]', '', case.title).lower()
            if len(clean_title) > 6 and clean_title in content.lower():
                detected_case_id = str(case.id)
                detected_case_title = f"{case.case_no} — {case.title}"
                detected_client_id = str(case.client_id) if case.client_id else None
                if case.client:
                    detected_client_name = case.client.name
                break

        # 3. Check if any client name matches
        if not detected_client_id:
            for client in firm_clients:
                clean_name = re.sub(r'[^a-zA-Z0-9 ]', '', client.name).lower()
                if len(clean_name) > 3 and clean_name in content.lower():
                    detected_client_id = str(client.id)
                    detected_client_name = client.name
                    break

        return {
            "matched_case_no": matched_case_no,
            "suggested_case_id": detected_case_id,
            "suggested_case_title": detected_case_title,
            "suggested_client_id": detected_client_id,
            "suggested_client_name": detected_client_name,
        }

    # ── Legacy CSV & XLSX Parsing ─────────────────────────────────────────────

    @staticmethod
    def parse_csv_bytes(content: bytes) -> List[Dict[str, str]]:
        """Parse CSV bytes supporting UTF-8, UTF-8 with BOM, and Latin-1."""
        text = None
        for enc in ["utf-8-sig", "utf-8", "latin-1"]:
            try:
                text = content.decode(enc)
                break
            except UnicodeDecodeError:
                continue

        if not text:
            raise ValueError("Could not decode CSV file. Please ensure it is saved in UTF-8 format.")

        # Auto-detect delimiter
        sample = text[:4096]
        delimiter = ","
        try:
            dialect = csv.Sniffer().sniff(sample, delimiters=",\t;|")
            delimiter = dialect.delimiter
        except Exception:
            delimiter = ","

        reader = csv.DictReader(io.StringIO(text), delimiter=delimiter)
        rows = []
        for r in reader:
            # Clean keys and values
            clean_row = {
                (k.strip() if k else f"col_{idx}"): (v.strip() if v else "")
                for idx, (k, v) in enumerate(r.items())
            }
            if any(clean_row.values()):  # Skip completely blank lines
                rows.append(clean_row)
        return rows

    @staticmethod
    def parse_xlsx_bytes(content: bytes) -> List[Dict[str, str]]:
        """
        Parse an Excel .xlsx workbook using Python's standard library (zipfile + XML).
        Extracts sheet1 rows and resolves shared strings with zero external dependencies.
        """
        try:
            with zipfile.ZipFile(io.BytesIO(content)) as z:
                # 1. Read shared strings
                shared_strings = []
                if "xl/sharedStrings.xml" in z.namelist():
                    ss_xml = z.read("xl/sharedStrings.xml")
                    tree = ET.fromstring(ss_xml)
                    for si in tree.findall(".//{*}si"):
                        t_elems = si.findall(".//{*}t")
                        shared_strings.append("".join(t.text or "" for t in t_elems))

                # 2. Read first worksheet
                sheet_target = "xl/worksheets/sheet1.xml"
                if sheet_target not in z.namelist():
                    # Pick first sheet found
                    for name in z.namelist():
                        if name.startswith("xl/worksheets/sheet") and name.endswith(".xml"):
                            sheet_target = name
                            break

                if sheet_target not in z.namelist():
                    raise ValueError("No worksheets found in XLSX file.")

                sheet_xml = z.read(sheet_target)
                tree = ET.fromstring(sheet_xml)

                raw_rows: List[List[str]] = []
                for row_el in tree.findall(".//{*}row"):
                    row_data: List[str] = []
                    for c_el in row_el.findall(".//{*}c"):
                        cell_type = c_el.get("t")
                        v_el = c_el.find(".//{*}v")
                        val = v_el.text if v_el is not None else ""

                        if cell_type == "s" and val.isdigit():
                            idx = int(val)
                            val = shared_strings[idx] if idx < len(shared_strings) else val
                        elif cell_type == "inlineStr":
                            t_el = c_el.find(".//{*}t")
                            val = t_el.text if t_el is not None else ""

                        row_data.append(str(val).strip())
                    if any(row_data):
                        raw_rows.append(row_data)

                if not raw_rows:
                    return []

                headers = [h or f"col_{i}" for i, h in enumerate(raw_rows[0])]
                result_rows: List[Dict[str, str]] = []
                for data_row in raw_rows[1:]:
                    row_dict = {}
                    for i, h in enumerate(headers):
                        row_dict[h] = data_row[i] if i < len(data_row) else ""
                    if any(row_dict.values()):
                        result_rows.append(row_dict)
                return result_rows
        except Exception as e:
            logger.error(f"XLSX parsing failed: {e}")
            raise ValueError(f"Could not parse Excel spreadsheet: {e}")

    def parse_migration_file(self, content: bytes, filename: str) -> Tuple[List[str], List[Dict[str, str]]]:
        """Parse uploaded CSV or XLSX file and return (headers, rows)."""
        ext = self.get_extension(filename)
        if ext == "csv":
            rows = self.parse_csv_bytes(content)
        elif ext in ("xlsx", "xls"):
            rows = self.parse_xlsx_bytes(content)
        else:
            raise ValueError(f"Unsupported migration file format '.{ext}'. Please upload a CSV or XLSX file.")

        headers = list(rows[0].keys()) if rows else []
        return headers, rows

    @staticmethod
    def sanitize_csv_cell(value: Any) -> str:
        """Prevent CSV formula injection by quoting or neutralizing prefix characters."""
        if value is None:
            return ""
        s = str(value).strip()
        if s.startswith(("=", "+", "-", "@", "\t", "\r")):
            return f"'{s}"
        return s

    # ── Export Case Documents & Practice Backup ───────────────────────────────

    def create_case_documents_zip(self, case: Case, docs: List[Document]) -> Tuple[bytes, str]:
        """Package case documents and an audit manifest into a ZIP file."""
        zip_buf = io.BytesIO()
        safe_case_no = self.sanitize_filename(case.case_no.replace("/", "_"))
        zip_filename = f"Fastcase_{safe_case_no}_Documents.zip"

        manifest_entries = []

        with zipfile.ZipFile(zip_buf, "w", zipfile.ZIP_DEFLATED) as z:
            for doc in docs:
                file_bytes = b""
                # Read from storage
                if doc.file_path and doc.file_path.startswith("local://"):
                    local_p = doc.file_path.replace("local://", "")
                    if os.path.exists(local_p):
                        with open(local_p, "rb") as f:
                            file_bytes = f.read()
                elif self.doc_service.s3_client and doc.file_path and doc.file_path.startswith("https://"):
                    # S3 download
                    try:
                        bucket_url = f"https://{self.doc_service.s3_client.meta.region_name}.amazonaws.com/"
                        key = doc.file_path.split(".amazonaws.com/")[-1]
                        resp = self.doc_service.s3_client.get_object(Bucket=os.getenv("AWS_S3_BUCKET", ""), Key=key)
                        file_bytes = resp["Body"].read()
                    except Exception as e:
                        logger.warning(f"Could not read document {doc.id} from S3 for ZIP export: {e}")

                entry_filename = self.sanitize_filename(doc.original_filename or doc.name)
                # Store under category folders
                cat_folder = (doc.doc_type or "other").title().replace("_", " ")
                archive_path = f"{cat_folder}/{entry_filename}"

                if file_bytes:
                    z.writestr(archive_path, file_bytes)

                manifest_entries.append({
                    "document_id": str(doc.id),
                    "name": doc.name,
                    "original_filename": doc.original_filename,
                    "category": doc.doc_type,
                    "size_bytes": doc.file_size or len(file_bytes),
                    "sha256_hash": doc.hash_sha256 or hashlib.sha256(file_bytes).hexdigest(),
                    "uploaded_at": doc.created_at.isoformat() if doc.created_at else None,
                    "ocr_available": bool(doc.ocr_text),
                })

            # Add manifest.json and manifest.csv
            manifest_json = json.dumps({
                "case_no": case.case_no,
                "case_title": case.title,
                "court": case.court,
                "exported_at": datetime.now(timezone.utc).isoformat(),
                "total_documents": len(docs),
                "documents": manifest_entries,
            }, indent=2)
            z.writestr("MANIFEST.json", manifest_json)

            # CSV manifest for easy reading in Excel
            csv_buf = io.StringIO()
            cw = csv.writer(csv_buf)
            cw.writerow(["Document Name", "Category", "Size (Bytes)", "SHA-256 Hash", "Uploaded At"])
            for m in manifest_entries:
                cw.writerow([
                    self.sanitize_csv_cell(m["name"]),
                    self.sanitize_csv_cell(m["category"]),
                    m["size_bytes"],
                    m["sha256_hash"],
                    m["uploaded_at"]
                ])
            z.writestr("MANIFEST.csv", csv_buf.getvalue())

        zip_buf.seek(0)
        return zip_buf.getvalue(), zip_filename

    def create_practice_backup_zip(self, current_user: User, db: Session) -> Tuple[bytes, str]:
        """Create a complete firm practice backup archive containing CSV data and metadata."""
        zip_buf = io.BytesIO()
        firm_name = current_user.firm.name if current_user.firm else "Fastcase_Practice"
        safe_firm = self.sanitize_filename(firm_name).replace(" ", "_")
        timestamp = datetime.now(timezone.utc).strftime("%Y%m%d_%H%M%S")
        zip_filename = f"Fastcase_Backup_{safe_firm}_{timestamp}.zip"

        clients = apply_firm_filter(db.query(Client), Client, current_user).filter(Client.is_deleted == False).all()
        cases = apply_firm_filter(db.query(Case), Case, current_user).filter(Case.is_deleted == False).all()
        
        firm_case_ids = [c.id for c in cases]
        firm_client_ids = [cl.id for cl in clients]
        from sqlalchemy import or_ as sql_or
        docs = db.query(Document).filter(
            sql_or(
                Document.case_id.in_(firm_case_ids),
                Document.client_id.in_(firm_client_ids),
                Document.uploaded_by_id == current_user.id
            ),
            Document.is_deleted == False
        ).all()

        with zipfile.ZipFile(zip_buf, "w", zipfile.ZIP_DEFLATED) as z:
            # 1. Clients CSV
            c_buf = io.StringIO()
            cw = csv.writer(c_buf)
            cw.writerow([
                "ID", "Name", "Type", "Phone", "Alternate Phone", "Email", 
                "Address", "City", "State", "Pincode", "PAN", "GSTIN", 
                "Occupation", "Company Name", "Contact Person", "Notes", "Created At"
            ])
            for cl in clients:
                cw.writerow([
                    str(cl.id),
                    self.sanitize_csv_cell(cl.name),
                    cl.type,
                    self.sanitize_csv_cell(cl.phone),
                    self.sanitize_csv_cell(cl.alternate_phone),
                    self.sanitize_csv_cell(cl.email),
                    self.sanitize_csv_cell(cl.address),
                    self.sanitize_csv_cell(cl.city),
                    self.sanitize_csv_cell(cl.state),
                    self.sanitize_csv_cell(cl.pincode),
                    self.sanitize_csv_cell(cl.pan),
                    self.sanitize_csv_cell(cl.gstin),
                    self.sanitize_csv_cell(cl.occupation),
                    self.sanitize_csv_cell(cl.company_name),
                    self.sanitize_csv_cell(cl.contact_person),
                    self.sanitize_csv_cell(cl.notes),
                    cl.created_at.isoformat() if cl.created_at else "",
                ])
            z.writestr("clients.csv", c_buf.getvalue())

            # 2. Cases CSV
            cs_buf = io.StringIO()
            csw = csv.writer(cs_buf)
            csw.writerow([
                "ID", "Case No", "Title", "Court", "Bench", "Judge", 
                "Court Complex", "Court State", "CNR", "Client ID", "Client Name",
                "Petitioner", "Respondent", "Opposing Counsel", "Practice Area",
                "Case Type", "Status", "Stage", "Priority", "Filing Date",
                "Next Hearing Date", "Fees Agreed", "Fees Received", "Created At"
            ])
            for cs in cases:
                csw.writerow([
                    str(cs.id),
                    self.sanitize_csv_cell(cs.case_no),
                    self.sanitize_csv_cell(cs.title),
                    self.sanitize_csv_cell(cs.court),
                    self.sanitize_csv_cell(cs.bench),
                    self.sanitize_csv_cell(cs.judge),
                    self.sanitize_csv_cell(cs.court_complex),
                    self.sanitize_csv_cell(cs.court_state),
                    self.sanitize_csv_cell(cs.ecourts_cnr),
                    str(cs.client_id) if cs.client_id else "",
                    self.sanitize_csv_cell(cs.client.name if cs.client else ""),
                    self.sanitize_csv_cell(cs.petitioner),
                    self.sanitize_csv_cell(cs.respondent),
                    self.sanitize_csv_cell(cs.opposing_counsel),
                    self.sanitize_csv_cell(cs.practice_area),
                    self.sanitize_csv_cell(cs.case_type),
                    cs.status.value if hasattr(cs.status, "value") else str(cs.status),
                    cs.stage.value if hasattr(cs.stage, "value") else str(cs.stage),
                    cs.priority.value if hasattr(cs.priority, "value") else str(cs.priority),
                    cs.filing_date.isoformat() if cs.filing_date else "",
                    cs.next_hearing_date.isoformat() if cs.next_hearing_date else "",
                    cs.fees_agreed or 0.0,
                    cs.fees_received or 0.0,
                    cs.created_at.isoformat() if cs.created_at else "",
                ])
            z.writestr("cases.csv", cs_buf.getvalue())

            # 3. Documents Manifest CSV
            d_buf = io.StringIO()
            dw = csv.writer(d_buf)
            dw.writerow(["ID", "Name", "Original Filename", "Type", "Size", "MIME", "Case No", "Client Name", "SHA-256", "Created At"])
            for d in docs:
                dw.writerow([
                    str(d.id),
                    self.sanitize_csv_cell(d.name),
                    self.sanitize_csv_cell(d.original_filename),
                    d.doc_type,
                    d.file_size or 0,
                    d.mime_type or "",
                    self.sanitize_csv_cell(d.case.case_no if d.case else ""),
                    self.sanitize_csv_cell(d.client.name if d.client else ""),
                    d.hash_sha256 or "",
                    d.created_at.isoformat() if d.created_at else "",
                ])
            z.writestr("documents_manifest.csv", d_buf.getvalue())

            # 4. Backup Metadata
            meta = {
                "backup_version": "1.0",
                "app": "Fastcase Legal Operating System",
                "exported_by": current_user.email,
                "exported_at": datetime.now(timezone.utc).isoformat(),
                "firm_id": str(current_user.firm_id) if current_user.firm_id else None,
                "firm_name": firm_name,
                "counts": {
                    "clients": len(clients),
                    "cases": len(cases),
                    "documents": len(docs),
                }
            }
            z.writestr("backup_manifest.json", json.dumps(meta, indent=2))

        zip_buf.seek(0)
        return zip_buf.getvalue(), zip_filename
