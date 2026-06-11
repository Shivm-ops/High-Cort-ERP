import sqlite3

def add_columns():
    conn = sqlite3.connect("backend/lagalos.db")
    cursor = conn.cursor()
    
    try:
        cursor.execute("ALTER TABLE hearings ADD COLUMN readiness_status TEXT;")
        print("Added readiness_status")
    except sqlite3.OperationalError as e:
        print(f"Error adding readiness_status: {e}")

    try:
        cursor.execute("ALTER TABLE hearings ADD COLUMN preparation_checklist JSON;")
        print("Added preparation_checklist")
    except sqlite3.OperationalError as e:
        print(f"Error adding preparation_checklist: {e}")

    conn.commit()
    conn.close()

if __name__ == "__main__":
    add_columns()
