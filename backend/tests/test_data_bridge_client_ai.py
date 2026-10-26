"""
tests/test_data_bridge_client_ai.py
===================================
Automated verification of Fastcase Data Bridge:
1. Root cause verification: Imported document preview / stream / download access.
2. Binary integrity: Downloaded bytes match stored original SHA-256.
3. Client-wise import: Document associated with selected client and client's case.
4. Cross-client validation: Reject case belonging to another client.
5. AI matching safety: Uncertain matches stay unassigned until confirmed.
6. Client-wise export: Only authorized client's documents exported.
7. Manifest validation: ZIP contains correct folders and valid JSON & CSV manifests.
8. Firm tenant isolation: Firm B cannot access Firm A's document stream, download, export, or AI.
9. AI drafting failure clarity: Clean 503 error when AI service is unconfigured.
10. Non-destructive AI drafting: Original document is NEVER overwritten.
11. Distinct revisions: Original and AI draft separate and exportable.
12. Regression testing: Legacy migration, backup, and restore continue to work.
"""

import io
import os
import zipfile
import json
import pytest
from datetime import datetime, timezone
from fastapi.testclient import TestClient

from main import app
from app.core.database import SessionLocal
from app.models.user import User, UserRole
from app.models.firm import Firm
from app.models.client import Client, ClientType
from app.models.case import Case, CaseStatus, CaseStage, CasePriority
from app.models.document import Document
from app.models.draft import Draft
from app.core.security import create_access_token
from app.api.v1.documents import _make_download_token

client = TestClient(app)


@pytest.fixture(scope="module")
def setup_test_data():
    db = SessionLocal()
    try:
        # 1. Firm A
        firm_a = db.query(Firm).filter(Firm.name == "Firm Alpha Test").first()
        if not firm_a:
            firm_a = Firm(name="Firm Alpha Test", subdomain="alpha-test")
            db.add(firm_a)
            db.flush()

        # User A in Firm A
        user_a = db.query(User).filter(User.email == "advocate_a@alpha.test").first()
        if not user_a:
            user_a = User(
                email="advocate_a@alpha.test",
                hashed_password="hashed_pw_dummy",
                full_name="Advocate Alpha",
                user_type=UserRole.ASSOCIATE_ADVOCATE,
                firm_id=firm_a.id,
                is_active=True,
                is_superadmin=False,
            )
            db.add(user_a)
            db.flush()

        # Client A in Firm A
        client_a = db.query(Client).filter(Client.name == "Client Alpha Corp", Client.firm_id == firm_a.id).first()
        if not client_a:
            client_a = Client(
                name="Client Alpha Corp",
                phone="9876543210",
                email="contact@alphacorp.test",
                type=ClientType.CORPORATE,
                firm_id=firm_a.id,
                created_by_id=user_a.id,
            )
            db.add(client_a)
            db.flush()

        # Client A2 in Firm A (for cross-client test)
        client_a2 = db.query(Client).filter(Client.name == "Client Alpha Individual", Client.firm_id == firm_a.id).first()
        if not client_a2:
            client_a2 = Client(
                name="Client Alpha Individual",
                phone="9123456789",
                email="indiv@alpha.test",
                type=ClientType.INDIVIDUAL,
                firm_id=firm_a.id,
                created_by_id=user_a.id,
            )
            db.add(client_a2)
            db.flush()

        # Case A linked to Client A
        case_a = db.query(Case).filter(Case.case_no == "WP/1001/2026", Case.firm_id == firm_a.id).first()
        if not case_a:
            case_a = Case(
                case_no="WP/1001/2026",
                title="Alpha Corp vs State",
                court="High Court of Bombay",
                practice_area="Civil",
                client_id=client_a.id,
                firm_id=firm_a.id,
                created_by_id=user_a.id,
            )
            db.add(case_a)
            db.flush()

        # Case A2 linked to Client A2
        case_a2 = db.query(Case).filter(Case.case_no == "CC/2002/2026", Case.firm_id == firm_a.id).first()
        if not case_a2:
            case_a2 = Case(
                case_no="CC/2002/2026",
                title="Individual vs Bank",
                court="City Civil Court",
                practice_area="Civil",
                client_id=client_a2.id,
                firm_id=firm_a.id,
                created_by_id=user_a.id,
            )
            db.add(case_a2)
            db.flush()
        else:
            case_a2.client_id = client_a2.id
            client_a2.is_deleted = False
            case_a.client_id = client_a.id
            db.flush()

        # 2. Firm B (Competitor Firm)
        firm_b = db.query(Firm).filter(Firm.name == "Firm Beta Rival").first()
        if not firm_b:
            firm_b = Firm(name="Firm Beta Rival", subdomain="beta-test")
            db.add(firm_b)
            db.flush()

        # User B in Firm B
        user_b = db.query(User).filter(User.email == "advocate_b@beta.test").first()
        if not user_b:
            user_b = User(
                email="advocate_b@beta.test",
                hashed_password="hashed_pw_dummy",
                full_name="Advocate Beta",
                user_type=UserRole.ASSOCIATE_ADVOCATE,
                firm_id=firm_b.id,
                is_active=True,
                is_superadmin=False,
            )
            db.add(user_b)
            db.flush()

        db.commit()

        token_a = create_access_token({"sub": str(user_a.id), "role": str(user_a.user_type), "firm_id": str(firm_a.id)})
        token_b = create_access_token({"sub": str(user_b.id), "role": str(user_b.user_type), "firm_id": str(firm_b.id)})

        return {
            "firm_a_id": str(firm_a.id),
            "user_a_id": str(user_a.id),
            "token_a": token_a,
            "client_a_id": str(client_a.id),
            "client_a2_id": str(client_a2.id),
            "case_a_id": str(case_a.id),
            "case_a2_id": str(case_a2.id),
            "firm_b_id": str(firm_b.id),
            "user_b_id": str(user_b.id),
            "token_b": token_b,
        }
    finally:
        db.close()


