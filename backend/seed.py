import sys
if sys.stdout.encoding != 'utf-8':
    try:
        sys.stdout.reconfigure(encoding='utf-8')
    except Exception:
        pass

from datetime import datetime, date, timedelta
from flask import current_app
from app import create_app, db
from app.models.user import User
from app.models.income import Income
from app.models.expense import Expense
from app.models.budget import Budget
from app.models.goal import SavingsGoal

def seed_database(app_instance=None, force=False):
    if current_app:
        target_app = current_app._get_current_object()
    elif app_instance:
        target_app = app_instance
    else:
        target_app = create_app()

    with target_app.app_context():
        print("🌱 Checking Personal Finance Advisor demo seed...")
        db.create_all()

        demo_email = "demo@financeadvisor.com"
        existing = User.query.filter_by(email=demo_email).first()
        if existing and not force:
            print(f"ℹ️ Demo user {demo_email} already initialized. Skipping duplicate seeding.")
            return existing

        if existing and force:
            print(f"⚠️ User {demo_email} already exists. Removing existing test records to re-seed...")
            db.session.delete(existing)
            db.session.commit()

        # 1. Create Demo User
        user = User(
            name="Pratik Patil",
            email=demo_email
        )
        user.set_password("Password123")
        db.session.add(user)
        db.session.commit()
        print(f"✅ Created User: {user.name} ({user.email}) / Password: Password123")

        now = datetime.now()
        cur_year = now.year
        cur_month = now.month

        # 2. Incomes for current month and previous 2 months
        # Current month
        incomes = [
            Income(user_id=user.id, amount=30000.0, source="Salary", date=date(cur_year, cur_month, 1), description="Monthly Tech Company Salary"),
            Income(user_id=user.id, amount=6500.0, source="Freelancing", date=date(cur_year, cur_month, 12), description="UI/UX Web Design Client Project"),
        ]

        # Prior month
        m_prev1 = (cur_month - 2) % 12 + 1
        y_prev1 = cur_year if cur_month > 1 else cur_year - 1
        incomes.append(Income(user_id=user.id, amount=30000.0, source="Salary", date=date(y_prev1, m_prev1, 1), description="Monthly Salary"))
        incomes.append(Income(user_id=user.id, amount=4000.0, source="Freelancing", date=date(y_prev1, m_prev1, 15), description="Content Writing Consulting"))

        # 2 months ago
        m_prev2 = (cur_month - 3) % 12 + 1
        y_prev2 = cur_year if cur_month > 2 else cur_year - 1
        incomes.append(Income(user_id=user.id, amount=28000.0, source="Salary", date=date(y_prev2, m_prev2, 1), description="Monthly Salary"))

        for inc in incomes:
            db.session.add(inc)

        # 3. Expenses for current month (realistic Indian numbers)
        current_expenses = [
            Expense(user_id=user.id, amount=8000.0, category="Housing", description="Apartment Rent via Bank Transfer", date=date(cur_year, cur_month, 2), payment_method="Bank Transfer"),
            Expense(user_id=user.id, amount=1200.0, category="Utilities", description="Electricity Bill (BESCOM/MSEDCL)", date=date(cur_year, cur_month, 4), payment_method="UPI"),
            Expense(user_id=user.id, amount=800.0, category="Utilities", description="High-speed Fiber WiFi", date=date(cur_year, cur_month, 5), payment_method="UPI"),
            Expense(user_id=user.id, amount=2200.0, category="Food", description="Monthly Grocery Stockup (DMart/Blinkit)", date=date(cur_year, cur_month, 6), payment_method="Card"),
            Expense(user_id=user.id, amount=1450.0, category="Food", description="Weekend Dining & Swiggy orders", date=date(cur_year, cur_month, 10), payment_method="UPI"),
            Expense(user_id=user.id, amount=850.0, category="Food", description="Office lunches & Chai", date=date(cur_year, cur_month, 15), payment_method="Cash"),
            Expense(user_id=user.id, amount=1800.0, category="Transportation", description="Monthly Metro Pass & Auto rides", date=date(cur_year, cur_month, 8), payment_method="UPI"),
            Expense(user_id=user.id, amount=700.0, category="Transportation", description="Fuel / Petrol refill", date=date(cur_year, cur_month, 18), payment_method="Card"),
            Expense(user_id=user.id, amount=2000.0, category="Education", description="Cloud Computing & Fullstack Course", date=date(cur_year, cur_month, 9), payment_method="Card"),
            Expense(user_id=user.id, amount=1500.0, category="Entertainment", description="Cinema outing & Streaming subscription", date=date(cur_year, cur_month, 14), payment_method="UPI"),
            Expense(user_id=user.id, amount=2100.0, category="Shopping", description="Festive clothing on Myntra", date=date(cur_year, cur_month, 16), payment_method="Card"),
            Expense(user_id=user.id, amount=450.0, category="Bills", description="Postpaid Mobile Recharge", date=date(cur_year, cur_month, 7), payment_method="UPI"),
        ]

        # Prior month expenses
        prev_expenses = [
            Expense(user_id=user.id, amount=8000.0, category="Housing", description="Rent", date=date(y_prev1, m_prev1, 2), payment_method="Bank Transfer"),
            Expense(user_id=user.id, amount=4100.0, category="Food", description="Groceries & Dining", date=date(y_prev1, m_prev1, 10), payment_method="UPI"),
            Expense(user_id=user.id, amount=2400.0, category="Transportation", description="Metro & Cab", date=date(y_prev1, m_prev1, 12), payment_method="UPI"),
            Expense(user_id=user.id, amount=1900.0, category="Utilities", description="Electricity and Internet", date=date(y_prev1, m_prev1, 6), payment_method="UPI"),
            Expense(user_id=user.id, amount=1800.0, category="Shopping", description="Footwear and Essentials", date=date(y_prev1, m_prev1, 18), payment_method="Card"),
            Expense(user_id=user.id, amount=1200.0, category="Entertainment", description="Concert Ticket", date=date(y_prev1, m_prev1, 20), payment_method="UPI"),
        ]

        for exp in current_expenses + prev_expenses:
            db.session.add(exp)

        # 4. Monthly Budgets for Current Month
        budgets = [
            Budget(user_id=user.id, category="Housing", amount=8500.0, month=cur_month, year=cur_year),
            Budget(user_id=user.id, category="Food", amount=4500.0, month=cur_month, year=cur_year),
            Budget(user_id=user.id, category="Transportation", amount=2500.0, month=cur_month, year=cur_year),
            Budget(user_id=user.id, category="Utilities", amount=2000.0, month=cur_month, year=cur_year),
            Budget(user_id=user.id, category="Entertainment", amount=1500.0, month=cur_month, year=cur_year),
            Budget(user_id=user.id, category="Shopping", amount=2000.0, month=cur_month, year=cur_year),
            Budget(user_id=user.id, category="Education", amount=2500.0, month=cur_month, year=cur_year),
        ]
        for b in budgets:
            db.session.add(b)

        # Also budgets for previous month so report works for previous month too
        prev_budgets = [
            Budget(user_id=user.id, category="Housing", amount=8500.0, month=m_prev1, year=y_prev1),
            Budget(user_id=user.id, category="Food", amount=4500.0, month=m_prev1, year=y_prev1),
            Budget(user_id=user.id, category="Transportation", amount=2500.0, month=m_prev1, year=y_prev1),
        ]
        for pb in prev_budgets:
            db.session.add(pb)

        # 5. Realistic Savings Goals
        goals = [
            SavingsGoal(
                user_id=user.id,
                name="Emergency Fund",
                target_amount=50000.0,
                current_amount=25000.0,
                target_date=date(cur_year, 12, 31),
                description="3 months living reserve in liquid high-interest savings"
            ),
            SavingsGoal(
                user_id=user.id,
                name="New Work Laptop",
                target_amount=60000.0,
                current_amount=36000.0,
                target_date=date(cur_year + 1, 3, 31),
                description="M3 MacBook Air or ThinkPad workstation upgrade"
            ),
            SavingsGoal(
                user_id=user.id,
                name="Goa Weekend Trip",
                target_amount=15000.0,
                current_amount=12000.0,
                target_date=date(cur_year, 11, 15),
                description="Travel, stay, and food for annual friends getaway"
            )
        ]
        for g in goals:
            db.session.add(g)

        db.session.commit()
        print("🎉 Seeding complete! Database successfully populated with realistic Indian financial data.")

if __name__ == '__main__':
    seed_database(force=True)
