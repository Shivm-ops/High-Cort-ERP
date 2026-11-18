"""
app/services/property/ecourts_adapter.py
=======================================
eCourtsIndia Partner API adapter for Indian High Courts & District Courts.
API Docs: https://ecourtsindia.com/api/docs

Capabilities:
- CNR Number Search (Exact 16-character unique lookup)
- Party Name Search (Filtered by State & District)
- Case Details, Status, Hearing Dates, and Orders
- Property Dispute Categorization (Partition, Injunction, Title, Specific Performance)
- Party vs Property Matching Confidence Disambiguation
"""

import httpx
import logging
from typing import Dict, Any, List, Optional
from app.services.property.base import BasePropertyProvider
from app.models.setting import SystemSetting
from app.core.config import settings

logger = logging.getLogger("ecourts_adapter")

# Civil disputes that are directly relevant to property titles
PROPERTY_CIVIL_CASE_TYPES = [
    "Special Civil Suit",
    "Regular Civil Suit",
    "Title Suit",
    "Partition Suit",
    "Injunction",
    "Specific Performance",
    "Land Acquisition Reference (LAR)",
    "Revenue Appeal",
    "Civil Appeal",
    "Execution Petition",
    "Succession Petition",
    "Arbitration Petition",
]


class ECourtsIndiaAdapter(BasePropertyProvider):
    def __init__(self, db_session=None):
        super().__init__(provider_name="eCourtsIndia Partner API", timeout_sec=12.0)
        self.db = db_session
        self.base_url, self.api_key = self._get_credentials()

    def _get_credentials(self) -> tuple[str, Optional[str]]:
        """Retrieve API credentials from SuperAdmin SystemSetting table, falling back to env."""
        base_url = "https://ecourtsindia.com/api"
        api_key = getattr(settings, "ECOURTS_API_KEY", None)

        if self.db:
            try:
                setting_url = self.db.query(SystemSetting).filter(SystemSetting.key == "ecourts_base_url").first()
                if setting_url and setting_url.value:
                    base_url = setting_url.value.strip()

                setting_key = self.db.query(SystemSetting).filter(SystemSetting.key == "ecourts_api_key").first()
                if setting_key and setting_key.value:
                    api_key = setting_key.value.strip()
            except Exception as e:
                logger.warning(f"Could not read eCourts settings from DB: {e}")

        return base_url, api_key

    async def search_by_cnr(self, cnr_number: str) -> Dict[str, Any]:
        """Fetch exact case details by CNR number."""
        clean_cnr = cnr_number.strip().upper()
        if not self.circuit_breaker.allow_request():
            return {
                "metadata": self.get_source_metadata("circuit_open", "Provider circuit breaker open due to past timeouts"),
                "case": None
            }

        if not self.api_key:
            return {
                "metadata": self.get_source_metadata("unavailable", "eCourts API Key not configured in SuperAdmin"),
                "case": None
            }

        headers = {
            "Authorization": f"Bearer {self.api_key}",
            "Accept": "application/json",
            "User-Agent": "FastCase-LegalCheck/2.0",
        }

        url = f"{self.base_url.rstrip('/')}/partner/case/{clean_cnr}"

        async with httpx.AsyncClient(timeout=self.timeout_sec) as client:
            try:
                response = await client.get(url, headers=headers)
                if response.status_code == 200:
                    self.circuit_breaker.record_success()
                    data = response.json()
                    return {
                        "metadata": self.get_source_metadata("available"),
                        "case": self._normalize_case_data(data)
                    }
                elif response.status_code == 404:
                    self.circuit_breaker.record_success()
                    return {
                        "metadata": self.get_source_metadata("no_record"),
                        "case": None
                    }
                else:
                    self.circuit_breaker.record_failure()
                    logger.warning(f"eCourts CNR lookup returned HTTP {response.status_code}: {response.text}")
                    return {
                        "metadata": self.get_source_metadata("unavailable", f"HTTP {response.status_code}"),
                        "case": None
                    }
            except Exception as exc:
                self.circuit_breaker.record_failure()
                logger.error(f"eCourts CNR lookup network error: {exc}")
                return {
                    "metadata": self.get_source_metadata("unavailable", str(exc)),
                    "case": None
                }

    async def search_by_party_name(
        self,
        party_name: str,
        state: str = "MH",
        district: Optional[str] = None,
        year: Optional[int] = None,
        property_identifiers: Optional[Dict[str, str]] = None
    ) -> Dict[str, Any]:
        """
        Search court cases involving a person or entity,
        then calculate property-matching relevance confidence scores.
        """
        if not self.circuit_breaker.allow_request():
            return {
                "metadata": self.get_source_metadata("circuit_open", "Provider circuit breaker open"),
                "cases": [],
                "count": 0
            }

        if not self.api_key:
            return {
                "metadata": self.get_source_metadata("unavailable", "eCourts API Key not configured in SuperAdmin"),
                "cases": [],
                "count": 0
            }

        headers = {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json",
            "Accept": "application/json",
            "User-Agent": "FastCase-LegalCheck/2.0",
        }

        payload = {
            "name": party_name.strip(),
            "state": state,
            "district": district or "",
            "caseStatus": "both",  # pending and disposed
        }
        if year:
            payload["year"] = year

        url = f"{self.base_url.rstrip('/')}/partner/search/party"

        async with httpx.AsyncClient(timeout=self.timeout_sec) as client:
            try:
                response = await client.post(url, json=payload, headers=headers)
                if response.status_code == 200:
                    self.circuit_breaker.record_success()
                    raw_cases = response.json().get("cases", [])
                    scored_cases = []
                    for c in raw_cases:
                        normalized = self._normalize_case_data(c)
                        # Disambiguate party vs property relevance
                        relevance = self._calculate_property_relevance(normalized, party_name, property_identifiers)
                        normalized["relevance_score"] = relevance["score"]
                        normalized["relevance_tier"] = relevance["tier"]
                        normalized["relevance_reason"] = relevance["reason"]
                        scored_cases.append(normalized)

                    # Sort highest risk / relevance first
                    scored_cases.sort(key=lambda x: x["relevance_score"], reverse=True)

                    return {
                        "metadata": self.get_source_metadata("available" if scored_cases else "no_record"),
                        "cases": scored_cases,
                        "count": len(scored_cases)
                    }
                elif response.status_code == 404:
                    self.circuit_breaker.record_success()
                    return {
                        "metadata": self.get_source_metadata("no_record"),
                        "cases": [],
                        "count": 0
                    }
                else:
                    self.circuit_breaker.record_failure()
                    logger.warning(f"eCourts party search returned HTTP {response.status_code}: {response.text}")
                    return {
                        "metadata": self.get_source_metadata("unavailable", f"HTTP {response.status_code}"),
                        "cases": [],
                        "count": 0
                    }
            except Exception as exc:
                self.circuit_breaker.record_failure()
                logger.error(f"eCourts party search network error: {exc}")
                return {
                    "metadata": self.get_source_metadata("unavailable", str(exc)),
                    "cases": [],
                    "count": 0
                }

    def _normalize_case_data(self, raw: Dict[str, Any]) -> Dict[str, Any]:
        """Convert provider response into unified FastCase case structure."""
        return {
            "cnr_number": raw.get("cnr") or raw.get("cnr_number", ""),
            "case_number": raw.get("case_number") or raw.get("caseNumber", ""),
            "case_type": raw.get("case_type") or raw.get("caseType", "Civil Suit"),
            "filing_year": raw.get("year") or raw.get("filing_year", ""),
            "court_name": raw.get("court_name") or raw.get("courtName", "District Court"),
            "district": raw.get("district", ""),
            "state": raw.get("state", "Maharashtra"),
            "petitioner": raw.get("petitioner") or raw.get("plaintiff", ""),
            "respondent": raw.get("respondent") or raw.get("defendant", ""),
            "status": raw.get("status") or raw.get("case_status", "Pending"),
            "next_hearing_date": raw.get("next_hearing_date") or raw.get("nextDate", None),
            "stage": raw.get("stage", "Arguments / Evidence"),
            "orders": raw.get("orders", []),
            "is_civil_property_type": any(pt.lower() in (raw.get("case_type") or "").lower() for pt in PROPERTY_CIVIL_CASE_TYPES),
        }

    def _calculate_property_relevance(
        self,
        case_data: Dict[str, Any],
        searched_owner: str,
        property_ids: Optional[Dict[str, str]]
    ) -> Dict[str, Any]:
        """
        Disambiguate party match from property match.
        CRITICAL: A case involving a person must not automatically be treated
        as a dispute involving the property being checked.
        """
        case_type = case_data.get("case_type", "")
        summary_text = f"{case_type} {case_data.get('petitioner', '')} vs {case_data.get('respondent', '')}".lower()
        
        # Check if survey, gat or CTS number is explicitly mentioned in case summary
        has_property_id_match = False
        matching_id = ""
        if property_ids:
            for k in ["survey_number", "gat_number", "cts_number"]:
                val = property_ids.get(k)
                if val and len(val.strip()) > 1 and val.strip().lower() in summary_text:
                    has_property_id_match = True
                    matching_id = f"{k}: {val}"
                    break

        is_property_case_type = case_data.get("is_civil_property_type", False)

        if has_property_id_match:
            return {
                "score": 95,
                "tier": "HIGH",
                "reason": f"Direct property identifier match detected in court record ({matching_id}). High likelihood of title dispute."
            }
        elif is_property_case_type:
            return {
                "score": 60,
                "tier": "MEDIUM",
                "reason": f"Owner party involved in {case_type}. Requires advocate review to determine whether the subject property is included in the suit schedule."
            }
        else:
            return {
                "score": 25,
                "tier": "INFORMATIONAL",
                "reason": "Litigation matches party name, but case category is unrelated to real estate title. Provided for complete disclosure."
            }

    async def search(self, params: Dict[str, Any]) -> Dict[str, Any]:
        """Unified entry point."""
        cnr = params.get("cnr_number")
        if cnr:
            res = await self.search_by_cnr(cnr)
            return {
                "metadata": res["metadata"],
                "cases": [res["case"]] if res["case"] else [],
                "count": 1 if res["case"] else 0
            }

        party_name = params.get("current_owner_name") or params.get("party_name")
        district = params.get("district")
        prop_ids = {
            "survey_number": params.get("survey_number", ""),
            "gat_number": params.get("gat_number", ""),
            "cts_number": params.get("cts_number", "")
        }
        if party_name:
            return await self.search_by_party_name(
                party_name=party_name,
                district=district,
                property_identifiers=prop_ids
            )

        return {
            "metadata": self.get_source_metadata("no_record", "Neither CNR nor party name provided"),
            "cases": [],
            "count": 0
        }
