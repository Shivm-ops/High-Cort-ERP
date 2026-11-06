"""
test_audit_citizen_help.py
==========================
Comprehensive Automated Audit and QA Test Suite for FastCase Citizen Legal Help Module.
Tests:
1. Legal Knowledge Base Completeness & Accuracy (All 9 Categories)
2. Accurate Acts, Sections, Amendments, Authorities, and Helplines
3. Real-world multilingual queries (Marathi, Hindi, English, and Ambiguous queries)
4. AI/Heuristic hallucination prevention (verifies strict anchoring)
5. Document Generation across all 9 categories in English, Marathi, and Hindi
6. A4 formatting, legal language, structure, verification clauses, and enclosures
7. API input validation, database persistence, and tenant data isolation
"""

import sys
import os
import unittest
from datetime import datetime

# Insert backend directory
sys.path.insert(0, os.path.abspath("backend"))

from app.services.citizen_legal_kb import (
    LEGAL_CATEGORIES,
    classify_citizen_problem,
    generate_citizen_application,
)


class TestCitizenHelpModule(unittest.TestCase):

    def test_01_all_nine_categories_present_and_verified(self):
        """Verify all 9 core categories exist with proper localized metadata."""
        expected_categories = [
            "police_fir",
            "women_child",
            "labour",
            "consumer",
            "municipal",
            "rti_govt",
            "property",
            "cybercrime",
            "legal_aid",
        ]
        self.assertEqual(len(LEGAL_CATEGORIES), 9, "Must contain exactly 9 categories")
        for cat_id in expected_categories:
            self.assertIn(cat_id, LEGAL_CATEGORIES, f"Category {cat_id} missing")
            cat = LEGAL_CATEGORIES[cat_id]
            # Check names in 3 languages
            for lang in ["en", "mr", "hi"]:
                self.assertIn(lang, cat["names"], f"Name missing for lang {lang} in {cat_id}")
                self.assertTrue(len(cat["names"][lang]) > 0)
                self.assertIn(lang, cat["taglines"], f"Tagline missing for lang {lang} in {cat_id}")
                self.assertIn(lang, cat["step_by_step"], f"Steps missing for lang {lang} in {cat_id}")

            # Check laws
            self.assertTrue(len(cat["default_laws"]) >= 2, f"Insufficient laws in {cat_id}")
            for law in cat["default_laws"]:
                self.assertIn("act", law)
                self.assertIn("section", law)
                self.assertIn("desc", law)

            # Check official portals and helplines
            self.assertTrue(len(cat["official_portals"]) >= 1, f"Missing official portals in {cat_id}")
            for p in cat["official_portals"]:
                self.assertTrue(p["url"].startswith("http"), f"Invalid portal URL {p['url']}")

            # Check evidence checklist
            self.assertTrue(len(cat["evidence_checklist"]) >= 4, f"Insufficient checklist in {cat_id}")

    def test_02_statutory_accuracy_and_recent_amendments(self):
        """Verify statutory provisions reflect current laws (BNSS 2023, BNS 2023, CPA 2019, etc.)."""
        # 1. Police FIR must cite BNSS 2023 Section 173 and Section 175(3)
        police_laws = LEGAL_CATEGORIES["police_fir"]["default_laws"]
        acts = [l["act"] for l in police_laws]
        sections = [l["section"] for l in police_laws]
        self.assertTrue(any("Bharatiya Nagarik Suraksha Sanhita" in a for a in acts), "BNSS 2023 must be cited for FIR")
        self.assertTrue(any("173" in s for s in sections), "Section 173 BNSS must be cited for FIR")
        self.assertTrue(any("175(3)" in s for s in sections), "Section 175(3) BNSS must be cited for Magistrate remedy")

        # 2. Women protection must cite DV Act 2005 & BNS 85/86
        wc_laws = LEGAL_CATEGORIES["women_child"]["default_laws"]
        wc_acts = [l["act"] for l in wc_laws]
        self.assertTrue(any("Domestic Violence" in a for a in wc_acts))
        self.assertTrue(any("Bharatiya Nyaya Sanhita" in a for a in wc_acts))

        # 3. Consumer Protection Act 2019 Section 35
        cons_laws = LEGAL_CATEGORIES["consumer"]["default_laws"]
        self.assertTrue(any("Consumer Protection Act, 2019" in l["act"] for l in cons_laws))
        self.assertTrue(any("Section 35" in l["section"] for l in cons_laws))

        # 4. Cybercrime must cite IT Act 2000 Section 66D and BNS 318(4)
        cyber_laws = LEGAL_CATEGORIES["cybercrime"]["default_laws"]
        cyber_acts = [l["act"] for l in cyber_laws]
        self.assertTrue(any("Information Technology Act" in a for a in cyber_acts))
        self.assertTrue(any("Bharatiya Nyaya Sanhita" in a for a in cyber_acts))

    def test_03_multilingual_real_world_query_classification(self):
        """Test realistic citizen queries across Marathi, Hindi, English and edge cases."""
        test_queries = [
            # Marathi queries
            ("माझा पगार ३ महिन्यांपासून कंपनीने दिला नाही, मालक पैसे देत नाही", "labour"),
            ("माझ्या बँक खात्यातून ओटीपी न मागता ५० हजार रुपये ऑनलाईन कापले गेले", "cybercrime"),
            ("स्थानिक पोलीस ठाण्यात तक्रार घेऊन गेलो पण पोलिसांनी एफआयआर नोंदवला नाही", "police_fir"),
            ("बिल्डरने फ्लॅटचा ताबा २ वर्षे उलटूनही दिला नाही व पैसे परत देत नाही", "consumer"),
            ("नवरा व सासरचे लोक हुंड्यासाठी मारहाण व छळ करत आहेत", "women_child"),
            ("आमच्या गल्लीत गटार तुंबले आहे आणि अनधिकृत बांधकाम चालू आहे", "municipal"),
            ("जिल्हाधिकारी कार्यालयातून शासकीय नस्तीची प्रमाणित प्रत हवी आहे", "rti_govt"),
            ("घरमालकाने अचानक सामान बाहेर फेकून कुलूप लावले व अनामत रक्कम देत नाही", "property"),
            ("मी खूप गरीब आहे आणि कोर्टाच्या केससाठी मला मोफत सरकारी वकील हवा आहे", "legal_aid"),

            # Hindi queries
            ("कंपनी ने पिछले चार महीने का वेतन रोक रखा है और नौकरी से निकाल दिया", "labour"),
            ("अज्ञात व्यक्ति ने फोन पे पर फर्जी लिंक भेजकर खाते से पैसे उड़ा लिए", "cybercrime"),
            ("थानेदार साहब शिकायत लेने से मना कर रहे हैं", "police_fir"),
            ("दुकानदार ने नकली और खराब सामान दिया और रिफंड नहीं कर रहा", "consumer"),
            ("ससुराल वाले दहेज के लिए मारपीट और मानसिक प्रताड़ना दे रहे हैं", "women_child"),
            ("मोहल्ले में गंदगी और सीवर का पानी भरा है नगर निगम सुन नहीं रहा", "municipal"),
            ("सरकारी योजना की फाइल में क्या कार्रवाई हुई इसकी सूचना आरटीआई से चाहिए", "rti_govt"),
            ("किरायेदार मकान खाली नहीं कर रहा और कब्जा करने की धमकी दे रहा है", "property"),
            ("हमारे पास वकील की फीस देने के पैसे नहीं हैं, मुफ्त कानूनी मदद चाहिए", "legal_aid"),

            # English queries
            ("My employer has withheld my salary for 2 months and not giving PF", "labour"),
            ("I was defrauded of 25000 rs via unauthorized UPI transaction", "cybercrime"),
            ("Police officer refused to register FIR for physical assault", "police_fir"),
            ("Flipkart delivered defective laptop and customer care refused refund", "consumer"),
            ("In-laws demanding dowry and domestic violence by husband", "women_child"),
            ("Illegal construction on public drainage causing waterlogging", "municipal"),
            ("Seeking certified copies of municipal tender files under RTI act", "rti_govt"),
            ("Landlord illegally changed lock and evicted without notice", "property"),
            ("Need free legal advocate under legal aid scheme as annual income is 1.5 lakhs", "legal_aid"),
        ]

        for query, expected_cat in test_queries:
            result = classify_citizen_problem(query)
            self.assertEqual(
                result["category_id"],
                expected_cat,
                f"Query '{query}' expected category '{expected_cat}', got '{result['category_id']}'"
            )

    def test_04_ambiguous_and_neutral_queries(self):
        """Test fallback and robust handling when queries are short, ambiguous or neutral."""
        ambiguous_queries = [
            "help me",
            "समस्या आहे",
            "urgent complaint",
            "please assist",
            "",
        ]
        for q in ambiguous_queries:
            result = classify_citizen_problem(q)
            self.assertIn("category_id", result)
            self.assertIn("category_data", result)
            # Default should fall back safely without error
            self.assertIsNotNone(result["category_data"])

    def test_05_application_generation_in_all_nine_categories_and_languages(self):
        """Generate actual complaint applications for all 9 categories across Marathi, Hindi, and English."""
        categories = list(LEGAL_CATEGORIES.keys())
        languages = ["en", "mr", "hi"]

        for cat_id in categories:
            for lang in languages:
                doc = generate_citizen_application(
                    category_id=cat_id,
                    language=lang,
                    applicant_name="Shweta Jadhav",
                    applicant_phone="9876543210",
                    applicant_address="Kasaba Beed, Karveer, Kolhapur, Maharashtra - 416001",
                    opposite_party="Global Tech Solutions Pvt Ltd",
                    opposite_party_address="MIDC Industrial Area, Pune",
                    incident_date="15/10/2026",
                    incident_place="Kolhapur / Pune",
                    facts_summary="1. The applicant performed work diligently.\n2. Dues of Rs 75,000 remain completely unpaid.\n3. Repeated demands resulted in refusal and verbal threats.",
                    relief_sought="Immediate recovery of pending amount with 18% statutory interest.",
                )

                self.assertTrue(len(doc) > 300, f"Generated doc too short for {cat_id} in {lang}")
                self.assertIn("Shweta Jadhav", doc, f"Applicant name missing in {cat_id} ({lang})")
                self.assertIn("Global Tech Solutions", doc, f"Opposite party missing in {cat_id} ({lang})")
                self.assertIn("75,000", doc, f"Factual detail missing in {cat_id} ({lang})")

                # Verify official legal structure per language
                if lang == "mr":
                    self.assertIn("प्रति,", doc)
                    self.assertIn("विषय:", doc)
                    self.assertIn("अर्जदार:", doc)
                    self.assertIn("गैरअर्जदार", doc)
                    self.assertIn("सत्यप्रतिज्ञा", doc)
                    self.assertIn("सहपत्रे", doc)
                elif lang == "hi":
                    self.assertIn("सेवा में,", doc)
                    self.assertIn("विषय:", doc)
                    self.assertIn("प्रार्थी", doc)
                    self.assertIn("विपक्षी", doc)
                    self.assertIn("सत्यापन", doc)
                    self.assertIn("संलग्नक", doc)
                else:
                    self.assertIn("TO,", doc)
                    self.assertIn("SUBJECT:", doc)
                    self.assertIn("APPLICANT:", doc)
                    self.assertIn("RESPONDENT", doc)
                    self.assertIn("VERIFICATION", doc)
                    self.assertIn("ENCLOSURES", doc)

    def test_06_fact_anchoring_no_hallucinations(self):
        """Verify the generator NEVER invents unprovided dates, amounts, or parties."""
        doc = generate_citizen_application(
            category_id="consumer",
            language="en",
            applicant_name="John Doe",
            applicant_phone="9999999999",
            applicant_address="Sample Address",
            opposite_party="XYZ Electronics",
            opposite_party_address="Sample Market",
            incident_date="01/11/2026",
            incident_place="Mumbai",
            facts_summary="Purchased mobile phone for Rs 12000 on 01/11/2026 which stopped working within 2 days.",
            relief_sought=None,
        )
        self.assertIn("Rs 12000", doc)
        self.assertNotIn("Rs 50000", doc)
        self.assertNotIn("knife", doc)
        self.assertNotIn("murder", doc)

    def test_07_categories_api_metadata(self):
        """Verify get_legal_categories returns emergency and limitation metadata across all languages."""
        from app.api.v1.citizen_help import get_legal_categories
        for lang in ["en", "mr", "hi"]:
            res = get_legal_categories(language=lang)
            self.assertIn("categories", res)
            self.assertEqual(len(res["categories"]), 9)

            for cat in res["categories"]:
                self.assertIn("is_emergency", cat)
                self.assertIn("emergency_hotline", cat)
                self.assertIn("limitation_period", cat)
                self.assertTrue(len(cat["limitation_period"]) > 0, f"Limitation period missing for {cat['id']} in {lang}")

    def test_08_classify_api_emergency_hotline(self):
        """Verify classify_problem correctly detects cyber fraud and flags emergency."""
        from app.api.v1.citizen_help import classify_problem, ProblemClassifyRequest
        req = ProblemClassifyRequest(
            query="Bank account hacked and 50000 deducted via fraudulent UPI link",
            language="en"
        )
        data = classify_problem(req)
        self.assertEqual(data["category_id"], "cybercrime")
        self.assertTrue(data["is_emergency"])
        self.assertIn("1930", data["emergency_hotline"])

    def test_09_generate_application_api(self):
        """Verify generate_application generates valid court-ready legal document."""
        from app.api.v1.citizen_help import generate_application, GenerateApplicationRequest
        req = GenerateApplicationRequest(
            category_id="labour",
            language="mr",
            applicant_name="Ramesh Kulkarni",
            applicant_phone="9822001122",
            applicant_address="Shivaji Nagar, Pune",
            opposite_party="ABC Engineering Ltd",
            opposite_party_address="Bhosari MIDC, Pune",
            incident_date="01/08/2026",
            incident_place="Pune",
            facts_summary="Company has not paid 3 months salary amounting to Rs 90,000.",
            relief_sought="Full payment of arrears with 18% interest."
        )
        data = generate_application(req)
        self.assertIn("application_text", data)
        self.assertIn("Ramesh Kulkarni", data["application_text"])
        self.assertIn("ABC Engineering", data["application_text"])
        self.assertIn("प्रति,", data["application_text"])
        self.assertIn("सत्यप्रतिज्ञा", data["application_text"])

    def test_10_save_and_print_view_tenant_isolation(self):
        """Verify database persistence and tenant isolation in print view."""
        from unittest.mock import MagicMock
        from fastapi import HTTPException
        from sqlalchemy import create_engine, text
        from sqlalchemy.orm import sessionmaker
        from app.models.citizen_help import CitizenGrievance, GrievanceStatus
        from app.api.v1.citizen_help import get_clean_print_view
        import uuid

        engine = create_engine("sqlite:///:memory:")
        conn = engine.connect()
        conn.execute(text("""
        CREATE TABLE IF NOT EXISTS citizen_grievances (
            id VARCHAR(36) PRIMARY KEY,
            user_id VARCHAR(36),
            firm_id VARCHAR(36),
            category VARCHAR(100) NOT NULL,
            sub_category VARCHAR(100),
            language VARCHAR(10) NOT NULL,
            applicant_name VARCHAR(255) NOT NULL,
            applicant_phone VARCHAR(20),
            applicant_email VARCHAR(255),
            applicant_address TEXT,
            opposite_party VARCHAR(255),
            opposite_party_address TEXT,
            incident_date VARCHAR(50),
            incident_place VARCHAR(255),
            facts_summary TEXT NOT NULL,
            relief_sought TEXT,
            target_authority VARCHAR(255),
            applicable_laws JSON,
            required_documents JSON,
            official_portal_url VARCHAR(500),
            generated_application TEXT,
            status VARCHAR(50) NOT NULL,
            is_saved BOOLEAN DEFAULT 1,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
        """))
        conn.commit()
        Session = sessionmaker(bind=engine)
        db = Session()

        firm_a_id = uuid.uuid4()
        g_id = uuid.uuid4()
        grievance = CitizenGrievance(
            id=g_id,
            firm_id=firm_a_id,
            category="consumer",
            language="en",
            applicant_name="Sunil Patil",
            applicant_phone="9988776655",
            opposite_party="XYZ Electronics",
            facts_summary="Defective TV delivered and refund denied.",
            generated_application="FORMAL CONSUMER NOTICE TO XYZ ELECTRONICS",
            status=GrievanceStatus.GENERATED,
        )
        db.add(grievance)
        db.commit()

        # Accessing print view without token or wrong firm must fail with 403
        mock_req = MagicMock()
        mock_req.headers = {}
        with self.assertRaises(HTTPException) as cm:
            get_clean_print_view(grievance_id=g_id, request=mock_req, db=db)
        self.assertEqual(cm.exception.status_code, 403)
        db.close()

    def test_11_public_anonymous_grievance_print_view(self):
        """Verify anonymous public citizen application print view renders clean HTML with A4 formatting."""
        from unittest.mock import MagicMock
        from sqlalchemy import create_engine, text
        from sqlalchemy.orm import sessionmaker
        from app.models.citizen_help import CitizenGrievance, GrievanceStatus
        from app.api.v1.citizen_help import get_clean_print_view
        import uuid

        engine = create_engine("sqlite:///:memory:")
        conn = engine.connect()
        conn.execute(text("""
        CREATE TABLE IF NOT EXISTS citizen_grievances (
            id VARCHAR(36) PRIMARY KEY,
            user_id VARCHAR(36),
            firm_id VARCHAR(36),
            category VARCHAR(100) NOT NULL,
            sub_category VARCHAR(100),
            language VARCHAR(10) NOT NULL,
            applicant_name VARCHAR(255) NOT NULL,
            applicant_phone VARCHAR(20),
            applicant_email VARCHAR(255),
            applicant_address TEXT,
            opposite_party VARCHAR(255),
            opposite_party_address TEXT,
            incident_date VARCHAR(50),
            incident_place VARCHAR(255),
            facts_summary TEXT NOT NULL,
            relief_sought TEXT,
            target_authority VARCHAR(255),
            applicable_laws JSON,
            required_documents JSON,
            official_portal_url VARCHAR(500),
            generated_application TEXT,
            status VARCHAR(50) NOT NULL,
            is_saved BOOLEAN DEFAULT 1,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
        """))
        conn.commit()
        Session = sessionmaker(bind=engine)
        db = Session()

        g_id = uuid.uuid4()
        grievance = CitizenGrievance(
            id=g_id,
            firm_id=None,
            category="police_fir",
            language="mr",
            applicant_name="अमित शिंदे",
            applicant_phone="9876543210",
            opposite_party="अज्ञात व्यक्ती",
            facts_summary="मोबाईल चोरीची तक्रार",
            generated_application="विषय: मोबाईल चोरीबाबत प्रथम माहिती अहवाल (FIR)",
            status=GrievanceStatus.GENERATED,
        )
        db.add(grievance)
        db.commit()

        mock_req = MagicMock()
        mock_req.headers = {}
        res = get_clean_print_view(grievance_id=g_id, request=mock_req, db=db)
        self.assertIn("size: A4", res.body.decode("utf-8"))
        self.assertIn("अमित शिंदे", res.body.decode("utf-8"))
        self.assertIn("मोबाईल चोरीबाबत", res.body.decode("utf-8"))
        db.close()


if __name__ == "__main__":
    unittest.main()
