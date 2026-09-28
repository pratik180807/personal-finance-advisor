from flask import Blueprint, request
from flask_jwt_extended import create_access_token, jwt_required, get_jwt_identity
from app import db
from app.models.user import User
from app.utils.validators import validate_registration, validate_login
from app.utils.helpers import success_response, error_response

auth_bp = Blueprint('auth', __name__)

@auth_bp.route('/register', methods=['POST'])
def register():
    data = request.get_json() or {}
    errors = validate_registration(data)
    if errors:
        return error_response("Validation failed", errors=errors, status_code=400)

    email = data['email'].strip().lower()
    existing_user = User.query.filter_by(email=email).first()
    if existing_user:
        return error_response("An account with this email already exists", errors=["Email already in use"], status_code=409)

    user = User(
        name=data['name'].strip(),
        email=email
    )
    user.set_password(data['password'])

    db.session.add(user)
    db.session.commit()

    # Create JWT token
    access_token = create_access_token(identity=str(user.id))

    return success_response(
        data={
            'user': user.to_dict(),
            'token': access_token
        },
        message="Registration successful",
        status_code=201
    )


@auth_bp.route('/login', methods=['POST'])
def login():
    data = request.get_json() or {}
    errors = validate_login(data)
    if errors:
        return error_response("Validation failed", errors=errors, status_code=400)

    email = data['email'].strip().lower()
    password = data['password']

    user = User.query.filter_by(email=email).first()
    if not user or not user.check_password(password):
        return error_response("Invalid email or password", errors=["Authentication failed"], status_code=401)

    access_token = create_access_token(identity=str(user.id))

    return success_response(
        data={
            'user': user.to_dict(),
            'token': access_token
        },
        message="Login successful",
        status_code=200
    )


@auth_bp.route('/me', methods=['GET'])
@jwt_required()
def get_current_user():
    user_id = int(get_jwt_identity())
    user = db.session.get(User, user_id)
    if not user:
        return error_response("User not found", status_code=404)

    return success_response(data=user.to_dict(), message="User profile retrieved")
