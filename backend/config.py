import os
from datetime import timedelta
from dotenv import load_dotenv

basedir = os.path.abspath(os.path.dirname(__file__))
load_dotenv(os.path.join(basedir, '.env'))

class Config:
    # Secret keys for sessions and JWTs
    SECRET_KEY = os.environ.get('SECRET_KEY', 'dev-secret-key-finance-advisor-app-2026')
    JWT_SECRET_KEY = os.environ.get('JWT_SECRET_KEY', 'jwt-dev-secret-key-finance-advisor-2026')
    
    # JWT expiration in hours
    jwt_hours = int(os.environ.get('JWT_ACCESS_TOKEN_EXPIRES_HOURS', 24))
    JWT_ACCESS_TOKEN_EXPIRES = timedelta(hours=jwt_hours)
    
    # Database Configuration: PostgreSQL on Render/production, SQLite locally
    raw_db_url = os.environ.get('DATABASE_URL', '').strip()
    if raw_db_url:
        # Standardize Render/Heroku 'postgres://' to SQLAlchemy 'postgresql://'
        if raw_db_url.startswith("postgres://"):
            raw_db_url = raw_db_url.replace("postgres://", "postgresql://", 1)
        SQLALCHEMY_DATABASE_URI = raw_db_url
    else:
        # Local SQLite database fallback
        SQLALCHEMY_DATABASE_URI = f"sqlite:///{os.path.join(basedir, 'finance_advisor.db')}"

    SQLALCHEMY_TRACK_MODIFICATIONS = False

    # CORS origins (default to wildcard for same-origin and common dev ports)
    CORS_ORIGINS = [origin.strip() for origin in os.environ.get('CORS_ORIGINS', '*').split(',') if origin.strip()]

    # Optional AI integration (fallback rule engine is used if omitted)
    AI_API_KEY = os.environ.get('AI_API_KEY', None)
    AI_PROVIDER = os.environ.get('AI_PROVIDER', 'gemini')

    # Auto-initialize demo account if database is clean (ideal for Render first boot)
    AUTO_SEED_DEMO = os.environ.get('AUTO_SEED_DEMO', 'true').lower() in ('1', 'true', 'yes')


class TestingConfig(Config):
    TESTING = True
    SQLALCHEMY_DATABASE_URI = 'sqlite:///:memory:'
    JWT_SECRET_KEY = 'test-jwt-secret-key-that-is-very-long-and-secure-32bytes'
    SECRET_KEY = 'test-secret-key-that-is-very-long-and-secure-32bytes'
    AUTO_SEED_DEMO = False
