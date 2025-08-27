from sqlalchemy import Column, Integer, String, Float, Date, DateTime, ForeignKey, Index
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from .database import Base

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    email = Column(String, unique=True, index=True, nullable=False)
    allowance = Column(Float, default=0.0, nullable=False)

    expenses = relationship(
        "Expense",
        back_populates="user",
        cascade="all, delete-orphan"
    )

class Expense(Base):
    __tablename__ = "expenses"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), index=True, nullable=False)

    title = Column(String, nullable=False)
    amount = Column(Float, nullable=False)
    category = Column(String, nullable=True)

    # optional, expense date (what day the user says this belongs to)
    date = Column(Date, nullable=True)

    # server-side default so inserts always get a timestamp
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)

    user = relationship("User", back_populates="expenses")

# helpful index for filtering by user + date
Index("ix_expenses_user_date", Expense.user_id, Expense.date)
