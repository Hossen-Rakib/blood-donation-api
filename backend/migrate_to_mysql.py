import os
import sqlite3
import pymysql
from dotenv import load_dotenv
from passlib.context import CryptContext

load_dotenv(os.path.join(os.path.dirname(__file__), '.env'))
load_dotenv(os.path.join(os.path.dirname(__file__), '..', '.env'))
load_dotenv()

pwd_context = CryptContext(schemes=['bcrypt'], deprecated='auto')

# Connect to sqlite
sqlite_path = os.path.join(os.path.dirname(__file__), 'blood_donation.db')
if not os.path.exists(sqlite_path):
    sqlite_path = os.path.join(os.path.dirname(__file__), '..', 'blood_donation.db')

s_conn = sqlite3.connect(sqlite_path)
s_conn.row_factory = sqlite3.Row
s_cur = s_conn.cursor()

# Connect to MySQL
m_host = os.getenv('MYSQL_HOST', '127.0.0.1')
m_port = int(os.getenv('MYSQL_PORT', '3306'))
m_user = os.getenv('MYSQL_USER', 'root')
m_pass = os.getenv('MYSQL_PASSWORD', '')
m_db   = os.getenv('MYSQL_DB', 'blood_donation_db')

m_conn = pymysql.connect(
    host=m_host,
    port=m_port,
    user=m_user,
    password=m_pass,
    database=m_db,
    autocommit=True
)
m_cur = m_conn.cursor()

# Migrate users from SQLite
s_cur.execute('SELECT * FROM users')
users = s_cur.fetchall()
for u in users:
    m_cur.execute('''
        INSERT INTO users (id, name, username, email, phone, hash_password, role, location, profile_image, is_active, created_at)
        VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
        ON DUPLICATE KEY UPDATE name=VALUES(name), phone=VALUES(phone)
    ''', (u['id'], u['name'], u['username'], u['email'], u['phone'], u['hash_password'], u['role'], u['location'], u['profile_image'], u['is_active'], u['created_at']))
print(f'Migrated {len(users)} users from SQLite.')

# Migrate donors from SQLite
s_cur.execute('SELECT * FROM donors')
donors = s_cur.fetchall()
for d in donors:
    m_cur.execute('''
        INSERT INTO donors (id, user_id, name, email, blood_group, phone, location, age, gender, availability, verified, last_donation_date, created_at)
        VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
        ON DUPLICATE KEY UPDATE name=VALUES(name), phone=VALUES(phone)
    ''', (d['id'], d['user_id'], d['name'], d['email'], d['blood_group'], d['phone'], d['location'], d['age'], d['gender'], d['availability'], d['verified'], d['last_donation_date'], d['created_at']))
print(f'Migrated {len(donors)} donors from SQLite.')

# Migrate blood_requests from SQLite
s_cur.execute('SELECT * FROM blood_requests')
reqs = s_cur.fetchall()
for r in reqs:
    m_cur.execute('''
        INSERT INTO blood_requests (id, requester_id, title, patient_name, blood_group, required_bags, hospital_name, hospital_location, required_date, contact_number, urgency, additional_info, status, accepted_donor_id, created_at)
        VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
        ON DUPLICATE KEY UPDATE title=VALUES(title)
    ''', (r['id'], r['requester_id'], r['title'], r['patient_name'], r['blood_group'], r['required_bags'], r['hospital_name'], r['hospital_location'], r['required_date'], r['contact_number'], r['urgency'], r['additional_info'], r['status'], r['accepted_donor_id'], r['created_at']))
print(f'Migrated {len(reqs)} requests from SQLite.')

# Create admin user if not exists
m_cur.execute("SELECT id, username, email FROM users WHERE role='admin'")
admin_row = m_cur.fetchone()
admin_default_pass = os.getenv('ADMIN_DEFAULT_PASSWORD', 'admin123')
if not admin_row:
    admin_hash = pwd_context.hash(admin_default_pass)
    m_cur.execute('''
        INSERT INTO users (name, username, email, phone, hash_password, role, location, is_active)
        VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
    ''', ('System Administrator', 'admin', 'admin@blooddonation.com', '01700000000', admin_hash, 'admin', 'Dhaka', 1))
    print(f'Created admin user: admin / admin@blooddonation.com with password: {admin_default_pass}')
else:
    print(f'Admin user already exists: {admin_row}')

# Also, if donors count is small, let's seed demo donors from mysql.sql so the platform has rich data for searching
m_cur.execute("SELECT COUNT(*) FROM donors")
donor_count = m_cur.fetchone()[0]
if donor_count <= 2:
    print("Adding demo donors for testing...")
    # Add demo donors from ID 10 upwards to avoid collision
    demo_donors = [
        ('Tanvir Ahmed', 'A+', '01710101001', 'Dhaka', 26, 'Male', 1, 1),
        ('Nusrat Jahan', 'A+', '01710102001', 'Chattogram', 24, 'Female', 1, 1),
        ('Sabbir Rahman', 'A+', '01710103001', 'Sylhet', 30, 'Male', 1, 1),
        ('Mehedi Hasan', 'A-', '01710201001', 'Rajshahi', 29, 'Male', 1, 1),
        ('Farhana Akter', 'A-', '01710202001', 'Khulna', 27, 'Female', 1, 1),
        ('Kamrul Islam', 'B+', '01710301001', 'Dhaka', 25, 'Male', 1, 1),
        ('Sharmin Sultana', 'B+', '01710302001', 'Barishal', 23, 'Female', 1, 1),
        ('Arifur Rahman', 'B+', '01710303001', 'Rangpur', 35, 'Male', 1, 1),
        ('Tareq Aziz', 'B-', '01710401001', 'Mymensingh', 34, 'Male', 1, 1),
        ('Rina Parvin', 'B-', '01710402001', 'Comilla', 26, 'Female', 1, 1),
        ('Mahmudul Hasan', 'AB+', '01710501001', 'Dhaka', 28, 'Male', 1, 1),
        ('Naznin Akter', 'AB+', '01710502001', 'Bogura', 25, 'Female', 1, 1),
        ('Zahid Hossain', 'AB-', '01710601001', 'Jessore', 30, 'Male', 1, 1),
        ('Tasnim Ferdous', 'AB-', '01710602001', 'Narayanganj', 28, 'Female', 1, 1),
        ('Ashiqur Rahman', 'O+', '01710701001', 'Dhaka', 27, 'Male', 1, 1),
        ('Fatema Khatun', 'O+', '01710702001', 'Gazipur', 24, 'Female', 1, 1),
        ('Rashed Khan', 'O-', '01710801001', 'Dhaka', 35, 'Male', 1, 1),
        ('Rumana Islam', 'O-', '01710802001', 'Cox\'s Bazar', 27, 'Female', 1, 1),
    ]
    for name, bg, phone, loc, age, gen, avail, ver in demo_donors:
        m_cur.execute('''
            INSERT INTO donors (name, blood_group, phone, location, age, gender, availability, verified)
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
        ''', (name, bg, phone, loc, age, gen, avail, ver))
    print(f'Added {len(demo_donors)} demo donors across Bangladesh districts.')

# Check total records in MySQL
for tbl in ['users', 'donors', 'blood_requests']:
    m_cur.execute(f'SELECT COUNT(*) FROM {tbl}')
    print(f'MySQL {tbl} count:', m_cur.fetchone()[0])

s_conn.close()
m_conn.close()
print("Migration completed successfully!")
