from typing import List, Optional
from datetime import date, datetime
from pydantic import BaseModel, EmailStr, ConfigDict

# ---------- Expense Schemas ----------

class ExpenseCreate(BaseModel):
    title: str
    amount: float
    category: Optional[str] = None
    date: Optional[date] = None

class ExpenseOut(ExpenseCreate):
    id: int
    user_id: int
    # created_at might be None just after creation on some drivers, so keep it optional
    created_at: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)

# ---------- User Schemas ----------

class UserCreate(BaseModel):
    name: str
    email: EmailStr
    allowance: float

class UserOut(UserCreate):
    id: int
    expenses: List[ExpenseOut] = []

    model_config = ConfigDict(from_attributes=True)