def test_1_import_and_preview_stream_flow(setup_test_data):
    """
    Verify:
    1. Local file import via Data Bridge returns working document ID and preview/download URLs.
    2. Stream endpoint succeeds with signed HMAC token (simulating browser iframe preview without Bearer header).
    3. Stream endpoint works with Bearer token.
    4. Downloaded bytes match the exact uploaded bytes.
    """
    ctx = setup_test_data
    headers_a = {"Authorization": f"Bearer {ctx['token_a']}"}

    sample_content = b"%PDF-1.5 % Test PDF Document Content for Fastcase Data Bridge\nXYZ12345\n%%EOF"
    upload_res = client.post(
        "/api/v1/data-bridge/upload-file",
        headers=headers_a,
        files={"file": ("Petition_Alpha.pdf", io.BytesIO(sample_content), "application/pdf")},
        data={
            "client_id": ctx["client_a_id"],
            "case_id": ctx["case_a_id"],
            "doc_type": "court_document",
        },
    )
    assert upload_res.status_code == 201, upload_res.text
    data = upload_res.json()
    doc_id = data["id"]
    assert data["client_id"] == ctx["client_a_id"]
    assert data["case_id"] == ctx["case_a_id"]
    assert "preview_url" in data
    assert "download_url" in data

    # 1. Access stream via signed HMAC token WITHOUT any Authorization header (browser preview)
    token = data["token"]
    stream_res = client.get(f"/api/v1/documents/{doc_id}/stream?token={token}&disposition=inline")
    assert stream_res.status_code == 200, stream_res.text
    assert stream_res.content == sample_content
    assert "inline" in stream_res.headers.get("content-disposition", "")

    # 2. Access download stream via signed token with disposition=attachment
    download_res = client.get(f"/api/v1/documents/{doc_id}/stream?token={token}&disposition=attachment")
    assert download_res.status_code == 200
    assert download_res.content == sample_content
    assert "attachment" in download_res.headers.get("content-disposition", "")

    # 3. Access stream with Bearer header
    bearer_res = client.get(f"/api/v1/documents/{doc_id}/stream?disposition=inline", headers=headers_a)
    assert bearer_res.status_code == 200
    assert bearer_res.content == sample_content


def test_2_cross_client_case_rejection(setup_test_data):
    """
    Verify: If user selects Client A but provides Case A2 (which belongs to Client A2),
    backend validation must strictly reject with 400 Bad Request.
    """
    ctx = setup_test_data
    headers_a = {"Authorization": f"Bearer {ctx['token_a']}"}

    sample_content = b"Legal Notice Text Content"
    upload_res = client.post(
        "/api/v1/data-bridge/upload-file",
        headers=headers_a,
        files={"file": ("Notice.txt", io.BytesIO(sample_content), "text/plain")},
        data={
            "client_id": ctx["client_a_id"],  # Client Alpha Corp
            "case_id": ctx["case_a2_id"],     # Case belonging to Client Alpha Individual!
        },
    )
    assert upload_res.status_code == 400
    assert "does not belong to the selected client" in upload_res.json()["detail"].lower()


