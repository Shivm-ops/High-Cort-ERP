from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func
from app.core.database import get_db
from app.core.security import get_current_superadmin
from app.models.subscription import TenantSubscription
from app.models.document import Document
from app.models.user import User
from app.models.firm import Firm

router = APIRouter()

@router.get("/")
def get_storage_stats(db: Session = Depends(get_db), current_admin: User = Depends(get_current_superadmin)):
    # Fetch all active tenant subscriptions to get their limits
    subscriptions = db.query(TenantSubscription).filter(TenantSubscription.status == 'active').all()
    
    total_platform_limit_gb = sum(sub.plan.storage_limit_gb for sub in subscriptions if sub.plan)
    total_platform_used_bytes = 0
    
    tenant_stats = []
    
    for sub in subscriptions:
        firm_id = sub.firm_id
        
        # Calculate storage used by this firm
        used_bytes = db.query(func.sum(Document.file_size)).join(
            User, Document.uploaded_by_id == User.id
        ).filter(
            User.firm_id == firm_id
        ).scalar() or 0
        
        total_platform_used_bytes += used_bytes
        
        limit_gb = sub.plan.storage_limit_gb if sub.plan else 0
        limit_bytes = limit_gb * 1024 * 1024 * 1024
        
        usage_percent = (used_bytes / limit_bytes * 100) if limit_bytes > 0 else 0
        
        tenant_stats.append({
            "firm_id": str(firm_id),
            "firm_name": sub.firm.name if sub.firm else "Unknown Firm",
            "plan_name": sub.plan.name if sub.plan else "Unknown Plan",
            "used_bytes": used_bytes,
            "limit_bytes": limit_bytes,
            "limit_gb": limit_gb,
            "usage_percent": round(usage_percent, 2)
        })
        
    total_platform_limit_bytes = total_platform_limit_gb * 1024 * 1024 * 1024
    platform_usage_percent = (total_platform_used_bytes / total_platform_limit_bytes * 100) if total_platform_limit_bytes > 0 else 0
        
    return {
        "global_stats": {
            "total_limit_bytes": total_platform_limit_bytes,
            "total_limit_gb": total_platform_limit_gb,
            "total_used_bytes": total_platform_used_bytes,
            "usage_percent": round(platform_usage_percent, 2)
        },
        "tenants": tenant_stats
    }
