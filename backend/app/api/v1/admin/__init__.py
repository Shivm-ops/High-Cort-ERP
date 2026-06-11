from fastapi import APIRouter
from . import users, firms, kyc, subscriptions, payments, storage, content, settings, roles, audit, support, reports, superadmins, dashboard, search

router = APIRouter()

router.include_router(users.router, prefix="/users", tags=["Admin - Users"])
router.include_router(firms.router, prefix="/firms", tags=["Admin - Firms"])
router.include_router(kyc.router, prefix="/kyc", tags=["Admin - KYC"])
router.include_router(subscriptions.router, prefix="/subscriptions", tags=["Admin - Subscriptions"])
router.include_router(payments.router, prefix="/payments", tags=["Admin - Payments"])
router.include_router(storage.router, prefix="/storage", tags=["Admin - Storage"])
router.include_router(content.router, prefix="/content", tags=["Admin - Content"])
router.include_router(settings.router, prefix="/settings", tags=["Admin - Settings"])
router.include_router(roles.router, prefix="/roles", tags=["Admin - Roles"])
router.include_router(audit.router, prefix="/audit", tags=["Admin - Audit"])
router.include_router(support.router, prefix="/support", tags=["Admin - Support"])
router.include_router(reports.router, prefix="/reports", tags=["admin-reports"])
router.include_router(superadmins.router, prefix="/superadmins", tags=["admin-superadmins"])
router.include_router(dashboard.router, prefix="/dashboard", tags=["Admin - Dashboard"])
router.include_router(search.router, prefix="/search", tags=["Admin - Search"])
