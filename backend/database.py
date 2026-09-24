import os
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base
from dotenv import load_dotenv

# Environment variables load
load_dotenv()

# Render / Environment Variable theke DATABASE_URL neowa
SQLALCHEMY_DATABASE_URL = os.getenv('DATABASE_URL', '').strip()

# Render connection string prefix fix (postgres:// -> postgresql://)
if SQLALCHEMY_DATABASE_URL.startswith("postgres://"):
    SQLALCHEMY_DATABASE_URL = SQLALCHEMY_DATABASE_URL.replace("postgres://", "postgresql://", 1)

# Fallback (Jodi local test kora hoy)
if not SQLALCHEMY_DATABASE_URL:
    _db_dir = os.path.dirname(os.path.abspath(__file__))
    SQLALCHEMY_DATABASE_URL = f"sqlite:///{os.path.join(_db_dir, 'blood_donation.db')}"

# Database Engine Initialization
if SQLALCHEMY_DATABASE_URL.startswith("sqlite"):
    engine = create_engine(SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False})
else:
    engine = create_engine(
        SQLALCHEMY_DATABASE_URL,
        pool_pre_ping=True,
        pool_recycle=300,
    )

sessionLocal = sessionmaker(autoflush=False, autocommit=False, bind=engine)
SessionLocal = sessionLocal

Base = declarative_base()