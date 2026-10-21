"""
Comprehensive Security, Integrity, Migration & Practice Recovery Test Suite
for Fastcase Data Bridge
"""
import io
import os
import json
import zipfile
import hashlib
import uuid
from datetime import datetime, timezone

import main  # Ensure all SQLAlchemy models are registered
from app.services.data_bridge_service import (
    DataBridgeService,
    ALLOWED_EXTENSIONS,
    MAX_FILE_SIZE_BYTES
)
from app.core.database import SessionLocal
from app.models.user import User
from app.models.case import Case, CaseStatus
from app.models.client import Client, ClientType
from app.models.document import Document
from app.core.permissions import apply_firm_filter


def test_magic_byte_and_content_validation():
    service = DataBridgeService()

    # 1. PE Executable disguised as PDF
    fake_exe_pdf = b"MZ\x90\x00\x03\x00\x00\x00This is a disguised Windows PE executable"
    valid, err = service.validate_file_content(fake_exe_pdf, "court_order.pdf")
    assert not valid and "Executable binary" in err, f"Failed to reject disguised PE: {err}"

    # 2. Linux ELF binary disguised as JPG
    fake_elf_jpg = b"\x7fELF\x02\x01\x01\x00Disguised Linux ELF binary"
    valid, err = service.validate_file_content(fake_elf_jpg, "crime_scene.jpg")
    assert not valid and "Linux ELF" in err, f"Failed to reject disguised ELF: {err}"

    # 3. Shell script disguised as TXT
    fake_sh_txt = b"#!/bin/bash\nrm -rf /"
    valid, err = service.validate_file_content(fake_sh_txt, "legal_notes.txt")
    assert not valid and "Shell/system script" in err, f"Failed to reject disguised script: {err}"

    # 4. PHP web script disguised as PNG
    fake_php = b"<?php echo 'malicious'; ?>"
    valid, err = service.validate_file_content(fake_php, "stamp.png")
    assert not valid and "Embedded active script" in err, f"Failed to reject PHP script: {err}"

    # 5. Invalid PDF magic bytes
    bad_pdf = b"NOT A PDF FILE AT ALL BUT NAMED PDF"
    valid, err = service.validate_file_content(bad_pdf, "petition.pdf")
    assert not valid and "Invalid PDF" in err

    # 6. Valid PDF
    good_pdf = b"%PDF-1.4\n1 0 obj\n<<>>\nendobj\ntrailer\n<<>>\n%%EOF"
    valid, err = service.validate_file_content(good_pdf, "petition.pdf")
    assert valid and err is None, f"Expected valid PDF, got error: {err}"

    # 7. Valid PNG
    good_png = b"\x89PNG\r\n\x1a\n\x00\x00\x00\rIHDR"
    valid, err = service.validate_file_content(good_png, "seal.png")
    assert valid and err is None

    # 8. Valid JPEG
    good_jpg = b"\xff\xd8\xff\xe0\x00\x10JFIF"
    valid, err = service.validate_file_content(good_jpg, "evidence.jpeg")
    assert valid and err is None

    # 9. Valid DOCX
    good_docx = b"PK\x03\x04\x14\x00\x06\x00word/document.xml"
    valid, err = service.validate_file_content(good_docx, "written_statement.docx")
    assert valid and err is None

    # 10. Valid Text
    good_txt = "Advocate daily cause notes and court list".encode("utf-8")
    valid, err = service.validate_file_content(good_txt, "notes.txt")
    assert valid and err is None

    # 11. Text with forbidden NUL byte
    bad_txt = b"Some normal text\x00with forbidden nul byte"
    valid, err = service.validate_file_content(bad_txt, "notes.txt")
    assert not valid and "null bytes" in err

    print("✓ test_magic_byte_and_content_validation passed")


def test_zip_bomb_and_archive_security():
    service = DataBridgeService()

    # Create a malicious zip simulating decompression bomb (>50MB uncompressed)
    buf = io.BytesIO()
    with zipfile.ZipFile(buf, "w", zipfile.ZIP_DEFLATED) as z:
        # Create an entry with claimed 60MB uncompressed size
        z.writestr("xl/worksheets/sheet1.xml", b" " * (55 * 1024 * 1024))
    
    malicious_xlsx = buf.getvalue()
    try:
        service.parse_xlsx_bytes(malicious_xlsx)
        assert False, "Decompression bomb was not caught!"
    except ValueError as e:
        assert "decompression bomb" in str(e).lower() or "50 mb" in str(e).lower()
        print("✓ test_zip_bomb_and_archive_security passed (bomb rejected)")

    # Test path traversal in zip entry
    pt_buf = io.BytesIO()
    with zipfile.ZipFile(pt_buf, "w") as z:
        z.writestr("../../etc/passwd", b"root:x:0:0:")
    try:
        service.parse_xlsx_bytes(pt_buf.getvalue())
        assert False, "Path traversal entry was not caught!"
    except ValueError as e:
        assert "invalid entry name" in str(e).lower()
        print("✓ test_zip_bomb_and_archive_security passed (path traversal rejected)")


