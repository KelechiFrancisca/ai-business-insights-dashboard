import sqlite3

# Connect to your SQLite database (creates cashflow.db if it doesn't exist)
conn = sqlite3.connect("cashflow.db")
cursor = conn.cursor()

# Create the entries table if it doesn't already exist
cursor.execute("""
CREATE TABLE IF NOT EXISTS entries (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    category TEXT NOT NULL,
    description TEXT NOT NULL,
    amount REAL NOT NULL,
    date TEXT NOT NULL
)
""")

conn.commit()
conn.close()

print("✅ Table 'entries' created successfully in cashflow.db")
