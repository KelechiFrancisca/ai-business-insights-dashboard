import psycopg2

conn = psycopg2.connect(
    dbname="founding_mvp",
    user="postgres",
    password="your_password",   # replace with your password
    host="localhost",
    port="5432"
)

cur = conn.cursor()

# Create tables if they don't exist
cur.execute("""
CREATE TABLE IF NOT EXISTS users (
    user_id SERIAL PRIMARY KEY,
    name VARCHAR(100),
    email VARCHAR(100)
);
""")

cur.execute("""
CREATE TABLE IF NOT EXISTS uploads (
    upload_id SERIAL PRIMARY KEY,
    user_id INT REFERENCES users(user_id),
    file_name VARCHAR(100)
);
""")

cur.execute("""
CREATE TABLE IF NOT EXISTS forecasts (
    forecast_id SERIAL PRIMARY KEY,
    upload_id INT REFERENCES uploads(upload_id),
    prediction_result VARCHAR(100),
    confidence_score FLOAT
);
""")

cur.execute("""
CREATE TABLE IF NOT EXISTS alerts (
    alert_id SERIAL PRIMARY KEY,
    user_id INT REFERENCES users(user_id),
    message VARCHAR(200),
    status VARCHAR(20)
);
""")

conn.commit()
print("Tables created successfully!")

cur.close()
conn.close()
