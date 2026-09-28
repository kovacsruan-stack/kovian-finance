from sqlalchemy import UniqueConstraint

from app.models import (
    Account,
    Base,
    Budget,
    FinancialGoal,
    ManagementExpense,
    ManagementLesson,
    ManagementModality,
    ManagementPayment,
    ManagementStudent,
    ManagementWaitlist,
    Transaction,
)


def test_model_metadata_registers_unique_tables():
    tables = Base.metadata.tables
    assert {"users", "accounts", "transactions", "budgets", "financial_goals"} <= set(tables)
    assert {
        "management_students",
        "management_modalities",
        "management_lessons",
        "management_payments",
        "management_expenses",
        "management_waitlist",
    } <= set(tables)


def test_transactions_reference_accounts():
    foreign_key = next(iter(Transaction.__table__.c.account_id.foreign_keys))
    assert foreign_key.target_fullname == "accounts.id"


def test_financial_amount_columns_use_decimal_numeric_types():
    assert str(Account.__table__.c.opening_balance.type) == "NUMERIC(14, 2)"
    assert str(Transaction.__table__.c.amount.type) == "NUMERIC(14, 2)"
    assert str(FinancialGoal.__table__.c.target_amount.type) == "NUMERIC(14, 2)"
    assert str(Budget.__table__.c.amount_limit.type) == "NUMERIC(14, 2)"


def test_management_records_are_owner_scoped_and_keep_source_identity():
    for model in (ManagementStudent, ManagementModality, ManagementLesson, ManagementPayment, ManagementExpense, ManagementWaitlist):
        assert model.__table__.c.user_id.foreign_keys
        assert model.__table__.c.source_id is not None
        assert model.__table__.c.data is not None
        assert model.__table__.c.is_archived is not None
        assert any(
            isinstance(constraint, UniqueConstraint)
            for constraint in model.__table__.constraints
        )
