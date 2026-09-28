from flask import Blueprint, request
from flask_jwt_extended import jwt_required, get_jwt_identity
from app import db
from app.models.income import Income
from app.utils.validators import validate_amount, validate_date, VALID_INCOME_SOURCES
from app.utils.helpers import success_response, error_response
from sqlalchemy import extract

income_bp = Blueprint('income', __name__)

@income_bp.route('', methods=['POST'])
@jwt_required()
def add_income():
    user_id = int(get_jwt_identity())
    data = request.get_json() or {}

    amount, amount_err = validate_amount(data.get('amount'))
    if amount_err:
        return error_response(amount_err, errors=[amount_err], status_code=400)

    source = str(data.get('source', '')).strip()
    if not source:
        return error_response("Income source is required", errors=["Source cannot be empty"], status_code=400)

    date_val, date_err = validate_date(data.get('date'))
    if date_err:
        return error_response(date_err, errors=[date_err], status_code=400)

    description = str(data.get('description', '')).strip()

    income = Income(
        user_id=user_id,
        amount=amount,
        source=source,
        date=date_val,
        description=description
    )

    db.session.add(income)
    db.session.commit()

    return success_response(data=income.to_dict(), message="Income added successfully", status_code=201)


@income_bp.route('', methods=['GET'])
@jwt_required()
def get_incomes():
    user_id = int(get_jwt_identity())
    query = Income.query.filter_by(user_id=user_id)

    # Filtering
    source = request.args.get('source')
    if source:
        query = query.filter_by(source=source)

    month = request.args.get('month')
    year = request.args.get('year')
    if month and year:
        try:
            m = int(month)
            y = int(year)
            query = query.filter(extract('month', Income.date) == m, extract('year', Income.date) == y)
        except ValueError:
            pass

    start_date = request.args.get('start_date')
    end_date = request.args.get('end_date')
    if start_date:
        s_date, err = validate_date(start_date)
        if not err:
            query = query.filter(Income.date >= s_date)
    if end_date:
        e_date, err = validate_date(end_date)
        if not err:
            query = query.filter(Income.date <= e_date)

    # Sorting
    sort_by = request.args.get('sort_by', 'date')
    order = request.args.get('order', 'desc').lower()

    if sort_by == 'amount':
        query = query.order_by(Income.amount.asc() if order == 'asc' else Income.amount.desc())
    else:
        query = query.order_by(Income.date.asc() if order == 'asc' else Income.date.desc())

    incomes = query.all()
    total_amount = sum(i.amount for i in incomes)

    return success_response(data={
        'incomes': [i.to_dict() for i in incomes],
        'total_amount': round(total_amount, 2),
        'count': len(incomes)
    }, message="Incomes retrieved successfully")


@income_bp.route('/<int:income_id>', methods=['PUT'])
@jwt_required()
def update_income(income_id):
    user_id = int(get_jwt_identity())
    income = Income.query.filter_by(id=income_id, user_id=user_id).first()

    if not income:
        return error_response("Income record not found or unauthorized", status_code=404)

    data = request.get_json() or {}

    if 'amount' in data:
        amount, amount_err = validate_amount(data['amount'])
        if amount_err:
            return error_response(amount_err, errors=[amount_err], status_code=400)
        income.amount = amount

    if 'source' in data:
        source = str(data['source']).strip()
        if not source:
            return error_response("Income source cannot be empty", status_code=400)
        income.source = source

    if 'date' in data:
        date_val, date_err = validate_date(data['date'])
        if date_err:
            return error_response(date_err, errors=[date_err], status_code=400)
        income.date = date_val

    if 'description' in data:
        income.description = str(data['description']).strip()

    db.session.commit()
    return success_response(data=income.to_dict(), message="Income updated successfully")


@income_bp.route('/<int:income_id>', methods=['DELETE'])
@jwt_required()
def delete_income(income_id):
    user_id = int(get_jwt_identity())
    income = Income.query.filter_by(id=income_id, user_id=user_id).first()

    if not income:
        return error_response("Income record not found or unauthorized", status_code=404)

    db.session.delete(income)
    db.session.commit()
    return success_response(message="Income deleted successfully")
