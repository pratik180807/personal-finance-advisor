import pytest
from app import create_app, db
from config import TestingConfig
from app.models.user import User

@pytest.fixture
def app():
    app = create_app(TestingConfig)
    with app.app_context():
        db.create_all()
        yield app
        db.session.remove()
        db.drop_all()

@pytest.fixture
def client(app):
    return app.test_client()

@pytest.fixture
def auth_headers(client):
    # Register and login a primary test user
    client.post('/api/auth/register', json={
        'name': 'Test User',
        'email': 'tester@example.com',
        'password': 'password123',
        'confirm_password': 'password123'
    })
    res = client.post('/api/auth/login', json={
        'email': 'tester@example.com',
        'password': 'password123'
    })
    token = res.get_json()['data']['token']
    return {'Authorization': f'Bearer {token}'}

@pytest.fixture
def other_auth_headers(client):
    # Register and login a second test user to verify data isolation
    client.post('/api/auth/register', json={
        'name': 'Other User',
        'email': 'other@example.com',
        'password': 'password456',
        'confirm_password': 'password456'
    })
    res = client.post('/api/auth/login', json={
        'email': 'other@example.com',
        'password': 'password456'
    })
    token = res.get_json()['data']['token']
    return {'Authorization': f'Bearer {token}'}
