import datetime
import hashlib
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from database import get_db
from models import User
import schemas

router = APIRouter(prefix="/api/v1/auth", tags=["auth"])


@router.post("/signup")
def signup_user(req: schemas.SignupRequest, db: Session = Depends(get_db)):
    if not req.email or not req.password or not req.name:
        raise HTTPException(status_code=400, detail="Name, Email, and Password are required.")

    # Check if user already exists
    existing = db.query(User).filter(User.email == req.email.strip().lower()).first()
    if existing:
        raise HTTPException(status_code=400, detail="An account with this email already exists.")

    pwd_hash = hashlib.sha256(req.password.encode("utf-8")).hexdigest()
    new_user = User(
        email=req.email.strip().lower(),
        name=req.name.strip(),
        password_hash=pwd_hash,
        role=req.role or "Creator",
        created_at=datetime.datetime.now().isoformat()
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    return {
        "status": "success",
        "user": {
            "id": new_user.id,
            "name": new_user.name,
            "email": new_user.email,
            "role": new_user.role
        }
    }


@router.post("/login")
def login_user(req: schemas.LoginRequest, db: Session = Depends(get_db)):
    if not req.email or not req.password:
        raise HTTPException(status_code=400, detail="Email and Password are required.")

    pwd_hash = hashlib.sha256(req.password.encode("utf-8")).hexdigest()
    user = db.query(User).filter(User.email == req.email.strip().lower()).first()

    if not user or user.password_hash != pwd_hash:
        raise HTTPException(status_code=401, detail="Invalid email or password.")

    return {
        "status": "success",
        "user": {
            "id": user.id,
            "name": user.name,
            "email": user.email,
            "role": user.role
        }
    }
