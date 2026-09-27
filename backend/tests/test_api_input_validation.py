import pytest
from pydantic import ValidationError

from app.accounts_api import AccountCreate
from app.transactions_api import TransactionCreate


def test_account_name_is_trimmed():
    item = AccountCreate(name="  Conta principal  ", account_type=" checking ")
    assert item.name == "Conta principal"
    assert item.account_type == "checking"


@pytest.mark.parametrize("name", ["", "   "])
def test_account_rejects_blank_normalized_name(name):
    with pytest.raises(ValidationError):
        AccountCreate(name=name, account_type="checking")


def test_transaction_text_fields_are_trimmed():
    item = TransactionCreate(
        account_id="account-1",
        description="  Mensalidade  ",
        amount="100.00",
        entry_type="income",
        category="  Serviço  ",
    )
    assert item.description == "Mensalidade"
    assert item.category == "Serviço"


@pytest.mark.parametrize("field", ["description", "category"])
def test_transaction_rejects_blank_normalized_text(field):
    data = {
        "account_id": "account-1",
        "description": "Pagamento",
        "amount": "100.00",
        "entry_type": "expense",
        "category": "Outros",
    }
    data[field] = "   "
    with pytest.raises(ValidationError):
        TransactionCreate(**data)
