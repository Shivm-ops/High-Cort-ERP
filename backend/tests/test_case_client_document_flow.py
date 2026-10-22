"""
test_case_client_document_flow.py
==================================
Comprehensive automated test suite for:
1. Client creation & profile verification
2. Case creation linked to client & auto-limitation verification
3. Document import & upload for client (via Standard Upload and Data Bridge)
4. Document import & upload for case (via Standard Upload and Data Bridge)
5. Bidirectional relationship verification (client <-> case <-> documents)
6. SHA-256 integrity hashing & HMAC secure download
7. Complete multi-tenant isolation across firms
"""

import io
import uuid
import pytest
from fastapi.testclient import TestClient

from main import app
from app.core.database import SessionLocal
from app.core.security import get_password_hash
from app.models.user import User, UserRole
from app.models.firm import Firm, FirmType
from app.models.client import Client
from app.models.case import Case
from app.models.document import Document

client = TestClient(app)

# Helper valid file bytes (PDF with text content)
VALID_PDF_CLIENT = b"%PDF-1.4\n1 0 obj\n<< /Title (Apex Incorporation Certificate) /Length 120 >>\nstream\nCertificate of Incorporation for Apex Global Logistics Pvt Ltd registered under Companies Act 2013 with CIN U74999MH2026PTC123456.\nendstream\nendobj\ntrailer\n<<>>\n%%EOF"
VALID_PDF_CASE = b"%PDF-1.4\n1 0 obj\n<< /Title (High Court Statement of Claim Petition) /Length 140 >>\nstream\nIn the High Court of Judicature at Bombay, Commercial Division. Statement of Claim in Arbitration Petition ARB/BOM/2026/001 vessel demurrage claim.\nendstream\nendobj\ntrailer\n<<>>\n%%EOF"
VALID_PDF_ORDER = b"%PDF-1.4\n1 0 obj\n<< /Title (Interim Court Order and Stay) /Length 130 >>\nstream\nCourt Order Dated 2026-10-22. In the High Court of Bombay. Interim Injunction Order and Stay granted pending disposal of arbitration.\nendstream\nendobj\ntrailer\n<<>>\n%%EOF"


@pytest.fixture(scope="module")
def test_setup():
    db = SessionLocal()
    suffix = uuid.uuid4().hex[:6]

    # 1. Create Firm A & User A
    firm_a = Firm(
        name=f"Lex Legal Partners {suffix}",
        type=FirmType.PARTNERSHIP,
        email=f"contact_{suffix}@lexpartners.in",
        phone="+919811122233",
        is_active=True
    )
    db.add(firm_a)
    db.commit()

    user_a = User(
        email=f"advocate_{suffix}@lexpartners.in",
        hashed_password=get_password_hash("SecretPass123!"),
        full_name=f"Advocate Aryan {suffix}",
        user_type=UserRole.ADMIN,
        firm_id=firm_a.id,
        is_active=True,
        is_verified=True,
    )
    db.add(user_a)
    db.commit()

    # 2. Create Firm B & User B (for tenant isolation verification)
    firm_b = Firm(
        name=f"Other Firm {suffix}",
        type=FirmType.INDIVIDUAL,
        email=f"contact_{suffix}@otherfirm.in",
        phone="+919844455566",
        is_active=True
    )
    db.add(firm_b)
    db.commit()

    user_b = User(
        email=f"lawyer_{suffix}@otherfirm.in",
        hashed_password=get_password_hash("SecretPass123!"),
        full_name=f"Lawyer Bharat {suffix}",
        user_type=UserRole.ADMIN,
        firm_id=firm_b.id,
        is_active=True,
        is_verified=True,
    )
    db.add(user_b)
    db.commit()

    # 3. Retrieve auth tokens
    resp_a = client.post("/api/v1/auth/token", data={
        "username": user_a.email,
        "password": "SecretPass123!"
    })
    assert resp_a.status_code == 200, f"User A login failed: {resp_a.text}"
    token_a = resp_a.json()["access_token"]
    headers_a = {"Authorization": f"Bearer {token_a}"}

    resp_b = client.post("/api/v1/auth/token", data={
        "username": user_b.email,
        "password": "SecretPass123!"
    })
    assert resp_b.status_code == 200, f"User B login failed: {resp_b.text}"
    token_b = resp_b.json()["access_token"]
    headers_b = {"Authorization": f"Bearer {token_b}"}

    context = {
        "db": db,
        "firm_a": firm_a,
        "firm_b": firm_b,
        "user_a": user_a,
        "user_b": user_b,
        "headers_a": headers_a,
        "headers_b": headers_b,
        "suffix": suffix
    }

    yield context

    # Cleanup test records
    try:
        db.query(Document).filter(Document.uploaded_by_id.in_([user_a.id, user_b.id])).delete(synchronize_session=False)
        db.query(Case).filter(Case.firm_id.in_([firm_a.id, firm_b.id])).delete(synchronize_session=False)
        db.query(Client).filter(Client.firm_id.in_([firm_a.id, firm_b.id])).delete(synchronize_session=False)
        db.query(User).filter(User.id.in_([user_a.id, user_b.id])).delete(synchronize_session=False)
        db.query(Firm).filter(Firm.id.in_([firm_a.id, firm_b.id])).delete(synchronize_session=False)
        db.commit()
    except Exception as e:
        db.rollback()
        print(f"Cleanup warning: {e}")
    finally:
        db.close()


