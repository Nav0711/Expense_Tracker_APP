from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List
from .. import models, schemas
from ..database import get_db

router = APIRouter(prefix="/expenses", tags=["Expenses"])

@router.post("/", response_model=schemas.ExpenseOut)
def create_expense(
    expense: schemas.ExpenseCreate,
    user_id: int = Query(..., description="User ID to attach the expense"),
    db: Session = Depends(get_db),
):
    user = db.query(models.User).filter(models.User.id == user_id).first()
    if not user:
        raise HTTPException(404, "User not found")

    obj = models.Expense(**expense.dict(), user_id=user_id)
    db.add(obj)
    db.commit()
    db.refresh(obj)  # ensures DB-generated fields are loaded (created_at, id)
    return obj

@router.get("/", response_model=List[schemas.ExpenseOut])
def list_expenses(
    user_id: int = Query(..., description="User ID to filter"),
    db: Session = Depends(get_db),
):
    q = db.query(models.Expense).filter(models.Expense.user_id == user_id).order_by(models.Expense.date.desc().nullslast(), models.Expense.id.desc())
    return q.all()
