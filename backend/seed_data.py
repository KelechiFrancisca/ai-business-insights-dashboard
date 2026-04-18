import sqlite3

# Connect to your existing database
conn = sqlite3.connect("cashflow.db")
cursor = conn.cursor()

# Sample entries with dates
entries = [
    ("income", "Consulting revenue", 5000, "2026-01-15"),
    ("expense", "Office rent", 1200, "2026-01-20"),
    ("income", "Project payment", 7000, "2026-02-10"),
    ("expense", "Stationery", 300, "2026-02-15"),
    ("income", "Bonus payment", 4000, "2026-03-05"),
    ("expense", "Utilities", 800, "2026-03-12")
]

# Insert entries
cursor.executemany(
    "INSERT INTO cashflow (category, description, amount, date) VALUES (?, ?, ?, ?)",
    entries
)

conn.commit()
conn.close()

print("Database seeded successfully with sample entries.")
