"""Persist complete-event fingerprints for Gestão payment replay integrity."""

from alembic import op
import sqlalchemy as sa

revision = "0003_gestao_event_fingerprint"
down_revision = "0002_gestao_payment_imports"
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Nullable supports safe upgrades if imports already exist; legacy rows with
    # no fingerprint fail closed on replay rather than accepting changed payloads.
    op.add_column(
        "gestao_payment_imports",
        sa.Column("event_fingerprint", sa.String(length=64), nullable=True),
    )


def downgrade() -> None:
    op.drop_column("gestao_payment_imports", "event_fingerprint")
