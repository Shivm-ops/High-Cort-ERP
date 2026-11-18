"""
app/services/property/risk_engine.py
====================================
Deterministic Rules-Based Property Risk Assessment Engine for FastCase.
Evaluates:
- Ownership name alignment across land records, deeds, and search inputs
- Gaps in the Chain of Title
- Active litigation relevance and matching confidence
- Bank charges, mortgages, and encumbrance indicators
- Pending / unverified mutation entries (कच्ची फेरफार नोंद)
- Classifies findings strictly into the 4 mandatory categories:
  1. Records Found
  2. Further Verification Required
  3. No Record Found in Sources Checked
  4. Source Unavailable / Search Incomplete
"""

import logging
from typing import Dict, Any, List
from datetime import datetime, timezone
from app.models.property_check import RiskCategory

logger = logging.getLogger("property_risk_engine")


class PropertyRiskEngine:
    @staticmethod
    def assess_risk(
        property_request: Dict[str, Any],
        land_records: Dict[str, Any],
        court_cases: List[Dict[str, Any]],
        registration_data: Dict[str, Any],
        mortgage_data: Dict[str, Any],
        sources_status: Dict[str, str],
        uploaded_documents: List[Dict[str, Any]],
    ) -> Dict[str, Any]:
        """
        Evaluate all multi-source records deterministically and generate
        risk scores, discrepancy alerts, and recommended next steps.
        """
        discrepancies: List[Dict[str, Any]] = []
        missing_docs: List[str] = []
        verification_limits: List[str] = []
        recommended_steps: List[str] = []

        risk_score = 15.0  # Base preliminary risk (no title is 0% risk without advocate deed inspection)
        searched_owner = (property_request.get("current_owner_name") or "").strip().lower()
        survey_gat = (property_request.get("survey_number") or property_request.get("gat_number") or "").strip()
        cts_no = (property_request.get("cts_number") or "").strip()
        prop_category = property_request.get("property_category", "agricultural_land")

        # ── 1. Land Records Verification ─────────────────────────────────────────
        satbara = land_records.get("satbara_7_12")
        property_card = land_records.get("property_card")

        if satbara:
            khatedars = [str(o).strip().lower() for o in satbara.get("owners", [])]
            # Check if searched owner appears in khatedar list
            matched_owner = any(searched_owner in k or k in searched_owner for k in khatedars)
            if not matched_owner and searched_owner:
                discrepancies.append({
                    "severity": "HIGH",
                    "code": "OWNER_NAME_MISMATCH_SATBARA",
                    "source": "MahaBhumi 7/12 Extract",
                    "title": "विक्रेत्याचे नाव ७/१२ उताऱ्यावरील खातेदारांशी जुळत नाही (Owner Name Mismatch)",
                    "detail": f"Searched seller/owner name '{property_request.get('current_owner_name')}' was not found among registered Khatedars: {', '.join(satbara.get('owners', []))}. Verify if a recent sale deed or succession entry is pending mutation."
                })
                risk_score += 30.0

            # Check Other Rights column for bank charges or mortgages
            if satbara.get("has_bank_charge_flag"):
                discrepancies.append({
                    "severity": "HIGH",
                    "code": "BANK_CHARGE_INDICATED_7_12",
                    "source": "7/12 Extract (इतर हक्क)",
                    "title": "७/१२ उताऱ्यावर बँक बोजा / गहाण नोंद आढळली (Active Bank Charge / Lien)",
                    "detail": f"Bank charge or encumbrance recorded under Other Rights: {', '.join(satbara.get('other_rights', []))}. Obtain an official Bank No-Objection Certificate (NOC) and Release Deed before transaction."
                })
                risk_score += 25.0

            # Check for uncertified / pencil mutation remarks
            for ferfar in satbara.get("mutation_entries", []):
                ferfar_str = str(ferfar).lower()
                if "pending" in ferfar_str or "कच्ची" in ferfar_str or "तक्रार" in ferfar_str or "disputed" in ferfar_str:
                    discrepancies.append({
                        "severity": "MEDIUM",
                        "code": "PENDING_MUTATION_DISPUTE",
                        "source": "MahaBhumi Ferfar",
                        "title": "फेरफार नोंद प्रलंबित किंवा वादग्रस्त असण्याची शक्यता (Pending / Disputed Mutation)",
                        "detail": f"Uncertified or disputed mutation entry noted: {ferfar}. Inquire with Talathi / Tahsildar regarding status of notice under Section 150 MLRC."
                    })
                    risk_score += 15.0
        else:
            if prop_category in ["agricultural_land", "na_plot", "residential_plot"] and survey_gat:
                missing_docs.append("Official 7/12 Satbara Extract (Digital Satbara)")
                verification_limits.append("7/12 land record was not retrievable from checked official sources. Ground verification required.")

        # ── 2. Court Litigation Analysis ─────────────────────────────────────────
        high_risk_cases = [c for c in court_cases if c.get("relevance_tier") == "HIGH"]
        medium_risk_cases = [c for c in court_cases if c.get("relevance_tier") == "MEDIUM"]

        if high_risk_cases:
            for hc in high_risk_cases:
                discrepancies.append({
                    "severity": "CRITICAL",
                    "code": "DIRECT_PROPERTY_COURT_CASE",
                    "source": f"{hc.get('court_name')} (CNR: {hc.get('cnr_number')})",
                    "title": "मालमत्तेबाबत थेट कोर्ट केस / दावा प्रलंबित (Direct Property Dispute in Court)",
                    "detail": f"{hc.get('case_type')} No. {hc.get('case_number')} ({hc.get('petitioner')} vs {hc.get('respondent')}). Status: {hc.get('status')}. Property identifier directly identified in litigation records."
                })
            risk_score += 45.0
        elif medium_risk_cases:
            for mc in medium_risk_cases:
                discrepancies.append({
                    "severity": "MEDIUM",
                    "code": "CIVIL_LITIGATION_PARTY_NAME",
                    "source": f"{mc.get('court_name')} (CNR: {mc.get('cnr_number')})",
                    "title": "पक्षकाराच्या नावावर दिवाणी दावा आढळला (Civil Litigation Involving Party)",
                    "detail": f"{mc.get('case_type')} No. {mc.get('case_number')} ({mc.get('petitioner')} vs {mc.get('respondent')}). Civil/partition suit found involving the seller. Advocate verification required to confirm if subject property is part of suit schedule."
                })
            risk_score += 15.0

        # ── 3. Chain of Title Verification ───────────────────────────────────────
        chain_of_title = registration_data.get("chain_of_title", [])
        for entry in chain_of_title:
            if entry.get("has_title_gap"):
                discrepancies.append({
                    "severity": "HIGH",
                    "code": "CHAIN_OF_TITLE_GAP",
                    "source": "Maharashtra IGR Index II",
                    "title": "मालकी हक्काच्या साखळीत खंड / तफावत (Gap in Chain of Title)",
                    "detail": entry.get("title_gap_note")
                })
                risk_score += 20.0

        # ── 4. Uploaded Document Verification ────────────────────────────────────
        if not uploaded_documents:
            missing_docs.extend([
                "Registered Sale Deed (खरेदीखत)",
                "Index II (सूची २ प्रत)",
                "Prior Title Deeds (३० वर्षांची मालकी कागदपत्रे)"
            ])
            verification_limits.append("No primary title deeds were uploaded for OCR textual verification. Online assessment is limited to public database matching.")

        # ── 5. Standard Legal Verification Limitations ───────────────────────────
        verification_limits.extend([
            "Public record searches do not conclusively guarantee unencumbered ownership or physical possession.",
            "Undisclosed equitable mortgages, family oral partitions, or unnotified revenue disputes may not be reflected in computerized records.",
            "Statutory notice: This computer-assisted report does NOT replace a physical Search Report or certified Title Certificate issued by a practicing Advocate under Section 54 Transfer of Property Act."
        ])

        # ── 6. Recommended Next Steps ────────────────────────────────────────────
        recommended_steps.append("Request an Advocate-Verified Title Search through FastCase to examine 30-year historical deeds.")
        if discrepancies:
            recommended_steps.append("Issue a public notice in two local newspapers (one Marathi, one English) inviting claims/objections within 14 days before signing agreement to sell.")
        recommended_steps.append("Inspect original title deeds and demand latest physical 7/12 with Talathi signature and stamp.")
        if satbara and satbara.get("has_bank_charge_flag"):
            recommended_steps.append("Demand official Bank Loan Clearance Certificate and Deed of Reconveyance.")

        # ── 7. Mandatory Verdict Classification ──────────────────────────────────
        has_offline_source = any(status in ["offline", "circuit_open", "unavailable"] for status in sources_status.values())
        has_records = bool(satbara or property_card or court_cases or registration_data.get("transactions"))

        if has_offline_source and not has_records:
            category = RiskCategory.SOURCE_UNAVAILABLE
            summary_verdict = "काही अधिकृत डेटा स्त्रोत अनुपलब्ध असल्यामुळे तपासणी अपूर्ण आहे. कृपया काही वेळानंतर पुन्हा प्रयत्न करा. (Source Unavailable / Search Incomplete)"
        elif discrepancies:
            category = RiskCategory.FURTHER_VERIFICATION_REQUIRED
            summary_verdict = "मालमत्ता नोंदींमध्ये काही महत्त्वाच्या तफावती किंवा न्यायालयीन दावे आढळले आहेत. खरेदीपूर्वी वकिलांमार्फत सखोल तपासणी आवश्यक आहे. (Further Verification Required)"
        elif has_records:
            category = RiskCategory.RECORDS_FOUND
            summary_verdict = "अधिकृत नोंदी यशस्वीरीत्या आढळल्या असून तपासलेल्या स्त्रोतांमध्ये कोणताही प्रतिकूल न्यायालयीन दावा आढळला नाही. प्रत्यक्ष मालकी तपासणीसाठी वकिलांचा सल्ला घ्या. (Records Found - No Adverse Findings in Sources Checked)"
        else:
            category = RiskCategory.NO_RECORD_FOUND
            summary_verdict = "तपासलेल्या अधिकृत डेटा स्त्रोतांमध्ये दिलेल्या क्रमांकाची कोणतीही नोंद आढळली नाही. कृपया जिल्हा, तालुका आणि सर्व्हे/गट क्रमांक तपासा. (No Record Found in Sources Checked)"

        risk_score = min(max(risk_score, 10.0), 98.0)

        return {
            "risk_category": category,
            "risk_score": round(risk_score, 1),
            "summary_verdict": summary_verdict,
            "discrepancies": discrepancies,
            "chain_of_title": chain_of_title,
            "missing_documents": missing_docs,
            "verification_limitations": verification_limits,
            "recommended_next_steps": recommended_steps,
            "assessed_at": datetime.now(timezone.utc).isoformat(),
        }