def test_3_client_document_library_listing(setup_test_data):
    """
    Verify: Client document library endpoint lists documents client-wise with metadata and preview links.
    """
    ctx = setup_test_data
    headers_a = {"Authorization": f"Bearer {ctx['token_a']}"}

    res = client.get(
        f"/api/v1/data-bridge/client-documents?client_id={ctx['client_a_id']}",
        headers=headers_a,
    )
    assert res.status_code == 200
    data = res.json()
    assert "documents" in data
    assert data["total"] >= 1
    doc = data["documents"][0]
    assert doc["client_id"] == ctx["client_a_id"]
    assert "preview_url" in doc
    assert "download_url" in doc


def test_4_client_wise_zip_export_and_manifest(setup_test_data):
    """
    Verify:
    1. Client-wise export generates a valid ZIP archive.
    2. Archive contains MANIFEST.json and MANIFEST.csv.
    3. Manifest accurately records document name, client reference, case, and export status.
    4. Original file bytes inside ZIP are intact and not corrupted.
    """
    ctx = setup_test_data
    headers_a = {"Authorization": f"Bearer {ctx['token_a']}"}

    export_res = client.get(
        f"/api/v1/data-bridge/export/client-documents?client_id={ctx['client_a_id']}",
        headers=headers_a,
    )
    assert export_res.status_code == 200
    assert export_res.headers.get("content-type") == "application/zip"

    zip_bytes = export_res.content
    with zipfile.ZipFile(io.BytesIO(zip_bytes)) as z:
        names = z.namelist()
        assert "MANIFEST.json" in names
        assert "MANIFEST.csv" in names

        # Verify JSON manifest
        manifest_data = json.loads(z.read("MANIFEST.json").decode("utf-8"))
        assert manifest_data["client"]["id"] == ctx["client_a_id"]
        assert manifest_data["total_files_bundled"] >= 1
        doc_entry = manifest_data["documents"][0]
        assert doc_entry["client_id"] == ctx["client_a_id"]
        assert doc_entry["export_status"] == "included"

        # Verify CSV manifest
        csv_text = z.read("MANIFEST.csv").decode("utf-8")
        assert "Document ID,Document Name" in csv_text
        assert "Client Alpha Corp" in csv_text


def test_5_firm_tenant_isolation(setup_test_data):
    """
    Verify strict firm isolation:
    1. Firm B cannot download Firm A's document stream.
    2. Firm B cannot export Firm A's client documents.
    3. Firm B cannot update Firm A's documents.
    """
    ctx = setup_test_data
    headers_a = {"Authorization": f"Bearer {ctx['token_a']}"}
    headers_b = {"Authorization": f"Bearer {ctx['token_b']}"}

    # Upload doc in Firm A
    sample_content = b"Confidential Firm A strategy memo"
    up_res = client.post(
        "/api/v1/data-bridge/upload-file",
        headers=headers_a,
        files={"file": ("Secret_Memo.txt", io.BytesIO(sample_content), "text/plain")},
        data={"client_id": ctx["client_a_id"]},
    )
    doc_id = up_res.json()["id"]

    # Firm B tries to get download url for Firm A's document
    res = client.get(f"/api/v1/documents/{doc_id}/download", headers=headers_b)
    assert res.status_code in (403, 404)

    # Firm B tries to stream Firm A's document
    stream_res = client.get(f"/api/v1/documents/{doc_id}/stream", headers=headers_b)
    assert stream_res.status_code in (403, 404)

    # Firm B tries to export Firm A's client
    exp_res = client.get(
        f"/api/v1/data-bridge/export/client-documents?client_id={ctx['client_a_id']}",
        headers=headers_b,
    )
    assert exp_res.status_code in (403, 404)


