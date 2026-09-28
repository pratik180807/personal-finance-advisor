from datetime import datetime
from flask import Blueprint, request, send_file
from flask_jwt_extended import jwt_required, get_jwt_identity
from app import db
from app.models.user import User
from app.models.income import Income
from app.models.expense import Expense
from app.models.budget import Budget
from app.models.goal import SavingsGoal
from app.services.financial_advisor import analyze_finances
from app.services.report_service import ReportService
from app.utils.validators import validate_month_year
from app.utils.helpers import success_response, error_response
from sqlalchemy import extract

report_bp = Blueprint('reports', __name__)

def _get_monthly_data(user_id, month, year):
    incomes = Income.query.filter(
        Income.user_id == user_id,
        extract('month', Income.date) == month,
        extract('year', Income.date) == year
    ).all()

    expenses = Expense.query.filter(
        Expense.user_id == user_id,
        extract('month', Expense.date) == month,
        extract('year', Expense.date) == year
    ).all()

    total_income = round(sum(i.amount for i in incomes), 2)
    total_expenses = round(sum(e.amount for e in expenses), 2)
    total_savings = round(total_income - total_expenses, 2)
    savings_pct = round((total_savings / total_income * 100), 1) if total_income > 0 else 0.0

    # Category breakdown
    cat_totals = {}
    for exp in expenses:
        cat_totals[exp.category] = cat_totals.get(exp.category, 0.0) + exp.amount

    sorted_categories = sorted(cat_totals.items(), key=lambda x: x[1], reverse=True)
    category_wise = [
        {
            'category': cat,
            'amount': round(amt, 2),
            'percentage': round((amt / total_expenses * 100), 1) if total_expenses > 0 else 0
        }
        for cat, amt in sorted_categories
    ]

    highest_spending = f"{sorted_categories[0][0]} (₹{sorted_categories[0][1]:,.2f})" if sorted_categories else "None"
    lowest_spending = f"{sorted_categories[-1][0]} (₹{sorted_categories[-1][1]:,.2f})" if sorted_categories else "None"

    # Budgets
    budgets = Budget.query.filter_by(user_id=user_id, month=month, year=year).all()
    budget_vs_actual = []
    for b in budgets:
        spent = round(cat_totals.get(b.category, 0.0), 2)
        remaining = round(b.amount - spent, 2)
        pct = round((spent / b.amount * 100), 1) if b.amount > 0 else 0.0
        status = "Over Budget" if spent > b.amount else ("Approaching Limit" if pct >= 80 else "Within Budget")

        budget_vs_actual.append({
            'category': b.category,
            'budget': b.amount,
            'spent': spent,
            'remaining': remaining,
            'percentage_used': pct,
            'status': status
        })

    # Goals
    goals = SavingsGoal.query.filter_by(user_id=user_id).all()
    goals_progress = [g.to_dict() for g in goals]

    # AI Summary
    month_name = datetime(year, month, 1).strftime('%B')
    insights = analyze_finances(
        income_total=total_income,
        expenses_total=total_expenses,
        category_spending=cat_totals,
        budgets_data=budget_vs_actual,
        goals_data=goals_progress
    )

    ai_summary = (
        f"During {month_name} {year}, your total income was ₹{total_income:,.2f} and total expenses were ₹{total_expenses:,.2f}, "
        f"resulting in net savings of ₹{total_savings:,.2f} ({savings_pct}% savings rate). "
    )
    if sorted_categories:
        ai_summary += f"Your top expenditure was in {sorted_categories[0][0]} (₹{sorted_categories[0][1]:,.2f}). "
    if any(b['status'] == 'Over Budget' for b in budget_vs_actual):
        over_cats = [b['category'] for b in budget_vs_actual if b['status'] == 'Over Budget']
        ai_summary += f"Overspending occurred in: {', '.join(over_cats)}. Consider reviewing these categories next month."
    else:
        ai_summary += "All category budgets remained within planned limits. Keep up the disciplined spending!"

    return {
        'month': month,
        'year': year,
        'month_name': month_name,
        'total_income': total_income,
        'total_expenses': total_expenses,
        'total_savings': total_savings,
        'savings_percentage': savings_pct,
        'category_wise_expenses': category_wise,
        'budget_vs_actual': budget_vs_actual,
        'highest_spending_category': highest_spending,
        'lowest_spending_category': lowest_spending,
        'goals_progress': goals_progress,
        'ai_summary': ai_summary,
        'raw_incomes_count': len(incomes),
        'raw_expenses_count': len(expenses)
    }


@report_bp.route('/monthly', methods=['GET'])
@jwt_required()
def get_monthly_report():
    user_id = int(get_jwt_identity())
    now = datetime.now()

    month = request.args.get('month', now.month)
    year = request.args.get('year', now.year)

    m, y, err = validate_month_year(month, year)
    if err:
        m, y = now.month, now.year

    report = _get_monthly_data(user_id, m, y)
    return success_response(data=report, message=f"Monthly report for {report['month_name']} {y} generated successfully")


@report_bp.route('/monthly/pdf', methods=['GET'])
@jwt_required()
def download_monthly_pdf():
    user_id = int(get_jwt_identity())
    user = db.session.get(User, user_id)
    if not user:
        return error_response("User not found", status_code=404)

    now = datetime.now()
    month = request.args.get('month', now.month)
    year = request.args.get('year', now.year)

    m, y, err = validate_month_year(month, year)
    if err:
        m, y = now.month, now.year

    report = _get_monthly_data(user_id, m, y)
    pdf_buffer = ReportService.generate_pdf(user, report['month_name'], y, report)

    filename = f"finance_report_{report['month_name'].lower()}_{y}.pdf"
    return send_file(
        pdf_buffer,
        mimetype='application/pdf',
        as_attachment=True,
        download_name=filename
    )
