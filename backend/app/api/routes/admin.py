"""Admin-only routes: user management and client access control."""
from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, EmailStr
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.deps import get_current_active_superuser
from app.core.security import get_password_hash
from app.models.client import Client
from app.models.user import User
from app.models.user_client_access import UserClientAccess
from app.schemas.user import UserResponse

router = APIRouter(prefix="/admin", tags=["admin"])


class AdminUserCreate(BaseModel):
    email: EmailStr
    full_name: str
    password: str
    is_superuser: bool = False


class AdminUserUpdate(BaseModel):
    full_name: Optional[str] = None
    is_active: Optional[bool] = None
    is_superuser: Optional[bool] = None
    password: Optional[str] = None


class UserWithAccess(UserResponse):
    client_ids: List[int] = []


class SetClientAccessRequest(BaseModel):
    client_ids: List[int]


@router.get("/users", response_model=List[UserWithAccess])
def list_users(
    db: Session = Depends(get_db),
    _: User = Depends(get_current_active_superuser),
):
    users = db.query(User).order_by(User.full_name).all()
    result = []
    for u in users:
        access = db.query(UserClientAccess.client_id).filter(UserClientAccess.user_id == u.id).all()
        client_ids = [r.client_id for r in access]
        result.append(UserWithAccess(
            id=u.id,
            email=u.email,
            full_name=u.full_name,
            avatar_url=u.avatar_url,
            is_active=u.is_active,
            is_superuser=u.is_superuser,
            created_at=u.created_at,
            updated_at=u.updated_at,
            client_ids=client_ids,
        ))
    return result


@router.post("/users", response_model=UserWithAccess, status_code=status.HTTP_201_CREATED)
def create_user(
    body: AdminUserCreate,
    db: Session = Depends(get_db),
    _: User = Depends(get_current_active_superuser),
):
    existing = db.query(User).filter(User.email == body.email).first()
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")
    user = User(
        email=body.email,
        full_name=body.full_name,
        hashed_password=get_password_hash(body.password),
        is_active=True,
        is_superuser=body.is_superuser,
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return UserWithAccess(**UserResponse.model_validate(user).model_dump(), client_ids=[])


@router.patch("/users/{user_id}", response_model=UserWithAccess)
def update_user(
    user_id: int,
    body: AdminUserUpdate,
    db: Session = Depends(get_db),
    current_admin: User = Depends(get_current_active_superuser),
):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    if body.full_name is not None:
        user.full_name = body.full_name
    if body.is_active is not None:
        user.is_active = body.is_active
    if body.is_superuser is not None:
        user.is_superuser = body.is_superuser
    if body.password is not None:
        user.hashed_password = get_password_hash(body.password)
    db.commit()
    db.refresh(user)
    access = db.query(UserClientAccess.client_id).filter(UserClientAccess.user_id == user.id).all()
    return UserWithAccess(**UserResponse.model_validate(user).model_dump(), client_ids=[r.client_id for r in access])


@router.delete("/users/{user_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_user(
    user_id: int,
    db: Session = Depends(get_db),
    current_admin: User = Depends(get_current_active_superuser),
):
    if user_id == current_admin.id:
        raise HTTPException(status_code=400, detail="Cannot delete yourself")
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    db.delete(user)
    db.commit()


@router.put("/users/{user_id}/client-access", response_model=UserWithAccess)
def set_client_access(
    user_id: int,
    body: SetClientAccessRequest,
    db: Session = Depends(get_db),
    _: User = Depends(get_current_active_superuser),
):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    # Validate all client IDs exist
    if body.client_ids:
        found = db.query(Client.id).filter(Client.id.in_(body.client_ids)).all()
        if len(found) != len(set(body.client_ids)):
            raise HTTPException(status_code=400, detail="One or more client IDs not found")

    # Replace existing access
    db.query(UserClientAccess).filter(UserClientAccess.user_id == user_id).delete()
    for cid in set(body.client_ids):
        db.add(UserClientAccess(user_id=user_id, client_id=cid))
    db.commit()

    return UserWithAccess(**UserResponse.model_validate(user).model_dump(), client_ids=list(set(body.client_ids)))