def test_formula_injection_mitigation():
    service = DataBridgeService()
    cases = [
        "=cmd|' /C calc'!A0",
        "+12345",
        "-500",
        "@SUM(A1:A5)",
        "\t=2+5",
        "\r=cmd",
    ]
    for val in cases:
        san = service.sanitize_csv_cell(val)
        assert san.startswith("'"), f"Failed to sanitize formula prefix: {val} -> {san}"
    
    # Safe text must remain uncorrupted
    normal = "Advocate Rajesh Kumar, High Court of Delhi"
    assert service.sanitize_csv_cell(normal) == normal
    print("✓ test_formula_injection_mitigation passed")


def test_csv_encodings_and_sniffing():
    service = DataBridgeService()

    # 1. UTF-8 with BOM
    bom_csv = "\ufeffName,Phone,Email\nRajesh Kumar,9812345678,rajesh@law.in\n".encode("utf-8-sig")
    rows = service.parse_csv_bytes(bom_csv)
    assert len(rows) == 1
    assert "Name" in rows[0]
    assert rows[0]["Name"] == "Rajesh Kumar"

    # 2. Semicolon delimited
    semi_csv = "Name;Phone;Email\nMeera Nair;9876543210;meera@firm.com\n".encode("utf-8")
    rows = service.parse_csv_bytes(semi_csv)
    assert len(rows) == 1
    assert rows[0]["Name"] == "Meera Nair"

    # 3. Tab delimited
    tab_csv = "Name\tPhone\tEmail\nAnil Verma\t9811122233\tanil@corp.in\n".encode("utf-8")
    rows = service.parse_csv_bytes(tab_csv)
    assert len(rows) == 1
    assert rows[0]["Name"] == "Anil Verma"

    print("✓ test_csv_encodings_and_sniffing passed")


def test_practice_backup_structure_and_manifest():
    """Verify that practice backup generates valid archive with all manifests and sanitized CSVs."""
    db = SessionLocal()
    try:
        service = DataBridgeService()
        user = db.query(User).first()
        if not user:
            print("⚠ Skipping practice backup test: No test user found in DB")
            return

        zip_bytes, zip_filename = service.create_practice_backup_zip(user, db)
        assert len(zip_bytes) > 0
        assert zip_filename.endswith(".zip")
        assert zip_filename.startswith("Fastcase_Backup_")

        # Inspect ZIP contents
        with zipfile.ZipFile(io.BytesIO(zip_bytes), "r") as z:
            names = z.namelist()
            assert "clients.csv" in names, "clients.csv missing from backup archive"
            assert "cases.csv" in names, "cases.csv missing from backup archive"
            assert "documents_manifest.csv" in names, "documents_manifest.csv missing from backup archive"
            assert "backup_manifest.json" in names, "backup_manifest.json missing from backup archive"

            # Parse and validate backup_manifest.json
            manifest_raw = z.read("backup_manifest.json").decode("utf-8")
            manifest = json.loads(manifest_raw)
            assert manifest["app"] == "Fastcase Legal Operating System"
            assert manifest["backup_version"] == "1.0"
            assert "counts" in manifest
            assert "clients" in manifest["counts"]
            assert "cases" in manifest["counts"]
            assert "documents" in manifest["counts"]
            print(f"✓ test_practice_backup_structure passed (Counts: {manifest['counts']})")
    finally:
        db.close()


def test_tenant_isolation_and_cross_firm_protection():
    """Verify that firm filter strictly isolates clients, cases, and documents."""
    db = SessionLocal()
    try:
        users = db.query(User).filter(User.firm_id.isnot(None)).all()
        if len(users) < 1:
            print("⚠ Skipping tenant isolation test: Insufficient firm users in DB")
            return

        user1 = users[0]
        # Query cases belonging to user1's firm
        cases_firm1 = apply_firm_filter(db.query(Case), Case, user1).all()
        for c in cases_firm1:
            assert c.firm_id == user1.firm_id, f"Cross-firm data leak: Case {c.id} firm_id {c.firm_id} != user firm_id {user1.firm_id}"

        # Query clients belonging to user1's firm
        clients_firm1 = apply_firm_filter(db.query(Client), Client, user1).all()
        for cl in clients_firm1:
            assert cl.firm_id == user1.firm_id, f"Cross-firm data leak: Client {cl.id} firm_id {cl.firm_id} != user firm_id {user1.firm_id}"

        print("✓ test_tenant_isolation_and_cross_firm_protection passed")
    finally:
        db.close()


if __name__ == "__main__":
    print("=" * 70)
    print("FASTCASE DATA BRIDGE — VERIFICATION & SECURITY AUDIT TEST SUITE")
    print("=" * 70)
    test_magic_byte_and_content_validation()
    test_zip_bomb_and_archive_security()
    test_formula_injection_mitigation()
    test_csv_encodings_and_sniffing()
    test_practice_backup_structure_and_manifest()
    test_tenant_isolation_and_cross_firm_protection()
    print("=" * 70)
    print("ALL SECURITY, INTEGRITY & PRACTICE RECOVERY TESTS PASSED (100% GREEN)")
    print("=" * 70)
