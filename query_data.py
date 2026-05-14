import psycopg2

# Connect to your PostgreSQL database
conn = psycopg2.connect(
    dbname="founding_mvp",
    user="postgres",            # replace with your username
    password="your_password",   # replace with your password
    host="localhost",
    port="5432"
)

cur = conn.cursor()

# Example query: join users, uploads, forecasts, alerts
query = """
SELECT u.name, u.email, up.file_name, f.prediction_result, f.confidence_score, a.message, a.status
FROM users u
JOIN uploads up ON u.user_id = up.user_id
JOIN forecasts f ON up.upload_id = f.upload_id
JOIN alerts a ON u.user_id = a.user_id
WHERE u.user_id = 1;
"""

cur.execute(query)
result = cur.fetchall()

for row in result:
    print(row)

cur.close()
conn.close()
