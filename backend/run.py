import os
from app import create_app

app = create_app()

@app.route('/api/health', methods=['GET'])
def health_check():
    return {'status': 'healthy', 'service': 'Personal Finance Advisor API', 'version': '1.0.0'}, 200

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5000))
    host = os.environ.get('HOST', '0.0.0.0')
    debug = os.environ.get('FLASK_ENV') == 'development'
    print(f"Starting Personal Finance Advisor API on http://{host}:{port}")
    app.run(host=host, port=port, debug=debug)
