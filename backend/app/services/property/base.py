"""
app/services/property/base.py
=============================
Base provider adapter specification, circuit breaker, timeout handling,
and source attribution for FastCase Unified Property Search Engine.
"""

import time
import logging
from abc import ABC, abstractmethod
from typing import Dict, Any, Optional
from datetime import datetime, timezone

logger = logging.getLogger("property_adapters")


class CircuitBreakerOpenException(Exception):
    """Raised when an external API provider is temporarily tripped due to consecutive failures."""
    pass


class CircuitBreaker:
    def __init__(self, failure_threshold: int = 5, recovery_timeout_sec: int = 60):
        self.failure_threshold = failure_threshold
        self.recovery_timeout_sec = recovery_timeout_sec
        self.failure_count = 0
        self.last_failure_time = 0
        self.state = "CLOSED"  # CLOSED, OPEN, HALF_OPEN

    def record_success(self):
        self.failure_count = 0
        self.state = "CLOSED"

    def record_failure(self):
        self.failure_count += 1
        self.last_failure_time = time.time()
        if self.failure_count >= self.failure_threshold:
            self.state = "OPEN"
            logger.warning(f"⚠️ Circuit breaker tripped OPEN. Failure count: {self.failure_count}")

    def allow_request(self) -> bool:
        if self.state == "CLOSED":
            return True
        if self.state == "OPEN":
            if time.time() - self.last_failure_time > self.recovery_timeout_sec:
                self.state = "HALF_OPEN"
                return True
            return False
        # HALF_OPEN
        return True


class BasePropertyProvider(ABC):
    def __init__(self, provider_name: str, timeout_sec: float = 12.0):
        self.provider_name = provider_name
        self.timeout_sec = timeout_sec
        self.circuit_breaker = CircuitBreaker()

    def get_source_metadata(self, status: str, error_detail: Optional[str] = None) -> Dict[str, Any]:
        return {
            "provider": self.provider_name,
            "retrieved_at": datetime.now(timezone.utc).isoformat(),
            "status": status,  # "available", "no_record", "unavailable", "circuit_open"
            "error_detail": error_detail,
        }

    @abstractmethod
    async def search(self, params: Dict[str, Any]) -> Dict[str, Any]:
        """Execute search against the provider with graceful failure handling."""
        pass
