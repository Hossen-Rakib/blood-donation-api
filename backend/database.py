# Database connection system

import os
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv(os.path.join(os.path.dirname(__file__), '.env'))
load_dotenv(os.path.join(os.path.dirname(__file__), '..', '.env'))
load_dotenv()

# Render sets DATABASE_URL in environment; for local dev set it in .env file
SQLALCHEMY_DATABASE_URL = os.getenv('DATABASE_URL', '').strip()

# Render provides URLs starting with 'postgres://', SQLAlchemy needs 'postgresql://'
if SQLALCHEMY_DATABASE_URL.startswith("postgres://"):
    SQLALCHEMY_DATABASE_URL = SQLALCHEMY_DATABASE_URL.replace("postgres://", "postgresql://", 1)

# If DATABASE_URL not set, try building from individual MySQL env variables
if not SQLALCHEMY_DATABASE_URL:
    mysql_user = os.getenv("MYSQL_USER", "root")
    mysql_password = os.getenv("MYSQL_PASSWORD", "")
    mysql_host = os.getenv("MYSQL_HOST", "127.0.0.1")
    mysql_port = os.getenv("MYSQL_PORT", "3306")
    mysql_db = os.getenv("MYSQL_DB", "blood_donation_db")
    if mysql_password:
        SQLALCHEMY_DATABASE_URL = f"mysql+pymysql://{mysql_user}:{mysql_password}@{mysql_host}:{mysql_port}/{mysql_db}"

# Database engine initialization
if SQLALCHEMY_DATABASE_URL.startswith("sqlite"):
    engine = create_engine(SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False})

elif SQLALCHEMY_DATABASE_URL.startswith("postgresql"):
    # PostgreSQL (Render cloud) - no fallback needed
    engine = create_engine(
        SQLALCHEMY_DATABASE_URL,
        pool_pre_ping=True,
        pool_recycle=300,
    )

elif SQLALCHEMY_DATABASE_URL.startswith("mysql"):
    # MySQL (local development) with fallback to SQLite if connection fails
    try:
        engine = create_engine(SQLALCHEMY_DATABASE_URL, pool_pre_ping=True)
        with engine.connect() as conn:
            pass
    except Exception:
        # Fallback to SQLite for local dev when MySQL not available
        SQLALCHEMY_DATABASE_URL = "sqlite:///./blood_donation.db"
        engine = create_engine(SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False})

else:
    # No database URL configured at all - use SQLite as last resort
    SQLALCHEMY_DATABASE_URL = "sqlite:///./blood_donation.db"
    engine = create_engine(SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False})

sessionLocal = sessionmaker(autoflush=False, autocommit=False, bind=engine)
SessionLocal = sessionLocal

Base = declarative_base()
