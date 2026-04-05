from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.deps import get_current_user
from app.models.checklist_template import ChecklistTemplate, TemplateStep
from app.models.user import User
from app.schemas.checklist import TemplateCreate, TemplateUpdate, TemplateResponse

router = APIRouter(prefix="/templates", tags=["templates"])


@router.get("/", response_model=List[TemplateResponse])
def list_templates(
    client_id: Optional[int] = Query(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    q = db.query(ChecklistTemplate)
    if client_id is not None:
        q = q.filter(ChecklistTemplate.client_id == client_id)
    return q.order_by(ChecklistTemplate.name).all()


@router.get("/{template_id}", response_model=TemplateResponse)
def get_template(
    template_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    t = db.query(ChecklistTemplate).filter(ChecklistTemplate.id == template_id).first()
    if not t:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Template not found")
    return t


@router.post("/", response_model=TemplateResponse, status_code=status.HTTP_201_CREATED)
def create_template(
    body: TemplateCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    template = ChecklistTemplate(
        client_id=body.client_id,
        name=body.name,
        description=body.description,
        created_by=body.created_by or current_user.full_name or current_user.email,
    )
    db.add(template)
    db.flush()

    for i, step in enumerate(body.steps):
        db.add(TemplateStep(
            template_id=template.id,
            order=step.order if step.order is not None else i,
            title=step.title,
            description=step.description,
            required=step.required,
        ))

    db.commit()
    db.refresh(template)
    return template


@router.put("/{template_id}", response_model=TemplateResponse)
def update_template(
    template_id: int,
    body: TemplateUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    template = db.query(ChecklistTemplate).filter(ChecklistTemplate.id == template_id).first()
    if not template:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Template not found")

    if body.name is not None:
        template.name = body.name
    if body.description is not None:
        template.description = body.description

    # Full replacement of steps when provided
    if body.steps is not None:
        for s in template.steps:
            db.delete(s)
        db.flush()
        for i, step in enumerate(body.steps):
            db.add(TemplateStep(
                template_id=template.id,
                order=step.order if step.order is not None else i,
                title=step.title,
                description=step.description,
                required=step.required,
            ))

    db.commit()
    db.refresh(template)
    return template


@router.delete("/{template_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_template(
    template_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    template = db.query(ChecklistTemplate).filter(ChecklistTemplate.id == template_id).first()
    if not template:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Template not found")
    db.delete(template)
    db.commit()
