"""
Admin Creation Script
=====================
Run this ONCE to create the first admin account.

Usage (from the backend/ folder):
    python create_admin.py

After the first admin is created, you can promote other users
to admin from the Admin Panel -> Manage Users -> Make Admin button.
"""

from database import sessionLocal
from models import Users
from passlib.context import CryptContext

bcrypt_context = CryptContext(schemes=['bcrypt'], deprecated='auto')

def create_admin():
    db = sessionLocal()
    try:
        # ── Change these values before running ───────────────
        ADMIN_NAME     = "Admin"
        ADMIN_EMAIL    = "admin@bloodbridge.com"
        ADMIN_USERNAME = "admin"
        ADMIN_PASSWORD = "admin123"       # Change after first login!
        ADMIN_PHONE    = "01700000000"
        # ─────────────────────────────────────────────────────

        # Check if admin already exists
        existing = db.query(Users).filter(
            (Users.email == ADMIN_EMAIL) | (Users.username == ADMIN_USERNAME)
        ).first()

        if existing:
            if existing.role != 'admin':
                existing.role = 'admin'
                db.commit()
                print(f"[OK] User '{existing.username}' promoted to admin role.")
            else:
                print(f"[INFO] Admin '{existing.username}' already exists. Nothing to do.")
            return

        # Create new admin user
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
