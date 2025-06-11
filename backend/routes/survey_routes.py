# routes/survey_routes.py
from flask import Blueprint, request, jsonify, abort
from sqlalchemy.orm import Session
from database import SessionLocal
from models import Survey, Question, Option, Response, Answer, User # Import all new models
from sqlalchemy.exc import IntegrityError
from datetime import datetime

survey_bp = Blueprint('survey_bp', __name__, url_prefix='/api')

# Helper function to get DB session
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# Endpoint to fetch a specific survey by ID
@survey_bp.route('/surveys/<int:survey_id>', methods=['GET'])
def get_survey(survey_id: int):
    db: Session = next(get_db())
    survey = db.query(Survey).filter(Survey.id == survey_id).first()

    if not survey:
        abort(404, description="Survey not found")

    # Serialize survey data, including questions and options
    survey_data = {
        "id": survey.id,
        "title": survey.title,
        "description": survey.description,
        "created_at": survey.created_at.isoformat(),
        "categories": [] # We will group questions by category on the frontend
    }

    # For dynamic questions, you might not have explicit "categories" from DB
    # Instead, you'll have questions. You can group them conceptually on frontend
    # Or, if you want categories from DB, you'd need a Category model
    # For now, let's just return questions directly and let frontend handle grouping
    questions_list = []
    for question in survey.questions:
        q_data = {
            "id": question.id,
            "text": question.text,
            "type": question.type,
            "order": question.order,
        }
        if question.type == 'multiple_choice':
            q_data["options"] = [{"id": opt.id, "text": opt.text, "value": opt.value} for opt in question.options]
        questions_list.append(q_data)
    
    # Sort questions by order for consistent display
    survey_data["questions"] = sorted(questions_list, key=lambda x: x["order"])

    return jsonify(survey_data)

# Endpoint to submit survey responses
@survey_bp.route('/surveys/<int:survey_id>/submit_response', methods=['POST'])
def submit_survey_response(survey_id: int):
    db: Session = next(get_db())
    data = request.get_json()

    # In a real app, you'd get user_id from a JWT token or session
    # For now, let's assume user_id is passed in the request body for testing,
    # or you can hardcode a user_id if you have a default user for testing.
    # IMPORTANT: NEVER trust user_id directly from client in production without authentication
    user_id = data.get('user_id') # Example: { "user_id": 1, "answers": [...], "suggestion": "..." }

    if not user_id:
        # If user_id is not provided, you might abort or handle anonymous response
        return jsonify({"detail": "User ID is required for submission"}), 400

    survey = db.query(Survey).filter(Survey.id == survey_id).first()
    if not survey:
        abort(404, description="Survey not found")

    # Create new response entry
    new_response = Response(
        survey_id=survey_id,
        user_id=user_id,
        submitted_at=datetime.utcnow(), # Use UTC for consistency
        final_suggestion=data.get('suggestion')
    )
    db.add(new_response)
    
    try:
        db.commit()
        db.refresh(new_response) # Get the ID for the new response
    except IntegrityError:
        db.rollback()
        return jsonify({"detail": "Database error during response creation."}), 500

    # Process individual answers
    answers_data = data.get('answers', [])
    for ans in answers_data:
        question_id = ans.get('id')
        question = db.query(Question).filter(Question.id == question_id, Question.survey_id == survey_id).first()
        if not question:
            # Skip or error if question doesn't belong to this survey or doesn't exist
            continue 

        new_answer = Answer(
            response_id=new_response.id,
            question_id=question_id,
            rating=ans.get('rating'),
            text_answer=ans.get('remarks'), # For remarks and text questions
            # For multiple choice, you'd have 'selected_option_id'
            # selected_option_id=ans.get('selected_option_id')
        )
        db.add(new_answer)
    
    try:
        db.commit()
        return jsonify({"message": "Survey submitted successfully", "response_id": new_response.id}), 201
    except IntegrityError:
        db.rollback()
        return jsonify({"detail": "Database error during answer submission."}), 500