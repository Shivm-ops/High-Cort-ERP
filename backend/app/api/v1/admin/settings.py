from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import Dict
from app.core.database import get_db
from app.core.security import get_current_superadmin
from app.models.setting import SystemSetting
from app.models.user import User

router = APIRouter()

@router.get("/")
def get_settings(db: Session = Depends(get_db), current_admin: User = Depends(get_current_superadmin)):
    settings = db.query(SystemSetting).all()
    result = {}
    for s in settings:
        result[s.key] = s.value
    return result

@router.put("/")
def update_settings(payload: Dict[str, str], db: Session = Depends(get_db), current_admin: User = Depends(get_current_superadmin)):
    for key, value in payload.items():
        setting = db.query(SystemSetting).filter(SystemSetting.key == key).first()
        if setting:
            setting.value = str(value)
    
    db.commit()
    return {"message": "Settings updated successfully"}
