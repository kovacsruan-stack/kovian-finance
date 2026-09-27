"""Create the initial application schema from SQLAlchemy metadata.

This bootstrap migration is safe to re-run against an existing database: create_all
only creates missing tables. It intentionally does not drop application tables on
downgrade, because that could destroy user data.
"""
from alembic import op

from app.models import Base

revision = "0001_initial_schema"
down_revision = None
branch_labels = None
depends_on = None


def upgrade() -> None:
    Base.metadata.create_all(bind=op.get_bind(), checkfirst=True)


def downgrade() -> None:
    raise RuntimeError(
        "Automatic destructive downgrade is disabled. Back up data and perform "
        "an explicit, reviewed migration if a schema rollback is required."
    )
