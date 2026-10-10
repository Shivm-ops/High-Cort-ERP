import os
import re
from typing import Optional

from sqlalchemy.orm import Session

from app.models.firm import Firm


def get_root_domain() -> str:
    domain = os.getenv("DOMAIN") or os.getenv("ROOT_DOMAIN") or "fastcase.in"
    return domain.strip().lower()


ROOT_DOMAIN = get_root_domain()
RESERVED_SUBDOMAINS = {
    "www", "app", "admin", "api", "mail", "ftp", "smtp", "imap",
    "ns1", "ns2", "cdn", "static", "assets", "dev", "staging", "test",
    "localhost", "fastcase", "support", "help", "blog", "docs", "superadmin",
}


def slugify_subdomain(text: str) -> str:
    slug = re.sub(r"[^a-z0-9]+", "-", (text or "").lower()).strip("-")
    slug = re.sub(r"-{2,}", "-", slug)[:48]
    if not slug or slug in RESERVED_SUBDOMAINS:
        slug = "firm"
    return slug


def allocate_unique_subdomain(db: Session, name: str, exclude_id=None) -> str:
    base = slugify_subdomain(name)
    candidate = base
    n = 2
    while True:
        q = db.query(Firm).filter(Firm.subdomain == candidate)
        if exclude_id is not None:
            q = q.filter(Firm.id != exclude_id)
        if not q.first():
            return candidate
        candidate = f"{base}-{n}"
        n += 1


def normalize_custom_domain(value: Optional[str]) -> Optional[str]:
    if not value:
        return None
    root_domain = get_root_domain()
    v = value.strip().lower()
    v = re.sub(r"^https?://", "", v)
    v = v.split("/")[0].strip(".")
    if not v or v.endswith(f".{root_domain}") or v == root_domain:
        return None
    if not re.match(r"^[a-z0-9]([a-z0-9.-]*[a-z0-9])?$", v):
        raise ValueError("Enter a valid domain such as www.yourfirm.in")
    return v


def normalize_subdomain(value: Optional[str]) -> Optional[str]:
    if not value:
        return None
    slug = slugify_subdomain(value)
    if slug in RESERVED_SUBDOMAINS:
        raise ValueError(f"'{slug}' is reserved and cannot be used as a subdomain")
    if len(slug) < 2:
        raise ValueError("Subdomain must be at least 2 characters")
    return slug


def public_domain(firm) -> Optional[str]:
    if getattr(firm, "custom_domain", None):
        return firm.custom_domain
    if getattr(firm, "subdomain", None):
        return f"{firm.subdomain}.{get_root_domain()}"
    return None


def domain_fields(firm) -> dict:
    return {
        "subdomain": getattr(firm, "subdomain", None),
        "custom_domain": getattr(firm, "custom_domain", None),
        "domain": public_domain(firm),
    }


def ensure_firm_subdomain(db: Session, firm) -> None:
    if firm is None:
        return
    if not getattr(firm, "subdomain", None):
        firm.subdomain = allocate_unique_subdomain(db, firm.name or "firm", firm.id)
        db.add(firm)
        db.flush()
