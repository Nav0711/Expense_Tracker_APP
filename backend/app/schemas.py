from typing import List
from datetime import date, datetime
from pydantic import BaseModel, EmailStr, Field
from typing_extensions import Annotated

class ExpenseCreate(BaseModel):
    title: str
    amount: float
    category: str | None = None
    date: Annotated[date, Field(default_factory=date.today)]

class ExpenseOut(ExpenseCreate):
    id: int
    user_id: int
    created_at: datetime | None = None
    
    class Config:
        from_attributes = True

class UserCreate(BaseModel):
    name: str
    email: EmailStr
    allowance: float

class UserOut(UserCreate):
    id: int
    expenses: List[ExpenseOut] = []
    
    class Config:
        from_attributes = True