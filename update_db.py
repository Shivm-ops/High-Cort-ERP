import sqlite3

def add_columns():
    conn = sqlite3.connect("backend/lagalos.db")
    cursor = conn.cursor()
    
    try:
        cursor.execute("ALTER TABLE intakes ADD COLUMN applicable_sections JSON;")
        print("Added applicable_sections")
    except sqlite3.OperationalError as e:
        print(f"applicable_sections: {e}")
        
    try:
        cursor.execute("ALTER TABLE intakes ADD COLUMN relief_sought TEXT;")
        print("Added relief_sought")
    except sqlite3.OperationalError as e:
        print(f"relief_sought: {e}")

    try:
        cursor.execute("ALTER TABLE intakes ADD COLUMN facts_list JSON;")
        print("Added facts_list")
    except sqlite3.OperationalError as e:
        print(f"facts_list: {e}")

    try:
        cursor.execute("ALTER TABLE intakes ADD COLUMN assessment JSON;")
        print("Added assessment (JSON)")
    except sqlite3.OperationalError as e:
        print(f"assessment: {e}")

    conn.commit()
    conn.close()

if __name__ == "__main__":
    add_columns()
