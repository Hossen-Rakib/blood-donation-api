from fastapi import FastAPI, APIRouter, HTTPException, Depends
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session
from datetime import timedelta, datetime, timezone
from typing import Annotated, Optional
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

# reset password directly by email
@router.post('/reset-password')
def reset_password(db: db_dependency, payload: ResetPasswordRequest):
    clean_email = payload.email.strip().lower()
    user = db.query(Users).filter(
        (Users.email.ilike(clean_email)) | (Users.username.ilike(clean_email))
    ).first()
    if not user:
        raise HTTPException(status_code=404, detail='User not found with this email')
    user.hash_password = bcrypt_context.hash(payload.new_password)
    db.commit()
    return JSONResponse(status_code=200, content={'message': 'Password reset successfully'})
