"""Owner-scoped CRUD and idempotent import for Gestão records."""
from datetime import datetime, timezone
from uuid import uuid4

from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel, ConfigDict, Field
from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.ext.asyncio import AsyncSession

from .database import get_session
from .finance_routes import current_user
from .models import ManagementStudent, ManagementModality, ManagementLesson, ManagementPayment

router = APIRouter(prefix="/api/v1/management", tags=["management"])
RESOURCE_MODELS = {
    "students": ManagementStudent,
    "modalities": ManagementModality,
    "lessons": ManagementLesson,
    "payments": ManagementPayment,
}


class RecordCreate(BaseModel):
    model_config = ConfigDict(extra="forbid")
    data: dict[str, object] = Field(min_length=1)
    source_id: str | None = Field(default=None, max_length=120)


class RecordUpdate(BaseModel):
    model_config = ConfigDict(extra="forbid")
    data: dict[str, object] = Field(min_length=1)


class ImportRecord(BaseModel):
    model_config = ConfigDict(extra="forbid")
    source_id: str = Field(min_length=1, max_length=120)
    data: dict[str, object] = Field(min_length=1)


class ImportBatch(BaseModel):
    model_config = ConfigDict(extra="forbid")
    resource: str
    records: list[ImportRecord] = Field(min_length=1, max_length=500)


def model_for(resource: str):
    model = RESOURCE_MODELS.get(resource)
    if model is None:
        raise HTTPException(status_code=404, detail="Management resource not found")
    return model


def record_json(record) -> dict:
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
    include_archived: bool = Query(default=False),
    user_id: str = Depends(current_user),
    db: AsyncSession = Depends(get_session),
):
    model = model_for(resource)
    query = select(model).where(model.user_id == user_id)
    if not include_archived:
        query = query.where(model.is_archived.is_(False))
    result = await db.execute(query.order_by(model.created_at.desc()))
    return [record_json(record) for record in result.scalars().all()]


@router.post("/{resource}", status_code=201)
async def create_record(
    resource: str,
    body: RecordCreate,
    user_id: str = Depends(current_user),
    db: AsyncSession = Depends(get_session),
):
    model = model_for(resource)
    now = datetime.now(timezone.utc)
    record = model(
        id=str(uuid4()), user_id=user_id, source_id=body.source_id,
        data=body.data, is_archived=False, created_at=now, updated_at=now,
    )
    db.add(record)
    try:
        await db.commit()
    except IntegrityError:
        await db.rollback()
        raise HTTPException(status_code=409, detail="A record with this source ID already exists")
    await db.refresh(record)
    return record_json(record)


@router.put("/{resource}/{record_id}")
async def update_record(
    resource: str,
    record_id: str,
    body: RecordUpdate,
    user_id: str = Depends(current_user),
    db: AsyncSession = Depends(get_session),
):
    model = model_for(resource)
    record = await db.scalar(select(model).where(model.id == record_id, model.user_id == user_id))
    if record is None:
        raise HTTPException(status_code=404, detail="Management record not found")
    record.data = body.data
    record.updated_at = datetime.now(timezone.utc)
    await db.commit()
    await db.refresh(record)
    return record_json(record)


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
        raise HTTPException(status_code=404, detail="Management record not found")
    record.is_archived = True
    record.updated_at = datetime.now(timezone.utc)
    await db.commit()
    return {"archived": True, "id": record.id}


@router.post("/import-batch")
async def import_batch(
    body: ImportBatch,
    user_id: str = Depends(current_user),
    db: AsyncSession = Depends(get_session),
):
    model = model_for(body.resource)
    source_ids = [item.source_id for item in body.records]
    if len(source_ids) != len(set(source_ids)):
        raise HTTPException(status_code=422, detail="Duplicate source IDs in import batch")
    result = await db.execute(select(model).where(
        model.user_id == user_id, model.source_id.in_(source_ids)))
    existing = {record.source_id: record for record in result.scalars().all()}
    now = datetime.now(timezone.utc)
    inserted = updated = unchanged = 0
    for item in body.records:
        record = existing.get(item.source_id)
        if record is None:
            db.add(model(
                id=str(uuid4()), user_id=user_id, source_id=item.source_id,
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
        raise HTTPException(status_code=409, detail="Import conflicted with existing source IDs")
    return {"resource": body.resource, "inserted": inserted, "updated": updated, "unchanged": unchanged}


@router.get("/health")
async def management_health():
    return {"status": "ok", "domain": "management"}
