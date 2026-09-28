from flask import Blueprint, request
from flask_jwt_extended import jwt_required, get_jwt_identity
from app import db
from app.models.expense import Expense
from app.utils.validators import validate_amount, validate_date, VALID_EXPENSE_CATEGORIES, VALID_PAYMENT_METHODS
from app.utils.helpers import success_response, error_response
from sqlalchemy import extract, or_

expense_bp = Blueprint('expenses', __name__)

@expense_bp.route('', methods=['POST'])
@jwt_required()
def add_expense():
    user_id = int(get_jwt_identity())
    data = request.get_json() or {}

    amount, amount_err = validate_amount(data.get('amount'))
    if amount_err:
        return error_response(amount_err, errors=[amount_err], status_code=400)

    category = str(data.get('category', '')).strip()
    if not category:
        return error_response("Expense category is required", errors=["Category cannot be empty"], status_code=400)

    date_val, date_err = validate_date(data.get('date'))
    if date_err:
        return error_response(date_err, errors=[date_err], status_code=400)

    payment_method = str(data.get('payment_method', 'Other')).strip()
    description = str(data.get('description', '')).strip()

    expense = Expense(
        user_id=user_id,
        amount=amount,
        category=category,
        description=description,
        date=date_val,
        payment_method=payment_method
    )

    db.session.add(expense)
    db.session.commit()

    return success_response(data=expense.to_dict(), message="Expense added successfully", status_code=201)


@expense_bp.route('', methods=['GET'])
@jwt_required()
def get_expenses():
    user_id = int(get_jwt_identity())
    query = Expense.query.filter_by(user_id=user_id)

    # Filtering by category
    category = request.args.get('category')
    if category and category != 'All':
        query = query.filter_by(category=category)

    # Filtering by payment method
    payment_method = request.args.get('payment_method')
    if payment_method and payment_method != 'All':
        query = query.filter_by(payment_method=payment_method)

    # Search keyword
    search = request.args.get('search', '').strip()
    if search:
        query = query.filter(
            or_(
                Expense.description.ilike(f'%{search}%'),
                Expense.category.ilike(f'%{search}%')
            )
        )

    # Month and Year filter
    month = request.args.get('month')
    year = request.args.get('year')
    if month and year:
        try:
            m = int(month)
            y = int(year)
            query = query.filter(extract('month', Expense.date) == m, extract('year', Expense.date) == y)
        except ValueError:
            pass

    # Date range filter
    start_date = request.args.get('start_date')
    end_date = request.args.get('end_date')
    if start_date:
        s_date, err = validate_date(start_date)
        if not err:
            query = query.filter(Expense.date >= s_date)
    if end_date:
        e_date, err = validate_date(end_date)
        if not err:
            query = query.filter(Expense.date <= e_date)

    # Sorting
    sort_by = request.args.get('sort_by', 'date')
    order = request.args.get('order', 'desc').lower()

    if sort_by == 'amount':
        query = query.order_by(Expense.amount.asc() if order == 'asc' else Expense.amount.desc())
    else:
        query = query.order_by(Expense.date.asc() if order == 'asc' else Expense.date.desc())

    expenses = query.all()
    total_amount = sum(e.amount for e in expenses)

    # Category breakdown for charts/filters
    category_totals = {}
    for e in expenses:
        category_totals[e.category] = category_totals.get(e.category, 0.0) + e.amount
    
    category_breakdown = [
        {'category': cat, 'amount': round(amt, 2), 'percentage': round((amt / total_amount * 100), 1) if total_amount > 0 else 0}
        for cat, amt in sorted(category_totals.items(), key=lambda x: x[1], reverse=True)
    ]

    return success_response(data={
        'expenses': [e.to_dict() for e in expenses],
        'total_amount': round(total_amount, 2),
        'category_breakdown': category_breakdown,
        'count': len(expenses)
    }, message="Expenses retrieved successfully")


@expense_bp.route('/<int:expense_id>', methods=['PUT'])
@jwt_required()
def update_expense(expense_id):
    user_id = int(get_jwt_identity())
    expense = Expense.query.filter_by(id=expense_id, user_id=user_id).first()

    if not expense:
        return error_response("Expense record not found or unauthorized", status_code=404)

    data = request.get_json() or {}

    if 'amount' in data:
        amount, amount_err = validate_amount(data['amount'])
        if amount_err:
            return error_response(amount_err, errors=[amount_err], status_code=400)
        expense.amount = amount

    if 'category' in data:
        category = str(data['category']).strip()
        if not category:
            return error_response("Category cannot be empty", status_code=400)
        expense.category = category

    if 'date' in data:
        date_val, date_err = validate_date(data['date'])
        if date_err:
            return error_response(date_err, errors=[date_err], status_code=400)
        expense.date = date_val

    if 'payment_method' in data:
        expense.payment_method = str(data['payment_method']).strip()

    if 'description' in data:
        expense.description = str(data['description']).strip()

    db.session.commit()
    return success_response(data=expense.to_dict(), message="Expense updated successfully")


@expense_bp.route('/<int:expense_id>', methods=['DELETE'])
@jwt_required()
def delete_expense(expense_id):
    user_id = int(get_jwt_identity())
    expense = Expense.query.filter_by(id=expense_id, user_id=user_id).first()

    if not expense:
        return error_response("Expense record not found or unauthorized", status_code=404)

    db.session.delete(expense)
    db.session.commit()
    return success_response(message="Expense deleted successfully")
