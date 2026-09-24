from database import sessionLocal
from models import Users
from passlib.context import CryptContext

# Password hashing setup using bcrypt
bcrypt_context = CryptContext(schemes=['bcrypt'], deprecated='auto')

def create_admin():
    db = sessionLocal()
    try:
        # Admin credentials (change these values if needed)
        ADMIN_NAME     = "Admin"
        ADMIN_EMAIL    = "admin@bloodbridge.com"
        ADMIN_USERNAME = "admin"
        ADMIN_PASSWORD = "admin123"
        ADMIN_PHONE    = "01700000000"

        # Check if the admin account already exists
        existing = db.query(Users).filter(
            (Users.email == ADMIN_EMAIL) | (Users.username == ADMIN_USERNAME)
        ).first()

        # If user exists, reset/update password and role
        if existing:
            existing.role = 'admin'
            existing.hash_password = bcrypt_context.hash(ADMIN_PASSWORD)
            db.commit()
            print(f"[OK] Admin '{existing.username}' already exists. Role set to 'admin' and password updated to '{ADMIN_PASSWORD}'.")
            return

        # Create new admin user if not exists
        admin = Users(
            name=ADMIN_NAME,
            email=ADMIN_EMAIL,
            username=ADMIN_USERNAME,
            phone=ADMIN_PHONE,
            hash_password=bcrypt_context.hash(ADMIN_PASSWORD),
            role='admin',
            location='Dhaka',
            is_active=True,
        )
        db.add(admin)
        db.commit()
        db.refresh(admin)

        print("[OK] Admin account created successfully!")
        print(f"   Username : {ADMIN_USERNAME}")
        print(f"   Email    : {ADMIN_EMAIL}")
        print(f"   Password : {ADMIN_PASSWORD}")
        print("\n[!] Please change the password after first login!")

    except Exception as e:
        db.rollback()
        print(f"[ERROR] {e}")
    finally:
        db.close()

if __name__ == '__main__':
    create_admin()