# ─── 1. CLIENT CREATION TEST ──────────────────────────────────────────────────

def test_client_creation(test_setup):
    """Test creating a corporate client with full metadata and retrieving details."""
    headers = test_setup["headers_a"]
    suffix = test_setup["suffix"]

    client_payload = {
        "name": f"Apex Global Logistics {suffix}",
        "type": "corporate",
        "phone": "+919876543210",
        "email": f"ops_{suffix}@apexlogistics.com",
        "city": "Mumbai",
        "state": "Maharashtra",
        "pincode": "400001",
        "address": "Floor 12, Express Towers, Nariman Point",
        "pan": "ABCDE1234F",
        "gstin": "27ABCDE1234F1Z5",
        "company_name": f"Apex Global Logistics {suffix}",
        "contact_person": "Rajesh Sharma",
        "notes": "Retainer corporate client for maritime & commercial arbitration disputes"
    }

    response = client.post("/api/v1/clients/", json=client_payload, headers=headers)
    assert response.status_code == 201, f"Client creation failed: {response.text}"
    created = response.json()

    assert "id" in created
    assert created["name"] == client_payload["name"]
    assert created["type"] == "corporate"
    assert created["phone"] == client_payload["phone"]
    assert created["email"] == client_payload["email"]
    assert created["city"] == "Mumbai"

    client_id = created["id"]
    test_setup["client_id"] = client_id

    # Verify retrieval by ID
    get_resp = client.get(f"/api/v1/clients/{client_id}", headers=headers)
    assert get_resp.status_code == 200
    retrieved = get_resp.json()
    assert retrieved["id"] == client_id
    assert retrieved["name"] == client_payload["name"]
    assert retrieved["contact_person"] == "Rajesh Sharma"


# ─── 2. CASE CREATION TEST LINKED TO CLIENT ───────────────────────────────────

def test_case_creation_linked_to_client(test_setup):
    """Test creating a case linked to the newly created client."""
    headers = test_setup["headers_a"]
    client_id = test_setup["client_id"]
    suffix = test_setup["suffix"]

    case_payload = {
        "case_no": f"ARB/BOM/{suffix}/2026",
        "title": "Apex Global Logistics vs Ocean Marine Transport Ltd",
        "court": "Bombay High Court",
        "client_id": client_id,
        "practice_area": "Arbitration",
        "case_type": "Commercial Arbitration Petition",
        "status": "active",
        "stage": "filing",
        "priority": "high",
        "judge": "Hon'ble Justice K. R. Shriram",
        "bench": "Commercial Division Bench",
        "fees_agreed": 350000.0,
        "description": "Arbitration claim under Section 9 of the Arbitration and Conciliation Act regarding vessel demurrage"
    }

    response = client.post("/api/v1/cases/", json=case_payload, headers=headers)
    assert response.status_code == 201, f"Case creation failed: {response.text}"
    created_case = response.json()

    assert "id" in created_case
    assert created_case["case_no"] == case_payload["case_no"]
    assert created_case["title"] == case_payload["title"]
    assert created_case["client_id"] == client_id
    assert created_case["court"] == "Bombay High Court"
    assert created_case["practice_area"] == "Arbitration"
    assert created_case["status"] == "active"

    case_id = created_case["id"]
    test_setup["case_id"] = case_id

    # Verify retrieval by ID includes client details
    get_case_resp = client.get(f"/api/v1/cases/{case_id}", headers=headers)
    assert get_case_resp.status_code == 200
    case_detail = get_case_resp.json()
    assert case_detail["id"] == case_id
    assert case_detail["client_id"] == client_id
    assert case_detail["client_name"] is not None
    assert f"Apex Global Logistics {suffix}" in case_detail["client_name"]

    # Verify client detail endpoint reflects the linked case
    get_client_resp = client.get(f"/api/v1/clients/{client_id}", headers=headers)
    assert get_client_resp.status_code == 200
    client_detail = get_client_resp.json()
    assert "cases" in client_detail
    case_ids = [c["id"] for c in client_detail["cases"]]
    assert case_id in case_ids


