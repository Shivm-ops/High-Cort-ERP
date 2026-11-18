"""
app/services/property/land_adapter.py
====================================
Maharashtra Land Records integration adapter.
Interfaces with official MahaBhumi data via authorized Landeed / India Property Register API.

Extracts & Analyzes:
- 7/12 Extract (Satbara Utara: Ownership, Area, Crop/Cultivation, Other Rights/Encumbrances)
- 8A Extract (Holding account)
- Mutation / Ferfar records (Historical transfers, pending mutations)
- Property Card (Urban CTS records for municipal corporations)
- Survey / Gat details and cadastral maps
"""

import httpx
import logging
from typing import Dict, Any, List, Optional
from datetime import datetime, timezone
from app.services.property.base import BasePropertyProvider
from app.models.setting import SystemSetting
from app.core.config import settings

logger = logging.getLogger("land_records_adapter")


class MaharashtraLandRecordsAdapter(BasePropertyProvider):
    def __init__(self, db_session=None):
        super().__init__(provider_name="MahaBhumi / Landeed Land Records Engine", timeout_sec=14.0)
        self.db = db_session
        self.base_url, self.api_key = self._get_credentials()

    def _get_credentials(self) -> tuple[str, Optional[str]]:
        """Retrieve Landeed / MahaBhumi API credentials from SuperAdmin SystemSetting table."""
        base_url = "https://api.landeed.com/v1"
        api_key = getattr(settings, "LANDEED_API_KEY", None)

        if self.db:
            try:
                setting_url = self.db.query(SystemSetting).filter(SystemSetting.key == "landeed_base_url").first()
                if setting_url and setting_url.value:
                    base_url = setting_url.value.strip()

                setting_key = self.db.query(SystemSetting).filter(SystemSetting.key == "landeed_api_key").first()
                if setting_key and setting_key.value:
                    api_key = setting_key.value.strip()
            except Exception as e:
                logger.warning(f"Could not read Landeed settings from DB: {e}")

        return base_url, api_key

    async def fetch_satbara_7_12(
        self,
        district: str,
        taluka: str,
        village: str,
        survey_or_gat_number: str
    ) -> Dict[str, Any]:
        """Fetch official 7/12 Extract (Satbara) for agricultural / rural / semi-urban land."""
        if not self.circuit_breaker.allow_request():
            return {
                "metadata": self.get_source_metadata("circuit_open", "Land records provider circuit breaker open"),
                "record": None
            }

        if not self.api_key:
            return {
                "metadata": self.get_source_metadata("unavailable", "Landeed / MahaBhumi API Key not configured in SuperAdmin"),
                "record": None
            }

        headers = {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json",
            "Accept": "application/json",
            "User-Agent": "FastCase-LegalCheck/2.0",
        }

        payload = {
            "state": "Maharashtra",
            "district": district.strip(),
            "taluka": taluka.strip() if taluka else "",
            "village": village.strip() if village else "",
            "survey_number": survey_or_gat_number.strip(),
            "document_type": "7_12"
        }

        url = f"{self.base_url.rstrip('/')}/maharashtra/satbara"

        async with httpx.AsyncClient(timeout=self.timeout_sec) as client:
            try:
                response = await client.post(url, json=payload, headers=headers)
                if response.status_code == 200:
                    self.circuit_breaker.record_success()
                    data = response.json()
                    return {
                        "metadata": self.get_source_metadata("available"),
                        "record": self._parse_satbara_data(data)
                    }
                elif response.status_code == 404:
                    self.circuit_breaker.record_success()
                    return {
                        "metadata": self.get_source_metadata("no_record", "No matching 7/12 record found for provided Survey/Gat number"),
                        "record": None
                    }
                else:
                    self.circuit_breaker.record_failure()
                    logger.warning(f"MahaBhumi 7/12 API returned HTTP {response.status_code}: {response.text}")
                    return {
                        "metadata": self.get_source_metadata("unavailable", f"HTTP {response.status_code}"),
                        "record": None
                    }
            except Exception as exc:
                self.circuit_breaker.record_failure()
                logger.error(f"MahaBhumi 7/12 API network error: {exc}")
                return {
                    "metadata": self.get_source_metadata("unavailable", str(exc)),
                    "record": None
                }

    async def fetch_property_card(
        self,
        district: str,
        city_office: str,
        cts_number: str
    ) -> Dict[str, Any]:
        """Fetch Urban Property Card (Malmatta Patrak) for municipal/city survey boundaries."""
        if not self.circuit_breaker.allow_request():
            return {
                "metadata": self.get_source_metadata("circuit_open"),
                "record": None
            }

        if not self.api_key:
            return {
                "metadata": self.get_source_metadata("unavailable", "Landeed API Key not configured in SuperAdmin"),
                "record": None
            }

        headers = {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json",
            "Accept": "application/json",
        }

        payload = {
            "state": "Maharashtra",
            "district": district.strip(),
            "office": city_office.strip() if city_office else "",
            "cts_number": cts_number.strip(),
            "document_type": "property_card"
        }

        url = f"{self.base_url.rstrip('/')}/maharashtra/property-card"

        async with httpx.AsyncClient(timeout=self.timeout_sec) as client:
            try:
                response = await client.post(url, json=payload, headers=headers)
                if response.status_code == 200:
                    self.circuit_breaker.record_success()
                    return {
                        "metadata": self.get_source_metadata("available"),
                        "record": response.json()
                    }
                elif response.status_code == 404:
                    self.circuit_breaker.record_success()
                    return {
                        "metadata": self.get_source_metadata("no_record"),
                        "record": None
                    }
                else:
                    self.circuit_breaker.record_failure()
                    return {
                        "metadata": self.get_source_metadata("unavailable", f"HTTP {response.status_code}"),
                        "record": None
                    }
            except Exception as exc:
                self.circuit_breaker.record_failure()
                return {
                    "metadata": self.get_source_metadata("unavailable", str(exc)),
                    "record": None
                }

    def _parse_satbara_data(self, raw: Dict[str, Any]) -> Dict[str, Any]:
        """Structure raw 7/12 response into clean FastCase legal fields."""
        owners = raw.get("khatedar_names") or raw.get("owners", [])
        other_rights = raw.get("other_rights") or raw.get("itar_hakka", [])
        area_total = raw.get("total_area") or raw.get("area_hectares", "")
        mutations = raw.get("mutations") or raw.get("ferfar_entries", [])

        # Detect mortgage or lien indicators in Other Rights
        has_bank_charge = any("बँक" in str(r) or "bank" in str(r).lower() or "bojh" in str(r).lower() or "गहाण" in str(r) for r in other_rights)

        return {
            "document_type": "7/12 Extract (Satbara Utara)",
            "district": raw.get("district", ""),
            "taluka": raw.get("taluka", ""),
            "village": raw.get("village", ""),
            "survey_gat_number": raw.get("survey_number") or raw.get("gat_number", ""),
            "khata_number": raw.get("khata_number", ""),
            "owners": owners,
            "total_area_hectares": area_total,
            "pot_kharaba": raw.get("pot_kharaba", "0.00"),
            "assessment_rupees": raw.get("aakar_rupees", "0.00"),
            "other_rights": other_rights,
            "has_bank_charge_flag": has_bank_charge,
            "mutation_entries": mutations,
            "last_mutation_number": raw.get("last_ferfar_no", ""),
            "is_digitally_signed": raw.get("digitally_signed", True),
            "retrieval_date": datetime.now(timezone.utc).strftime("%d-%m-%Y %H:%M:%S UTC"),
        }

    async def search(self, params: Dict[str, Any]) -> Dict[str, Any]:
        """Unified entry point."""
        district = params.get("district", "")
        taluka = params.get("taluka", "")
        village = params.get("village_city", "")
        survey_gat = params.get("survey_number") or params.get("gat_number")
        cts = params.get("cts_number")

        results = {}
        sources_status = {}

        # 1. Satbara check if survey/gat provided
        if survey_gat:
            satbara_res = await self.fetch_satbara_7_12(district, taluka, village, survey_gat)
            results["satbara_7_12"] = satbara_res["record"]
            sources_status["mahabhumi_7_12"] = satbara_res["metadata"]["status"]

        # 2. Property card check if CTS provided
        if cts:
            pcard_res = await self.fetch_property_card(district, taluka, cts)
            results["property_card"] = pcard_res["record"]
            sources_status["mahabhumi_property_card"] = pcard_res["metadata"]["status"]

        return {
            "metadata": self.get_source_metadata("available" if results else "no_record"),
            "sources_status": sources_status,
            "records": results
        }
