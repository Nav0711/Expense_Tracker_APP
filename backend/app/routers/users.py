from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from .. import models, schemas
from ..database import get_db

router = APIRouter(prefix="/users", tags=["Users"])

@router.post("/", response_model=schemas.UserOut)
def create_user(user: schemas.UserCreate, db: Session = Depends(get_db)):
    # Check if user already exists by clerk_id
    existing_user = db.query(models.User).filter(models.User.clerk_id == user.clerk_id).first()
    if existing_user:
        return existing_user  
    
    db_user = models.User(**user.dict())
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    return db_user

@router.post("/sync-clerk-user", response_model=schemas.UserOut)
def sync_clerk_user(user_data: dict, db: Session = Depends(get_db)):
    """
    Endpoint to sync user data from Clerk to our database
    Expected format from frontend:
    {
        "clerk_id": "user_xxx",
        "name": "John Doe", 
        "email": "john@example.com"
    }
    """
    try:
        clerk_id = user_data.get("clerk_id")
        name = user_data.get("name") or user_data.get("firstName", "") + " " + user_data.get("lastName", "")
        email = user_data.get("email")
        
        if not clerk_id or not email:
            raise HTTPException(400, "clerk_id and email are required")
        
        # Check if user already exists
        existing_user = db.query(models.User).filter(models.User.clerk_id == clerk_id).first()
        
        if existing_user:
            # Update existing user if needed
            existing_user.name = name.strip()
            existing_user.email = email
            db.commit()
            db.refresh(existing_user)
            return existing_user
        else:
            # Create new user
            new_user = models.User(
                clerk_id=clerk_id,
                name=name.strip(),
                email=email,
                allowance=0.0  # Default allowance
            )
            db.add(new_user)
            db.commit()
            db.refresh(new_user)
            return new_user
            
    except Exception as e:
        raise HTTPException(500, f"Error syncing user: {str(e)}")

# Get user by clerk_id
@router.get("/clerk/{clerk_id}", response_model=schemas.UserOut)
def get_user_by_clerk_id(clerk_id: str, db: Session = Depends(get_db)):
    user = db.query(models.User).filter(models.User.clerk_id == clerk_id).first()
    if not user:
        raise HTTPException(404, "User not found")
    return user
