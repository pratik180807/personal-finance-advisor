from datetime import datetime

def test_income_crud_and_isolation(client, auth_headers, other_auth_headers):
    # 1. Create income
    res = client.post('/api/income', headers=auth_headers, json={
        'amount': 50000.0,
        'source': 'Salary',
        'date': '2026-09-01',
        'description': 'Main salary'
    })
    assert res.status_code == 201
    income_id = res.get_json()['data']['id']

    # 2. List income
    res = client.get('/api/income', headers=auth_headers)
    assert res.status_code == 200
    assert len(res.get_json()['data']['incomes']) == 1
    assert res.get_json()['data']['total_amount'] == 50000.0

    # 3. Verify user isolation: other user should see 0 incomes
    res_other = client.get('/api/income', headers=other_auth_headers)
    assert res_other.status_code == 200
    assert len(res_other.get_json()['data']['incomes']) == 0

    # 4. Other user cannot update or delete this income
    res_hack = client.delete(f'/api/income/{income_id}', headers=other_auth_headers)
    assert res_hack.status_code == 404

    # 5. Delete own income
    res_del = client.delete(f'/api/income/{income_id}', headers=auth_headers)
    assert res_del.status_code == 200


def test_expense_crud_and_validation(client, auth_headers):
    # Zero or negative amount should fail
    res_bad = client.post('/api/expenses', headers=auth_headers, json={
        'amount': -500,
        'category': 'Food',
        'date': '2026-09-05'
    })
    assert res_bad.status_code == 400

    # Valid expense
    res = client.post('/api/expenses', headers=auth_headers, json={
        'amount': 2500.0,
        'category': 'Food',
        'date': '2026-09-05',
        'payment_method': 'UPI',
        'description': 'Dinner with friends'
    })
    assert res.status_code == 201
    exp_id = res.get_json()['data']['id']

    # Update expense
    res_up = client.put(f'/api/expenses/{exp_id}', headers=auth_headers, json={
        'amount': 2800.0,
        'description': 'Dinner and ice cream'
    })
    assert res_up.status_code == 200
    assert res_up.get_json()['data']['amount'] == 2800.0


def test_budget_utilization_calculation(client, auth_headers):
    now = datetime.now()
    month = now.month
    year = now.year

    # Create budget of 5000 for Food
    client.post('/api/budgets', headers=auth_headers, json={
        'category': 'Food',
        'amount': 5000.0,
        'month': month,
        'year': year
    })

    # Add expense of 4000
    client.post('/api/expenses', headers=auth_headers, json={
        'category': 'Food',
        'amount': 4000.0,
        'date': f"{year}-{month:02d}-10",
        'payment_method': 'UPI'
    })

    # Fetch budgets
    res = client.get(f'/api/budgets?month={month}&year={year}', headers=auth_headers)
    assert res.status_code == 200
    budgets = res.get_json()['data']['budgets']
    assert len(budgets) == 1
    b = budgets[0]
    assert b['budget'] == 5000.0
    assert b['spent'] == 4000.0
    assert b['remaining'] == 1000.0
    assert b['percentage_used'] == 80.0
    assert b['status'] == 'Approaching Limit'


def test_savings_goal_progress(client, auth_headers):
    res = client.post('/api/goals', headers=auth_headers, json={
        'name': 'Emergency Fund',
        'target_amount': 20000.0,
        'current_amount': 10000.0,
        'target_date': '2026-12-31'
    })
    assert res.status_code == 201
    goal = res.get_json()['data']
    assert goal['progress_percentage'] == 50.0
    assert goal['remaining_amount'] == 10000.0


def test_dashboard_calculations(client, auth_headers):
    now = datetime.now()
    cur_date = now.strftime('%Y-%m-%d')

    client.post('/api/income', headers=auth_headers, json={
        'amount': 40000.0,
        'source': 'Salary',
        'date': cur_date
    })
    client.post('/api/expenses', headers=auth_headers, json={
        'amount': 25000.0,
        'category': 'Housing',
        'date': cur_date
    })

    res = client.get('/api/dashboard', headers=auth_headers)
    assert res.status_code == 200
    d = res.get_json()['data']
    assert d['current_month_income'] == 40000.0
    assert d['current_month_expenses'] == 25000.0
    assert d['current_month_savings'] == 15000.0
    assert d['current_month_savings_percentage'] == 37.5
    assert 'financial_health' in d
    assert d['financial_health']['score'] > 0
