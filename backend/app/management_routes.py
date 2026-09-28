"""Owner-scoped CRUD and idempotent import for the integrated Management module."""
from datetime import datetime, timezone
from uuid import uuid4

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, ConfigDict, Field
from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.ext.asyncio import AsyncSession

from .database import get_session
from .finance_routes import current_user
from .models import ManagementExpense, ManagementLesson, ManagementModality, ManagementPayment, ManagementStudent, ManagementWaitlist

router = APIRouter(prefix="/api/v1/management", tags=["management"])
MODELS = {
    "students": ManagementStudent,
    "modalities": ManagementModality,
    "lessons": ManagementLesson,
    "payments": ManagementPayment,
    "expenses": ManagementExpense,
    "waitlist": ManagementWaitlist,
}


def model_for(resource: str):
    model = MODELS.get(resource)
    if model is None:
        raise HTTPException(status_code=404, detail="Unknown management resource")
    return model


class RecordInput(BaseModel):
    model_config = ConfigDict(extra="forbid")
    data: dict = Field(default_factory=dict)
    sourceId: str | None = Field(default=None, max_length=160)


class ImportRecord(BaseModel):
    model_config = ConfigDict(extra="forbid")
    sourceId: str = Field(min_length=1, max_length=160)
    data: dict = Field(default_factory=dict)


class ImportBatch(BaseModel):
    model_config = ConfigDict(extra="forbid")
    records: list[ImportRecord] = Field(max_length=2000)


def serialize(record):
    return {
        "id": record.id,
        "sourceId": record.source_id,
        "data": record.data,
        "archived": record.is_archived,
        "createdAt": record.created_at,
        "updatedAt": record.updated_at,
    }


@router.get("/{resource}")
async def list_records(
    resource: str,
    includeArchived: bool = False,
    user_id: str = Depends(current_user),
    db: AsyncSession = Depends(get_session),
):
    model = model_for(resource)
    query = select(model).where(model.user_id == user_id)
    if not includeArchived:
        query = query.where(model.is_archived.is_(False))
    result = await db.execute(query.order_by(model.created_at.desc()))
    return [serialize(item) for item in result.scalars().all()]


@router.post("/{resource}", status_code=201)
async def create_record(
    resource: str,
    body: RecordInput,
    user_id: str = Depends(current_user),
    db: AsyncSession = Depends(get_session),
):
    model = model_for(resource)
    now = datetime.now(timezone.utc)
    record = model(
        id=str(uuid4()), user_id=user_id, source_id=body.sourceId,
        data=body.data, is_archived=False, created_at=now, updated_at=now,
    )
    db.add(record)
    try:
        await db.commit()
    except IntegrityError:
        await db.rollback()
        raise HTTPException(status_code=409, detail="A record with this sourceId already exists")
    await db.refresh(record)
    return serialize(record)


@router.put("/{resource}/{record_id}")
async def update_record(
    resource: str,
    record_id: str,
    body: RecordInput,
    user_id: str = Depends(current_user),
    db: AsyncSession = Depends(get_session),
):
    model = model_for(resource)
    record = await db.scalar(select(model).where(model.id == record_id, model.user_id == user_id))
    if record is None:
        raise HTTPException(status_code=404, detail="Record not found")
    record.data = body.data
    if body.sourceId is not None:
        record.source_id = body.sourceId
    record.updated_at = datetime.now(timezone.utc)
    try:
        await db.commit()
    except IntegrityError:
        await db.rollback()
        raise HTTPException(status_code=409, detail="A record with this sourceId already exists")
    await db.refresh(record)
    return serialize(record)


@router.delete("/{resource}/{record_id}")
async def archive_record(
    resource: str,
    record_id: str,
    user_id: str = Depends(current_user),
    db: AsyncSession = Depends(get_session),
):
    model = model_for(resource)
    record = await db.scalar(select(model).where(model.id == record_id, model.user_id == user_id))
    if record is None:
        raise HTTPException(status_code=404, detail="Record not found")
    record.is_archived = True
    record.updated_at = datetime.now(timezone.utc)
    await db.commit()
    return {"archived": True, "id": record.id}


@router.post("/import-batch/{resource}")
async def import_batch(
    resource: str,
    body: ImportBatch,
    user_id: str = Depends(current_user),
    db: AsyncSession = Depends(get_session),
):
    model = model_for(resource)
    inserted = updated = unchanged = 0
    now = datetime.now(timezone.utc)
    for item in body.records:
        record = await db.scalar(select(model).where(
            model.user_id == user_id, model.source_id == item.sourceId
        ))
        if record is None:
            db.add(model(
                id=str(uuid4()), user_id=user_id, source_id=item.sourceId,
                data=item.data, is_archived=False, created_at=now, updated_at=now,
            ))
            inserted += 1
        elif record.data != item.data:
            record.data = item.data
            record.updated_at = now
            updated += 1
        else:
            unchanged += 1
    try:
        await db.commit()
    except IntegrityError:
        await db.rollback()
        raise HTTPException(status_code=409, detail="Import conflict; no changes were committed")
    return {
        "resource": resource, "inserted": inserted, "updated": updated,
        "unchanged": unchanged, "unresolvedStudentLinks": 0,
    }
