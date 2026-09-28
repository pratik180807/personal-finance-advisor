def test_registration_success(client):
    res = client.post('/api/auth/register', json={
        'name': 'Rahul Sharma',
        'email': 'rahul@example.com',
        'password': 'secretpassword',
        'confirm_password': 'secretpassword'
    })
    assert res.status_code == 201
    data = res.get_json()
    assert data['success'] is True
    assert 'token' in data['data']
    assert data['data']['user']['email'] == 'rahul@example.com'

def test_registration_duplicate_email(client):
    client.post('/api/auth/register', json={
        'name': 'Rahul Sharma',
        'email': 'rahul@example.com',
        'password': 'secretpassword',
        'confirm_password': 'secretpassword'
    })
    # Try registering again with duplicate email
    res = client.post('/api/auth/register', json={
        'name': 'Rahul Sharma',
        'email': 'rahul@example.com',
        'password': 'secretpassword',
        'confirm_password': 'secretpassword'
    })
    assert res.status_code == 409
    assert res.get_json()['success'] is False

def test_registration_validation_mismatch(client):
    res = client.post('/api/auth/register', json={
        'name': 'Rahul',
        'email': 'rahul@example.com',
        'password': 'password123',
        'confirm_password': 'mismatchpassword'
    })
    assert res.status_code == 400
    assert res.get_json()['success'] is False

def test_login_success(client):
    client.post('/api/auth/register', json={
        'name': 'Priya Patel',
        'email': 'priya@example.com',
        'password': 'priyapassword',
        'confirm_password': 'priyapassword'
    })
    res = client.post('/api/auth/login', json={
        'email': 'priya@example.com',
        'password': 'priyapassword'
    })
    assert res.status_code == 200
    assert res.get_json()['success'] is True
    assert 'token' in res.get_json()['data']

def test_login_invalid_password(client):
    client.post('/api/auth/register', json={
        'name': 'Priya Patel',
        'email': 'priya@example.com',
        'password': 'priyapassword',
        'confirm_password': 'priyapassword'
    })
    res = client.post('/api/auth/login', json={
        'email': 'priya@example.com',
        'password': 'wrongpassword'
    })
    assert res.status_code == 401
    assert res.get_json()['success'] is False

def test_me_endpoint_requires_auth(client):
    res = client.get('/api/auth/me')
    assert res.status_code == 401

def test_me_endpoint_authenticated(client, auth_headers):
    res = client.get('/api/auth/me', headers=auth_headers)
    assert res.status_code == 200
    data = res.get_json()['data']
    assert data['email'] == 'tester@example.com'
