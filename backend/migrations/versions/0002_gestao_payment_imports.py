"""Persist idempotency keys for imported Gestão payments."""

from alembic import op
import sqlalchemy as sa

revision = "0002_gestao_payment_imports"
down_revision = "0001_initial_schema"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "gestao_payment_imports",
        sa.Column("id", sa.String(length=36), nullable=False),
        sa.Column("user_id", sa.String(length=36), nullable=False),
        sa.Column("event_id", sa.String(length=36), nullable=False),
        sa.Column("payment_ref", sa.String(length=128), nullable=False),
        sa.Column("student_ref", sa.String(length=128), nullable=False),
        sa.Column("transaction_id", sa.String(length=36), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"]),
        sa.ForeignKeyConstraint(["transaction_id"], ["transactions.id"]),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("user_id", "event_id", name="uq_gestao_import_user_event"),
        sa.UniqueConstraint("user_id", "payment_ref", name="uq_gestao_import_user_payment"),
        sa.UniqueConstraint("transaction_id", name="uq_gestao_import_transaction"),
    )
    op.create_index(
        "ix_gestao_payment_imports_user_id",
        "gestao_payment_imports",
        ["user_id"],
        unique=False,
    )


def downgrade() -> None:
    op.drop_index("ix_gestao_payment_imports_user_id", table_name="gestao_payment_imports")
    op.drop_table("gestao_payment_imports")
