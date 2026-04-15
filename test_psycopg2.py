import psycopg2
print("psycopg2 is installed and ready!")

import psycopg2

conn = psycopg2.connect(
    dbname="founding_mvp",
    user="postgres",
    password="egofrancisca@gmail.com",
    host="localhost",
    port="5432"
)

cur = conn.cursor()
cur.execute("SELECT * FROM users;")
rows = cur.fetchall()

for row in rows:
    print(row)

cur.close()
conn.close()
