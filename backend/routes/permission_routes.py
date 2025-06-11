# routes/permission_routes.py
from flask import Blueprint, request, jsonify
from sqlalchemy.orm import Session
from database import SessionLocal
from models import Department, Permission, User # Import User model
from security import get_frontend_role # Ensure this is imported for user role normalization
from sqlalchemy.exc import IntegrityError
import datetime # For date parsing

permission_bp = Blueprint('permission_bp', __name__, url_prefix='/api')

# Helper function to get a database session
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# GET all departments
@permission_bp.route('/departments', methods=['GET'])
def get_departments():
    db: Session = next(get_db())
    departments = db.query(Department).order_by(Department.name).all() # Order by name for consistent display
    
    departments_data = [{"id": dept.id, "name": dept.name} for dept in departments]
    return jsonify(departments_data)

# POST (Create) a new department
@permission_bp.route('/departments', methods=['POST'])
def create_department():
    data = request.get_json()
    dept_name = data.get('name')

    if not dept_name:
        return jsonify({"message": "Department name is required"}), 400

    db: Session = next(get_db())
    try:
        existing_dept = db.query(Department).filter(Department.name == dept_name).first()
        if existing_dept:
            return jsonify({"message": f"Department '{dept_name}' already exists"}), 409 # Conflict

        new_dept = Department(name=dept_name)
        db.add(new_dept)
        db.commit()
        db.refresh(new_dept)
        return jsonify({"id": new_dept.id, "name": new_dept.name}), 201 # 201 Created
    except IntegrityError:
        db.rollback()
        return jsonify({"message": "Database integrity error. Department might already exist."}), 400
    except Exception as e:
        db.rollback()
        print(f"Error creating department: {e}")
        return jsonify({"message": "Internal server error"}), 500
    finally:
        db.close()


# GET all permissions (allowed pairs)
@permission_bp.route('/permissions', methods=['GET'])
def get_permissions():
    db: Session = next(get_db())
    permissions = db.query(Permission).all()
    
    permissions_data = []
    for perm in permissions:
        permissions_data.append({
            "from_dept_id": perm.from_dept_id,
            "to_dept_id": perm.to_dept_id
        })
    return jsonify(permissions_data)

# POST to save permissions (wipe and save new)
@permission_bp.route('/permissions/save', methods=['POST'])
def save_permissions():
    data = request.get_json()
    allowed_pairs = data.get('allowed_pairs', []) # Expects a list of {"from_dept_id": X, "to_dept_id": Y}

    if not isinstance(allowed_pairs, list):
        return jsonify({"message": "Invalid data format. 'allowed_pairs' must be a list."}), 400

    db: Session = next(get_db())
    try:
        # Wipe existing permissions
        db.query(Permission).delete()
        print("Existing permissions wiped.")

        # Save new permissions
        for pair in allowed_pairs:
            from_dept_id = pair.get('from_dept_id')
            to_dept_id = pair.get('to_dept_id')

            if from_dept_id is None or to_dept_id is None:
                db.rollback() # Rollback any changes if data is invalid
                return jsonify({"message": "Invalid pair format: 'from_dept_id' and 'to_dept_id' are required."}), 400
            
            new_permission = Permission(from_dept_id=from_dept_id, to_dept_id=to_dept_id)
            db.add(new_permission)
        
        db.commit()
        print(f"Saved {len(allowed_pairs)} new permissions.")
        return jsonify({"message": "Permissions saved successfully"}), 200

    except IntegrityError as e:
        db.rollback()
        print(f"Integrity error: {e}")
        return jsonify({"message": "Failed to save permissions due to data integrity issue (e.g., duplicate entry). Check logs."}), 400
    except Exception as e:
        db.rollback()
        print(f"An unexpected error occurred: {e}")
        return jsonify({"message": "An internal server error occurred while saving permissions."}), 500
    finally:
        db.close()

# POST for Mail Alert Users
@permission_bp.route('/permissions/mail-alert', methods=['POST'])
def mail_alert_users():
    data = request.get_json()
    allowed_pairs = data.get('allowed_pairs', [])
    start_date_str = data.get('start_date')
    end_date_str = data.get('end_date')

    if not allowed_pairs or not start_date_str or not end_date_str:
        return jsonify({"message": "Missing allowed_pairs or date range for mail alert"}), 400

    try:
        # Parse dates (assuming ISO format from frontend)
        start_date = datetime.datetime.fromisoformat(start_date_str.replace('Z', '+00:00'))
        end_date = datetime.datetime.fromisoformat(end_date_str.replace('Z', '+00:00'))
    except ValueError:
        return jsonify({"message": "Invalid date format. Expected ISO string."}), 400

    db: Session = next(get_db())
    
    # Get department names for logging
    department_names_map = {dept.id: dept.name for dept in db.query(Department).all()}

    # Identify departments involved in the allowed pairs
    from_dept_ids = {pair['from_dept_id'] for pair in allowed_pairs}
    
    # Find users belonging to these 'from' departments
    # Assuming User.department stores the department NAME (string)
    users_to_alert = db.query(User).filter(User.department.in_([department_names_map.get(dept_id) for dept_id in from_dept_ids if department_names_map.get(dept_id)])).all()

    alert_summary = []
    for user in users_to_alert:
        # Filter allowed_pairs relevant to this user's department
        relevant_permissions = [
            pair for pair in allowed_pairs 
            if department_names_map.get(pair['from_dept_id']) == user.department
        ]
        
        surveyable_depts = [department_names_map.get(p['to_dept_id']) for p in relevant_permissions if department_names_map.get(p['to_dept_id'])]
        
        if surveyable_depts:
            alert_summary.append(
                f"Simulating email to user '{user.username}' ({user.email}) from department '{user.department}'. "
                f"Can now survey: {', '.join(surveyable_depts)}. Survey period: {start_date.strftime('%Y-%m-%d')} to {end_date.strftime('%Y-%m-%d')}."
            )
            print(alert_summary[-1]) # Print to backend console

    if not users_to_alert:
        print("No users found in the relevant departments for mail alert.")
        return jsonify({"message": "No relevant users found for mail alert."}), 200


    return jsonify({
        "message": "Mail alert process initiated (simulated). Check backend logs for details.",
        "alert_details": alert_summary
    }), 200
