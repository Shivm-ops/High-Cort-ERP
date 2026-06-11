"""
Comprehensive Tenant Isolation & Security Tests
================================================
Tests that verify Firm A cannot access Firm B's data and vice versa.
Run with: source venv/bin/activate && pytest tests/test_isolation.py -v
"""

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

import sys
import os
sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))

from main import app
from app.core.database import Base, get_db
from app.core.security import get_password_hash
from app.models.user import User, UserRole
from app.models.firm import Firm, FirmType

# In-memory SQLite for testing
SQLALCHEMY_DATABASE_URL = "sqlite:///:memory:"

engine = create_engine(
    SQLALCHEMY_DATABASE_URL,
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,
)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


def override_get_db():
    try:
        db = TestingSessionLocal()
        yield db
    finally:
        db.close()


app.dependency_overrides[get_db] = override_get_db
client = TestClient(app)


@pytest.fixture(autouse=True)
def setup_db():
    Base.metadata.create_all(bind=engine)
    yield
    Base.metadata.drop_all(bind=engine)


def _create_firm_and_user(db, firm_name: str, email: str, role: UserRole = UserRole.ADMIN):
    firm = Firm(name=firm_name, type=FirmType.PARTNERSHIP, is_active=True)
    db.add(firm)
    db.commit()
    user = User(
        email=email,
        hashed_password=get_password_hash("password123"),
        full_name=f"User of {firm_name}",
        user_type=role,
        firm_id=firm.id,
        is_active=True,
        is_verified=True,
    )
    db.add(user)
    db.commit()
    return firm, user


def get_auth_headers(user_email: str):
    response = client.post(
        "/api/v1/auth/token",
        data={"username": user_email, "password": "password123"}
    )
    assert response.status_code == 200, f"Login failed: {response.text}"
    token = response.json()["access_token"]
    return {"Authorization": f"Bearer {token}"}


# ─── Test 1: Client Isolation ────────────────────────────────────────────────

class TestClientTenantIsolation:

    def test_user_b_cannot_get_user_a_client(self):
        """User B must receive 403 when accessing User A's client by ID."""
        db = TestingSessionLocal()
        _create_firm_and_user(db, "Firm A", "a@test.com")
        _create_firm_and_user(db, "Firm B", "b@test.com")
        db.close()

        headers_a = get_auth_headers("a@test.com")
        # User A creates a client
        resp = client.post(
            "/api/v1/clients/",
            json={"name": "Client A", "type": "individual", "phone": "+911111111111"},
            headers=headers_a,
        )
        assert resp.status_code == 201, resp.text
        client_id = resp.json()["id"]

        # User B tries to access User A's client directly
        headers_b = get_auth_headers("b@test.com")
        resp_b = client.get(f"/api/v1/clients/{client_id}", headers=headers_b)
        assert resp_b.status_code in [403, 404], (
            f"SECURITY FAILURE: User B accessed User A's client! Status: {resp_b.status_code}"
        )

    def test_user_b_search_cannot_see_user_a_clients(self):
        """User B's client list should return empty when A has clients."""
        db = TestingSessionLocal()
        _create_firm_and_user(db, "Firm A", "a@search.com")
        _create_firm_and_user(db, "Firm B", "b@search.com")
        db.close()

        headers_a = get_auth_headers("a@search.com")
        client.post(
            "/api/v1/clients/",
            json={"name": "Confidential Client", "type": "individual", "phone": "+911111111111"},
            headers=headers_a,
        )

        headers_b = get_auth_headers("b@search.com")
        resp_list = client.get("/api/v1/clients/?search=Confidential", headers=headers_b)
        assert resp_list.status_code == 200
        data = resp_list.json()
        # Use either 'clients' or 'items' key
        items = data.get("clients", data.get("items", []))
        assert len(items) == 0, (
            f"SECURITY FAILURE: User B can see User A's client in search! Found: {items}"
        )

    def test_user_b_cannot_update_user_a_client(self):
        """User B must receive 403 when updating User A's client."""
        db = TestingSessionLocal()
        _create_firm_and_user(db, "Firm A", "a@update.com")
        _create_firm_and_user(db, "Firm B", "b@update.com")
        db.close()

        headers_a = get_auth_headers("a@update.com")
        resp = client.post(
            "/api/v1/clients/",
            json={"name": "Target Client", "type": "individual", "phone": "+911111111111"},
            headers=headers_a,
        )
        assert resp.status_code == 201
        client_id = resp.json()["id"]

        headers_b = get_auth_headers("b@update.com")
        resp_b = client.put(
            f"/api/v1/clients/{client_id}",
            json={"name": "Hacked Client Name"},
            headers=headers_b,
        )
        assert resp_b.status_code in [403, 404], (
            f"SECURITY FAILURE: User B modified User A's client! Status: {resp_b.status_code}"
        )


