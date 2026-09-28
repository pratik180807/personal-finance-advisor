from flask import Blueprint, request
from flask_jwt_extended import jwt_required, get_jwt_identity
from app import db
from app.models.goal import SavingsGoal
from app.utils.validators import validate_amount, validate_date
from app.utils.helpers import success_response, error_response

goal_bp = Blueprint('goals', __name__)

@goal_bp.route('', methods=['POST'])
@jwt_required()
def add_goal():
    user_id = int(get_jwt_identity())
    data = request.get_json() or {}

    name = str(data.get('name', '')).strip()
    if not name:
        return error_response("Goal name is required", errors=["Name cannot be empty"], status_code=400)

    target_amount, target_err = validate_amount(data.get('target_amount'), "Target amount")
    if target_err:
        return error_response(target_err, errors=[target_err], status_code=400)

    current_amount = 0.0
    if 'current_amount' in data and data['current_amount'] is not None and str(data['current_amount']).strip() != '':
        try:
            curr_val = float(data['current_amount'])
            if curr_val < 0:
                return error_response("Current amount cannot be negative", status_code=400)
            current_amount = round(curr_val, 2)
        except (ValueError, TypeError):
            return error_response("Current amount must be a number", status_code=400)

    target_date = None
    if data.get('target_date'):
        parsed_date, d_err = validate_date(data.get('target_date'))
        if d_err:
            return error_response(d_err, status_code=400)
        target_date = parsed_date

    description = str(data.get('description', '')).strip()

    goal = SavingsGoal(
        user_id=user_id,
        name=name,
        target_amount=target_amount,
        current_amount=current_amount,
        target_date=target_date,
        description=description
    )

    db.session.add(goal)
    db.session.commit()

    return success_response(data=goal.to_dict(), message="Savings goal created successfully", status_code=201)


@goal_bp.route('', methods=['GET'])
@jwt_required()
def get_goals():
    user_id = int(get_jwt_identity())
    goals = SavingsGoal.query.filter_by(user_id=user_id).order_by(SavingsGoal.created_at.desc()).all()

    total_target = sum(g.target_amount for g in goals)
    total_saved = sum(g.current_amount for g in goals)
    overall_progress = round((total_saved / total_target * 100), 1) if total_target > 0 else 0.0

    return success_response(data={
        'goals': [g.to_dict() for g in goals],
        'total_target': round(total_target, 2),
        'total_saved': round(total_saved, 2),
        'overall_progress': overall_progress,
        'count': len(goals)
    }, message="Savings goals retrieved successfully")


@goal_bp.route('/<int:goal_id>', methods=['PUT'])
@jwt_required()
def update_goal(goal_id):
    user_id = int(get_jwt_identity())
    goal = SavingsGoal.query.filter_by(id=goal_id, user_id=user_id).first()

    if not goal:
        return error_response("Savings goal not found or unauthorized", status_code=404)

    data = request.get_json() or {}

    if 'name' in data:
        name = str(data['name']).strip()
        if not name:
            return error_response("Goal name cannot be empty", status_code=400)
        goal.name = name

    if 'target_amount' in data:
        target_amount, target_err = validate_amount(data['target_amount'], "Target amount")
        if target_err:
            return error_response(target_err, errors=[target_err], status_code=400)
        goal.target_amount = target_amount

    if 'current_amount' in data:
        try:
            curr_val = float(data['current_amount'])
            if curr_val < 0:
                return error_response("Current amount cannot be negative", status_code=400)
            goal.current_amount = round(curr_val, 2)
        except (ValueError, TypeError):
            return error_response("Current amount must be a number", status_code=400)

    if 'target_date' in data:
        if data['target_date']:
            parsed_date, d_err = validate_date(data['target_date'])
            if d_err:
                return error_response(d_err, status_code=400)
            goal.target_date = parsed_date
        else:
            goal.target_date = None

    if 'description' in data:
        goal.description = str(data['description']).strip()

    db.session.commit()
    return success_response(data=goal.to_dict(), message="Savings goal updated successfully")


@goal_bp.route('/<int:goal_id>', methods=['DELETE'])
@jwt_required()
def delete_goal(goal_id):
    user_id = int(get_jwt_identity())
    goal = SavingsGoal.query.filter_by(id=goal_id, user_id=user_id).first()

    if not goal:
        return error_response("Savings goal not found or unauthorized", status_code=404)

    db.session.delete(goal)
    db.session.commit()
    return success_response(message="Savings goal deleted successfully")
