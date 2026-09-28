from app.models import Account, Base, Budget, FinancialGoal, GestaoPaymentImport, Transaction, User


def test_model_metadata_registers_unique_tables():
    tables = Base.metadata.tables
    assert {"users", "accounts", "transactions", "budgets", "financial_goals"} <= set(tables)
    assert len(tables) == 6
    assert "gestao_payment_imports" in tables


def test_transactions_reference_accounts():
    foreign_key = next(iter(Transaction.__table__.c.account_id.foreign_keys))
    assert foreign_key.target_fullname == "accounts.id"


def test_financial_amount_columns_use_decimal_numeric_types():
    assert str(Account.__table__.c.opening_balance.type) == "NUMERIC(14, 2)"
    assert str(Transaction.__table__.c.amount.type) == "NUMERIC(14, 2)"
    assert str(FinancialGoal.__table__.c.target_amount.type) == "NUMERIC(14, 2)"
    assert str(Budget.__table__.c.amount_limit.type) == "NUMERIC(14, 2)"



def test_gestao_import_has_database_idempotency_constraints():
    constraints = {
        constraint.name
        for constraint in GestaoPaymentImport.__table__.constraints
        if constraint.name
    }
    assert "uq_gestao_import_owner_event" in constraints
    assert "uq_gestao_import_owner_payment" in constraints
    assert "uq_gestao_import_transaction" in constraints
    assert "event_fingerprint" in GestaoPaymentImport.__table__.c
    assert GestaoPaymentImport.__table__.c.event_fingerprint.nullable is True
