"""
test_citizen_auth.py
====================
Test suite for dedicated Citizen Login, Registration, and Portal Access Control.
"""

import sys
import os
import uuid
import asyncio
import unittest
from unittest.mock import patch, AsyncMock, MagicMock

sys.path.insert(0, os.path.abspath("backend"))

from app.api.v1.auth import (
    CitizenRegisterRequest,
    CitizenLoginRequest,
    citizen_register,
    citizen_login,
)
from app.api.v1.citizen_help import (
    get_user_grievances,
)
from app.models.user import User, UserRole
from app.models.citizen_help import CitizenGrievance, GrievanceStatus
from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker

engine = create_engine("sqlite:///:memory:")
conn = engine.connect()
conn.execute(text("""
CREATE TABLE IF NOT EXISTS users (
    id VARCHAR(36) PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    hashed_password VARCHAR(255) NOT NULL,
    full_name VARCHAR(255) NOT NULL,
    user_type VARCHAR(50) NOT NULL,
    phone VARCHAR(20),
    address TEXT,
    bar_council_no VARCHAR(50),
    firm_id VARCHAR(36),
    role_id VARCHAR(36),
    avatar_url VARCHAR(500),
    is_active BOOLEAN DEFAULT 1,
    is_verified BOOLEAN DEFAULT 1,
    is_superadmin BOOLEAN DEFAULT 0,
    admin_permissions JSON,
    preferred_language VARCHAR(10) DEFAULT 'mr',
    specializations TEXT,
    failed_login_attempts INTEGER DEFAULT 0,
    locked_until TIMESTAMP,
    login_count INTEGER DEFAULT 0,
    mfa_enabled BOOLEAN DEFAULT 0,
    mfa_secret VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_login TIMESTAMP
);
"""))
conn.execute(text("""
CREATE TABLE IF NOT EXISTS citizen_grievances (
    id VARCHAR(36) PRIMARY KEY,
    user_id VARCHAR(36),
    firm_id VARCHAR(36),
    category VARCHAR(100) NOT NULL,
    sub_category VARCHAR(100),
    language VARCHAR(10) NOT NULL,
    applicant_name VARCHAR(255) NOT NULL,
    applicant_phone VARCHAR(20),
    applicant_email VARCHAR(255),
    applicant_address TEXT,
    opposite_party VARCHAR(255),
    opposite_party_address TEXT,
    incident_date VARCHAR(50),
    incident_place VARCHAR(255),
    facts_summary TEXT NOT NULL,
    relief_sought TEXT,
    target_authority VARCHAR(255),
    applicable_laws JSON,
    required_documents JSON,
    official_portal_url VARCHAR(500),
    generated_application TEXT,
    status VARCHAR(50) NOT NULL,
    is_saved BOOLEAN DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
"""))
conn.commit()
Session = sessionmaker(bind=engine)


class TestCitizenAuthAndPortal(unittest.TestCase):

    def setUp(self):
        self.db = Session()

    def tearDown(self):
        self.db.close()

    @patch("app.api.v1.auth.notify_login", new_callable=AsyncMock)
    def test_01_citizen_registration_and_login(self, mock_notify):
        """Verify dedicated citizen registration creates User with CITIZEN role and no firm."""
        mock_req = MagicMock()
        mock_req.client.host = "127.0.0.1"
        mock_req.headers = {"User-Agent": "Mozilla/5.0"}

        reg_payload = CitizenRegisterRequest(
            full_name="रमेश शंकर पाटील",
            email="ramesh.patil@example.com",
            password="StrongPassword123",
            phone="9822001122",
            city_or_district="Kolhapur",
            preferred_language="mr"
        )

        res = asyncio.run(citizen_register(payload=reg_payload, request=mock_req, db=self.db))
        self.assertIsNotNone(res.access_token)
        self.assertEqual(res.user["role"], "citizen")
        self.assertEqual(res.user["full_name"], "रमेश शंकर पाटील")
        self.assertIsNone(res.user["firm_id"])

        # Test Citizen Login
        login_payload = CitizenLoginRequest(
            email="ramesh.patil@example.com",
            password="StrongPassword123"
        )
        login_res = asyncio.run(citizen_login(payload=login_payload, request=mock_req, db=self.db))
        self.assertEqual(login_res.user["role"], "citizen")
        self.assertEqual(login_res.user["email"], "ramesh.patil@example.com")

    def test_02_citizen_data_isolation_in_history(self):
        """Verify citizens only see grievances created by themselves, not other citizens or firms."""
        citizen_a = User(
            id=uuid.uuid4(),
            email="citizen.a@example.com",
            hashed_password="hash",
            full_name="Citizen A",
            user_type=UserRole.CITIZEN,
            is_active=True,
            firm_id=None
        )
        citizen_b = User(
            id=uuid.uuid4(),
            email="citizen.b@example.com",
            hashed_password="hash",
            full_name="Citizen B",
            user_type=UserRole.CITIZEN,
            is_active=True,
            firm_id=None
        )
        self.db.add_all([citizen_a, citizen_b])
        self.db.commit()

        # Add grievance for A and for B
        g_a = CitizenGrievance(
            id=uuid.uuid4(),
            user_id=citizen_a.id,
            firm_id=None,
            category="cybercrime",
            language="mr",
            applicant_name="Citizen A",
            facts_summary="Citizen A cyber complaint",
            status=GrievanceStatus.GENERATED
        )
        g_b = CitizenGrievance(
            id=uuid.uuid4(),
            user_id=citizen_b.id,
            firm_id=None,
            category="labour",
            language="en",
            applicant_name="Citizen B",
            facts_summary="Citizen B salary complaint",
            status=GrievanceStatus.GENERATED
        )
        self.db.add_all([g_a, g_b])
        self.db.commit()

        # History for Citizen A must ONLY contain A's grievance
        history_a = get_user_grievances(db=self.db, current_user=citizen_a)
        self.assertEqual(len(history_a), 1)
        self.assertEqual(history_a[0]["applicant_name"], "Citizen A")
        self.assertEqual(history_a[0]["category"], "cybercrime")

        # History for Citizen B must ONLY contain B's grievance
        history_b = get_user_grievances(db=self.db, current_user=citizen_b)
        self.assertEqual(len(history_b), 1)
        self.assertEqual(history_b[0]["applicant_name"], "Citizen B")
        self.assertEqual(history_b[0]["category"], "labour")


if __name__ == "__main__":
    unittest.main()
