"""
Seed script to populate sample clients and matters into production or local database.
Can be executed safely without dropping any existing data:
    python seed_clients.py
Or inside docker container:
    docker compose -f docker-compose.vps.yml exec backend python seed_clients.py
"""

import sys
import os
import uuid
from datetime import datetime, timezone

sys.path.insert(0, os.path.dirname(__file__))

from app.core.database import SessionLocal, engine, Base
from app.models.firm import Firm
from app.models.user import User, UserRole
from app.models.client import Client, ClientType
from app.models.case import Case, CaseStatus, CaseStage, CasePriority

# Ensure all models are loaded
import app.models.client   # noqa
import app.models.case     # noqa
import app.models.hearing  # noqa
import app.models.invoice  # noqa
import app.models.document # noqa
import app.models.draft    # noqa
import app.models.filing        # noqa
import app.models.case_advocate  # noqa
import app.models.intake         # noqa
import app.models.case_law       # noqa
import app.models.letterhead     # noqa
import app.models.security       # noqa
import app.models.fee_expense    # noqa
import app.models.audit_log      # noqa
import app.models.advance_payment # noqa
import app.models.witness        # noqa
import app.models.firm           # noqa
import app.models.kyc            # noqa
import app.models.subscription   # noqa
import app.models.setting        # noqa
import app.models.role           # noqa
import app.models.support        # noqa
import app.models.order          # noqa


def seed_clients_and_matters():
    db = SessionLocal()
    try:
        print("[*] Seeding sample clients and cases...")

        # 1. Resolve Admin User and Firm
        admin = db.query(User).filter(User.email == "admin@fastcase.in").first()
        if not admin:
            admin = db.query(User).first()

        firm_id = admin.firm_id if admin else None
        if not firm_id:
            firm = db.query(Firm).first()
            if not firm:
                firm = Firm(
                    name="Fastcase Legal Practice",
                    subdomain="fastcase",
                    domain="fastcase.in",
                    is_active=True,
                )
                db.add(firm)
                db.commit()
                db.refresh(firm)
                print(f"  [+] Created firm: {firm.name}")
            firm_id = firm.id
            if admin and not admin.firm_id:
                admin.firm_id = firm_id
                db.commit()

        admin_id = admin.id if admin else None

        # 2. Define Clients
        clients_data = [
            {
                "name": "Shweta Jadhav",
                "phone": "07218834640",
                "email": "shwetajadhav2324@gmail.com",
                "type": ClientType.INDIVIDUAL,
                "city": "Mumbai",
                "state": "Maharashtra",
            },
            {
                "name": "Rajesh Sharma",
                "phone": "9876543210",
                "email": "rajesh.sharma@example.com",
                "type": ClientType.INDIVIDUAL,
                "city": "Delhi",
                "state": "Delhi",
            },
            {
                "name": "Client Alpha Corp",
                "phone": "9876543210",
                "email": "alpha.corp@example.com",
                "type": ClientType.CORPORATE,
                "company_name": "Alpha Corp Ltd",
                "city": "Bengaluru",
                "state": "Karnataka",
            },
            {
                "name": "Client Alpha Individual",
                "phone": "9123456789",
                "email": "alpha.ind@example.com",
                "type": ClientType.INDIVIDUAL,
                "city": "Pune",
                "state": "Maharashtra",
            },
        ]

        client_map = {}
        for cdata in clients_data:
            existing = (
                db.query(Client)
                .filter(
                    Client.name == cdata["name"],
                    Client.phone == cdata["phone"],
                    Client.is_deleted == False,
                )
                .first()
            )
            if not existing:
                client = Client(
                    id=uuid.uuid4(),
                    name=cdata["name"],
                    phone=cdata["phone"],
                    email=cdata.get("email"),
                    type=cdata["type"],
                    city=cdata.get("city"),
                    state=cdata.get("state"),
                    company_name=cdata.get("company_name"),
                    firm_id=firm_id,
                    created_by_id=admin_id,
                    is_active=True,
                )
                db.add(client)
                db.commit()
                db.refresh(client)
                client_map[cdata["name"]] = client
                print(f"  [+] Added Client: {client.name} ({client.phone})")
            else:
                client_map[cdata["name"]] = existing
                print(f"  [i] Existing Client: {existing.name} ({existing.phone})")

        # 3. Define Cases
        cases_data = [
            {
                "case_no": "CC/2002/2026",
                "title": "Individual vs Bank",
                "court": "High Court of Bombay",
                "practice_area": "Banking & Finance",
                "case_type": "Commercial Suit",
                "status": CaseStatus.ACTIVE,
                "stage": CaseStage.FILING,
                "priority": CasePriority.HIGH,
                "client_name": "Client Alpha Individual",
                "ecourts_cnr": "MHHC010020022026",
            },
            {
                "case_no": "CR-9082/2026",
                "title": "Sharma vs State of Maharashtra",
                "court": "Sessions Court, Mumbai",
                "practice_area": "Criminal",
                "case_type": "Criminal Revision",
                "status": CaseStatus.ACTIVE,
                "stage": CaseStage.ARGUMENTS,
                "priority": CasePriority.HIGH,
                "client_name": "Rajesh Sharma",
                "ecourts_cnr": "MHHC010090822026",
            },
            {
                "case_no": "WP/1001/2026",
                "title": "Alpha Corp vs State",
                "court": "High Court of Bombay",
                "practice_area": "Constitutional / Writ",
                "case_type": "Writ Petition",
                "status": CaseStatus.ACTIVE,
                "stage": CaseStage.NOTICE,
                "priority": CasePriority.MEDIUM,
                "client_name": "Client Alpha Corp",
                "ecourts_cnr": "MHHC010010012026",
            },
        ]

        for cs in cases_data:
            existing = (
                db.query(Case)
                .filter(Case.case_no == cs["case_no"], Case.is_deleted == False)
                .first()
            )
            if not existing:
                parent_client = client_map.get(cs["client_name"])
                if not parent_client:
                    continue
                new_case = Case(
                    id=uuid.uuid4(),
                    case_no=cs["case_no"],
                    title=cs["title"],
                    court=cs["court"],
                    practice_area=cs["practice_area"],
                    case_type=cs.get("case_type"),
                    status=cs["status"],
                    stage=cs["stage"],
                    priority=cs["priority"],
                    client_id=parent_client.id,
                    ecourts_cnr=cs.get("ecourts_cnr"),
                    firm_id=firm_id,
                    created_by_id=admin_id,
                    primary_advocate_id=admin_id,
                )
                db.add(new_case)
                db.commit()
                print(f"  [+] Added Case: {new_case.case_no} - {new_case.title}")
            else:
                print(f"  [i] Existing Case: {existing.case_no} - {existing.title}")

        print("\n[+] Seeding completed successfully!")
    finally:
        db.close()


if __name__ == "__main__":
    seed_clients_and_matters()