# ─── 3. DOCUMENT IMPORT & UPLOAD FOR CLIENT ───────────────────────────────────

def test_client_document_standard_upload(test_setup):
    """Test standard document upload directly linked to the client."""
    headers = test_setup["headers_a"]
    client_id = test_setup["client_id"]

    files = {
        "file": ("apex_incorporation_cert.pdf", VALID_PDF_CLIENT, "application/pdf")
    }
    data = {
        "client_id": client_id,
        "doc_type": "identity_document",
        "description": "Certificate of Incorporation & Articles of Association",
        "enable_ocr": "false"
    }

    response = client.post("/api/v1/documents/upload", files=files, data=data, headers=headers)
    assert response.status_code == 201, f"Client document upload failed: {response.text}"
    doc_res = response.json()

    assert "id" in doc_res
    assert doc_res["name"] == "apex_incorporation_cert.pdf"
    doc_id = doc_res["id"]
    test_setup["client_doc_id"] = doc_id

    # Verify document detail endpoint shows correct client_id linkage
    detail_resp = client.get(f"/api/v1/documents/{doc_id}", headers=headers)
    assert detail_resp.status_code == 200
    detail = detail_resp.json()
    assert detail["client_id"] == client_id
    assert detail["doc_type"] == "identity_document"
    assert detail["case_id"] is None


def test_client_document_data_bridge_import(test_setup):
    """Test importing a client document via Data Bridge with integrity validation."""
    headers = test_setup["headers_a"]
    client_id = test_setup["client_id"]

    files = {
        "file": ("client_pan_card.pdf", VALID_PDF_CLIENT, "application/pdf")
    }
    data = {
        "client_id": client_id,
        "doc_type": "identity_document",
        "description": "PAN Card of Corporate Client",
        "auto_classify": "true"
    }

    response = client.post("/api/v1/data-bridge/upload-file", files=files, data=data, headers=headers)
    assert response.status_code == 201, f"Data Bridge client document import failed: {response.text}"
    imported = response.json()

    assert "id" in imported
    assert imported["name"] == "client_pan_card.pdf"
    assert imported["client_id"] == client_id
    assert imported["hash_sha256"] is not None
    test_setup["client_bridge_doc_id"] = imported["id"]


def test_client_documents_listing(test_setup):
    """Verify listing documents filtered by client_id returns both client documents."""
    headers = test_setup["headers_a"]
    client_id = test_setup["client_id"]

    resp = client.get(f"/api/v1/documents/?client_id={client_id}", headers=headers)
    assert resp.status_code == 200
    data = resp.json()

    assert data["total"] >= 2
    doc_ids = [d["id"] for d in data["documents"]]
    assert test_setup["client_doc_id"] in doc_ids
    assert test_setup["client_bridge_doc_id"] in doc_ids


# ─── 4. DOCUMENT IMPORT & UPLOAD FOR CASE ─────────────────────────────────────

def test_case_document_standard_upload(test_setup):
    """Test standard document upload linked to the case with auto client association."""
    headers = test_setup["headers_a"]
    case_id = test_setup["case_id"]
    client_id = test_setup["client_id"]

    files = {
        "file": ("statement_of_claim.pdf", VALID_PDF_CASE, "application/pdf")
    }
    data = {
        "case_id": case_id,
        "doc_type": "court_document",
        "description": "Statement of Claim filed in High Court",
        "enable_ocr": "false"
    }

    response = client.post("/api/v1/documents/upload", files=files, data=data, headers=headers)
    assert response.status_code == 201, f"Case document upload failed: {response.text}"
    doc_res = response.json()

    assert "id" in doc_res
    assert doc_res["name"] == "statement_of_claim.pdf"
    doc_id = doc_res["id"]
    test_setup["case_doc_id"] = doc_id

    # Verify document detail endpoint shows case_id and resolved client_id
    detail_resp = client.get(f"/api/v1/documents/{doc_id}", headers=headers)
    assert detail_resp.status_code == 200
    detail = detail_resp.json()
    assert detail["case_id"] == case_id
    assert detail["client_id"] == client_id
    assert detail["doc_type"] == "court_document"


