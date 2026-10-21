"""
Unit & Functional Test Suite for Fastcase Data Bridge
"""
import io
import json
from app.services.data_bridge_service import (
    DataBridgeService,
    ALLOWED_EXTENSIONS,
    MAX_FILE_SIZE_BYTES
)

def test_formula_injection_mitigation():
    service = DataBridgeService()
    cases = ["=cmd|' /C calc'!A0", "+12345", "-500", "@SUM(A1:A5)"]
    for val in cases:
        san = service.sanitize_csv_cell(val)
        assert san.startswith("'"), f"Failed to sanitize: {val} -> {san}"
    normal = "Advocate Rajesh Kumar"
    assert service.sanitize_csv_cell(normal) == normal
    print("✓ test_formula_injection_mitigation passed")

def test_classification_heuristics():
    service = DataBridgeService()
    # Pleading -> maps to court_document enum
    cat, conf = service.classify_document("writ_petition.pdf", "IN THE HIGH COURT OF DELHI WRIT PETITION (CIVIL) NO. 450 OF 2024")
    assert cat == "court_document", f"Expected court_document, got {cat}"
    
    # Court order -> maps to order enum
    cat, conf = service.classify_document("order_dated_12_05.pdf", "CORAM: HON'BLE MR. JUSTICE ... IT IS ORDERED ACCORDINGLY")
    assert cat == "order", f"Expected order, got {cat}"
    
    # Notice -> maps to notice enum
    cat, conf = service.classify_document("legal_notice.pdf", "WITHOUT PREJUDICE LEGAL NOTICE UNDER SECTION 138 OF NI ACT")
    assert cat == "notice", f"Expected notice, got {cat}"
    print("✓ test_classification_heuristics passed")

def test_file_validation():
    service = DataBridgeService()
    # Oversized file
    valid, err = service.validate_file_metadata("large.pdf", MAX_FILE_SIZE_BYTES + 1)
    assert not valid and "exceeds" in err
    
    # Unsupported extension
    valid, err = service.validate_file_metadata("exploit.exe", 100)
    assert not valid and "forbidden" in err
    
    # Valid PDF
    valid, err = service.validate_file_metadata("vakalatnama.pdf", 250000)
    assert valid and err is None
    print("✓ test_file_validation passed")

def test_csv_parser():
    service = DataBridgeService()
    sample_csv = "Name,Email,Phone,City\nRajesh Kumar,rajesh@legal.in,9812345678,New Delhi\nMeera Singh,meera@corp.com,9876543210,Mumbai\n".encode("utf-8")
    rows = service.parse_csv_bytes(sample_csv)
    assert len(rows) == 2
    headers = list(rows[0].keys())
    assert len(headers) == 4
    assert rows[0]["Name"] == "Rajesh Kumar"
    assert rows[1]["City"] == "Mumbai"
    print("✓ test_csv_parser passed")

if __name__ == "__main__":
    print("Running Data Bridge Service Tests...")
    test_formula_injection_mitigation()
    test_classification_heuristics()
    test_file_validation()
    test_csv_parser()
    print("ALL DATA BRIDGE TESTS PASSED!")
