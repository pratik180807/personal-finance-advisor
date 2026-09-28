import re
from datetime import datetime

EMAIL_REGEX = re.compile(r'^[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+$')

VALID_EXPENSE_CATEGORIES = [
    'Housing', 'Food', 'Transportation', 'Education', 'Healthcare',
    'Utilities', 'Entertainment', 'Shopping', 'Bills', 'Travel', 'Other'
]

VALID_INCOME_SOURCES = [
    'Salary', 'Freelancing', 'Part-time job', 'Allowance', 'Business', 'Other'
]

VALID_PAYMENT_METHODS = [
    'Cash', 'UPI', 'Card', 'Bank Transfer', 'Other'
]

def validate_registration(data):
    errors = []
    if not data:
        return ["Request body is missing"]

    name = str(data.get('name', '')).strip()
    email = str(data.get('email', '')).strip().lower()
    password = str(data.get('password', ''))
    confirm_password = str(data.get('confirm_password', ''))

    if not name:
        errors.append("Full Name is required")
    elif len(name) < 2 or len(name) > 100:
        errors.append("Full Name must be between 2 and 100 characters")

    if not email:
        errors.append("Email is required")
    elif not EMAIL_REGEX.match(email):
        errors.append("Please provide a valid email address")

    if not password:
        errors.append("Password is required")
    elif len(password) < 6:
        errors.append("Password must be at least 6 characters long")

    if password != confirm_password:
        errors.append("Password and confirmation password do not match")

    return errors


def validate_login(data):
    errors = []
    if not data:
        return ["Request body is missing"]

    email = str(data.get('email', '')).strip().lower()
    password = str(data.get('password', ''))

    if not email:
        errors.append("Email is required")
    if not password:
        errors.append("Password is required")

    return errors


def validate_amount(amount, field_name="Amount"):
    try:
        val = float(amount)
        if val <= 0:
            return None, f"{field_name} must be greater than 0"
        if val > 1000000000:  # 100 crore safety limit
            return None, f"{field_name} exceeds reasonable limit"
        return round(val, 2), None
    except (TypeError, ValueError):
        return None, f"{field_name} must be a valid positive number"


def validate_date(date_str):
    if not date_str:
        return datetime.utcnow().date(), None
    try:
        parsed = datetime.strptime(str(date_str).strip()[:10], '%Y-%m-%d').date()
        return parsed, None
    except (ValueError, TypeError):
        return None, "Invalid date format. Expected YYYY-MM-DD"


def validate_month_year(month, year):
    try:
        m = int(month)
        y = int(year)
        if m < 1 or m > 12:
            return None, None, "Month must be between 1 and 12"
        if y < 2000 or y > 2100:
            return None, None, "Year must be between 2000 and 2100"
        return m, y, None
    except (TypeError, ValueError):
        return None, None, "Month and year must be valid integers"
