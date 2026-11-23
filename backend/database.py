import os
from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker, declarative_base
from dotenv import load_dotenv

load_dotenv()

SQLALCHEMY_DATABASE_URL = os.getenv('DATABASE_URL', '').strip()

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

if SQLALCHEMY_DATABASE_URL.startswith("postgres://"):
    SQLALCHEMY_DATABASE_URL = SQLALCHEMY_DATABASE_URL.replace("postgres://", "postgresql://", 1)

def _create_engine(url):
    if url.startswith("sqlite"):
        return create_engine(url, connect_args={"check_same_thread": False})
    return create_engine(url, pool_pre_ping=True, pool_recycle=300, pool_size=10, max_overflow=20)

def _get_working_engine():
    global SQLALCHEMY_DATABASE_URL
    if SQLALCHEMY_DATABASE_URL and not SQLALCHEMY_DATABASE_URL.startswith("sqlite"):
        try:
            eng = _create_engine(SQLALCHEMY_DATABASE_URL)
            with eng.connect() as conn:
                conn.execute(text("SELECT 1"))
            return eng
        except Exception:
            pass
    _db_dir = os.path.dirname(os.path.abspath(__file__))
    SQLALCHEMY_DATABASE_URL = f"sqlite:///{os.path.join(_db_dir, 'blood_donation.db')}"
    return _create_engine(SQLALCHEMY_DATABASE_URL)

engine = _get_working_engine()

SessionLocal = sessionmaker(autoflush=False, autocommit=False, bind=engine)
sessionLocal = SessionLocal

Base = declarative_base()
