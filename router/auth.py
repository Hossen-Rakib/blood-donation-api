from fastapi import FastAPI, APIRouter, HTTPException, Depends
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session
from datetime import timedelta, datetime, timezone
from typing import Annotated, Optional
import secrets
import hashlib
from database import sessionLocal
from models import Users
from fastapi.responses import JSONResponse
from passlib.context import CryptContext
from fastapi.security import OAuth2PasswordRequestForm, OAuth2PasswordBearer
from jose import jwt, JWTError

router = APIRouter(prefix='/auth', tags=['auth'])

# Password hashing configuration for secure storage and verification
bcrypt_context = CryptContext(schemes=['bcrypt'], deprecated='auto')
QAuth2_bearer = OAuth2PasswordBearer(tokenUrl='auth/login')
OAuth2_bearer = QAuth2_bearer

SECRET_KEY = '79c463b8c7296ef09bfc9e7a374f6c5609a252cb90b55f1fcb4aa73121993a6a'
ALGORITHM = 'HS256'
ACCESS_TOKEN_EXPIRE_MINUTES = 1440

# In-memory store for password reset tokens
_reset_tokens = {}

# pydantic class for user data validation
class CreateUserRequest(BaseModel):
    username: str
    email: str
    password: str
    role: Optional[str] = 'requester'
    name: Optional[str] = None
    phone: Optional[str] = None
    location: Optional[str] = 'Dhaka'

# Alias for compatibility
UserRegister = CreateUserRequest

class ForgotPasswordRequest(BaseModel):
    email: str

class ResetPasswordRequest(BaseModel):
    reset_token: str
    new_password: str

def authenticate_user(username, password, db):
    user = db.query(Users).filter(
        (Users.username == username) | (Users.email == username)
    ).first()
    if user is None:
        return False
    pwd = getattr(user, 'hash_password', None) or getattr(user, 'hashed_password', None)
    if pwd and bcrypt_context.verify(password, pwd):
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

# create new user
@router.post('/register')
def create_users(db: db_dependency, new_user: CreateUserRequest):
    user_model = Users(
        name=new_user.name if new_user.name else new_user.username,
        email=new_user.email,
        username=new_user.username,
        phone=new_user.phone if new_user.phone else '01700000000',
        location=new_user.location if new_user.location else 'Dhaka',
        hash_password=bcrypt_context.hash(new_user.password),
        role=new_user.role if new_user.role else 'requester'
    )
    db.add(user_model)
    db.commit()
    db.refresh(user_model)
    return JSONResponse(status_code=201, content={'message': 'User registered successfully', 'user_id': user_model.id})

# login user
@router.post('/login')
def login_user(db: db_dependency, form_data: Annotated[OAuth2PasswordRequestForm, Depends()]):
    user = authenticate_user(form_data.username, form_data.password, db)
    if not user:
        raise HTTPException(status_code=401, detail='Failed Authentication')
    user_role = getattr(user, 'role', 'user') or 'user'
    token = create_access_token(user.username, user.id, user_role, timedelta(minutes=1440))
    return {'access_token': token, 'token_type': 'bearer'}

# refresh token
@router.post('/refresh-token')
def refresh_token(user: user_dependency, db: db_dependency):
    user_id = user.get('user_id') or user.get('id')
    db_user = db.query(Users).filter(Users.id == user_id).first()
    if not db_user:
        raise HTTPException(status_code=404, detail='User not found')
    user_role = getattr(db_user, 'role', 'user') or 'user'
    new_token = create_access_token(db_user.username, db_user.id, user_role, timedelta(minutes=1440))
    return {'access_token': new_token, 'token_type': 'bearer'}

# forgot password
@router.post('/forgot-password')
def forgot_password(db: db_dependency, payload: ForgotPasswordRequest):
    clean_email = payload.email.strip().lower()
    user = db.query(Users).filter(Users.email.ilike(clean_email)).first()
    if not user:
        return {'message': 'If this email exists in our system, a reset token has been sent.'}
    raw_token = secrets.token_urlsafe(32)
    hashed = hashlib.sha256(raw_token.encode()).hexdigest()
    _reset_tokens[hashed] = {
        'user_id': user.id,
        'expires_at': datetime.now(timezone.utc) + timedelta(minutes=30)
    }
    return {'message': 'Password reset token generated.', 'reset_token': raw_token}

# reset password
@router.post('/reset-password')
def reset_password(db: db_dependency, payload: ResetPasswordRequest):
    hashed = hashlib.sha256(payload.reset_token.encode()).hexdigest()
    token_data = _reset_tokens.get(hashed)
    if not token_data:
        raise HTTPException(status_code=400, detail='Invalid or expired reset token')
    if datetime.now(timezone.utc) > token_data['expires_at']:
        del _reset_tokens[hashed]
        raise HTTPException(status_code=400, detail='Reset token has expired')
    user = db.query(Users).filter(Users.id == token_data['user_id']).first()
    if not user:
        raise HTTPException(status_code=404, detail='User not found')
    user.hash_password = bcrypt_context.hash(payload.new_password)
    db.commit()
    del _reset_tokens[hashed]
    return JSONResponse(status_code=200, content={'message': 'Password reset successfully'})
