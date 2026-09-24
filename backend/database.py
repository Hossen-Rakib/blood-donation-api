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

# SQLite fallback path — works on both local and Render (ephemeral but functional)
_db_dir = os.path.dirname(os.path.abspath(__file__))
SQLITE_FALLBACK_URL = f"sqlite:///{os.path.join(_db_dir, 'blood_donation.db')}"

# Database engine initialization
if SQLALCHEMY_DATABASE_URL.startswith("sqlite"):
    engine = create_engine(SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False})

elif SQLALCHEMY_DATABASE_URL.startswith("postgresql"):
    # PostgreSQL (Render cloud)
    try:
        engine = create_engine(
            SQLALCHEMY_DATABASE_URL,
            pool_pre_ping=True,
            pool_recycle=300,
        )
        with engine.connect() as conn:
            pass
    except Exception as e:
        print(f"PostgreSQL connection failed: {e}. Falling back to SQLite.")
        engine = create_engine(SQLITE_FALLBACK_URL, connect_args={"check_same_thread": False})
        SQLALCHEMY_DATABASE_URL = SQLITE_FALLBACK_URL

elif SQLALCHEMY_DATABASE_URL.startswith("mysql"):
    # MySQL (local development) with fallback to SQLite if connection fails
    try:
        engine = create_engine(SQLALCHEMY_DATABASE_URL, pool_pre_ping=True)
        with engine.connect() as conn:
            pass
    except Exception as e:
        print(f"MySQL connection failed: {e}. Falling back to SQLite.")
        engine = create_engine(SQLITE_FALLBACK_URL, connect_args={"check_same_thread": False})
        SQLALCHEMY_DATABASE_URL = SQLITE_FALLBACK_URL

else:
    # No database URL configured at all - use SQLite as last resort
    print("No DATABASE_URL configured. Using SQLite fallback.")
    engine = create_engine(SQLITE_FALLBACK_URL, connect_args={"check_same_thread": False})
    SQLALCHEMY_DATABASE_URL = SQLITE_FALLBACK_URL

sessionLocal = sessionmaker(autoflush=False, autocommit=False, bind=engine)
SessionLocal = sessionLocal

Base = declarative_base()
