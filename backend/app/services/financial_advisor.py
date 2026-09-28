"""
Rule-based Financial Recommendation Engine
Provides deterministic, actionable personal finance insights based on 
user income, expenses, budgets, and savings goals.
"""

# Configurable threshold constants
SAVINGS_RATE_EXCELLENT_THRESHOLD = 20.0  # >= 20%
SAVINGS_RATE_LOW_THRESHOLD = 10.0        # < 10%
BUDGET_WARNING_THRESHOLD = 80.0          # >= 80% used
CATEGORY_DOMINANCE_THRESHOLD = 35.0      # single category > 35% of total expenses

DISCLAIMER_TEXT = "These insights are for educational and budgeting purposes only and are not professional financial advice."

def analyze_finances(income_total, expenses_total, category_spending, budgets_data, goals_data, previous_spending=None):
    """
    Analyzes current financial situation and produces structured recommendations.
    
    :param income_total: float
    :param expenses_total: float
    :param category_spending: dict of {category_name: amount}
    :param budgets_data: list of dicts with {category, budget, spent, remaining, percentage_used, status}
    :param goals_data: list of dicts with {name, target_amount, current_amount, progress_percentage}
    :param previous_spending: optional dict of previous month's category spending
    :return: dict with structured insights
    """
    savings = income_total - expenses_total
    savings_rate = (savings / income_total * 100.0) if income_total > 0 else 0.0

    warnings = []
    positive_habits = []
    saving_opportunities = []
    budget_recommendations = []
    suggested_actions = []
    overspending_categories = []

    # 1. Cash flow & Savings Analysis
    if income_total == 0 and expenses_total > 0:
        warnings.append({
            'type': 'no_income',
            'severity': 'high',
            'title': 'No Income Logged',
            'message': f"You have logged ₹{expenses_total:,.2f} in expenses this month, but no income records yet. Please log your monthly income for accurate tracking."
        })
    elif expenses_total > income_total:
        deficit = expenses_total - income_total
        warnings.append({
            'type': 'negative_cash_flow',
            'severity': 'critical',
            'title': 'Deficit Alert: Expenses Exceed Income',
            'message': f"Your expenses (₹{expenses_total:,.2f}) exceed your income (₹{income_total:,.2f}) by ₹{deficit:,.2f}. Review discretionary categories like Entertainment and Shopping to halt deficit spending."
        })
        suggested_actions.append(f"Cut back immediately on non-essential purchases to close the ₹{deficit:,.2f} gap.")
    elif savings_rate >= SAVINGS_RATE_EXCELLENT_THRESHOLD:
        positive_habits.append({
            'type': 'healthy_savings',
            'title': 'Strong Savings Discipline',
            'message': f"Your current savings rate is {savings_rate:.1f}%, keeping ₹{savings:,.2f} safe. You are maintaining an excellent monthly savings pattern exceeding the 20% benchmark."
        })
        suggested_actions.append("Consider allocating a portion of your monthly surplus towards high-priority savings goals or an emergency fund.")
    elif savings_rate < SAVINGS_RATE_LOW_THRESHOLD and income_total > 0:
        warnings.append({
            'type': 'low_savings',
            'severity': 'medium',
            'title': 'Low Savings Rate',
            'message': f"Your savings rate is {savings_rate:.1f}% (₹{savings:,.2f}). Financial planners typically recommend saving at least 20% of your earnings."
        })
        saving_opportunities.append("Review subscription services, dining out, and impulse shopping to raise your savings buffer towards 20%.")
    else:
        positive_habits.append({
            'type': 'moderate_savings',
            'title': 'Positive Cash Flow',
            'message': f"You are saving {savings_rate:.1f}% (₹{savings:,.2f}) of your income. Great start—try pushing towards 20% next month."
        })

    # 2. Budget Utilization Analysis
    budget_map = {b['category']: b for b in budgets_data}
    for b in budgets_data:
        cat = b['category']
        spent = b['spent']
        budget_amt = b['budget']
        pct = b['percentage_used']

        if spent > budget_amt:
            overage = spent - budget_amt
            overspending_categories.append({
                'category': cat,
                'spent': spent,
                'budget': budget_amt,
                'overage': overage,
                'percentage': pct
            })
            warnings.append({
                'type': 'budget_exceeded',
                'severity': 'high',
                'title': f"{cat} Budget Exceeded",
                'message': f"You spent ₹{spent:,.2f} on {cat} against your budget of ₹{budget_amt:,.2f} ({pct:.1f}% used). That is ₹{overage:,.2f} over limit."
            })
            suggested_actions.append(f"Freeze additional discretionary spending in {cat} for the remainder of this month.")
        elif pct >= BUDGET_WARNING_THRESHOLD:
            remaining = budget_amt - spent
            warnings.append({
                'type': 'budget_approaching',
                'severity': 'medium',
                'title': f"{cat} Budget Alert",
                'message': f"You have used {pct:.1f}% of your {cat} budget with only ₹{remaining:,.2f} remaining. Monitor expenses closely."
            })

    # 3. Category Spending Dominance & Opportunities
    sorted_categories = sorted(category_spending.items(), key=lambda x: x[1], reverse=True)
    if expenses_total > 0 and sorted_categories:
        top_cat, top_amt = sorted_categories[0]
        top_pct = (top_amt / expenses_total) * 100.0

        if top_pct >= CATEGORY_DOMINANCE_THRESHOLD and top_cat not in ['Housing']:
            saving_opportunities.append(
                f"{top_cat} accounts for {top_pct:.1f}% (₹{top_amt:,.2f}) of your total expenses. Look for bulk discounts, home cooking, or alternatives to reduce this major outflow."
            )

        # Check for unbudgeted high-spending categories
        for cat, amt in sorted_categories[:3]:
            if cat not in budget_map and amt > 0:
                suggested_budget = round(amt * 1.05, -2)  # 5% buffer rounded to nearest 100
                budget_recommendations.append({
                    'category': cat,
                    'current_spending': amt,
                    'recommended_budget': suggested_budget,
                    'reason': f"You spent ₹{amt:,.2f} on {cat} without an active budget. Setting a limit of ~₹{suggested_budget:,.2f} helps prevent surprise overruns."
                })

    # 4. Savings Goals Progress
    if not goals_data:
        suggested_actions.append("You don't have any active savings goals yet. Create an 'Emergency Fund' goal to build resilience.")
    else:
        for g in goals_data:
            name = g['name']
            pct = g.get('progress_percentage', 0)
            curr = g.get('current_amount', 0)
            target = g.get('target_amount', 0)
            rem = target - curr

            if "emergency" in name.lower():
                if pct >= 100:
                    positive_habits.append({
                        'type': 'emergency_fund_complete',
                        'title': 'Emergency Fund Secured',
                        'message': f"Your {name} goal is 100% funded! Having liquid reserves shields you from sudden financial shocks."
                    })
                else:
                    suggested_actions.append(f"Your {name} is at {pct:.1f}%. Keep allocating monthly savings to reach the ₹{target:,.2f} target.")
            elif pct >= 100:
                positive_habits.append({
                    'type': 'goal_achieved',
                    'title': f"Goal Achieved: {name}",
                    'message': f"Congratulations! You successfully reached your target of ₹{target:,.2f} for {name}."
                })

    # 5. High-level Summary Narrative
    if income_total > 0:
        summary = (
            f"This month you recorded ₹{income_total:,.2f} in total income and ₹{expenses_total:,.2f} in expenses, "
            f"resulting in net savings of ₹{savings:,.2f} ({savings_rate:.1f}% savings rate). "
        )
        if overspending_categories:
            over_names = ", ".join([o['category'] for o in overspending_categories])
            summary += f"Attention is needed in {over_names}, which exceeded allocated budgets. "
        else:
            summary += "Your budget discipline remained intact across all tracked categories. "
    else:
        summary = f"Total expenses recorded: ₹{expenses_total:,.2f}. Add your monthly income to unlock complete savings rate and cash flow analysis."

    return {
        'summary': summary,
        'savings_rate': round(savings_rate, 1),
        'net_savings': round(savings, 2),
        'overspending_categories': overspending_categories,
        'saving_opportunities': saving_opportunities,
        'budget_recommendations': budget_recommendations,
        'warnings': warnings,
        'positive_habits': positive_habits,
        'suggested_actions': suggested_actions,
        'disclaimer': DISCLAIMER_TEXT
    }
