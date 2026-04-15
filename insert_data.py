import psycopg2

conn = psycopg2.connect(
    dbname="founding_mvp",
    user="postgres",
    password="your_password",   # replace with your password
    host="localhost",
    port="5432"
)

cur = conn.cursor()

# Insert a sample user
cur.execute("""
INSERT INTO users (user_id, name, email)
VALUES (1, 'Francisca Kelechi', 'egofrancisca@gmail.com')
ON CONFLICT (user_id) DO NOTHING;
""")

# Insert a sample upload
cur.execute("""
INSERT INTO uploads (upload_id, user_id, file_name)
VALUES (1, 1, 'sales_data.csv')
ON CONFLICT (upload_id) DO NOTHING;
""")

# Insert a sample forecast
cur.execute("""
INSERT INTO forecasts (forecast_id, upload_id, prediction_result, confidence_score)
VALUES (1, 1, 'Category A', 92.5)
ON CONFLICT (forecast_id) DO NOTHING;
""")

# Insert a sample alert
cur.execute("""
INSERT INTO alerts (alert_id, user_id, message, status)
VALUES (1, 1, 'Your forecast is ready!', 'unread')
ON CONFLICT (alert_id) DO NOTHING;
""")

conn.commit()
print("Sample data inserted successfully!")

cur.close()
conn.close()
