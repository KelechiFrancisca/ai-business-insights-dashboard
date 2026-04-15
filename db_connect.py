import psycopg2

# Connect to your PostgreSQL database
conn = psycopg2.connect(
    dbname="founding_mvp",      # your database name
    user="postgres",            # your PostgreSQL username
    password="your_password",   # replace with your actual password
    host="localhost",           # or server address if remote
    port="5432"                 # default PostgreSQL port
)

# Create a cursor to execute SQL commands
cur = conn.cursor()

print("Connected successfully!")

# Close connection
cur.close()
conn.close()
