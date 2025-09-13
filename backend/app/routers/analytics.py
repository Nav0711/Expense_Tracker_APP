from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import Optional
from datetime import date as dt_date
import pandas as pd
from .. import models
from ..database import get_db
from ..services.ai_services import ai_insight_enhanced  # ✅ Use enhanced version

router = APIRouter(prefix="/analytics", tags=["Analytics"])

@router.get("/{user_id}")
def get_user_analytics(
    user_id: int,
    date_from: Optional[dt_date] = None,
    date_to: Optional[dt_date] = None,
    db: Session = Depends(get_db),
):
    user = db.query(models.User).filter(models.User.id == user_id).first()
    if not user:
        raise HTTPException(404, "User not found")

    q = db.query(models.Expense).filter(models.Expense.user_id == user_id)
    if date_from:
        q = q.filter(models.Expense.date >= date_from)
    if date_to:
        q = q.filter(models.Expense.date <= date_to)

    rows = q.all()
    if not rows:
        return {
            "user_id": user_id,
            "name": user.name,
            "allowance": user.allowance,
            "expected_spend": 0,
            "actual_spend": 0,
            "savings": 0,
            "days_counted": 0,
            "overspend_days": 0,
            "by_category": {},
            "ai_insight": "No data available yet — start adding expenses to get insights!",
        }

    data = [
        {
            "amount": r.amount,
            "date": r.date,
            "category": r.category or "Uncategorized",
        }
        for r in rows
    ]
    df = pd.DataFrame(data)
    df["date"] = pd.to_datetime(df["date"])

    daily = df.groupby(df["date"].dt.date)["amount"].sum()
    expected = float(user.allowance) * int(len(daily))
    actual = float(daily.sum())
    savings = expected - actual
    overspend_days = int((daily > user.allowance).sum())
    by_cat = {str(k): float(v) for k, v in df.groupby("category")["amount"].sum().to_dict().items()}

    # ✅ Prepare a clean summary for AI
    summary = (
        f"User '{user.name}' has a daily allowance of ${user.allowance}. "
        f"Over {len(daily)} days, they spent ${actual:.2f} (expected ${expected:.2f}). "
        f"Savings: ${savings:.2f}. Overspent on {overspend_days} day(s). "
        f"Top categories: {dict(list(sorted(by_cat.items(), key=lambda x: x[1], reverse=True))[:3])}."
    )

    # ✅ Use enhanced AI insight with fallback data
    ai_result = ai_insight_enhanced(
        summary=summary,
        expected=expected,
        actual=actual,
        savings=savings,
        overspend_days=overspend_days,
        by_cat=by_cat
    )

    return {
        "user_id": user_id,
        "name": user.name,
        "allowance": user.allowance,
        "expected_spend": expected,
        "actual_spend": actual,
        "savings": savings,
        "days_counted": int(len(daily)),
        "overspend_days": overspend_days,
        "by_category": by_cat,
        "ai_insight": ai_result,
    }