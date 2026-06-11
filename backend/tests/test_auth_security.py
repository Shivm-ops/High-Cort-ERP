import pytest
from fastapi.testclient import TestClient
from datetime import datetime, timedelta
import uuid

import sys
import os
sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))

from main import app
from app.core.database import get_db
from app.core.security import get_password_hash
from app.models.user import User
from app.models.security import UserSession

client = TestClient(app)

@pytest.fixture(scope="module")
def auth_test_db():
    from sqlalchemy import create_engine
    from sqlalchemy.orm import sessionmaker
    from app.core.database import Base

    engine = create_engine("sqlite:///:memory:", connect_args={"check_same_thread": False})
    Base.metadata.create_all(bind=engine)
    TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
    return TestingSessionLocal()


@pytest.fixture(scope="module")
def override_get_db(auth_test_db):
    def _override_get_db():
        try:
            yield auth_test_db
        finally:
            pass
    app.dependency_overrides[get_db] = _override_get_db
    yield
    app.dependency_overrides.clear()


@pytest.fixture(scope="module")
def seed_user(auth_test_db):
    user = User(
        email="test_auth@lagalos.in",
        hashed_password=get_password_hash("LegalOS@2025"),
        full_name="Test Auth User",
        is_active=True,
        failed_login_attempts=0,
    )
    auth_test_db.add(user)
    auth_test_db.commit()
    auth_test_db.refresh(user)
    return user


def test_password_strength_on_register(override_get_db):
    response = client.post("/api/v1/auth/register", json={
        "email": "new_user@lagalos.in",
        "password": "weak", # Too short, no upper, no number, no special
        "full_name": "New User",
        "phone": "1234567890"
    })
    assert response.status_code == 422
    
    response = client.post("/api/v1/auth/register", json={
        "email": "new_user@lagalos.in",
        "password": "StrongPassword123!", # Valid
        "full_name": "New User",
        "phone": "1234567890"
    })
    assert response.status_code == 201


def test_login_rate_limiting_and_lockout(override_get_db, seed_user, auth_test_db):
    # 4 failed attempts should increment counter but not lock
    for _ in range(4):
        response = client.post("/api/v1/auth/token", data={
            "username": seed_user.email,
            "password": "WrongPassword"
        })
        assert response.status_code == 401
    
    auth_test_db.refresh(seed_user)
    assert seed_user.failed_login_attempts == 4
    assert seed_user.locked_until is None

    # 5th failed attempt should lock the account
    response = client.post("/api/v1/auth/token", data={
        "username": seed_user.email,
        "password": "WrongPassword"
    })
    assert response.status_code == 401
    
    auth_test_db.refresh(seed_user)
    assert seed_user.locked_until is not None
    assert seed_user.locked_until > datetime.utcnow()

    # Even with correct password, account should be locked
    response = client.post("/api/v1/auth/token", data={
        "username": seed_user.email,
        "password": "LegalOS@2025"
    })
    assert response.status_code == 423
    assert "locked" in response.json()["detail"].lower()

    # Manually unlock the account to test success
    seed_user.locked_until = None
    seed_user.failed_login_attempts = 0
    auth_test_db.commit()

    response = client.post("/api/v1/auth/token", data={
        "username": seed_user.email,
        "password": "LegalOS@2025"
    })
    assert response.status_code == 200
    assert "access_token" in response.json()


def test_logout_invalidates_session(override_get_db, seed_user, auth_test_db):
    response = client.post("/api/v1/auth/token", data={
        "username": seed_user.email,
        "password": "LegalOS@2025"
    })
    assert response.status_code == 200
    access_token = response.json()["access_token"]
    
    # Session should be active
    active_sessions = auth_test_db.query(UserSession).filter(UserSession.user_id == seed_user.id, UserSession.is_active == True).count()
    assert active_sessions > 0
    
    # Logout
    response = client.post("/api/v1/auth/logout", headers={"Authorization": f"Bearer {access_token}"})
    assert response.status_code == 200
    
    # Session should be invalidated
    session = auth_test_db.query(UserSession).filter(UserSession.user_id == seed_user.id, UserSession.is_active == False).first()
    assert session is not None
