from datetime import datetime, timezone
from app import db

class SavingsGoal(db.Model):
    __tablename__ = 'savings_goals'

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id', ondelete='CASCADE'), nullable=False, index=True)
    name = db.Column(db.String(150), nullable=False)
    target_amount = db.Column(db.Float, nullable=False)
    current_amount = db.Column(db.Float, default=0.0, nullable=False)
    target_date = db.Column(db.Date, nullable=True)
    description = db.Column(db.String(255), nullable=True)
    created_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc))

    def to_dict(self):
        progress_pct = 0.0
        if self.target_amount > 0:
            progress_pct = round(min(100.0, (self.current_amount / self.target_amount) * 100.0), 1)

        remaining_amount = max(0.0, round(self.target_amount - self.current_amount, 2))

        return {
            'id': self.id,
            'user_id': self.user_id,
            'name': self.name,
            'target_amount': round(float(self.target_amount), 2),
            'current_amount': round(float(self.current_amount), 2),
            'remaining_amount': remaining_amount,
            'progress_percentage': progress_pct,
            'target_date': self.target_date.isoformat() if self.target_date else None,
            'description': self.description or '',
            'is_completed': self.current_amount >= self.target_amount,
            'created_at': self.created_at.isoformat() if self.created_at else None
        }

    def __repr__(self):
        return f'<SavingsGoal {self.name}: ₹{self.current_amount}/₹{self.target_amount}>'
