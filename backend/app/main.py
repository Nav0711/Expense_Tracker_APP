from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .database import Base, engine
from . import models  # ensure models are imported before create_all
from .routers import users, expenses, analytics

# Create tables if they don't exist (since you're not using Alembic)
Base.metadata.create_all(bind=engine)

app = FastAPI(title="Expense Tracker API")

# CORS (adjust for your frontend origin)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:8080", "http://127.0.0.1:8080"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def read_root():
    return {"message": "Expense Tracker backend is running 🚀"}

app.include_router(users.router)
app.include_router(expenses.router)
app.include_router(analytics.router)
