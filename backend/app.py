# app.py
from dotenv import load_dotenv
load_dotenv()

from flask import Flask, request, jsonify
from flask_cors import CORS
from sqlalchemy.orm import Session
from security import verify_password, get_frontend_role # Import get_frontend_role
from database import SessionLocal
from models import User
from routes.user_routes import user_bp
from routes.permission_routes import permission_bp # Import permission_bp

app = Flask(__name__)
CORS(app)

# Register the user blueprint
app.register_blueprint(user_bp)
app.register_blueprint(permission_bp) # Register the permission blueprint

@app.route("/login", methods=["POST"])
def login():
    data = request.get_json()
    username = data.get("username")
    password = data.get("password")

    if not username or not password:
        return jsonify({"detail": "Missing username or password"}), 400

    db: Session = SessionLocal()
    user = db.query(User).filter(User.username == username).first()
    db.close()

    if not user or not verify_password(password, user.hashed_password):
        return jsonify({"detail": "Invalid username or password"}), 401

    return jsonify({
        "username": user.username,
        "name": user.name,
        "email": user.email,
        "department": user.department,
        "role": get_frontend_role(user.role),  # Normalize role for frontend redirection
    })

if __name__ == "__main__":
    app.run(debug=True)
