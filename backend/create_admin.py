from database import SessionLocal
from models import Users
from passlib.context import CryptContext

bcrypt_context = CryptContext(schemes=['bcrypt'], deprecated='auto')

def create_admin():
    db = SessionLocal()
    try:
        ADMIN_NAME     = "Admin"
        ADMIN_EMAIL    = "admin@bloodbridge.com"
        ADMIN_USERNAME = "admin"
        ADMIN_PASSWORD = "admin123"
        ADMIN_PHONE    = "01700000000"

        # Safely truncate UTF-8 encoded bytes to 72 bytes limit
        pwd_bytes = ADMIN_PASSWORD.encode('utf-8')[:72]
        hashed_pw = bcrypt_context.hash(pwd_bytes.decode('utf-8', errors='ignore'))

        existing = db.query(Users).filter(
            (Users.email == ADMIN_EMAIL) | (Users.username == ADMIN_USERNAME)
        ).first()

        if existing:
            existing.role = 'admin'
            existing.hash_password = hashed_pw
            db.commit()
            print(f"[OK] Admin '{existing.username}' already exists. Password updated.")
            return

        admin = Users(
            name=ADMIN_NAME,
            email=ADMIN_EMAIL,
            username=ADMIN_USERNAME,
            phone=ADMIN_PHONE,
            hash_password=hashed_pw,
            role='admin',
            location='Dhaka',
            is_active=True,
        )
        db.add(admin)
        db.commit()
        print("[OK] Admin account created successfully!")
    except Exception as e:
        db.rollback()
        print(f"[ERROR] {e}")
    finally:
        db.close()

if __name__ == '__main__':
    create_admin()