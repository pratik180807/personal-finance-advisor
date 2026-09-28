from datetime import datetime
from flask import Blueprint, request
from flask_jwt_extended import jwt_required, get_jwt_identity
from app.models.income import Income
from app.models.expense import Expense
from app.models.budget import Budget
from app.models.goal import SavingsGoal
from app.services.ai_service import AIService
from app.utils.health_score import calculate_budget_health
from app.utils.validators import validate_month_year
from app.utils.helpers import success_response, error_response
from sqlalchemy import extract

analysis_bp = Blueprint('analysis', __name__)

@analysis_bp.route('', methods=['POST', 'GET'])
@jwt_required()
def analyze():
    user_id = int(get_jwt_identity())
    now = datetime.now()

    data = (request.get_json() if request.is_json else None) or {}
    month = data.get('month', request.args.get('month', now.month))
    year = data.get('year', request.args.get('year', now.year))

    m, y, err = validate_month_year(month, year)
    if err:
        m, y = now.month, now.year

    # Fetch incomes & expenses for specified month & year
    incomes = Income.query.filter(
        Income.user_id == user_id,
        extract('month', Income.date) == m,
        extract('year', Income.date) == y
    ).all()

    expenses = Expense.query.filter(
        Expense.user_id == user_id,
        extract('month', Expense.date) == m,
        extract('year', Expense.date) == y
    ).all()

    total_income = sum(i.amount for i in incomes)
    total_expenses = sum(e.amount for e in expenses)

    cat_spending = {}
    for exp in expenses:
        cat_spending[exp.category] = cat_spending.get(exp.category, 0.0) + exp.amount

    # Fetch budgets for this period
    budgets = Budget.query.filter_by(user_id=user_id, month=m, year=y).all()
    budgets_summary = []
    for b in budgets:
        spent = round(cat_spending.get(b.category, 0.0), 2)
        pct = round((spent / b.amount * 100), 1) if b.amount > 0 else 0.0
        status = "Over Budget" if spent > b.amount else ("Approaching Limit" if pct >= 80 else "Within Budget")
        budgets_summary.append({
            'category': b.category,
            'budget': b.amount,
            'spent': spent,
            'remaining': round(b.amount - spent, 2),
            'percentage_used': pct,
            'status': status
        })

    # Fetch goals
    goals = SavingsGoal.query.filter_by(user_id=user_id).all()
    goals_summary = [g.to_dict() for g in goals]

    # Run AI / Rule-based advisor analysis
    insights = AIService.get_financial_insights(
        income_total=total_income,
        expenses_total=total_expenses,
        category_spending=cat_spending,
        budgets_data=budgets_summary,
        goals_data=goals_summary
    )

    # Health score
    health_score = calculate_budget_health(
        income=total_income,
        expenses=total_expenses,
        budgets_summary=budgets_summary,
        goals_summary=goals_summary
    )

    month_name = datetime(y, m, 1).strftime('%B %Y')

    return success_response(data={
        'month': m,
        'year': y,
        'period_name': month_name,
        'total_income': round(total_income, 2),
        'total_expenses': round(total_expenses, 2),
        'net_savings': round(total_income - total_expenses, 2),
        'savings_rate': insights.get('savings_rate', 0.0),
        'summary': insights.get('summary', ''),
        'overspending_categories': insights.get('overspending_categories', []),
        'saving_opportunities': insights.get('saving_opportunities', []),
        'budget_recommendations': insights.get('budget_recommendations', []),
        'warnings': insights.get('warnings', []),
        'positive_habits': insights.get('positive_habits', []),
        'suggested_actions': insights.get('suggested_actions', []),
        'budget_health': health_score,
        'advisor_mode': insights.get('advisor_mode', 'rule_based'),
        'ai_enhanced': insights.get('ai_enhanced', False),
        'disclaimer': insights.get('disclaimer')
    }, message="Financial analysis generated successfully")
