def calculate_budget_health(income, expenses, budgets_summary, goals_summary):
    """
    Calculates a transparent Budget Health score (0 - 100).
    NOTE: This is strictly an application-generated budgeting metric based on user-entered data,
    NOT a formal credit score or professional financial rating.
    """
    factors = []
    total_score = 0

    # 1. Savings Rate Factor (Max 30 points)
    if income <= 0:
        savings_score = 0
        savings_status = "No Income Logged"
        savings_note = "Record your monthly income to evaluate savings health."
    else:
        savings = income - expenses
        savings_rate = (savings / income) * 100.0
        if savings_rate >= 30:
            savings_score = 30
            savings_status = "Excellent"
            savings_note = f"Saving {savings_rate:.1f}% of income (target >= 20%)."
        elif savings_rate >= 20:
            savings_score = 25
            savings_status = "Good"
            savings_note = f"Healthy savings rate of {savings_rate:.1f}%."
        elif savings_rate >= 10:
            savings_score = 18
            savings_status = "Moderate"
            savings_note = f"Modest savings rate of {savings_rate:.1f}%. Aim for 20%."
        elif savings_rate >= 0:
            savings_score = 10
            savings_status = "Low"
            savings_note = f"Savings rate is {savings_rate:.1f}%. High spending leaves little margin."
        else:
            savings_score = 0
            savings_status = "Critical (Negative)"
            savings_note = f"Spending exceeds income by ₹{abs(savings):,.2f}."

    total_score += savings_score
    factors.append({
        'name': 'Savings Rate',
        'score': savings_score,
        'max_score': 30,
        'status': savings_status,
        'note': savings_note
    })

    # 2. Budget Adherence Factor (Max 30 points)
    total_budgets = len(budgets_summary)
    if total_budgets == 0:
        budget_score = 15
        budget_status = "No Budgets Set"
        budget_note = "Setting monthly category budgets helps optimize spending control."
    else:
        over_budget_count = sum(1 for b in budgets_summary if b.get('spent', 0) > b.get('budget', 0))
        approaching_count = sum(1 for b in budgets_summary if 0.8 * b.get('budget', 0) < b.get('spent', 0) <= b.get('budget', 0))
        
        if over_budget_count == 0:
            if approaching_count == 0:
                budget_score = 30
                budget_status = "Good"
                budget_note = f"All {total_budgets} category budgets are well under control."
            else:
                budget_score = 25
                budget_status = "Good"
                budget_note = f"All budgets held, {approaching_count} near 80% threshold."
        elif over_budget_count == 1:
            budget_score = 18
            budget_status = "Moderate"
            budget_note = f"1 of {total_budgets} budgets exceeded this period."
        else:
            budget_score = max(5, 30 - (over_budget_count * 8))
            budget_status = "Needs Attention"
            budget_note = f"{over_budget_count} categories have exceeded their monthly limits."

    total_score += budget_score
    factors.append({
        'name': 'Budget Adherence',
        'score': budget_score,
        'max_score': 30,
        'status': budget_status,
        'note': budget_note
    })

    # 3. Expense-to-Income Ratio (Max 25 points)
    if income <= 0:
        expense_score = 0
        expense_status = "No Income"
        expense_note = "Income needed to measure expense ratio."
    else:
        ratio = expenses / income
        if ratio <= 0.50:
            expense_score = 25
            expense_status = "Good"
            expense_note = f"Spending is only {ratio*100:.1f}% of income (50/30/20 rule ideal)."
        elif ratio <= 0.70:
            expense_score = 22
            expense_status = "Good"
            expense_note = f"Expenses are {ratio*100:.1f}% of income."
        elif ratio <= 0.85:
            expense_score = 16
            expense_status = "Moderate"
            expense_note = f"Expenses take up {ratio*100:.1f}% of total income."
        elif ratio <= 1.00:
            expense_score = 10
            expense_status = "Tight"
            expense_note = f"Expenses consume {ratio*100:.1f}% of income."
        else:
            expense_score = 0
            expense_status = "Deficit"
            expense_note = f"Spending is {ratio*100:.1f}% of income (operating in deficit)."

    total_score += expense_score
    factors.append({
        'name': 'Expense Ratio',
        'score': expense_score,
        'max_score': 25,
        'status': expense_status,
        'note': expense_note
    })

    # 4. Goal Progress Factor (Max 15 points)
    total_goals = len(goals_summary)
    if total_goals == 0:
        goal_score = 8
        goal_status = "No Goals Active"
        goal_note = "Create a savings goal (like an Emergency Fund) to boost your score."
    else:
        avg_progress = sum(g.get('progress_percentage', 0) for g in goals_summary) / total_goals
        if avg_progress >= 60:
            goal_score = 15
            goal_status = "Good"
            goal_note = f"Active goals average {avg_progress:.1f}% completion."
        elif avg_progress >= 25:
            goal_score = 12
            goal_status = "Moderate"
            goal_note = f"Active goals average {avg_progress:.1f}% progress."
        else:
            goal_score = 8
            goal_status = "Starting Out"
            goal_note = f"Active goals are at {avg_progress:.1f}% progress."

    total_score += goal_score
    factors.append({
        'name': 'Goal Progress',
        'score': goal_score,
        'max_score': 15,
        'status': goal_status,
        'note': goal_note
    })

    # Overall grade
    final_score = min(100, max(0, total_score))
    if final_score >= 80:
        grade = "Excellent"
        grade_color = "emerald"
    elif final_score >= 65:
        grade = "Good"
        grade_color = "blue"
    elif final_score >= 50:
        grade = "Moderate"
        grade_color = "amber"
    else:
        grade = "Needs Attention"
        grade_color = "rose"

    return {
        'score': final_score,
        'max_score': 100,
        'grade': grade,
        'grade_color': grade_color,
        'factors': factors,
        'disclaimer': "This Budget Health indicator is an application-generated metric based on your recorded cash flow and budgets. It is for educational purposes only and is not a credit score or certified financial rating."
    }
