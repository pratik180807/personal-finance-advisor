from datetime import datetime
from flask import Blueprint, request
from flask_jwt_extended import jwt_required, get_jwt_identity
from app import db
from app.models.budget import Budget
from app.models.expense import Expense
from app.utils.validators import validate_amount, validate_month_year
from app.utils.helpers import success_response, error_response
from sqlalchemy import extract

budget_bp = Blueprint('budgets', __name__)

@budget_bp.route('', methods=['POST'])
@jwt_required()
def add_budget():
    user_id = int(get_jwt_identity())
    data = request.get_json() or {}

    category = str(data.get('category', '')).strip()
    if not category:
        return error_response("Budget category is required", errors=["Category cannot be empty"], status_code=400)

    amount, amount_err = validate_amount(data.get('amount'), "Budget amount")
    if amount_err:
        return error_response(amount_err, errors=[amount_err], status_code=400)

    now = datetime.now()
    month = data.get('month', now.month)
    year = data.get('year', now.year)

    m, y, my_err = validate_month_year(month, year)
    if my_err:
        return error_response(my_err, errors=[my_err], status_code=400)

    # Check for existing budget for category, month, year
    existing = Budget.query.filter_by(
        user_id=user_id,
        category=category,
        month=m,
        year=y
    ).first()

    if existing:
        # Update existing budget
        existing.amount = amount
        db.session.commit()
        return success_response(data=existing.to_dict(), message=f"Budget for {category} updated for {m}/{y}")

    budget = Budget(
        user_id=user_id,
        category=category,
        amount=amount,
        month=m,
        year=y
    )

    db.session.add(budget)
    db.session.commit()

    return success_response(data=budget.to_dict(), message="Budget created successfully", status_code=201)


@budget_bp.route('', methods=['GET'])
@jwt_required()
def get_budgets():
    user_id = int(get_jwt_identity())
    now = datetime.now()

    month = request.args.get('month', now.month)
    year = request.args.get('year', now.year)

    m, y, err = validate_month_year(month, year)
    if err:
        m, y = now.month, now.year

    budgets = Budget.query.filter_by(user_id=user_id, month=m, year=y).all()

    # Query all expenses for user in this month/year
    expenses = Expense.query.filter(
        Expense.user_id == user_id,
        extract('month', Expense.date) == m,
        extract('year', Expense.date) == y
    ).all()

    cat_spending = {}
    for exp in expenses:
        cat_spending[exp.category] = cat_spending.get(exp.category, 0.0) + exp.amount

    result = []
    total_budgeted = 0.0
    total_spent_on_budgeted = 0.0

    for b in budgets:
        spent = round(cat_spending.get(b.category, 0.0), 2)
        remaining = round(b.amount - spent, 2)
        pct_used = round((spent / b.amount * 100.0), 1) if b.amount > 0 else 0.0

        if spent > b.amount:
            status = "Over Budget"
        elif pct_used >= 80.0:
            status = "Approaching Limit"
        else:
            status = "Within Budget"

        total_budgeted += b.amount
        total_spent_on_budgeted += spent

        result.append({
            'id': b.id,
            'category': b.category,
            'amount': b.amount,
            'budget': b.amount,
            'spent': spent,
            'remaining': remaining,
            'percentage_used': pct_used,
            'status': status,
            'month': b.month,
            'year': b.year,
            'created_at': b.created_at.isoformat() if b.created_at else None
        })

    return success_response(data={
        'budgets': result,
        'total_budgeted': round(total_budgeted, 2),
        'total_spent': round(total_spent_on_budgeted, 2),
        'month': m,
        'year': y
    }, message="Budgets retrieved successfully")


@budget_bp.route('/<int:budget_id>', methods=['PUT'])
@jwt_required()
def update_budget(budget_id):
    user_id = int(get_jwt_identity())
    budget = Budget.query.filter_by(id=budget_id, user_id=user_id).first()

    if not budget:
        return error_response("Budget not found or unauthorized", status_code=404)

    data = request.get_json() or {}

    if 'amount' in data:
        amount, amount_err = validate_amount(data['amount'], "Budget amount")
        if amount_err:
            return error_response(amount_err, errors=[amount_err], status_code=400)
        budget.amount = amount

    if 'category' in data:
        cat = str(data['category']).strip()
        if not cat:
            return error_response("Category cannot be empty", status_code=400)
        budget.category = cat

    db.session.commit()
    return success_response(data=budget.to_dict(), message="Budget updated successfully")


@budget_bp.route('/<int:budget_id>', methods=['DELETE'])
@jwt_required()
def delete_budget(budget_id):
    user_id = int(get_jwt_identity())
    budget = Budget.query.filter_by(id=budget_id, user_id=user_id).first()

    if not budget:
        return error_response("Budget not found or unauthorized", status_code=404)

    db.session.delete(budget)
    db.session.commit()
    return success_response(message="Budget deleted successfully")
