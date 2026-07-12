import os, csv, io
import pandas as pd
from dotenv import load_dotenv
load_dotenv()

from flask import Flask, request, jsonify, Response
from flask_cors import CORS
from werkzeug.utils import secure_filename
from datetime import datetime, date
from apscheduler.schedulers.background import BackgroundScheduler

from extensions import db, migrate
from entries import entries_bp
from auth import auth_bp
from models import User, Entry, Forecast, Alert, Upload, Settings
from auth_utils import verify_token_and_get_user

app = Flask(__name__)

# ✅ Expanded CORS config for React frontend (local + cloud)
CORS(app, supports_credentials=True, origins=[
    "http://localhost:3000",
    "https://finsight-frontend-rhov.onrender.com"
])

# ✅ Database config (Postgres only)
app.config["SQLALCHEMY_DATABASE_URI"] = os.getenv("DATABASE_URL")
app.config["SQLALCHEMY_TRACK_MODIFICATIONS"] = False
app.config["SECRET_KEY"] = os.getenv("SECRET_KEY", "replace_with_long_random_secret_key")

# ✅ Initialize DB + Migrations
db.init_app(app)
migrate.init_app(app, db)

# Register blueprints
app.register_blueprint(entries_bp, url_prefix="/api")
app.register_blueprint(auth_bp, url_prefix="/api")

# -------------------------
# Your routes and helpers
# -------------------------

# (all the routes you pasted earlier: upload, settings, clear_entries, clear_all,
# forecast, alerts, resolve_alert, acknowledge_alert, etc.)
# ✅ Keep them exactly as they are

# -------------------------
# Run App
# -------------------------
if __name__ == "__main__":
    app.run(debug=True)
