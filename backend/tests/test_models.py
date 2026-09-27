from app.models import Account, Base, Budget, FinancialGoal, Transaction, User


def test_model_metadata_registers_unique_tables():
    tables = Base.metadata.tables
    assert {"users", "accounts", "transactions", "budgets", "financial_goals"} <= set(tables)
    assert len(tables) == 5


def test_transactions_reference_accounts():
    foreign_key = next(iter(Transaction.__table__.c.account_id.foreign_keys))
    assert foreign_key.target_fullname == "accounts.id"


def test_financial_amount_columns_use_decimal_numeric_types():
    assert str(Account.__table__.c.opening_balance.type) == "NUMERIC(14, 2)"
    assert str(Transaction.__table__.c.amount.type) == "NUMERIC(14, 2)"
    assert str(FinancialGoal.__table__.c.target_amount.type) == "NUMERIC(14, 2)"
    assert str(Budget.__table__.c.amount_limit.type) == "NUMERIC(14, 2)"
