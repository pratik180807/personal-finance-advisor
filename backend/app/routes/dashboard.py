from datetime import datetime, date
from flask import Blueprint, request
from flask_jwt_extended import jwt_required, get_jwt_identity
from app import db
from app.models.income import Income
from app.models.expense import Expense
from app.models.budget import Budget
from app.models.goal import SavingsGoal
from app.utils.health_score import calculate_budget_health
from app.services.financial_advisor import analyze_finances
from app.utils.helpers import success_response, error_response
from sqlalchemy import extract

dashboard_bp = Blueprint('dashboard', __name__)

@dashboard_bp.route('', methods=['GET'])
@jwt_required()
def get_dashboard_data():
    user_id = int(get_jwt_identity())
    now = datetime.now()
    cur_month = now.month
    cur_year = now.year

    # 1. All-time totals
    all_incomes = Income.query.filter_by(user_id=user_id).all()
    all_expenses = Expense.query.filter_by(user_id=user_id).all()

    total_income_all = sum(i.amount for i in all_incomes)
    total_expenses_all = sum(e.amount for e in all_expenses)
    total_savings_all = total_income_all - total_expenses_all
    savings_percentage_all = round((total_savings_all / total_income_all * 100), 1) if total_income_all > 0 else 0.0

    # 2. Current month totals
    month_incomes = [i for i in all_incomes if i.date.month == cur_month and i.date.year == cur_year]
    month_expenses = [e for e in all_expenses if e.date.month == cur_month and e.date.year == cur_year]

    cur_income = sum(i.amount for i in month_incomes)
    cur_expenses = sum(e.amount for e in month_expenses)
    cur_savings = cur_income - cur_expenses
    cur_savings_pct = round((cur_savings / cur_income * 100), 1) if cur_income > 0 else 0.0

    # 3. Category spending for current month
    cat_spending = {}
    for exp in month_expenses:
        cat_spending[exp.category] = cat_spending.get(exp.category, 0.0) + exp.amount

    top_categories = [
        {'category': cat, 'amount': round(amt, 2), 'percentage': round((amt / cur_expenses * 100), 1) if cur_expenses > 0 else 0}
        for cat, amt in sorted(cat_spending.items(), key=lambda x: x[1], reverse=True)
    ]

    # 4. Budget utilization
    budgets = Budget.query.filter_by(user_id=user_id, month=cur_month, year=cur_year).all()
    budgets_summary = []
    for b in budgets:
        spent = round(cat_spending.get(b.category, 0.0), 2)
        remaining = round(b.amount - spent, 2)
        pct = round((spent / b.amount * 100), 1) if b.amount > 0 else 0.0
        status = "Over Budget" if spent > b.amount else ("Approaching Limit" if pct >= 80 else "Within Budget")

        budgets_summary.append({
            'id': b.id,
            'category': b.category,
            'budget': b.amount,
            'spent': spent,
            'remaining': remaining,
            'percentage_used': pct,
            'status': status
        })

    # 5. Active savings goals
    goals = SavingsGoal.query.filter_by(user_id=user_id).order_by(SavingsGoal.created_at.desc()).all()
    goals_summary = [g.to_dict() for g in goals]

    # 6. Budget Health Score
    health_info = calculate_budget_health(
        income=cur_income,
        expenses=cur_expenses,
        budgets_summary=budgets_summary,
        goals_summary=goals_summary
    )

    # 7. AI / Rule insights
    advisor_insights = analyze_finances(
        income_total=cur_income,
        expenses_total=cur_expenses,
        category_spending=cat_spending,
        budgets_data=budgets_summary,
        goals_data=goals_summary
    )

    # Extract top actionable items for the Dashboard AI card
    primary_warning = advisor_insights['warnings'][0] if advisor_insights['warnings'] else None
    primary_recommendation = (
        advisor_insights['saving_opportunities'][0] if advisor_insights['saving_opportunities']
        else (advisor_insights['suggested_actions'][0] if advisor_insights['suggested_actions'] else "Keep recording transactions daily to build your financial history.")
    )

    ai_card = {
        'summary': advisor_insights['summary'],
        'warning': primary_warning,
        'recommendation': primary_recommendation,
        'suggested_action': advisor_insights['suggested_actions'][0] if advisor_insights['suggested_actions'] else "Set category budgets to maintain strong cash flow control.",
        'disclaimer': advisor_insights['disclaimer']
    }

    # 8. Recent unified transactions (last 8)
    combined_txns = []
    for inc in month_incomes if month_incomes else all_incomes[-5:]:
        combined_txns.append({
            'id': f'inc-{inc.id}',
            'raw_id': inc.id,
            'type': 'income',
            'title': inc.source,
            'category': inc.source,
            'amount': inc.amount,
            'date': inc.date.isoformat(),
            'description': inc.description,
            'payment_method': 'Direct Deposit'
        })
    for exp in month_expenses if month_expenses else all_expenses[-10:]:
        combined_txns.append({
            'id': f'exp-{exp.id}',
            'raw_id': exp.id,
            'type': 'expense',
            'title': exp.category,
            'category': exp.category,
            'amount': exp.amount,
            'date': exp.date.isoformat(),
            'description': exp.description,
            'payment_method': exp.payment_method
        })

    combined_txns.sort(key=lambda x: x['date'], reverse=True)
    recent_transactions = combined_txns[:8]

    # 9. Monthly spending trend (last 6 months)
    monthly_trend = []
    # Build a 6-month sequence ending with current month
    for offset in range(5, -1, -1):
        # Calculate target month and year
        target_month = (cur_month - offset - 1) % 12 + 1
        target_year = cur_year if cur_month - offset > 0 else cur_year - 1
        month_label = datetime(target_year, target_month, 1).strftime('%b %Y')

        m_inc = sum(i.amount for i in all_incomes if i.date.month == target_month and i.date.year == target_year)
        m_exp = sum(e.amount for e in all_expenses if e.date.month == target_month and e.date.year == target_year)

        monthly_trend.append({
            'month': month_label,
            'month_num': target_month,
            'year': target_year,
            'income': round(m_inc, 2),
            'expenses': round(m_exp, 2),
            'savings': round(m_inc - m_exp, 2)
        })

    return success_response(data={
        'total_income': round(total_income_all, 2),
        'total_expenses': round(total_expenses_all, 2),
        'total_savings': round(total_savings_all, 2),
        'savings_percentage': savings_percentage_all,
        'current_month_income': round(cur_income, 2),
        'current_month_expenses': round(cur_expenses, 2),
        'current_month_savings': round(cur_savings, 2),
        'current_month_savings_percentage': cur_savings_pct,
        'current_month_name': now.strftime('%B %Y'),
        'top_spending_categories': top_categories,
        'budget_utilization': budgets_summary,
        'active_savings_goals': goals_summary,
        'financial_health': health_info,
        'ai_insight': ai_card,
        'recent_transactions': recent_transactions,
        'monthly_trend': monthly_trend
    }, message="Dashboard data retrieved successfully")
