from fastapi import FastAPI, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from pydantic import BaseModel, Field
import os

import models
from models import Users, Donors, BloodRequests
from typing import Annotated, Optional
from database import engine, sessionLocal
from fastapi.responses import JSONResponse
from router import auth, admin, donor, requester
from router.auth import get_current_user

# Initialize FastAPI Application
app = FastAPI(
    title="Blood Donation Platform API",
    description="Blood Donation Platform Backend API - Find blood donors by group and area in Dhaka city.",
    version="2.0.0",
)

# CORS middleware configuration
cors_allow_all = os.getenv("CORS_ALLOW_ALL", "true").lower() in ("true", "1", "yes")

if cors_allow_all:
    app.add_middleware(
        CORSMiddleware,
        allow_origin_regex=r"^https?://.*",
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )
else:
    app.add_middleware(
        CORSMiddleware,
        allow_origins=[
            "http://localhost:5173",
            "http://localhost:3000",
            "http://127.0.0.1:5173",
            "http://127.0.0.1:3000",
        ],
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

# Database connection
models.Base.metadata.create_all(bind=engine)

# Router connection
app.include_router(auth.router)
app.include_router(admin.router)
app.include_router(donor.router)
app.include_router(requester.router)

# Database call function
def get_db():
    db = sessionLocal()
    try:
        yield db
    finally:
        db.close()

db_dependency = Annotated[Session, Depends(get_db)]
user_dependency = Annotated[dict, Depends(get_current_user)]

# Show user data (get request)
@app.get('/user', tags=['User'])
def get_user(user: user_dependency, db: db_dependency):
    if user is None:
        raise HTTPException(status_code=401, detail='Failed Authentication')

    user_id = user.get('id') or user.get('user_id')
    db_user = db.query(Users).filter(Users.id == user_id).first()
    if db_user is None:
        raise HTTPException(status_code=404, detail='User not found')

    donor = db.query(Donors).filter(Donors.user_id == db_user.id).first()

    return {
        "id": db_user.id,
        "name": db_user.name,
        "username": db_user.username,
        "email": db_user.email,
        "phone": db_user.phone,
        "role": db_user.role,
        "location": db_user.location,
        "is_active": db_user.is_active,
        "donor_id": donor.id if donor else None,
    }
