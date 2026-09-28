"""Add owner-scoped Management tables without altering existing data."""
from alembic import op
from sqlalchemy import inspect

from app.models import ManagementLesson, ManagementModality, ManagementPayment, ManagementStudent

revision = "0002_management_domain"
down_revision = "0001_initial_schema"
branch_labels = None
depends_on = None


def upgrade() -> None:
    bind = op.get_bind()
    inspector = inspect(bind)
    existing = set(inspector.get_table_names())
    for model in (ManagementStudent, ManagementModality, ManagementLesson, ManagementPayment):
        if model.__tablename__ not in existing:
            model.__table__.create(bind=bind, checkfirst=True)


def downgrade() -> None:
    raise RuntimeError(
        "Automatic destructive downgrade is disabled. Back up data and use an "
        "explicit reviewed migration if Management tables must be removed."
    )
