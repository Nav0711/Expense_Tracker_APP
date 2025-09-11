from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import Optional
from datetime import date as dt_date
import pandas as pd
import os
from openai import OpenAI
from .. import models
from ..database import get_db

router = APIRouter(prefix="/analytics", tags=["Analytics"])

# Initialize OpenAI client using your key from .env
client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))

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

    # === AI-powered summary ===
    try:
        ai_prompt = f"""
        The user '{user.name}' has a daily allowance of {user.allowance}.
        They spent a total of {actual:.2f} over {len(daily)} days.
        Their expected spend was {expected:.2f}, meaning their savings are {savings:.2f}.
        They overspent on {overspend_days} day(s).
        Spending by category: {by_cat}.

        Please provide a short, helpful financial insight about their spending habits.
        """
        ai_response = client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[
                {"role": "system", "content": "You are a helpful financial advisor."},
                {"role": "user", "content": ai_prompt}
            ],
            max_tokens=150
        )
        ai_insight = ai_response.choices[0].message.content
    except Exception as e:
        ai_insight = f"AI insight could not be generated: {str(e)}"

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
        "ai_insight": ai_insight,
    }
