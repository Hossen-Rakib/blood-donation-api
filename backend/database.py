import os
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base
from dotenv import load_dotenv

# Load Environment Variables
load_dotenv()

# Read Environment Variables
SQLALCHEMY_DATABASE_URL = os.getenv('DATABASE_URL', '').strip()

# If DATABASE_URL is not set directly, build it from MySQL individual credentials
if not SQLALCHEMY_DATABASE_URL:
    db_user = os.getenv("MYSQL_USER", "root")
    db_password = os.getenv("MYSQL_PASSWORD", "")
    db_host = os.getenv("MYSQL_HOST", "127.0.0.1")
    db_port = os.getenv("MYSQL_PORT", "3306")
    db_name = os.getenv("MYSQL_DB", "blood_donation_db")

    if db_password:
        SQLALCHEMY_DATABASE_URL = f"mysql+pymysql://{db_user}:{db_password}@{db_host}:{db_port}/{db_name}"
    else:
        SQLALCHEMY_DATABASE_URL = f"mysql+pymysql://{db_user}@{db_host}:{db_port}/{db_name}"

# Render (PostgreSQL) URL Fix
if SQLALCHEMY_DATABASE_URL.startswith("postgres://"):
    SQLALCHEMY_DATABASE_URL = SQLALCHEMY_DATABASE_URL.replace("postgres://", "postgresql://", 1)

# Fallback to SQLite if MySQL/Postgres is not configured or available
if not SQLALCHEMY_DATABASE_URL or SQLALCHEMY_DATABASE_URL.startswith("mysql+pymysql://root:@"):
    _db_dir = os.path.dirname(os.path.abspath(__file__))
    SQLALCHEMY_DATABASE_URL = f"sqlite:///{os.path.join(_db_dir, 'blood_donation.db')}"

# Engine Configuration
if SQLALCHEMY_DATABASE_URL.startswith("sqlite"):
    engine = create_engine(
        SQLALCHEMY_DATABASE_URL, 
        connect_args={"check_same_thread": False}
    )
else:
    engine = create_engine(
        SQLALCHEMY_DATABASE_URL,
        pool_pre_ping=True,
        pool_recycle=300,
        pool_size=10,
        max_overflow=20
    )

SessionLocal = sessionmaker(autoflush=False, autocommit=False, bind=engine)
sessionLocal = SessionLocal  # Backward compatibility

Base = declarative_base()