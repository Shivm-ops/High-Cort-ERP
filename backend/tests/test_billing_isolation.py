import pytest
from fastapi.testclient import TestClient
import uuid
from datetime import date

import sys
import os
sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))

from main import app
from app.core.database import get_db
from app.models.user import User
from app.models.firm import Firm
from app.models.client import Client
from app.models.invoice import Invoice
from app.models.security import UserSession

client = TestClient(app)

@pytest.fixture(scope="module")
def billing_test_db():
    from sqlalchemy import create_engine
    from sqlalchemy.orm import sessionmaker
    from app.core.database import Base

    engine = create_engine("sqlite:///:memory:", connect_args={"check_same_thread": False})
    Base.metadata.create_all(bind=engine)
    TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
    return TestingSessionLocal()

@pytest.fixture(scope="module")
def override_get_db(billing_test_db):
    def _override_get_db():
        try:
            yield billing_test_db
        finally:
            pass
    app.dependency_overrides[get_db] = _override_get_db
    yield
    app.dependency_overrides.clear()

@pytest.fixture(scope="module")
def billing_data(billing_test_db):
    firm_a = Firm(id=uuid.uuid4(), name="Firm A")
    firm_b = Firm(id=uuid.uuid4(), name="Firm B")
    billing_test_db.add_all([firm_a, firm_b])
    
    user_a = User(id=uuid.uuid4(), email="usera@billing.com", hashed_password="pw", full_name="User A", firm_id=firm_a.id, role="senior_advocate", is_active=True)
    user_b = User(id=uuid.uuid4(), email="userb@billing.com", hashed_password="pw", full_name="User B", firm_id=firm_b.id, role="senior_advocate", is_active=True)
    billing_test_db.add_all([user_a, user_b])
    
    client_a = Client(id=uuid.uuid4(), name="Client A", firm_id=firm_a.id, created_by_id=user_a.id, updated_by_id=user_a.id)
    client_b = Client(id=uuid.uuid4(), name="Client B", firm_id=firm_b.id, created_by_id=user_b.id, updated_by_id=user_b.id)
    billing_test_db.add_all([client_a, client_b])
    
    invoice_a = Invoice(id=uuid.uuid4(), invoice_no="INV-A", client_id=client_a.id, created_by_id=user_a.id, total=100.0)
    invoice_b = Invoice(id=uuid.uuid4(), invoice_no="INV-B", client_id=client_b.id, created_by_id=user_b.id, total=200.0)
    billing_test_db.add_all([invoice_a, invoice_b])
    
    billing_test_db.commit()
    
    return {
        "user_a": user_a, "user_b": user_b,
        "client_a": client_a, "client_b": client_b,
        "invoice_a": invoice_a, "invoice_b": invoice_b
    }

def get_token_for(user):
    from app.core.security import create_access_token
    return create_access_token({"sub": str(user.id), "role": user.role})


def test_billing_stats_isolation(override_get_db, billing_data):
    token_a = get_token_for(billing_data["user_a"])
    response = client.get("/api/v1/billing/stats/summary", headers={"Authorization": f"Bearer {token_a}"})
    assert response.status_code == 200
    data = response.json()
    assert data["total_billed"] == 100.0  # Only sees Invoice A
    
    token_b = get_token_for(billing_data["user_b"])
    response = client.get("/api/v1/billing/stats/summary", headers={"Authorization": f"Bearer {token_b}"})
    assert response.status_code == 200
    data = response.json()
    assert data["total_billed"] == 200.0  # Only sees Invoice B


def test_invoice_list_isolation(override_get_db, billing_data):
    token_a = get_token_for(billing_data["user_a"])
    response = client.get("/api/v1/billing/", headers={"Authorization": f"Bearer {token_a}"})
    assert response.status_code == 200
    invoices = response.json()["invoices"]
    assert len(invoices) == 1
    assert invoices[0]["id"] == str(billing_data["invoice_a"].id)


def test_cannot_access_other_firm_invoice(override_get_db, billing_data):
    token_a = get_token_for(billing_data["user_a"])
    invoice_b_id = str(billing_data["invoice_b"].id)
    
    response = client.get(f"/api/v1/billing/{invoice_b_id}", headers={"Authorization": f"Bearer {token_a}"})
    assert response.status_code in [403, 404]


def test_cannot_create_invoice_for_other_firm_client(override_get_db, billing_data):
    token_a = get_token_for(billing_data["user_a"])
    client_b_id = str(billing_data["client_b"].id)
    
    response = client.post("/api/v1/billing/", headers={"Authorization": f"Bearer {token_a}"}, json={
        "client_id": client_b_id,
        "items": [{"description": "Service", "rate": 500, "amount": 500}]
    })
    assert response.status_code == 404  # Not found due to firm filter


def test_cannot_record_payment_for_other_firm_invoice(override_get_db, billing_data):
    token_a = get_token_for(billing_data["user_a"])
    invoice_b_id = str(billing_data["invoice_b"].id)
    
    response = client.post(f"/api/v1/billing/{invoice_b_id}/record-payment", headers={"Authorization": f"Bearer {token_a}"}, json={
        "amount": 100,
        "payment_method": "cash"
    })
    assert response.status_code in [403, 404]
