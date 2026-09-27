"""Create the initial schema without silently orphaning legacy records.

Existing tables that gained ownership columns must be migrated explicitly so
records can be assigned to the correct user. This migration refuses to guess.
"""
from alembic import op
from sqlalchemy import inspect

from app.models import Base

revision = "0001_initial_schema"
down_revision = None
branch_labels = None
depends_on = None

OWNED_TABLES = ("accounts", "transactions", "budgets", "financial_goals", "students", "group_sessions")


def upgrade() -> None:
    bind = op.get_bind()
    inspector = inspect(bind)
    existing_tables = set(inspector.get_table_names())
    for table_name in OWNED_TABLES:
        if table_name in existing_tables:
            columns = {column["name"] for column in inspector.get_columns(table_name)}
            if "user_id" not in columns:
                raise RuntimeError(
                    f"Table '{table_name}' already exists without user_id. "
                    "Create a reviewed data migration that assigns each legacy row "
                    "to its rightful owner before enabling this schema."
                )
    Base.metadata.create_all(bind=bind, checkfirst=True)


def downgrade() -> None:
    raise RuntimeError(
        "Automatic destructive downgrade is disabled. Back up data and perform "
        "an explicit, reviewed migration if a schema rollback is required."
    )
