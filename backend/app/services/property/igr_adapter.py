"""
app/services/property/igr_adapter.py
===================================
Maharashtra IGR (Department of Registration & Stamps) Index II & Deed Adapter.
Docs: https://igrmaharashtra.gov.in/

Extracts:
- Registered Sale Deeds (खरेदीखत)
- Index II transaction entries
- Gift Deeds (बक्षीसपत्र), Release Deeds (हक्कसोडपत्र), Partition Deeds (वाटपपत्र)
- Registered Mortgages & Encumbrance records
- Historical ownership chain sequence
"""

import httpx
import logging
from typing import Dict, Any, List, Optional
from datetime import datetime, timezone
from app.services.property.base import BasePropertyProvider
from app.models.setting import SystemSetting
from app.core.config import settings

logger = logging.getLogger("igr_adapter")


class MaharashtraIGRAdapter(BasePropertyProvider):
    def __init__(self, db_session=None):
        super().__init__(provider_name="Maharashtra IGR Index II Engine", timeout_sec=14.0)
        self.db = db_session
        self.base_url, self.api_key = self._get_credentials()

    def _get_credentials(self) -> tuple[str, Optional[str]]:
        base_url = "https://api.landeed.com/v1"
        api_key = getattr(settings, "LANDEED_API_KEY", None)

        if self.db:
            try:
                setting_key = self.db.query(SystemSetting).filter(SystemSetting.key == "landeed_api_key").first()
                if setting_key and setting_key.value:
                    api_key = setting_key.value.strip()
            except Exception as e:
                logger.warning(f"Could not read IGR settings from DB: {e}")

        return base_url, api_key

    async def search_index_ii(
        self,
        district: str,
        survey_number: Optional[str] = None,
        cts_number: Optional[str] = None,
        party_name: Optional[str] = None,
        year_from: int = 1995,
        year_to: Optional[int] = None
    ) -> Dict[str, Any]:
        """Search Index II registered transaction history across SRO offices in district."""
        if not self.circuit_breaker.allow_request():
            return {
                "metadata": self.get_source_metadata("circuit_open"),
                "transactions": [],
                "chain_of_title": []
            }

        if not self.api_key:
            return {
                "metadata": self.get_source_metadata("unavailable", "IGR / Landeed API Key not configured in SuperAdmin"),
                "transactions": [],
                "chain_of_title": []
            }

        headers = {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json",
            "Accept": "application/json",
        }

        current_year = datetime.now().year
        payload = {
            "state": "Maharashtra",
            "district": district.strip(),
            "survey_number": survey_number or "",
            "cts_number": cts_number or "",
            "party_name": party_name or "",
            "from_year": year_from,
            "to_year": year_to or current_year,
        }

        url = f"{self.base_url.rstrip('/')}/maharashtra/index2/search"

        async with httpx.AsyncClient(timeout=self.timeout_sec) as client:
            try:
                response = await client.post(url, json=payload, headers=headers)
                if response.status_code == 200:
                    self.circuit_breaker.record_success()
                    raw_data = response.json().get("transactions", [])
                    chain = self._construct_chain_of_title(raw_data)
                    return {
                        "metadata": self.get_source_metadata("available" if raw_data else "no_record"),
                        "transactions": raw_data,
                        "chain_of_title": chain
                    }
                elif response.status_code == 404:
                    self.circuit_breaker.record_success()
                    return {
                        "metadata": self.get_source_metadata("no_record"),
                        "transactions": [],
                        "chain_of_title": []
                    }
                else:
                    self.circuit_breaker.record_failure()
                    return {
                        "metadata": self.get_source_metadata("unavailable", f"HTTP {response.status_code}"),
                        "transactions": [],
                        "chain_of_title": []
                    }
            except Exception as exc:
                self.circuit_breaker.record_failure()
                return {
                    "metadata": self.get_source_metadata("unavailable", str(exc)),
                    "transactions": [],
                    "chain_of_title": []
                }

    def _construct_chain_of_title(self, transactions: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """Order transactions chronologically and identify gaps in ownership sequence."""
        if not transactions:
            return []

        # Sort by registration date / year ascending
        sorted_tx = sorted(transactions, key=lambda x: str(x.get("registration_year", "0")))
        chain = []
        for i, tx in enumerate(sorted_tx):
            doc_type = tx.get("document_type", "Sale Deed")
            seller = tx.get("seller_name") or tx.get("party1", "")
            buyer = tx.get("buyer_name") or tx.get("party2", "")
            year = tx.get("registration_year", "")
            doc_no = tx.get("document_number", "")

            gap_flag = False
            gap_note = None
            if i > 0:
                prev_buyer = chain[i - 1].get("buyer", "").strip().lower()
                current_seller = seller.strip().lower()
                # If current seller does not match previous buyer, flag gap in title
                if prev_buyer and current_seller and (prev_buyer not in current_seller and current_seller not in prev_buyer):
                    gap_flag = True
                    gap_note = f"Gap in Chain of Title: Seller '{seller}' does not match prior registered purchaser '{chain[i - 1].get('buyer')}'. Intervening deed or inheritance succession document required."

            chain.append({
                "sequence": i + 1,
                "year": year,
                "document_number": doc_no,
                "document_type": doc_type,
                "seller": seller,
                "buyer": buyer,
                "sro_office": tx.get("sro_office", ""),
                "consideration_amount": tx.get("market_value", 0),
                "has_title_gap": gap_flag,
                "title_gap_note": gap_note,
            })

        return chain

    async def search(self, params: Dict[str, Any]) -> Dict[str, Any]:
        """Unified entry point."""
        return await self.search_index_ii(
            district=params.get("district", ""),
            survey_number=params.get("survey_number") or params.get("gat_number"),
            cts_number=params.get("cts_number"),
            party_name=params.get("current_owner_name"),
        )
