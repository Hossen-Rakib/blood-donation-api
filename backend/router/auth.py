from fastapi import FastAPI, APIRouter, HTTPException, Depends
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session
from datetime import timedelta, datetime, timezone
from typing import Annotated, Optional
import os
import bcrypt
from dotenv import load_dotenv
from database import sessionLocal
from models import Users, Donors
from fastapi.responses import JSONResponse
from fastapi.security import OAuth2PasswordRequestForm, OAuth2PasswordBearer
from jose import jwt, JWTError

# Load environment variables
load_dotenv(os.path.join(os.path.dirname(__file__), '..', '.env'))
load_dotenv()

router = APIRouter(prefix='/auth', tags=['auth'])

QAuth2_bearer = OAuth2PasswordBearer(tokenUrl='auth/login')
OAuth2_bearer = QAuth2_bearer

SECRET_KEY = os.getenv('SECRET_KEY', '79c463b8c7296ef09bfc9e7a374f6c5609a252cb90b55f1fcb4aa73121993a6a')
ALGORITHM = os.getenv('ALGORITHM', 'HS256')
ACCESS_TOKEN_EXPIRE_MINUTES = int(os.getenv('ACCESS_TOKEN_EXPIRE_MINUTES', '1440'))

# Helper functions for password hashing & verification
def hash_password_func(password: str) -> str:
    # Truncate password to 72 bytes safely to avoid bcrypt limit error
    pwd_bytes = password.encode('utf-8')[:72]
    salt = bcrypt.gensalt()
    return bcrypt.hashpw(pwd_bytes, salt).decode('utf-8')

def verify_password_func(plain_password: str, hashed_password: str) -> bool:
    pwd_bytes = plain_password.encode('utf-8')[:72]
    hashed_bytes = hashed_password.encode('utf-8')
    try:
        return bcrypt.checkpw(pwd_bytes, hashed_bytes)
    except Exception:
        return False

# Pydantic schema for unified registration
class CreateUserRequest(BaseModel):
    email: str = Field(..., description="Email Address (Used as login ID)")
    password: str = Field(..., min_length=4, description="Password (min 4 characters)")
    name: Optional[str] = Field(default=None, description="Full Name")
    phone: Optional[str] = Field(default=None, description="Mobile Phone Number")
    blood_group: Optional[str] = Field(default=None, description="Blood Group e.g. A+, A-, B+, B-, AB+, AB-, O+, O-")
    location: Optional[str] = Field(default="Dhaka", description="Dhaka Area (Mirpur, Dhanmondi, etc.)")
    username: Optional[str] = Field(default=None, description="Optional username, defaults to email")
    role: Optional[str] = Field(default="user", description="Account role: user (donor + requester) or admin")
    age: Optional[int] = Field(default=None, description="Age in years")
    gender: Optional[str] = Field(default=None, description="Gender (Male, Female, Other)")

UserRegister = CreateUserRequest

class ResetPasswordRequest(BaseModel):
    email: str
    new_password: str

def authenticate_user(username, password, db):
    user = db.query(Users).filter(
        (Users.username == username) | (Users.email == username)
    ).first()
    if user is None:
        return False
    pwd = getattr(user, 'hash_password', None) or getattr(user, 'hashed_password', None)
    if pwd and verify_password_func(password, pwd):
        return user
    return False

def create_access_token(username: str, user_id: int, role: str, expire_delta: timedelta):
    encode = {'sub': username, 'id': user_id, 'role': role}
    expires = datetime.now(timezone.utc) + expire_delta
    encode.update({'exp': expires})
    return jwt.encode(encode, SECRET_KEY, algorithm=ALGORITHM)

def get_current_user(token: Annotated[str, Depends(QAuth2_bearer)]):
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        username: str = payload.get('sub')
        user_id: int = payload.get('id')
        role: str = payload.get('role', 'user')
        if username is None or user_id is None:
            raise HTTPException(status_code=401, detail='Could not validate user')
        return {'username': username, 'id': user_id, 'user_id': user_id, 'role': role}
    except JWTError:
        raise HTTPException(status_code=401, detail='Could not validate user')

def get_db():
    db = sessionLocal()
    try:
        yield db
    finally:
        db.close()

db_dependency = Annotated[Session, Depends(get_db)]
user_dependency = Annotated[dict, Depends(get_current_user)]

# Unified single registration endpoint
@router.post('/register', status_code=201)
def create_users(db: db_dependency, new_user: CreateUserRequest):
    clean_email = new_user.email.strip().lower()
    clean_username = (new_user.username.strip().lower()) if new_user.username else clean_email
    display_name = (new_user.name.strip()) if new_user.name else clean_username
    phone_number = new_user.phone.strip() if new_user.phone else '01700000000'
    user_location = new_user.location.strip() if new_user.location else 'Dhaka'

    # Check existing user
    existing_user = db.query(Users).filter(
        (Users.email.ilike(clean_email)) | (Users.username.ilike(clean_username))
    ).first()
    if existing_user:
        raise HTTPException(status_code=400, detail='This email or username is already registered. Please login.')

    # 1. Create User account
    user_model = Users(
        name=display_name,
        email=clean_email,
        username=clean_username,
        phone=phone_number,
        location=user_location,
        hash_password=hash_password_func(new_user.password),
        role=new_user.role if new_user.role else 'user',
        is_active=True,
    )
    db.add(user_model)
    db.flush()

    # 2. Linked Donors record
    donor_id = None
    clean_bg = new_user.blood_group.strip().upper() if new_user.blood_group else None
    if clean_bg:
        donor_model = Donors(
            user_id=user_model.id,
            name=user_model.name,
            email=clean_email,
            blood_group=clean_bg,
            phone=phone_number,
            location=user_location,
            age=new_user.age,
            gender=new_user.gender,
            availability=True,
            verified=True,
        )
        db.add(donor_model)
        db.flush()
        donor_id = donor_model.id

    db.commit()
    db.refresh(user_model)

    # 3. Generate token
    token = create_access_token(
        user_model.username,
        user_model.id,
        user_model.role,
        timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    )

    return JSONResponse(
        status_code=201,
        content={
            'message': 'Registration successful! You can now both donate blood and request blood.',
            'access_token': token,
            'token_type': 'bearer',
            'user_id': user_model.id,
            'donor_id': donor_id,
            'name': user_model.name,
            'email': user_model.email,
            'username': user_model.username,
            'phone': user_model.phone,
            'blood_group': clean_bg,
            'location': user_model.location,
            'role': user_model.role,
            'can_donate': bool(donor_id),
            'can_request': True,
        }
    )

# Login endpoint
@router.post('/login')
def login_user(db: db_dependency, form_data: Annotated[OAuth2PasswordRequestForm, Depends()]):
    user = authenticate_user(form_data.username, form_data.password, db)
    if not user:
        raise HTTPException(status_code=401, detail='Failed Authentication')
    user_role = getattr(user, 'role', 'user') or 'user'
    token = create_access_token(user.username, user.id, user_role, timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES))
    return {'access_token': token, 'token_type': 'bearer'}

# Reset password
@router.post('/reset-password')
def reset_password(db: db_dependency, payload: ResetPasswordRequest):
    clean_email = payload.email.strip().lower()
    user = db.query(Users).filter(
        (Users.email.ilike(clean_email)) | (Users.username.ilike(clean_email))
    ).first()
    if not user:
        raise HTTPException(status_code=404, detail='User not found with this email')
    user.hash_password = hash_password_func(payload.new_password)
    db.commit()
    return JSONResponse(status_code=200, content={'message': 'Password reset successfully'})