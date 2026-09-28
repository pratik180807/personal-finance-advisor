from flask import Flask, jsonify
from flask_sqlalchemy import SQLAlchemy
from flask_jwt_extended import JWTManager
from flask_cors import CORS
from config import Config

db = SQLAlchemy()
jwt = JWTManager()
cors = CORS()

def create_app(config_class=Config):
    app = Flask(__name__)
    app.config.from_object(config_class)

    # Initialize extensions
    db.init_app(app)
    jwt.init_app(app)
    cors.init_app(app, resources={r"/api/*": {"origins": app.config.get('CORS_ORIGINS', '*')}})

    # JWT Error handlers
    @jwt.unauthorized_loader
    def unauthorized_callback(callback):
        return jsonify({
            'success': False,
            'message': 'Missing authorization header or token',
            'errors': ['Authentication is required to access this endpoint']
        }), 401

    @jwt.invalid_token_loader
    def invalid_token_callback(callback):
        return jsonify({
            'success': False,
            'message': 'Invalid authentication token',
            'errors': ['The provided token is malformed or invalid']
        }), 401

    @jwt.expired_token_loader
    def expired_token_callback(jwt_header, jwt_payload):
        return jsonify({
            'success': False,
            'message': 'Session expired',
            'errors': ['The authentication token has expired. Please log in again.']
        }), 401

    # Standard HTTP Error handlers (prevent exposing internal Python tracebacks)
    @app.errorhandler(400)
    def bad_request_error(e):
        return jsonify({'success': False, 'message': 'Bad Request', 'errors': [str(e)]}), 400

    @app.errorhandler(404)
    def not_found_error(e):
        return jsonify({'success': False, 'message': 'Resource Not Found', 'errors': ['The requested endpoint or record does not exist']}), 404

    @app.errorhandler(405)
    def method_not_allowed_error(e):
        return jsonify({'success': False, 'message': 'Method Not Allowed', 'errors': ['The HTTP method is not allowed for this route']}), 405

    @app.errorhandler(500)
    def internal_server_error(e):
        return jsonify({'success': False, 'message': 'Internal Server Error', 'errors': ['An unexpected server error occurred. Please try again later.']}), 500

    # Register API Blueprints
    from app.routes.auth import auth_bp
    from app.routes.income import income_bp
    from app.routes.expenses import expense_bp
    from app.routes.budgets import budget_bp
    from app.routes.goals import goal_bp
    from app.routes.dashboard import dashboard_bp
    from app.routes.analysis import analysis_bp
    from app.routes.reports import report_bp

    app.register_blueprint(auth_bp, url_prefix='/api/auth')
    app.register_blueprint(income_bp, url_prefix='/api/income')
    app.register_blueprint(expense_bp, url_prefix='/api/expenses')
    app.register_blueprint(budget_bp, url_prefix='/api/budgets')
    app.register_blueprint(goal_bp, url_prefix='/api/goals')
    app.register_blueprint(dashboard_bp, url_prefix='/api/dashboard')
    app.register_blueprint(analysis_bp, url_prefix='/api/analysis')
    app.register_blueprint(report_bp, url_prefix='/api/reports')

    # Serve compiled React frontend if dist/ exists
    import os
    from flask import send_from_directory
    
    potential_dist_paths = [
        os.environ.get('FRONTEND_DIST'),
        os.path.abspath(os.path.join(app.root_path, '../../frontend/dist')),
        os.path.abspath(os.path.join(app.root_path, '../frontend/dist')),
        os.path.abspath(os.path.join(os.getcwd(), 'frontend/dist')),
    ]
    dist_dir = next((p for p in potential_dist_paths if p and os.path.exists(p)), None)

    if dist_dir:
        @app.route('/', defaults={'path': ''})
        @app.route('/<path:path>')
        def serve_spa(path):
            if path.startswith('api/'):
                return jsonify({'success': False, 'message': 'API route not found'}), 404
            target_path = os.path.join(dist_dir, path)
            if path != '' and os.path.exists(target_path) and os.path.isfile(target_path):
                return send_from_directory(dist_dir, path)
            return send_from_directory(dist_dir, 'index.html')

    # Initialize tables and optionally auto-seed demo user if database is fresh
    with app.app_context():
        db.create_all()
        if app.config.get('AUTO_SEED_DEMO', True):
            try:
                from app.models.user import User
                if not User.query.filter_by(email="demo@financeadvisor.com").first():
                    from seed import seed_database
                    seed_database(app_instance=app, force=False)
            except Exception as e:
                app.logger.info(f"Auto-seeding check notice: {e}")

    return app
