from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.orm import Session
from typing import Dict
from app.core.database import get_db
from app.core.security import get_current_superadmin
from app.models.setting import SystemSetting
from app.models.user import User
from app.api.v1.admin.audit import log_admin_action

router = APIRouter()

_SECRET_KEY_TOKENS = ("secret", "password", "token", "api_key", "private_key")


def _is_secret_key(key: str) -> bool:
    low = (key or "").lower()
    return any(tok in low for tok in _SECRET_KEY_TOKENS)


def _mask_secret_value(val: str) -> str:
    if not val:
        return ""
    if len(val) > 4:
        return "********" + val[-4:]
    return "********"


@router.get("/")
def get_settings(db: Session = Depends(get_db), current_admin: User = Depends(get_current_superadmin)):
    settings = db.query(SystemSetting).all()
    result = {}
    for s in settings:
        raw_val = s.value or ""
        result[s.key] = _mask_secret_value(raw_val) if _is_secret_key(s.key) else raw_val
    return result


@router.put("/")
def update_settings(
    payload: Dict[str, str],
    request: Request,
    db: Session = Depends(get_db),
    current_admin: User = Depends(get_current_superadmin),
):
    updated_keys = []
    for key, value in payload.items():
        val_str = str(value)
        if _is_secret_key(key) and val_str.startswith("********"):
            continue
        setting = db.query(SystemSetting).filter(SystemSetting.key == key).first()
        if setting:
            setting.value = val_str
        else:
            setting = SystemSetting(key=key, value=val_str)
            db.add(setting)
        updated_keys.append(key)

    db.commit()
    if updated_keys:
        log_admin_action(
            db=db,
            admin_id=current_admin.id,
            action="UPDATE_SYSTEM_SETTINGS",
            resource_type="SETTING",
            resource_id="system",
            details=f"Updated keys: {', '.join(sorted(updated_keys))}",
            request=request,
        )
    return {"message": "Settings updated successfully"}
