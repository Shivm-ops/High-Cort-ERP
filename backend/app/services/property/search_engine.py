"""
app/services/property/search_engine.py
======================================
FastCase Unified Property Search Engine.
Orchestrates:
- Multi-provider execution (eCourtsIndia, Landeed/MahaBhumi, IGR Index II, CERSAI)
- Request validation & multi-identifier resolution
- Document OCR & metadata extraction comparison
- Deterministic Property Risk Assessment Engine
- Publication-grade A4 PDF/HTML report generation
- Audit logging & source attribution
"""

import uuid
import logging
from typing import Dict, Any, List, Optional
from datetime import datetime, timezone
from sqlalchemy.orm import Session

from app.models.property_check import (
    PropertyCheckRequest,
    PropertyDocument,
    PropertyCheckResult,
    CheckStatus,
    RiskCategory,
)
from app.services.property.ecourts_adapter import ECourtsIndiaAdapter
from app.services.property.land_adapter import MaharashtraLandRecordsAdapter
from app.services.property.igr_adapter import MaharashtraIGRAdapter
from app.services.property.cersai_adapter import CersaiMortgageAdapter
from app.services.property.risk_engine import PropertyRiskEngine
from app.services.property.report_generator import PropertyReportGenerator

logger = logging.getLogger("unified_property_search")


class UnifiedPropertySearchEngine:
    def __init__(self, db: Session):
        self.db = db
        self.ecourts = ECourtsIndiaAdapter(db_session=db)
        self.land_records = MaharashtraLandRecordsAdapter(db_session=db)
        self.igr = MaharashtraIGRAdapter(db_session=db)
        self.cersai = CersaiMortgageAdapter(db_session=db)

    async def execute_check(self, check_request_id: uuid.UUID) -> PropertyCheckResult:
        """Run the full legal due diligence pipeline across all authorized sources."""
        req: Optional[PropertyCheckRequest] = (
            self.db.query(PropertyCheckRequest)
            .filter(PropertyCheckRequest.id == check_request_id)
            .first()
        )
        if not req:
            raise ValueError(f"Property check request {check_request_id} not found.")

        req.status = CheckStatus.PROCESSING
        self.db.commit()

        params = {
            "state": req.state or "Maharashtra",
            "district": req.district,
            "taluka": req.taluka or "",
            "village_city": req.village_city or "",
            "survey_number": req.survey_number or "",
            "gat_number": req.gat_number or "",
            "cts_number": req.cts_number or "",
            "current_owner_name": req.current_owner_name,
            "property_category": req.property_category,
        }

        sources_checked = []
        sources_status = {}

        # 1. MahaBhumi Land Records
        try:
            land_res = await self.land_records.search(params)
            land_findings = land_res.get("records", {})
            sources_checked.extend(list(land_res.get("sources_status", {}).keys()))
            sources_status.update(land_res.get("sources_status", {}))
        except Exception as e:
            logger.error(f"Land records lookup failed: {e}")
            land_findings = {}
            sources_status["mahabhumi"] = "unavailable"

        # 2. eCourts Court Cases Search
        try:
            court_res = await self.ecourts.search(params)
            court_cases = court_res.get("cases", [])
            sources_checked.append("ecourts_partner_api")
            sources_status["ecourts"] = court_res["metadata"]["status"]
        except Exception as e:
            logger.error(f"eCourts lookup failed: {e}")
            court_cases = []
            sources_status["ecourts"] = "unavailable"

        # 3. Maharashtra IGR Index II
        try:
            igr_res = await self.igr.search(params)
            registration_findings = {
                "transactions": igr_res.get("transactions", []),
                "chain_of_title": igr_res.get("chain_of_title", []),
            }
            sources_checked.append("maharashtra_igr_index2")
            sources_status["igr"] = igr_res["metadata"]["status"]
        except Exception as e:
            logger.error(f"IGR lookup failed: {e}")
            registration_findings = {"transactions": [], "chain_of_title": []}
            sources_status["igr"] = "unavailable"

        # 4. CERSAI Mortgages & Charges
        try:
            cersai_res = await self.cersai.search(params)
            mortgage_findings = cersai_res
            sources_checked.append("cersai_security_registry")
            sources_status["cersai"] = cersai_res["metadata"]["status"]
        except Exception as e:
            logger.error(f"CERSAI lookup failed: {e}")
            mortgage_findings = {}
            sources_status["cersai"] = "unavailable"

        # 5. Uploaded Documents
        uploaded_docs = (
            self.db.query(PropertyDocument)
            .filter(PropertyDocument.property_check_id == check_request_id)
            .all()
        )
        docs_payload = [
            {
                "type": d.document_type,
                "filename": d.original_filename,
                "extracted_metadata": d.extracted_metadata,
            }
            for d in uploaded_docs
        ]

        # 6. Risk Engine Assessment
        assessment = PropertyRiskEngine.assess_risk(
            property_request=params,
            land_records=land_findings,
            court_cases=court_cases,
            registration_data=registration_findings,
            mortgage_data=mortgage_findings,
            sources_status=sources_status,
            uploaded_documents=docs_payload,
        )

        # 7. Generate Downloadable A4 Report
        report_html = PropertyReportGenerator.generate_html_report(
            property_request=params,
            assessment_result=assessment,
            land_records=land_findings,
            court_cases=court_cases,
            registration_data=registration_findings,
            mortgage_data=mortgage_findings,
            sources_status=sources_status,
            report_id=str(req.id),
        )

        # 8. Persist or Update Result in Database
        existing_res = (
            self.db.query(PropertyCheckResult)
            .filter(PropertyCheckResult.property_check_id == check_request_id)
            .first()
        )
        if not existing_res:
            check_result = PropertyCheckResult(
                property_check_id=check_request_id,
                risk_category=assessment["risk_category"],
                risk_score=assessment["risk_score"],
                summary_verdict=assessment["summary_verdict"],
                sources_checked=sources_checked,
                source_status=sources_status,
                land_records_findings=land_findings,
                court_cases_findings=court_cases,
                registration_findings=registration_findings,
                mortgage_charge_findings=mortgage_findings,
                chain_of_title_observations=assessment["chain_of_title"],
                identified_inconsistencies=assessment["discrepancies"],
                missing_documents=assessment["missing_documents"],
                verification_limitations=assessment["verification_limitations"],
                recommended_next_steps=assessment["recommended_next_steps"],
                report_html_url=f"/api/v1/property-check/{check_request_id}/report",
            )
            self.db.add(check_result)
        else:
            existing_res.risk_category = assessment["risk_category"]
            existing_res.risk_score = assessment["risk_score"]
            existing_res.summary_verdict = assessment["summary_verdict"]
            existing_res.sources_checked = sources_checked
            existing_res.source_status = sources_status
            existing_res.land_records_findings = land_findings
            existing_res.court_cases_findings = court_cases
            existing_res.registration_findings = registration_findings
            existing_res.mortgage_charge_findings = mortgage_findings
            existing_res.chain_of_title_observations = assessment["chain_of_title"]
            existing_res.identified_inconsistencies = assessment["discrepancies"]
            existing_res.missing_documents = assessment["missing_documents"]
            existing_res.verification_limitations = assessment["verification_limitations"]
            existing_res.recommended_next_steps = assessment["recommended_next_steps"]
            existing_res.generated_at = datetime.now(timezone.utc)
            check_result = existing_res

        req.status = CheckStatus.COMPLETED
        self.db.commit()
        self.db.refresh(check_result)
        return check_result
