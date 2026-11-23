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

# Import Seed Data Function
from demo_data import seed_demo_donors

# ─────────────────────────────────────────────
# Swagger / OpenAPI Metadata
# ─────────────────────────────────────────────
API_DESCRIPTION = """
## 🩸 Blood Donation Platform — REST API

> **Base URL (Local):** `http://localhost:8000`
> **Live URL:** See deployment docs

---

### 🔐 Authentication
All **protected** endpoints require a **Bearer Token** in the `Authorization` header:
```
Authorization: Bearer <access_token>
```
Obtain a token via **POST `/auth/register`** or **POST `/auth/login`**.
Token is valid for **24 hours (1440 minutes)**.

---

### 👥 User Roles

| Role | Description |
|------|-------------|
| `user` | Default role — can donate blood AND request blood |
| `admin` | Full platform access — manage users, requests, stats |

---

### 📦 Module Overview

| Module | Prefix | Description |
|--------|--------|-------------|
| **Auth** | `/auth` | Register, Login, Forgot/Reset Password |
| **User** | `/user` | Current user profile |
| **Donor** | `/donor` | Donor dashboard, accept/reject requests |
| **Public** | `/donors`, `/blood-request` | Search donors, manage blood requests |
| **Admin** | `/admin` | Platform management (admin only) |

---

### 🩸 Blood Groups
`A+` `A-` `B+` `B-` `AB+` `AB-` `O+` `O-`

### 📍 Supported Locations (Dhaka)
Mirpur, Dhanmondi, Gulshan, Uttara, Mohammadpur, Motijheel,
Banani, Farmgate, Rampura, Bashundhara, Tejgaon, Wari, Lalbagh

---

### 📊 Blood Request Status Flow
```
pending → donor_found → donor_accepted → donation_completed
                                       → request_closed
       → cancelled
```

---

### ⚠️ Error Codes

| Code | Meaning |
|------|---------|
| `400` | Bad Request / Validation Error |
| `401` | Unauthorized — missing or invalid token |
| `403` | Forbidden — admin privileges required |
| `404` | Resource not found |
| `422` | Unprocessable Entity — missing required field |
| `500` | Internal Server Error |

---

*Built with ❤️ using FastAPI · Python 3.14 · SQLAlchemy*
"""

# ─────────────────────────────────────────────
# Initialize FastAPI Application
# ─────────────────────────────────────────────
app = FastAPI(
    title="🩸 Blood Donation Platform API",
    description=API_DESCRIPTION,
    version="2.0.0",
    openapi_tags=[
        {
            "name": "auth",
            "description": "🔐 **Authentication** — Register, Login, Password Reset. "
                           "Use `POST /auth/login` to get a Bearer token.",
        },
        {
            "name": "User",
            "description": "👤 **User Profile** — Get the currently logged-in user's full profile including donor status.",
        },
        {
            "name": "Donor Operations",
            "description": "🩸 **Donor** — Manage donor profile, view matching blood requests, "
                           "accept or reject requests, and track donation history.",
        },
        {
            "name": "Requester & Public Operations",
            "description": "📋 **Blood Requests & Public** — Search donors, create/view/update/cancel "
                           "blood requests, and manage notifications. Most search endpoints are **public** (no auth needed).",
        },
        {
            "name": "Admin Operations",
            "description": "🛡️ **Admin Only** — Dashboard stats, user management, blood request oversight, "
                           "donor verification, and role promotion. Requires `role: admin`.",
        },
    ],
    swagger_ui_parameters={
        "docExpansion": "none",          # Collapse all sections by default
        "defaultModelsExpandDepth": -1,  # Hide schemas section by default
        "displayRequestDuration": True,  # Show request time in Swagger UI
        "filter": True,                  # Enable endpoint search/filter bar
        "syntaxHighlight.theme": "monokai",
        "tryItOutEnabled": False,        # Don't auto-enable "Try it out"
    },
    docs_url="/docs",
    redoc_url="/redoc",
    openapi_url="/openapi.json",
)

# Call Seed Function & Auto Reset Admin on Application Startup
@app.on_event("startup")
def startup_event():
    # 1. Seed demo donors
    try:
        seed_demo_donors()
    except Exception as e:
        print(f"[ERROR Seed Donors]: {e}")
    
    # 2. Ensure Admin user exists and has password 'admin123' on Live DB using direct bcrypt
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


@app.get('/', include_in_schema=False)
def root():
    return RedirectResponse(url='/docs')

# Show user data (get request)
@app.get(
    '/user',
    tags=['User'],
    summary="Get Current User Profile",
    response_description="Full user profile including donor status",
)
def get_user(user: user_dependency, db: db_dependency):
    """
    Get the **complete profile** of the currently logged-in user.

    Returns user info plus donor status:
    - `can_donate` — `true` if the user has a donor profile
    - `can_request` — always `true` (all users can request blood)
    - `blood_group` and `donor_id` — populated only if user is a donor
    - `availability` — donor's current availability toggle
    """
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