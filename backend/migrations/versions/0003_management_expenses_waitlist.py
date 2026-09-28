"""Add expense and waitlist Management tables."""
from alembic import op
from sqlalchemy import inspect

from app.models import ManagementExpense, ManagementWaitlist

revision = "0003_management_expenses_waitlist"
down_revision = "0002_management_domain"
branch_labels = None
depends_on = None


def upgrade() -> None:
    bind = op.get_bind()
    inspector = inspect(bind)
    existing = set(inspector.get_table_names())
    for model in (ManagementExpense, ManagementWaitlist):
        if model.__tablename__ not in existing:
            model.__table__.create(bind=bind, checkfirst=True)


def downgrade() -> None:
    raise RuntimeError(
        "Automatic destructive downgrade is disabled. Back up data and use an "
        "explicit reviewed migration if Management tables must be removed."
    )
