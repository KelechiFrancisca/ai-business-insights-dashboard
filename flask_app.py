import os
import csv
import psycopg2
from flask import Flask, request, jsonify

# Initialize Flask app
app = Flask(__name__)

# Configure upload folder
UPLOAD_FOLDER = "uploads"
os.makedirs(UPLOAD_FOLDER, exist_ok=True)
app.config["UPLOAD_FOLDER"] = UPLOAD_FOLDER

# Database connection function
def get_db_connection():
    return psycopg2.connect(
        host="localhost",
        port=5432,
        database="founding_mvp",     # replace with your database name
        user="postgres2026",          # your role
        password="Francisca2026!"     # your password
    )

# ------------------- CRUD ROUTES -------------------

# CREATE (POST)
@app.route("/cashflow", methods=["POST"])
def add_cashflow():
    amount = request.form.get("amount")
    category = request.form.get("category")
    description = request.form.get("description")

    conn = get_db_connection()
    cur = conn.cursor()
    cur.execute(
        "INSERT INTO cashflow (amount, category, description) VALUES (%s, %s, %s)",
        (amount, category, description)
    )
    conn.commit()
    cur.close()
    conn.close()

    return jsonify({
        "amount": float(amount),
        "category": category,
        "description": description,
        "message": "Cashflow entry added"
    })

# READ (GET – list entries)
@app.route("/cashflow", methods=["GET"])
def get_cashflow():
    conn = get_db_connection()
    cur = conn.cursor()
    cur.execute("SELECT id, amount, category, description FROM cashflow")
    rows = cur.fetchall()
    cur.close()
    conn.close()

    results = []
    for row in rows:
        results.append({
            "id": row[0],
            "amount": float(row[1]),
            "category": row[2],
            "description": row[3]
        })
    return jsonify(results)

# READ (GET – summary totals)
@app.route("/cashflow/summary", methods=["GET"])
def cashflow_summary():
    conn = get_db_connection()
    cur = conn.cursor()

    cur.execute("SELECT SUM(amount) FROM cashflow WHERE category = 'income'")
    income_total = cur.fetchone()[0] or 0

    cur.execute("SELECT SUM(amount) FROM cashflow WHERE category = 'expense'")
    expense_total = cur.fetchone()[0] or 0

    balance = income_total - expense_total
    cur.close()
    conn.close()

    return jsonify({
        "income_total": float(income_total),
        "expense_total": float(expense_total),
        "balance": float(balance)
    })

# UPDATE (PUT)
@app.route("/cashflow/<int:entry_id>", methods=["PUT"])
def update_cashflow(entry_id):
    amount = request.form.get("amount")
    category = request.form.get("category")
    description = request.form.get("description")

    conn = get_db_connection()
    cur = conn.cursor()
    cur.execute(
        "UPDATE cashflow SET amount = %s, category = %s, description = %s WHERE id = %s",
        (amount, category, description, entry_id)
    )
    conn.commit()
    cur.close()
    conn.close()

    return jsonify({
        "id": entry_id,
        "amount": float(amount),
        "category": category,
        "description": description,
        "message": "Cashflow entry updated"
    })

# DELETE
@app.route("/cashflow/<int:entry_id>", methods=["DELETE"])
def delete_cashflow(entry_id):
    conn = get_db_connection()
    cur = conn.cursor()
    cur.execute("DELETE FROM cashflow WHERE id = %s", (entry_id,))
    conn.commit()
    cur.close()
    conn.close()

    return jsonify({
        "id": entry_id,
        "message": "Cashflow entry deleted"
    })

# ------------------- UPLOAD ROUTE -------------------

@app.route("/upload", methods=["POST"])
def upload_file():
    if "file" not in request.files:
        return jsonify({"error": "No file part"}), 400

    file = request.files["file"]
    if file.filename == "":
        return jsonify({"error": "No selected file"}), 400

    filepath = os.path.join(app.config["UPLOAD_FOLDER"], file.filename)
    file.save(filepath)

    # Read CSV and insert rows into cashflow table
    conn = get_db_connection()
    cur = conn.cursor()

    with open(filepath, newline="") as csvfile:
        reader = csv.DictReader(csvfile)
        for row in reader:
            amount = row.get("amount")
            category = row.get("category")
            description = row.get("description")
            cur.execute(
                "INSERT INTO cashflow (amount, category, description) VALUES (%s, %s, %s)",
                (amount, category, description)
            )

    conn.commit()
    cur.close()
    conn.close()

    return jsonify({
        "filename": file.filename,
        "message": "File uploaded and data imported successfully"
    })

# ------------------- MAIN -------------------

if __name__ == "__main__":
    app.run(use_reloader=False, debug=True)
