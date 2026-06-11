import sys
import os
import uuid
import random
from datetime import datetime, timedelta

# Add backend dir to pythonpath
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from sqlalchemy.sql import text
from app.core.database import SessionLocal

def seed_performance_data():
    db = SessionLocal()
    try:
        print("Starting performance data seeding (Raw SQL)...")
        
        firm = db.execute(text("SELECT id FROM firms LIMIT 1")).fetchone()
        if not firm:
            print("No firm found. Please run regular seed.py first.")
            return

        firm_id = str(firm.id)

        # 1. Insert Clients
        print("Generating 10,000 Clients...")
        clients = []
        client_ids = []
        for i in range(10000):
            cid = str(uuid.uuid4())
            client_ids.append(cid)
            dt = datetime.utcnow() - timedelta(days=random.randint(1, 300))
            clients.append({
                "id": cid, "email": f"perf{i}@example.com", "full_name": f"Perf Client {i}", 
                "phone": f"90000{i:05d}", "firm_id": firm_id, "created_at": dt
            })
            
        db.execute(text("""
            INSERT INTO clients (id, name, email, phone, type, firm_id, created_at, updated_at) 
            VALUES (:id, :full_name, :email, :phone, 'individual', :firm_id, :created_at, :created_at)
        """), clients)
        db.commit()

        # 2. Insert Cases
        print("Generating 50,000 Cases...")
        cases = []
        case_ids = []
        for i in range(50000):
            case_id = str(uuid.uuid4())
            case_ids.append(case_id)
            dt = datetime.utcnow() - timedelta(days=random.randint(1, 300))
            cases.append({
                "id": case_id, "case_no": f"PERF-CASE-{i}", "title": f"Performance Case {i} vs State",
                "court": "High Court of Performance", "client_id": random.choice(client_ids),
                "firm_id": firm_id, "status": "active", "stage": "filing", "priority": "medium",
                "created_at": dt
            })
            
            if len(cases) >= 10000:
                db.execute(text("""
                    INSERT INTO cases (id, case_no, title, court, client_id, firm_id, practice_area, status, stage, priority, created_at, updated_at) 
                    VALUES (:id, :case_no, :title, :court, :client_id, :firm_id, 'Civil', :status, :stage, :priority, :created_at, :created_at)
                """), cases)
                db.commit()
                cases = []

        if cases:
            db.execute(text("""
                INSERT INTO cases (id, case_no, title, court, client_id, firm_id, practice_area, status, stage, priority, created_at, updated_at) 
                VALUES (:id, :case_no, :title, :court, :client_id, :firm_id, 'Civil', :status, :stage, :priority, :created_at, :created_at)
            """), cases)
            db.commit()

        # 3. Insert Documents
        print("Generating 100,000 Documents...")
        docs = []
        for i in range(100000):
            doc_id = str(uuid.uuid4())
            dt = datetime.utcnow() - timedelta(days=random.randint(1, 300))
            docs.append({
                "id": doc_id, "name": f"Evidence_{i}.pdf", "original_filename": f"Evidence_{i}.pdf",
                "file_path": f"s3://bucket/perf/evidence_{i}.pdf", "case_id": random.choice(case_ids),
                "doc_type": "evidence", "file_size": random.randint(10000, 5000000), "created_at": dt
            })
            
            if len(docs) >= 10000:
                db.execute(text("""
                    INSERT INTO documents (id, name, original_filename, file_path, case_id, doc_type, file_size, created_at) 
                    VALUES (:id, :name, :original_filename, :file_path, :case_id, :doc_type, :file_size, :created_at)
                """), docs)
                db.commit()
                docs = []

        if docs:
            db.execute(text("""
                INSERT INTO documents (id, name, original_filename, file_path, case_id, doc_type, file_size, created_at) 
                VALUES (:id, :name, :original_filename, :file_path, :case_id, :doc_type, :file_size, :created_at)
            """), docs)
            db.commit()

        print("✅ Performance Seeding Complete!")

    except Exception as e:
        print(f"Error seeding data: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    seed_performance_data()