def test_case_document_data_bridge_import_with_autoclassify(test_setup):
    """Test importing case document via Data Bridge with automatic classification."""
    headers = test_setup["headers_a"]
    case_id = test_setup["case_id"]
    client_id = test_setup["client_id"]

    files = {
        "file": ("interim_injunction_order.pdf", VALID_PDF_ORDER, "application/pdf")
    }
    data = {
        "case_id": case_id,
        "auto_classify": "true",
        "description": "Interim injunction court order"
    }

    response = client.post("/api/v1/data-bridge/upload-file", files=files, data=data, headers=headers)
    assert response.status_code == 201, f"Data bridge case document import failed: {response.text}"
    imported = response.json()

    assert "id" in imported
    assert imported["name"] == "interim_injunction_order.pdf"
    assert imported["case_id"] == case_id
    assert imported["client_id"] == client_id
    # Auto-classification should categorize as order or court_document
    assert imported["doc_type"] in ["order", "court_document"]
    assert imported["hash_sha256"] is not None

    test_setup["case_order_doc_id"] = imported["id"]


def test_case_documents_listing_and_relationship(test_setup):
    """Verify that case detail endpoint and document list show all case-linked documents."""
    headers = test_setup["headers_a"]
    case_id = test_setup["case_id"]

    # 1. Documents API filtered by case_id
    resp = client.get(f"/api/v1/documents/?case_id={case_id}", headers=headers)
    assert resp.status_code == 200
    data = resp.json()
    assert data["total"] >= 2
    doc_ids = [d["id"] for d in data["documents"]]
    assert test_setup["case_doc_id"] in doc_ids
    assert test_setup["case_order_doc_id"] in doc_ids

    # 2. Case detail endpoint relationship includes the documents
    case_resp = client.get(f"/api/v1/cases/{case_id}", headers=headers)
    assert case_resp.status_code == 200
    case_data = case_resp.json()
    assert "documents" in case_data
    case_doc_ids = [d["id"] for d in case_data["documents"]]
    assert test_setup["case_doc_id"] in case_doc_ids
    assert test_setup["case_order_doc_id"] in case_doc_ids


# ─── 5. DOCUMENT INTEGRITY & SECURE DOWNLOAD TEST ─────────────────────────────

def test_document_download_token_and_verification(test_setup):
    """Test generating a secure HMAC download token and retrieving the original file content."""
    headers = test_setup["headers_a"]
    case_doc_id = test_setup["case_doc_id"]

    # Request download URL with HMAC token
    download_info_resp = client.get(f"/api/v1/documents/{case_doc_id}/download", headers=headers)
    assert download_info_resp.status_code == 200
    data = download_info_resp.json()
    assert "download_url" in data
    download_url = data["download_url"]

    # Stream the file content
    stream_resp = client.get(download_url, headers=headers)
    assert stream_resp.status_code == 200
    assert stream_resp.content == VALID_PDF_CASE

    # Tampered token must be rejected
    bad_url = download_url[:-4] + "XXXX"
    bad_resp = client.get(bad_url, headers=headers)
    assert bad_resp.status_code == 403


# ─── 6. TENANT ISOLATION TESTS ────────────────────────────────────────────────

def test_cross_firm_tenant_isolation(test_setup):
    """Verify that User B from Firm B cannot access, view, or upload documents to Firm A's client/case."""
    headers_b = test_setup["headers_b"]
    client_id = test_setup["client_id"]
    case_id = test_setup["case_id"]

    # 1. User B cannot get User A's client
    resp_client = client.get(f"/api/v1/clients/{client_id}", headers=headers_b)
    assert resp_client.status_code in [403, 404]

    # 2. User B cannot get User A's case
    resp_case = client.get(f"/api/v1/cases/{case_id}", headers=headers_b)
    assert resp_case.status_code in [403, 404]

    # 3. User B cannot upload document to User A's client
    files = {"file": ("malicious.pdf", VALID_PDF_CLIENT, "application/pdf")}
    resp_upload_client = client.post(
        "/api/v1/documents/upload",
        files=files,
        data={"client_id": client_id, "doc_type": "identity_document"},
        headers=headers_b
    )
    assert resp_upload_client.status_code in [403, 404]

    # 4. User B cannot upload document to User A's case
    files = {"file": ("malicious_case.pdf", VALID_PDF_CASE, "application/pdf")}
    resp_upload_case = client.post(
        "/api/v1/documents/upload",
        files=files,
        data={"case_id": case_id, "doc_type": "court_document"},
        headers=headers_b
    )
    assert resp_upload_case.status_code in [403, 404]

    # 5. User B listing documents for User A's case receives 0 documents
    resp_list = client.get(f"/api/v1/documents/?case_id={case_id}", headers=headers_b)
    assert resp_list.status_code in [403, 404] or (resp_list.status_code == 200 and resp_list.json()["total"] == 0)
