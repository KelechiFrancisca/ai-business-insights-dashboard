from flask import Flask, request, jsonify
from flask_cors import CORS
import psycopg2
import numpy as np
from sklearn.linear_model import LinearRegression
from datetime import datetime
from werkzeug.security import generate_password_hash, check_password_hash
from psycopg2 import errors
import os
import secrets

# JWT imports
from flask_jwt_extended import (
    JWTManager, create_access_token,
    jwt_required, get_jwt_identity
)

app = Flask(__name__)
CORS(app)

# --- JWT Config ---
# Use a strong secret key (at least 32 characters)
# In production, load this from environment variables
app.config["JWT_SECRET_KEY"] = secrets.token_hex(32)
jwt = JWTManager(app)

# --- Database connection helper ---
def get_db_connection():
    # ✅ Use DATABASE_URL from Render environment instead of localhost
    return psycopg2.connect(os.environ["DATABASE_URL"])

# ---------------- AUTH ROUTES ----------------
@app.route('/register', methods=['POST'])
def register():
    data = request.get_json()
    hashed_pw = generate_password_hash(data['password'])
    conn = get_db_connection()
    cursor = conn.cursor()
    try:
        cursor.execute(
            "INSERT INTO users (name, email, password_hash, role) VALUES (%s, %s, %s, %s)",
            (data['name'], data['email'], hashed_pw, data.get('role', 'user'))
        )
        conn.commit()
        return jsonify({"message": "User registered successfully"}), 201
    except errors.UniqueViolation:
        conn.rollback()
        return jsonify({"error": "Email already exists"}), 400
    finally:
        cursor.close()
        conn.close()

@app.route('/login', methods=['POST'])
def login():
    data = request.get_json()
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT id, password_hash FROM users WHERE email=%s", (data['email'],))
    user = cursor.fetchone()
    cursor.close()
    conn.close()

    if user is None or user[1] is None:
        return jsonify({"error": "User not found"}), 404

    if check_password_hash(user[1], data['password']):
        # ✅ identity must be string
        token = create_access_token(identity=str(user[0]))
        return jsonify({"message": "Login successful", "token": token}), 200
    else:
        return jsonify({"error": "Invalid credentials"}), 401

# ---------------- PROFILE ROUTES ----------------
@app.route('/api/users/me', methods=['GET'])
@jwt_required()
def get_profile():
    user_id = get_jwt_identity()
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT name, email, role FROM users WHERE id=%s", (user_id,))
    user = cursor.fetchone()
    cursor.close()
    conn.close()
    if user:
        return jsonify({"name": user[0], "email": user[1], "role": user[2]})
    return jsonify({"error": "User not found"}), 404

@app.route('/api/users/me', methods=['PUT'])
@jwt_required()
def update_profile():
    user_id = get_jwt_identity()
    data = request.get_json()
    conn = get_db_connection()
    cursor = conn.cursor()
    try:
        cursor.execute(
            "UPDATE users SET name=%s, email=%s, role=%s WHERE id=%s",
            (data['name'], data['email'], data['role'], user_id)
        )
        conn.commit()
        return jsonify({"message": "Profile updated"})
    except errors.UniqueViolation:
        conn.rollback()
        return jsonify({"error": "Email already exists"}), 400
    finally:
        cursor.close()
        conn.close()

# ---------------- UPLOAD FILE ----------------
@app.route('/upload', methods=['POST'])
@jwt_required()
def upload_file():
    user_id = get_jwt_identity()
    if 'file' not in request.files:
        return jsonify({"error": "No file part"}), 400

    file = request.files['file']
    if file.filename == '':
        return jsonify({"error": "No selected file"}), 400

    upload_path = os.path.join("uploads", file.filename)
    os.makedirs("uploads", exist_ok=True)
    file.save(upload_path)

    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute(
        "INSERT INTO uploads (filename, user_id, upload_date) VALUES (%s, %s, %s)",
        (file.filename, user_id, datetime.now())
    )
    conn.commit()
    cursor.close()
    conn.close()

    return jsonify({"message": "File uploaded successfully", "filename": file.filename})

# ---------------- CASHFLOW ROUTES ----------------
@app.route('/get_entries', methods=['GET'])
@jwt_required()
def get_entries():
    user_id = get_jwt_identity()
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM entries WHERE user_id = %s", (user_id,))
    rows = cursor.fetchall()
    cursor.close()
    conn.close()

    entries = []
    for row in rows:
        entries.append({
            "id": row[0],
            "date": str(row[1]),
            "type": row[2],
            "category": row[3],
            "description": row[4],
            "amount": row[5],
            "user_id": row[6]
        })
    return jsonify(entries)

@app.route('/add', methods=['POST'])
@jwt_required()
def add_entry_detailed():
    user_id = get_jwt_identity()
    data = request.get_json()
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute(
        "INSERT INTO entries (date, type, category, description, amount, user_id) VALUES (%s, %s, %s, %s, %s, %s)",
        (data['date'], data['type'], data['category'], data['description'], data['amount'], user_id)
    )
    conn.commit()
    cursor.close()
    conn.close()
    return jsonify({"message": "Detailed entry added successfully"}), 201

@app.route('/forecast', methods=['GET'])
@jwt_required()
def forecast():
    user_id = get_jwt_identity()
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT date, type, amount FROM entries WHERE user_id=%s", (user_id,))
    rows = cursor.fetchall()
    cursor.close()
    conn.close()

    if not rows:
        return jsonify({"error": "No data available"})

    monthly_net = {}
    for date, type_, amount in rows:
        month = str(date)[:7]
        monthly_net[month] = monthly_net.get(month, 0) + (amount if type_ == "income" else -amount)

    months = sorted(monthly_net.keys())
    X = np.arange(len(months)).reshape(-1, 1)
    y = np.array([monthly_net[m] for m in months])
    model = LinearRegression().fit(X, y)

    return jsonify({
        "current_net": float(y[-1]),
        "forecast_next": float(model.predict([[len(months)]])[0])
    })

@app.route('/alerts', methods=['GET'])
@jwt_required()
def get_alerts():
    user_id = get_jwt_identity()
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT type, amount FROM entries WHERE user_id=%s", (user_id,))
    rows = cursor.fetchall()
    cursor.close()
    conn.close()

    alerts = []
    total_income = sum(r[1] for r in rows if r[0] == "income")
    total_expenses = sum(r[1] for r in rows if r[0] == "expense")
    net = total_income - total_expenses

    if net < 1000:
        alerts.append("⚠️ Net cashflow is below $1,000")
    if total_expenses > total_income:
        alerts.append("⚠️ Expenses exceed income")

    return jsonify(alerts)

# ---------------- MAIN ----------------
if __name__ == "__main__":
    app.run(debug=True)
