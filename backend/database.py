# Database connection system

import os
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv(os.path.join(os.path.dirname(__file__), '.env'))
load_dotenv(os.path.join(os.path.dirname(__file__), '..', '.env'))
load_dotenv()

# Production PostgreSQL URL (Render blood-donation-db - External/Full URL)
_RENDER_PG_EXTERNAL = 'postgresql://blood_donation_db_9zit_user:1DFwJQZME1PmzZqHRbzk8r1SzSdLZ62u@dpg-daps1gu7bikc738k1ieg-a.singapore-postgres.render.com/blood_donation_db_9zit'

# Get DATABASE_URL; if it's Render internal short URL (no .render.com), replace with full external URL
_raw_db_url = os.getenv('DATABASE_URL', '').strip()
_is_local = any(x in _raw_db_url for x in ['localhost', '127.0.0.1', 'sqlite'])
_is_full_pg = '.render.com' in _raw_db_url or _is_local

if _is_full_pg:
    SQLALCHEMY_DATABASE_URL = _raw_db_url
else:
    # No URL, or short internal URL without .render.com suffix → use External URL
    SQLALCHEMY_DATABASE_URL = _RENDER_PG_EXTERNAL

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
