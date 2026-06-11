import logging
import asyncio
from datetime import datetime, timedelta
import random

logger = logging.getLogger(__name__)

class ECourtsSyncService:
    """Mock e-Courts Sync Service for Advocate ERP.
    Simulates fetching case status and next hearing date from Indian e-Courts via CNR Number.
    """

    @staticmethod
    async def sync_case(cnr_number: str) -> dict:
        """Simulate fetching case details from e-Courts."""
        logger.info(f"⚖️ [e-Courts Mock] Syncing case with CNR: {cnr_number}...")
        await asyncio.sleep(2) # Simulate API delay
        
        # Mock some random future date and status
        future_days = random.randint(5, 60)
        next_hearing = datetime.utcnow() + timedelta(days=future_days)
        
        statuses = ["Pending", "Hearing Fixed", "Adjourned"]
        
        mock_data = {
            "cnr_number": cnr_number,
            "status": random.choice(statuses),
            "next_hearing_date": next_hearing.date().isoformat(),
            "court_name": "High Court of Mock Data",
            "judge": "Hon'ble Mr. Justice AI",
            "last_synced": datetime.utcnow().isoformat()
        }
        
        logger.info(f"✅ [e-Courts Mock] Successfully synced CNR {cnr_number}")
        return mock_data