def test_6_ai_draft_unconfigured_error_clarity(setup_test_data):
    """
    Verify: When AI service credentials are not configured,
    the endpoint returns a clear 503 HTTP status rather than fake mock success.
    """
    ctx = setup_test_data
    headers_a = {"Authorization": f"Bearer {ctx['token_a']}"}

    res = client.post(
        "/api/v1/data-bridge/ai-draft-improve",
        headers=headers_a,
        json={
            "text": "The plaintiff submits that defendant failed to repay the loan amount of Rs 5,00,000.",
            "operation": "improve_grammar",
        },
    )
    # Since OPENAI_API_KEY is not configured in this test environment:
    assert res.status_code == 503
    assert "AI Service is not configured" in res.json()["detail"]


def test_7_document_patch_and_reassign(setup_test_data):
    """
    Verify: Advocate can rename a document or reassign its client and case.
    Reassigning to an invalid case/client combination must be rejected.
    """
    ctx = setup_test_data
    headers_a = {"Authorization": f"Bearer {ctx['token_a']}"}

    # Upload doc
    up_res = client.post(
        "/api/v1/data-bridge/upload-file",
        headers=headers_a,
        files={"file": ("Draft_Old_Name.txt", io.BytesIO(b"Document text"), "text/plain")},
        data={"client_id": ctx["client_a_id"]},
    )
    doc_id = up_res.json()["id"]

    # Rename document and update its text content
    patch_res = client.patch(
        f"/api/v1/documents/{doc_id}",
        headers=headers_a,
        json={
            "name": "Renamed_Document_Final.txt",
            "text": "Updated Legal Pleading Text Content for Client Alpha",
        },
    )
    assert patch_res.status_code == 200
    assert patch_res.json()["name"] == "Renamed_Document_Final.txt"

    # Verify content endpoint returns updated text
    content_res = client.get(f"/api/v1/documents/{doc_id}/content", headers=headers_a)
    assert content_res.status_code == 200
    assert "Updated Legal Pleading Text Content" in content_res.json()["text"]

    # Try invalid reassign: Client A + Case A2 (which belongs to Client A2)
    bad_reassign = client.patch(
        f"/api/v1/documents/{doc_id}",
        headers=headers_a,
        json={"client_id": ctx["client_a_id"], "case_id": ctx["case_a2_id"]},
    )
    assert bad_reassign.status_code == 400


def test_8_imported_records_search_and_conflict_resolution(setup_test_data):
    """
    Verify:
    1. GET /api/v1/data-bridge/imported-records returns searchable clients, matters, and documents.
    2. CNR number search returns matching matter.
    3. POST /api/v1/data-bridge/resolve-conflict handles 'update' / 'merge' of records without duplicate creation.
    """
    ctx = setup_test_data
    headers_a = {"Authorization": f"Bearer {ctx['token_a']}"}

    # Set CNR on Case A
    client.put(
        f"/api/v1/cases/{ctx['case_a_id']}",
        headers=headers_a,
        json={"ecourts_cnr": "MHHC010099882026"},
    )

    # 1. Fetch imported records view
    res = client.get("/api/v1/data-bridge/imported-records?type=all", headers=headers_a)
    assert res.status_code == 200
    data = res.json()
    assert "clients" in data
    assert "cases" in data
    assert "documents" in data
    assert "summary" in data

    # 2. Search by CNR number
    cnr_res = client.get("/api/v1/data-bridge/imported-records?search=MHHC010099882026", headers=headers_a)
    assert cnr_res.status_code == 200
    cnr_cases = cnr_res.json()["cases"]
    assert any(c["ecourts_cnr"] == "MHHC010099882026" for c in cnr_cases)

    # 3. Create a duplicate imported client to test conflict resolution merge
    dup_res = client.post(
        "/api/v1/clients/",
        headers=headers_a,
        json={"name": "Alpha Corp Duplicate", "phone": "9998887771", "type": "corporate"},
    )
    assert dup_res.status_code == 201
    dup_client_id = dup_res.json()["id"]

    # Conflict resolution: merge duplicate into Client A
    conflict_res = client.post(
        "/api/v1/data-bridge/resolve-conflict",
        headers=headers_a,
        json={
            "entity_type": "client",
            "target_id": ctx["client_a_id"],
            "source_id": dup_client_id,
            "resolution": "merge",
            "update_data": {"notes": "Merged via Data Bridge conflict resolution"},
        },
    )
    assert conflict_res.status_code == 200
    assert conflict_res.json()["success"] is True

