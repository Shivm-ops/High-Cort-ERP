from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.security import get_current_superadmin
from app.models.role import Role
from app.models.user import User

router = APIRouter()

@router.get("/")
def get_roles(db: Session = Depends(get_db), current_admin: User = Depends(get_current_superadmin)):
    roles = db.query(Role).all()
    return [{"id": r.id, "name": r.name, "description": r.description, "is_system": r.is_system, "permissions": r.permissions} for r in roles]

from pydantic import BaseModel
import re

class RoleCreate(BaseModel):
    name: str
    description: str

class RoleUpdate(BaseModel):
    permissions: dict

@router.post("/")
def create_role(data: RoleCreate, db: Session = Depends(get_db), current_admin: User = Depends(get_current_superadmin)):
    if not re.match(r"^[a-zA-Z0-9 _-]+$", data.name):
        raise HTTPException(status_code=400, detail="Invalid role name format.")
    
    exists = db.query(Role).filter(Role.name == data.name).first()
    if exists:
        raise HTTPException(status_code=400, detail="Role name already exists.")

    role = Role(
        name=data.name,
        description=data.description,
        is_system=False,
        permissions={}
    )
    db.add(role)
    db.commit()
    db.refresh(role)
    return {"id": role.id, "name": role.name, "description": role.description, "is_system": role.is_system, "permissions": role.permissions}

@router.put("/{role_id}")
def update_role(role_id: str, data: RoleUpdate, db: Session = Depends(get_db), current_admin: User = Depends(get_current_superadmin)):
    role = db.query(Role).filter(Role.id == role_id).first()
    if not role:
        raise HTTPException(status_code=404, detail="Role not found.")
    
    role.permissions = data.permissions
    db.commit()
    return {"message": "Permissions updated."}
