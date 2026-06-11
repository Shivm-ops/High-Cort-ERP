"""
app/core/permissions.py
========================
Central RBAC and Tenant-Isolation utilities.

Usage
-----
    from app.core.permissions import require_firm_access, check_object_firm, require_roles

"""

from fastapi import Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.security import get_current_user
from app.core.database import get_db
from app.models.user import User, UserRole


# ---------------------------------------------------------------------------
# Role constants (ordered from most to least privileged)
# ---------------------------------------------------------------------------

ROLES_ALL = [
    UserRole.ADMIN,
    UserRole.SENIOR_ADVOCATE,
    UserRole.ASSOCIATE_ADVOCATE,
    UserRole.JUNIOR_ADVOCATE,
    UserRole.PARALEGAL,
    UserRole.CLERK,
]

ROLES_ADMIN = [UserRole.ADMIN]
ROLES_ADVOCATES = [UserRole.ADMIN, UserRole.SENIOR_ADVOCATE, UserRole.ASSOCIATE_ADVOCATE]
ROLES_WITH_BILLING = [UserRole.ADMIN, UserRole.SENIOR_ADVOCATE]
ROLES_WITH_TEAM_MGMT = [UserRole.ADMIN, UserRole.SENIOR_ADVOCATE]


# ---------------------------------------------------------------------------
# Tenant guard helpers
# ---------------------------------------------------------------------------

def require_firm_member(current_user: User = Depends(get_current_user)) -> User:
    """
    Gate: User must belong to a firm.
    Super-admins bypass this (they have cross-firm visibility).
    """
    if current_user.is_superadmin:
        return current_user
    if not current_user.firm_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="User is not associated with any firm. Contact your administrator.",
        )
    return current_user


def require_roles(*allowed_roles: UserRole):
    """
    Dependency factory — restrict endpoint to specific roles.

    Usage:
        current_user: User = Depends(require_roles(UserRole.ADMIN, UserRole.SENIOR_ADVOCATE))
    """
    async def _checker(current_user: User = Depends(require_firm_member)) -> User:
        if current_user.is_superadmin:
            return current_user
        if current_user.user_type not in allowed_roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Role '{current_user.user_type}' is not permitted to perform this action.",
            )
        return current_user
    return _checker


def require_feature(required_feature: str):
    """
    Dependency factory — restrict endpoint to firms whose active subscription 
    includes the required_feature.
    Super-admins bypass this check.
    """
    async def _checker(current_user: User = Depends(require_firm_member), db: Session = Depends(get_db)) -> User:
        if current_user.is_superadmin:
            return current_user

        from app.models.subscription import TenantSubscription
        sub = db.query(TenantSubscription).filter(
            TenantSubscription.firm_id == current_user.firm_id,
            TenantSubscription.status == "active"
        ).first()

        if not sub or not sub.plan:
            raise HTTPException(
                status_code=status.HTTP_402_PAYMENT_REQUIRED,
                detail=f"Feature '{required_feature}' requires an active subscription.",
            )

        feats = sub.plan.features or ""
        features_list = [f.strip() for f in feats.split(",") if f.strip()]
        
        if required_feature not in features_list:
            raise HTTPException(
                status_code=status.HTTP_402_PAYMENT_REQUIRED,
                detail=f"Your current subscription plan does not include the '{required_feature}' feature. Please upgrade your plan.",
            )
        return current_user
    return _checker


def check_object_firm(obj, current_user: User, obj_firm_id_attr: str = "firm_id"):
    """
    Object-level security check.
    Raises 403 if the object's firm_id doesn't match the caller's firm_id.
    Super-admins bypass this check.
    """
    if current_user.is_superadmin:
        return
        
    obj_firm_id = getattr(obj, obj_firm_id_attr, None)
    
    if obj_firm_id is None:
        # Object has no firm_id (e.g. legacy or isolated by owner)
        # We MUST ensure the caller is actually the creator, otherwise anyone can access it!
        creator_id = getattr(obj, "created_by_id", None)
        if creator_id and creator_id != current_user.id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Access denied. This record is private and belongs to another user.",
            )
        return
        
    if obj_firm_id != current_user.firm_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied. This record belongs to a different organisation.",
        )


def apply_firm_filter(query, model, current_user: User):
    """
    Applies a `firm_id` WHERE clause to a SQLAlchemy query.
    Super-admins get unfiltered queries.
    """
    if current_user.is_superadmin:
        return query
    if current_user.firm_id:
        return query.filter(model.firm_id == current_user.firm_id)
    # User with no firm sees nothing
    return query.filter(False)


def get_user_firm_id(current_user: User):
    """Return the firm_id for seeding / creating records, or None for superadmins."""
    return current_user.firm_id if not current_user.is_superadmin else None
