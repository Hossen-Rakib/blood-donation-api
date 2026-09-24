# Database connection system

import os
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv(os.path.join(os.path.dirname(__file__), '.env'))
load_dotenv(os.path.join(os.path.dirname(__file__), '..', '.env'))
load_dotenv()

# sqlite connection
# SQLALCHEMY_DATABASE_URL = 'sqlite:///./blood_donation.db'

# postgres database connection system (Render Cloud)
# SQLALCHEMY_DATABASE_URL = 'postgresql://username:password@host/dbname'

# mysql database connection system (local)
# SQLALCHEMY_DATABASE_URL = 'mysql+pymysql://root:YOUR_PASSWORD@127.0.0.1:3306/blood_donation_db'

# Render sets DATABASE_URL in environment; for local dev set it in .env file
SQLALCHEMY_DATABASE_URL = os.getenv('DATABASE_URL', '')

# Render provides URLs starting with 'postgres://', SQLAlchemy needs 'postgresql://'
if SQLALCHEMY_DATABASE_URL.startswith("postgres://"):
    SQLALCHEMY_DATABASE_URL = SQLALCHEMY_DATABASE_URL.replace("postgres://", "postgresql://", 1)

# If DATABASE_URL not set, build local MySQL URL from individual .env variables
if not SQLALCHEMY_DATABASE_URL:
    mysql_user = os.getenv("MYSQL_USER", "root")
    mysql_password = os.getenv("MYSQL_PASSWORD", "")
    mysql_host = os.getenv("MYSQL_HOST", "127.0.0.1")
    mysql_port = os.getenv("MYSQL_PORT", "3306")
    mysql_db = os.getenv("MYSQL_DB", "blood_donation_db")
    SQLALCHEMY_DATABASE_URL = f"mysql+pymysql://{mysql_user}:{mysql_password}@{mysql_host}:{mysql_port}/{mysql_db}"

# Database engine initialization
if SQLALCHEMY_DATABASE_URL.startswith("sqlite"):
    engine = create_engine(SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False})
elif SQLALCHEMY_DATABASE_URL.startswith("postgresql"):
    # PostgreSQL (Render cloud)
    engine = create_engine(SQLALCHEMY_DATABASE_URL)
else:
    # MySQL (local development) with fallback to SQLite if database not found
    try:
        engine = create_engine(SQLALCHEMY_DATABASE_URL)
        with engine.connect() as conn:
            pass
    except Exception:
        SQLALCHEMY_DATABASE_URL = "sqlite:///./blood_donation.db"
        engine = create_engine(SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False})

sessionLocal = sessionmaker(autoflush=False, autocommit=False, bind=engine)
SessionLocal = sessionLocal

Base = declarative_base()
