"""
seed_massive.py
===============
Script to bulk insert realistic mass-scale data to test LegalOS performance metrics.
WARNING: 100k clients and 500k documents on SQLite will take a long time and expand the file significantly.
We scale this down for local testing to demonstrate the ORM bulk inserts.
"""

import sys, os, time, uuid
sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))

from main import app
from app.core.database import engine, Base, SessionLocal
from app.models.firm import Firm
from app.models.user import User, UserRole
from app.models.client import Client
from app.models.document import Document

def run_seed():
    db = SessionLocal()
    
    print("Starting mass data seeding process...")
    start_time = time.time()
    
    # Create base firm and user
    firm_id = uuid.uuid4()
    user_id = uuid.uuid4()
    
    firm = Firm(id=firm_id, name="Massive Law Firm")
    user = User(
        id=user_id, email="perf@massive.in", hashed_password="pw",
        full_name="Perf Tester", firm_id=firm_id, user_type=UserRole.ADMIN,
        is_active=True
    )
    db.add(firm)
    db.add(user)
    db.commit()
    
    # Scale: 10,000 clients (reduced from 100k to save local execution time, but uses same bulk engine)
    print("Generating 10,000 clients...")
    clients_data = [
        {
            "id": uuid.uuid4(),
            "name": f"Client {i}",
            "type": "individual",
            "phone": "+910000000000",
            "firm_id": firm_id,
            "created_by_id": user_id,
            "updated_by_id": user_id
        }
        for i in range(10000)
    ]
    
    db.bulk_insert_mappings(Client, clients_data)
    db.commit()
    print(f"Clients seeded in {time.time() - start_time:.2f} seconds.")
    
    # Scale: 50,000 documents
    print("Generating 50,000 document records...")
    docs_start = time.time()
    docs_data = [
        {
            "id": uuid.uuid4(),
            "title": f"Document {i}.pdf",
            "file_path": f"s3://lagalos/docs/doc_{i}.pdf",
            "content_type": "application/pdf",
            "file_size": 1024,
            "firm_id": firm_id,
            "uploaded_by_id": user_id
        }
        for i in range(50000)
    ]
    db.bulk_insert_mappings(Document, docs_data)
    db.commit()
    print(f"Documents seeded in {time.time() - docs_start:.2f} seconds.")
    
    print(f"Total Mass Seeding completed in {time.time() - start_time:.2f} seconds.")

if __name__ == "__main__":
    run_seed()
