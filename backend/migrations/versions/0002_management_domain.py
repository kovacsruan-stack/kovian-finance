"""Add owner-scoped tables for records integrated from KOVIAN Gestão.

The source system remains untouched. This migration creates destination tables
only; importing production data is a separate, reviewed operation.
"""
from alembic import op
from sqlalchemy import Boolean, Column, DateTime, ForeignKey, JSON, MetaData, String, Table, UniqueConstraint, inspect

revision = "0002_management_domain"
down_revision = "0001_initial_schema"
branch_labels = None
depends_on = None

TABLES = ("management_students", "management_modalities", "management_lessons", "management_payments")


def upgrade() -> None:
    bind = op.get_bind()
    existing = set(inspect(bind).get_table_names())
    for name in TABLES:
        if name in existing:
            continue
        op.create_table(
            name,
            Column("id", String(36), primary_key=True),
            Column("user_id", String(36), ForeignKey("users.id"), nullable=False, index=True),
            Column("source_id", String(120), nullable=True),
            Column("data", JSON, nullable=False),
            Column("is_archived", Boolean, nullable=False, server_default="false"),
            Column("created_at", DateTime(timezone=True), nullable=False),
            Column("updated_at", DateTime(timezone=True), nullable=False),
            UniqueConstraint("user_id", "source_id"),
        )
        op.create_index(f"ix_{name}_user_id", name, ["user_id"])


def downgrade() -> None:
    raise RuntimeError(
        "Destructive downgrade is disabled for management data. "
        "Back up and perform an explicitly reviewed rollback."
    )
