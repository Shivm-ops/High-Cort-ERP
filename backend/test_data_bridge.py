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
    MAX_FILE_SIZE_BYTES,
    encrypt_archive_bytes,
    decrypt_archive_bytes,
    ENCRYPTION_MAGIC
)
from app.core.database import SessionLocal
from app.models.user import User
from app.models.firm import Firm
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


def test_malware_scanner_hook():
    service = DataBridgeService()
    # EICAR test string
    eicar = b"X5O!P%@AP[4\\PZX54(P^)7CC)7}$EICAR-STANDARD-ANTIVIRUS-TEST-FILE!$H+H*"
    valid, err = service.scan_content_for_malware(eicar, "suspicious.pdf")
    assert not valid and "EICAR" in err, f"Expected EICAR detection, got: {err}"

    # Normal PDF
    good_pdf = b"%PDF-1.5 standard court petition content"
    valid, err = service.scan_content_for_malware(good_pdf, "petition.pdf")
    assert valid and err is None
    print("✓ test_malware_scanner_hook passed (EICAR detected, clean PDF accepted)")


def test_zip_bomb_and_archive_security():
    service = DataBridgeService()

    # Create a malicious zip simulating decompression bomb (>50MB uncompressed)
    buf = io.BytesIO()
    with zipfile.ZipFile(buf, "w", zipfile.ZIP_DEFLATED) as z:
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


def test_aes_gcm_backup_encryption_and_decryption():
    """Verify authenticated AES-256-GCM encryption with PBKDF2 key derivation."""
    test_payload = b"Fastcase Confidential Legal Practice Database Archive Bytes 12345"
    passphrase = "Chamber#Secret@Key2026!StrongPassphrase"

    # Encrypt
    encrypted_bytes = encrypt_archive_bytes(test_payload, passphrase)
    assert encrypted_bytes.startswith(ENCRYPTION_MAGIC)
    assert len(encrypted_bytes) > len(test_payload)

    # Decrypt with correct passphrase
    decrypted = decrypt_archive_bytes(encrypted_bytes, passphrase)
    assert decrypted == test_payload, "Decrypted plaintext does not match original!"

    # Test wrong passphrase
    try:
        decrypt_archive_bytes(encrypted_bytes, "WrongPassword123")
        assert False, "Decryption succeeded with incorrect password!"
    except ValueError as e:
        assert "decryption failed" in str(e).lower()

    # Test tampering with ciphertext (authenticated AEAD tag must detect it)
    tampered = bytearray(encrypted_bytes)
    tampered[-5] ^= 0xFF  # Flip bits in tag/ciphertext
    try:
        decrypt_archive_bytes(bytes(tampered), passphrase)
        assert False, "Tampered ciphertext was not detected by AEAD tag!"
    except ValueError as e:
        assert "decryption failed" in str(e).lower()

    print("✓ test_aes_gcm_backup_encryption_and_decryption passed (AES-256-GCM verified)")


def test_practice_backup_structure_and_manifest():
    """Verify that practice backup generates valid archive with manifests and optional document bundle."""
    db = SessionLocal()
    try:
        service = DataBridgeService()
        user = db.query(User).first()
        if not user:
            print("⚠ Skipping practice backup test: No test user found in DB")
            return

        zip_bytes, zip_filename, meta = service.create_practice_backup_zip(user, db, passphrase="TestPassphrase123")
        assert len(zip_bytes) > 0
        assert zip_filename.endswith(".fcenc"), f"Expected .fcenc extension for encrypted archive, got {zip_filename}"
        assert meta["is_encrypted"] is True
        assert "AES-256-GCM" in meta["encryption_algorithm"]

        # Decrypt and inspect ZIP contents
        decrypted_zip = decrypt_archive_bytes(zip_bytes, "TestPassphrase123")
        with zipfile.ZipFile(io.BytesIO(decrypted_zip), "r") as z:
            names = z.namelist()
            assert "clients.csv" in names, "clients.csv missing from backup archive"
            assert "cases.csv" in names, "cases.csv missing from backup archive"
            assert "documents_manifest.csv" in names, "documents_manifest.csv missing from backup archive"
            assert "backup_manifest.json" in names, "backup_manifest.json missing from backup archive"

            manifest_raw = z.read("backup_manifest.json").decode("utf-8")
            manifest = json.loads(manifest_raw)
            assert manifest["app"] == "Fastcase Legal Operating System"
            assert manifest["backup_version"] == "2.0"
            assert manifest["is_encrypted"] is True
            print(f"✓ test_practice_backup_structure passed (Counts: {manifest['counts']})")
    finally:
        db.close()


