import sys
import os

_backend_dir = os.path.dirname(os.path.abspath(__file__))
if _backend_dir not in sys.path:
    sys.path.insert(0, _backend_dir)

from fastapi import FastAPI, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.openapi.utils import get_openapi
from sqlalchemy.orm import Session
from pydantic import BaseModel, Field
import bcrypt

import models
from models import Users, Donors, BloodRequests
from typing import Annotated, Optional
from database import engine, sessionLocal
from fastapi.responses import JSONResponse, RedirectResponse
from router import auth, admin, donor, requester
from router.auth import get_current_user

from demo_data import seed_demo_donors

API_DESCRIPTION = (
    "## 🩸 Blood Donation Platform — REST API\n\n"
    "> **Base URL (Local):** `http://localhost:8000`\n\n"
    "---\n\n"
    "### 🔐 Authentication\n"
    "All **protected** endpoints require a **Bearer Token** in the `Authorization` header:\n"
    "```\nAuthorization: Bearer <access_token>\n```\n"
    "Obtain a token via **POST `/auth/register`** or **POST `/auth/login`**.\n"
    "Token is valid for **24 hours (1440 minutes)**.\n\n"
    "---\n\n"
    "### 👥 User Roles\n\n"
    "| Role | Description |\n"
    "|------|-------------|\n"
    "| `user` | Default role — can donate blood AND request blood |\n"
    "| `admin` | Full platform access — manage users, requests, stats |\n\n"
    "---\n\n"
    "### 📦 Module Overview\n\n"
    "| Module | Prefix | Description |\n"
    "|--------|--------|-------------|\n"
    "| **Auth** | `/auth` | Register, Login, Forgot/Reset Password |\n"
    "| **User** | `/user` | Current user profile |\n"
    "| **Donor** | `/donor` | Donor dashboard, accept/reject requests |\n"
    "| **Public** | `/donors`, `/blood-request` | Search donors, manage blood requests |\n"
    "| **Admin** | `/admin` | Platform management (admin only) |\n\n"
    "---\n\n"
    "### 🩸 Blood Groups\n"
    "`A+` `A-` `B+` `B-` `AB+` `AB-` `O+` `O-`\n\n"
    "### 📊 Blood Request Status Flow\n"
    "```\npending → donor_found → donor_accepted → donation_completed\n"
    "                                       → request_closed\n"
    "       → cancelled\n```\n\n"
    "---\n\n"
    "### ⚠️ Error Codes\n\n"
    "| Code | Meaning |\n"
    "|------|---------|\n"
    "| `400` | Bad Request / Validation Error |\n"
    "| `401` | Unauthorized — missing or invalid token |\n"
    "| `403` | Forbidden — admin privileges required |\n"
    "| `404` | Resource not found |\n"
    "| `422` | Unprocessable Entity — missing required field |\n"
    "| `500` | Internal Server Error |\n\n"
    "---\n\n"
    "*Built with FastAPI · Python 3.14 · SQLAlchemy*"
)

app = FastAPI(
    title="🩸 Blood Donation Platform API",
    description=API_DESCRIPTION,
    version="2.0.0",
    openapi_tags=[
        {
            "name": "auth",
            "description": " **Authentication** — Register, Login, Password Reset. "
                           "Use `POST /auth/login` to get a Bearer token.",
        },
        {
            "name": "User",
            "description": "👤 **User Profile** — Get the currently logged-in user's full profile including donor status.",
        },
        {
            "name": "Donor Operations",
            "description": " **Donor** — Manage donor profile, view matching blood requests, "
                           "accept or reject requests, and track donation history.",
        },
        {
            "name": "Requester & Public Operations",
            "description": " **Blood Requests & Public** — Search donors, create/view/update/cancel "
                           "blood requests, and manage notifications. Most search endpoints are **public** (no auth needed).",
        },
        {
            "name": "Admin Operations",
            "description": " **Admin Only** — Dashboard stats, user management, blood request oversight, "
                           "donor verification, and role promotion. Requires `role: admin`.",
        },
    ],
    swagger_ui_parameters={
        "docExpansion": "none",
        "defaultModelsExpandDepth": -1,
        "displayRequestDuration": True,
        "filter": True,
        "syntaxHighlight.theme": "monokai",
        "tryItOutEnabled": False,
    },
    docs_url="/docs",
    redoc_url="/redoc",
    openapi_url="/openapi.json",
)

@app.on_event("startup")
def startup_event():

    try:
        seed_demo_donors()
    except Exception as e:
        print(f"[ERROR Seed Donors]: {e}")

    db = sessionLocal()
    try:
        ADMIN_EMAIL = "admin@bloodbridge.com"
        ADMIN_USERNAME = "admin"
        ADMIN_PASSWORD = "admin123"

        pwd_bytes = ADMIN_PASSWORD.encode('utf-8')[:72]
        salt = bcrypt.gensalt()
        hashed_pw = bcrypt.hashpw(pwd_bytes, salt).decode('utf-8')

        existing = db.query(Users).filter(
            (Users.email == ADMIN_EMAIL) | (Users.username == ADMIN_USERNAME)
        ).first()

        if existing:
            existing.role = 'admin'
            existing.hash_password = hashed_pw
            db.commit()
            print(f"[OK] Admin '{existing.username}' updated with password '{ADMIN_PASSWORD}' on startup.")
        else:
            admin = Users(
                name="Admin",
                email=ADMIN_EMAIL,
                username=ADMIN_USERNAME,
                phone="01700000000",
                hash_password=hashed_pw,
                role='admin',
                location='Dhaka',
                is_active=True,
            )
            db.add(admin)
            db.commit()
            print("[OK] New Admin created on startup.")
    except Exception as e:
        db.rollback()
        print(f"[ERROR Startup Admin]: {e}")
    finally:
        db.close()

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

models.Base.metadata.create_all(bind=engine)

app.include_router(auth.router)
app.include_router(admin.router)
app.include_router(donor.router)
app.include_router(requester.router)

def get_db():
    db = sessionLocal()
    try:
        yield db
    finally:
        db.close()

db_dependency = Annotated[Session, Depends(get_db)]
user_dependency = Annotated[dict, Depends(get_current_user)]

@app.get('/', include_in_schema=False)
def root():
    return RedirectResponse(url='/docs')

# GET /user — লগইন করা user-এর full profile দেখায়, donor status সহ
@app.get(
    '/user',
    tags=['User'],
    summary="Get Current User Profile",
    response_description="Full user profile including donor status",
)
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
        "blood_group": donor.blood_group if donor else None,
        "availability": donor.availability if donor else False,
        "can_donate": bool(donor),
        "can_request": True,
    }
