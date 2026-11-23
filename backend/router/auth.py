from fastapi import FastAPI, APIRouter, HTTPException, Depends
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session
from datetime import timedelta, datetime, timezone
from typing import Annotated, Optional
import os
import secrets
import bcrypt
from dotenv import load_dotenv
from database import sessionLocal
from models import Users, Donors, PasswordResetToken
from fastapi.responses import JSONResponse
from fastapi.security import OAuth2PasswordRequestForm, OAuth2PasswordBearer
from jose import jwt, JWTError

load_dotenv(os.path.join(os.path.dirname(__file__), '..', '.env'))
load_dotenv()

router = APIRouter(prefix='/auth', tags=['auth'])

QAuth2_bearer = OAuth2PasswordBearer(tokenUrl='auth/login')
OAuth2_bearer = QAuth2_bearer

SECRET_KEY = os.getenv('SECRET_KEY', '79c463b8c7296ef09bfc9e7a374f6c5609a252cb90b55f1fcb4aa73121993a6a')
ALGORITHM = os.getenv('ALGORITHM', 'HS256')
ACCESS_TOKEN_EXPIRE_MINUTES = int(os.getenv('ACCESS_TOKEN_EXPIRE_MINUTES', '1440'))

def hash_password_func(password: str) -> str:

    pwd_bytes = password.encode('utf-8')[:72]
    salt = bcrypt.gensalt()
    return bcrypt.hashpw(pwd_bytes, salt).decode('utf-8')

def verify_password_func(plain_password: str, hashed_password: str) -> bool:
    try:
        pwd_bytes = plain_password.encode('utf-8')[:72]

        if isinstance(hashed_password, str):
            hashed_bytes = hashed_password.encode('utf-8')
        else:
            hashed_bytes = hashed_password

        return bcrypt.checkpw(pwd_bytes, hashed_bytes)
    except Exception:
        return False

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

class ForgotPasswordRequest(BaseModel):
    email: str = Field(..., description="Registered email address")

class VerifyResetTokenRequest(BaseModel):
    token: str = Field(..., description="Reset token received from forgot-password")

class ResetPasswordRequest(BaseModel):
    token: str  = Field(..., description="Reset token received from forgot-password")
    new_password: str = Field(..., min_length=4, description="New password (min 4 characters)")

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

# POST /auth/forgot-password — registered email দিয়ে password reset token জেনারেট করে
@router.post(
    '/forgot-password',
    tags=['auth'],
    summary="Request Password Reset Token",
    response_description="Returns a reset token valid for 15 minutes",
)
def forgot_password(db: db_dependency, payload: ForgotPasswordRequest):

    clean_email = payload.email.strip().lower()
    user = db.query(Users).filter(Users.email.ilike(clean_email)).first()

    if not user:
        return JSONResponse(
            status_code=200,
            content={
                'message': 'If this email is registered, a reset token has been sent.',
                'token': None
            }
        )

    db.query(PasswordResetToken).filter(
        PasswordResetToken.user_id == user.id,
        PasswordResetToken.is_used == False
    ).delete()
    db.flush()

    raw_token = secrets.token_urlsafe(48)
    expires_at = datetime.now(timezone.utc).replace(tzinfo=None) + timedelta(minutes=15)

    reset_entry = PasswordResetToken(
        user_id=user.id,
        token=raw_token,
        expires_at=expires_at,
        is_used=False,
    )
    db.add(reset_entry)
    db.commit()

    return JSONResponse(
        status_code=200,
        content={
            'message': 'Password reset token generated successfully. Token is valid for 15 minutes.',
            'token': raw_token,
            'expires_in_minutes': 15,
            'email': clean_email,
        }
    )

# POST /auth/verify-reset-token — reset token টি valid কিনা যাচাই করে (token consume হয় না)
@router.post(
    '/verify-reset-token',
    tags=['auth'],
    summary="Verify Password Reset Token",
    response_description="Returns whether the token is valid",
)
def verify_reset_token(db: db_dependency, payload: VerifyResetTokenRequest):
    entry = db.query(PasswordResetToken).filter(
        PasswordResetToken.token == payload.token,
        PasswordResetToken.is_used == False
    ).first()

    if not entry:
        raise HTTPException(status_code=400, detail='Invalid or already used reset token.')

    now = datetime.now(timezone.utc).replace(tzinfo=None)
    if entry.expires_at < now:
        raise HTTPException(status_code=400, detail='Reset token has expired. Please request a new one.')

    return JSONResponse(
        status_code=200,
        content={'valid': True, 'message': 'Token is valid. You may now reset your password.'}
    )

# POST /auth/reset-password — valid token দিয়ে নতুন password সেট করে
@router.post(
    '/reset-password',
    tags=['auth'],
    summary="Reset Password with Token",
    response_description="Confirmation that password was changed",
)
def reset_password(db: db_dependency, payload: ResetPasswordRequest):

    entry = db.query(PasswordResetToken).filter(
        PasswordResetToken.token == payload.token,
        PasswordResetToken.is_used == False
    ).first()

    if not entry:
        raise HTTPException(status_code=400, detail='Invalid or already used reset token.')

    now = datetime.now(timezone.utc).replace(tzinfo=None)
    if entry.expires_at < now:
        raise HTTPException(status_code=400, detail='Reset token has expired. Please request a new one.')

    user = db.query(Users).filter(Users.id == entry.user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail='User not found.')

    user.hash_password = hash_password_func(payload.new_password)

    entry.is_used = True

    db.commit()

    return JSONResponse(
        status_code=200,
        content={'message': 'Password has been reset successfully. You can now log in with your new password.'}
    )

# POST /auth/register — নতুন user রেজিস্ট্রেশন করে এবং JWT token রিটার্ন করে
@router.post(
    '/register',
    status_code=201,
    summary="Register New User",
    response_description="User created with access token",
)
def create_users(db: db_dependency, new_user: CreateUserRequest):

    clean_email = new_user.email.strip().lower()
    clean_username = (new_user.username.strip().lower()) if new_user.username else clean_email
    display_name = (new_user.name.strip()) if new_user.name else clean_username
    phone_number = new_user.phone.strip() if new_user.phone else '01700000000'
    user_location = new_user.location.strip() if new_user.location else 'Dhaka'

    existing_user = db.query(Users).filter(
        (Users.email.ilike(clean_email)) | (Users.username.ilike(clean_username))
    ).first()
    if existing_user:
        raise HTTPException(status_code=400, detail='This email or username is already registered. Please login.')

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

# POST /auth/login — username/email ও password দিয়ে login করে Bearer token পায়
@router.post(
    '/login',
    summary="Login (Get Bearer Token)",
    response_description="JWT access token",
)
def login_user(db: db_dependency, form_data: Annotated[OAuth2PasswordRequestForm, Depends()]):

    user = authenticate_user(form_data.username, form_data.password, db)
    if not user:
        raise HTTPException(status_code=401, detail='Failed Authentication')
    user_role = getattr(user, 'role', 'user') or 'user'
    token = create_access_token(user.username, user.id, user_role, timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES))
    return {'access_token': token, 'token_type': 'bearer'}