def test_practice_restore_pipeline():
    """Verify disaster recovery: validate and execute restore of clients and cases."""
    db = SessionLocal()
    try:
        service = DataBridgeService()
        user = db.query(User).first()
        if not user:
            print("⚠ Skipping restore test: No test user found in DB")
            return

        # 1. Synthesize a mock practice backup archive
        zip_buf = io.BytesIO()
        with zipfile.ZipFile(zip_buf, "w", zipfile.ZIP_DEFLATED) as z:
            # Clients CSV
            c_csv = "ID,Name,Type,Phone,Email\n11111111-1111-1111-1111-111111111111,Restore Test Client,individual,9998887776,restore@test.in\n"
            z.writestr("clients.csv", c_csv)

            # Cases CSV
            cs_csv = "ID,Case No,Title,Court,Practice Area,Client ID,Client Name\n22222222-2222-2222-2222-222222222222,REST-001/2026,Disaster Recovery Matter,Delhi High Court,Civil,11111111-1111-1111-1111-111111111111,Restore Test Client\n"
            z.writestr("cases.csv", cs_csv)

            # Manifest
            manifest = {
                "backup_version": "2.0",
                "app": "Fastcase Legal Operating System",
                "firm_id": str(user.firm_id),
                "firm_name": "Test Firm",
                "counts": {"clients": 1, "cases": 1, "documents_manifest": 0},
            }
            z.writestr("backup_manifest.json", json.dumps(manifest))

        raw_archive = zip_buf.getvalue()

        # 2. Validate archive
        report = service.validate_restore_archive(raw_archive, user, db)
        assert report["valid"] is True
        assert report["counts"]["clients_total"] == 1
        assert report["counts"]["cases_total"] == 1
        assert report["requires_confirmation"] is True

        # 3. Execute restore
        result = service.execute_restore_archive(raw_archive, user, db, conflict_strategy="skip")
        assert result["success"] is True

        # Verify the restored records in DB
        restored_case = db.query(Case).filter(Case.case_no == "REST-001/2026", Case.firm_id == user.firm_id).first()
        assert restored_case is not None, "Restored case not found in database!"
        assert restored_case.client.name == "Restore Test Client", "Client relationship was not restored properly!"

        # Clean up test records
        db.delete(restored_case)
        if restored_case.client:
            db.delete(restored_case.client)
        db.commit()

        print("✓ test_practice_restore_pipeline passed (Disaster recovery verified)")
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
        cases_firm1 = apply_firm_filter(db.query(Case), Case, user1).all()
        for c in cases_firm1:
            assert c.firm_id == user1.firm_id, f"Cross-firm leak: Case {c.id} firm_id {c.firm_id} != user firm_id {user1.firm_id}"

        clients_firm1 = apply_firm_filter(db.query(Client), Client, user1).all()
        for cl in clients_firm1:
            assert cl.firm_id == user1.firm_id, f"Cross-firm leak: Client {cl.id} firm_id {cl.firm_id} != user firm_id {user1.firm_id}"

        print("✓ test_tenant_isolation_and_cross_firm_protection passed")
    finally:
        db.close()


if __name__ == "__main__":
    print("=" * 70)
    print("FASTCASE DATA BRIDGE — VERIFICATION & SECURITY AUDIT TEST SUITE")
    print("=" * 70)
    test_magic_byte_and_content_validation()
    test_malware_scanner_hook()
    test_zip_bomb_and_archive_security()
    test_formula_injection_mitigation()
    test_csv_encodings_and_sniffing()
    test_aes_gcm_backup_encryption_and_decryption()
    test_practice_backup_structure_and_manifest()
    test_practice_restore_pipeline()
    test_tenant_isolation_and_cross_firm_protection()
    print("=" * 70)
    print("ALL SECURITY, INTEGRITY & PRACTICE RECOVERY TESTS PASSED (100% GREEN)")
    print("=" * 70)
