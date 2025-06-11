# models.py
from database import Base
from sqlalchemy import Column, Integer, String, DateTime, func, ForeignKey, UniqueConstraint, Text, Enum
from sqlalchemy.orm import relationship

# Existing User Model (Consolidated)
class User(Base):
    __tablename__ = "admin_users"
    __table_args__ = {'schema': 'dbo'}

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String, unique=True, index=True, nullable=False)
    name = Column(String, nullable=False)
    email = Column(String, unique=True, nullable=False)
    department = Column(String) 
    hashed_password = Column(String, nullable=False)
    role = Column(String, default='user')  # Either 'admin' or 'user'
    created_at = Column(DateTime, server_default=func.now())

    def __repr__(self):
        return f"<User(id={self.id}, username='{self.username}', name='{self.name}')>"

# Existing Department Model
class Department(Base):
    __tablename__ = "departments"
    __table_args__ = {'schema': 'dbo'}

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), unique=True, index=True, nullable=False) 
    created_at = Column(DateTime, server_default=func.now())

    def __repr__(self):
        return f"<Department(id={self.id}, name='{self.name}')>"

# Existing Permission Model
class Permission(Base):
    __tablename__ = "permissions"
    __table_args__ = (
        UniqueConstraint('from_dept_id', 'to_dept_id', name='uq_from_to_dept'),
        {'schema': 'dbo'}
    )

    id = Column(Integer, primary_key=True, index=True)
    from_dept_id = Column(Integer, ForeignKey('dbo.departments.id'), nullable=False)
    to_dept_id = Column(Integer, ForeignKey('dbo.departments.id'), nullable=False)
    created_at = Column(DateTime, server_default=func.now())

    from_department = relationship("Department", foreign_keys=[from_dept_id], backref="can_survey")
    to_department = relationship("Department", foreign_keys=[to_dept_id], backref="can_be_surveyed_by")

    def __repr__(self):
        return f"<Permission(id={self.id}, from_dept_id={self.from_dept_id}, to_dept_id={self.to_dept_id})>"
    
# --- NEW MODELS FOR SURVEYS AND RESPONSES (Corrected) ---

class Survey(Base):
    __tablename__ = "surveys"
    __table_args__ = {'schema': 'dbo'}
    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, nullable=False)
    description = Column(String)
    created_at = Column(DateTime, server_default=func.now())

    questions = relationship("Question", back_populates="survey", cascade="all, delete-orphan")
    responses = relationship("Response", back_populates="survey", cascade="all, delete-orphan")

class Question(Base):
    __tablename__ = "questions"
    __table_args__ = {'schema': 'dbo'}
    id = Column(Integer, primary_key=True, index=True)
    survey_id = Column(Integer, ForeignKey('dbo.surveys.id'), nullable=False)
    text = Column(String, nullable=False)
    # Using Enum for question type for strict validation
    type = Column(Enum('rating', 'text', 'multiple_choice', name='question_type'), nullable=False)
    order = Column(Integer, nullable=False) 

    survey = relationship("Survey", back_populates="questions")
    options = relationship("Option", back_populates="question", cascade="all, delete-orphan")

class Option(Base):
    __tablename__ = "question_options"
    __table_args__ = {'schema': 'dbo'}
    id = Column(Integer, primary_key=True, index=True)
    question_id = Column(Integer, ForeignKey('dbo.questions.id'), nullable=False)
    text = Column(String, nullable=False)
    value = Column(String) 

    question = relationship("Question", back_populates="options")

class Response(Base):
    __tablename__ = "survey_responses"
    __table_args__ = {'schema': 'dbo'}
    id = Column(Integer, primary_key=True, index=True)
    survey_id = Column(Integer, ForeignKey('dbo.surveys.id'), nullable=False)
    user_id = Column(Integer, ForeignKey('dbo.admin_users.id'), nullable=False) 
    submitted_at = Column(DateTime, server_default=func.now())
    final_suggestion = Column(Text) 

    survey = relationship("Survey", back_populates="responses")
    user = relationship("User") 
    answers = relationship("Answer", back_populates="response", cascade="all, delete-orphan")

class Answer(Base):
    # FIX: Changed table name from "Youtubes" to "question_answers"
    __tablename__ = "question_answers" 
    __table_args__ = {'schema': 'dbo'}
    id = Column(Integer, primary_key=True, index=True)
    response_id = Column(Integer, ForeignKey('dbo.survey_responses.id'), nullable=False)
    question_id = Column(Integer, ForeignKey('dbo.questions.id'), nullable=False)
    rating = Column(Integer) 
    text_answer = Column(Text)
    selected_option_id = Column(Integer, ForeignKey('dbo.question_options.id'), nullable=True) 

    response = relationship("Response", back_populates="answers")
    question = relationship("Question")
    selected_option = relationship("Option")
