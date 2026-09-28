from app.services.financial_advisor import analyze_finances
from app.utils.health_score import calculate_budget_health

def test_rule_advisor_negative_cash_flow():
    # Expenses exceed income
    insights = analyze_finances(
        income_total=20000.0,
        expenses_total=25000.0,
        category_spending={'Housing': 15000.0, 'Food': 10000.0},
        budgets_data=[],
        goals_data=[]
    )
    assert any(w['type'] == 'negative_cash_flow' for w in insights['warnings'])
    assert insights['savings_rate'] < 0

def test_rule_advisor_budget_overrun():
    budgets = [{
        'category': 'Food',
        'budget': 5000.0,
        'spent': 6200.0,
        'remaining': -1200.0,
        'percentage_used': 124.0,
        'status': 'Over Budget'
    }]
    insights = analyze_finances(
        income_total=50000.0,
        expenses_total=30000.0,
        category_spending={'Food': 6200.0},
        budgets_data=budgets,
        goals_data=[]
    )
    assert len(insights['overspending_categories']) == 1
    assert insights['overspending_categories'][0]['category'] == 'Food'
    assert any(w['type'] == 'budget_exceeded' for w in insights['warnings'])

def test_rule_advisor_healthy_savings():
    insights = analyze_finances(
        income_total=50000.0,
        expenses_total=30000.0,
        category_spending={},
        budgets_data=[],
        goals_data=[]
    )
    assert insights['savings_rate'] == 40.0
    assert any(p['type'] == 'healthy_savings' for p in insights['positive_habits'])

def test_division_by_zero_safety():
    # Zero income case must never crash
    insights = analyze_finances(
        income_total=0.0,
        expenses_total=5000.0,
        category_spending={'Food': 5000.0},
        budgets_data=[],
        goals_data=[]
    )
    assert insights['savings_rate'] == 0.0

    health = calculate_budget_health(
        income=0.0,
        expenses=5000.0,
        budgets_summary=[],
        goals_summary=[]
    )
    assert 0 <= health['score'] <= 100

def test_monthly_report_api_and_pdf(client, auth_headers):
    # Add income and expense
    client.post('/api/income', headers=auth_headers, json={
        'amount': 30000.0,
        'source': 'Salary',
        'date': '2026-09-01'
    })
    client.post('/api/expenses', headers=auth_headers, json={
        'amount': 15000.0,
        'category': 'Housing',
        'date': '2026-09-02'
    })

    # JSON report
    res = client.get('/api/reports/monthly?month=9&year=2026', headers=auth_headers)
    assert res.status_code == 200
    rep = res.get_json()['data']
    assert rep['total_income'] == 30000.0
    assert rep['total_expenses'] == 15000.0
    assert rep['total_savings'] == 15000.0
    assert rep['savings_percentage'] == 50.0

    # PDF download
    res_pdf = client.get('/api/reports/monthly/pdf?month=9&year=2026', headers=auth_headers)
    assert res_pdf.status_code == 200
    assert res_pdf.mimetype == 'application/pdf'
    assert len(res_pdf.data) > 500  # valid PDF binary stream