# ─── Test 2: Case Isolation ───────────────────────────────────────────────────

class TestCaseTenantIsolation:

    def test_user_b_cannot_access_user_a_case(self):
        """User B must NOT be able to GET a case that belongs to Firm A."""
        db = TestingSessionLocal()
        _create_firm_and_user(db, "Law Firm A", "caseA@test.com")
        _create_firm_and_user(db, "Law Firm B", "caseB@test.com")
        db.close()

        headers_a = get_auth_headers("caseA@test.com")
        # Create client for A
        client_resp = client.post(
            "/api/v1/clients/",
            json={"name": "Client A", "type": "individual", "phone": "+912222222222"},
            headers=headers_a,
        )
        assert client_resp.status_code == 201
        client_id = client_resp.json()["id"]

        # Create case for A
        case_resp = client.post(
            "/api/v1/cases/",
            json={
                "case_no": "CASE/001/2025",
                "title": "Secret Case A",
                "court": "High Court",
                "client_id": client_id,
                "practice_area": "Criminal"
            },
            headers=headers_a,
        )
        assert case_resp.status_code == 201, case_resp.text
        case_id = case_resp.json()["id"]

        # User B tries to access
        headers_b = get_auth_headers("caseB@test.com")
        resp_b = client.get(f"/api/v1/cases/{case_id}", headers=headers_b)
        assert resp_b.status_code in [403, 404], (
            f"SECURITY FAILURE: User B accessed Firm A's case! Status: {resp_b.status_code}"
        )

    def test_user_b_cannot_use_user_a_client_for_case(self):
        """User B should get 404 when trying to create a case using Firm A's client."""
        db = TestingSessionLocal()
        _create_firm_and_user(db, "Firm A", "firmA@case.com")
        _create_firm_and_user(db, "Firm B", "firmB@case.com")
        db.close()

        headers_a = get_auth_headers("firmA@case.com")
        client_resp = client.post(
            "/api/v1/clients/",
            json={"name": "Client A", "type": "individual", "phone": "+913333333333"},
            headers=headers_a,
        )
        assert client_resp.status_code == 201
        client_id = client_resp.json()["id"]

        # User B tries to create a case using Firm A's client ID
        headers_b = get_auth_headers("firmB@case.com")
        case_resp = client.post(
            "/api/v1/cases/",
            json={
                "case_no": "CASE/002/2025",
                "title": "Cross-Tenant Attack",
                "court": "Supreme Court",
                "client_id": client_id,
                "practice_area": "Civil"
            },
            headers=headers_b,
        )
        assert case_resp.status_code in [404, 403], (
            f"SECURITY FAILURE: User B created a case linked to Firm A's client! Status: {case_resp.status_code}"
        )


# ─── Test 3: Three-Firm Isolation (A→B→C) ────────────────────────────────────

class TestThreeFirmIsolation:

    def test_three_firms_completely_isolated(self):
        """Firm A, B, C should all be isolated from each other."""
        db = TestingSessionLocal()
        _create_firm_and_user(db, "Firm Alpha", "alpha@test.com")
        _create_firm_and_user(db, "Firm Beta", "beta@test.com")
        _create_firm_and_user(db, "Firm Gamma", "gamma@test.com")
        db.close()

        ha = get_auth_headers("alpha@test.com")
        hb = get_auth_headers("beta@test.com")
        hc = get_auth_headers("gamma@test.com")

        # Each firm creates a client
        def create_client(headers, name, phone):
            r = client.post(
                "/api/v1/clients/",
                json={"name": name, "type": "individual", "phone": phone},
                headers=headers,
            )
            assert r.status_code == 201
            return r.json()["id"]

        cid_a = create_client(ha, "Alpha Client", "+914444444444")
        cid_b = create_client(hb, "Beta Client", "+915555555555")
        cid_c = create_client(hc, "Gamma Client", "+916666666666")

        # Verify cross-access is blocked in all directions
        for actor_headers, actor_name, target_id, target_firm in [
            (ha, "Alpha", cid_b, "Beta"),
            (ha, "Alpha", cid_c, "Gamma"),
            (hb, "Beta", cid_a, "Alpha"),
            (hb, "Beta", cid_c, "Gamma"),
            (hc, "Gamma", cid_a, "Alpha"),
            (hc, "Gamma", cid_b, "Beta"),
        ]:
            resp = client.get(f"/api/v1/clients/{target_id}", headers=actor_headers)
            assert resp.status_code in [403, 404], (
                f"SECURITY FAILURE: {actor_name} accessed {target_firm}'s client! "
                f"Status: {resp.status_code}"
            )
