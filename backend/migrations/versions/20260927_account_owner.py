"""Add owner association to finance accounts."""
from alembic import op
import sqlalchemy as sa

revision = "20260927_account_owner"
down_revision = None
branch_labels = None
depends_on = None

def upgrade() -> None:
    op.add_column("accounts", sa.Column("owner_id", sa.String(length=36), nullable=True))
    op.create_index("ix_accounts_owner_id", "accounts", ["owner_id"])

def downgrade() -> None:
    op.drop_index("ix_accounts_owner_id", table_name="accounts")
    op.drop_column("accounts", "owner_id")
