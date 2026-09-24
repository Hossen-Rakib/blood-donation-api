from database import SessionLocal, engine
from models import Users, Donors, Base
from router.auth import hash_password_func

def seed_demo_donors():
    db = SessionLocal()
    
    # 8 Blood Groups (3 donors per group = 24 donors)
    demo_data = [
        # A+
        {"name": "Rakib Hossen", "email": "rakib@gmail.com", "bg": "A+", "location": "Dhanmondi, Dhaka", "phone": "01711000001"},
        {"name": "Rifat Hossain", "email": "rifat.h@gmail.com", "bg": "A+", "location": "Agrabad, Chittagong", "phone": "01711000002"},
        {"name": "Arif Islam", "email": "arif.i@gmail.com", "bg": "A+", "location": "Mirpur, Dhaka", "phone": "01711000003"},
        
        # A-
        {"name": "Rony Chowdhury", "email": "rony.c@gmail.com", "bg": "A-", "location": "Zindabazar, Sylhet", "phone": "01811000004"},
        {"name": "Siam Hasan", "email": "siam.h@gmail.com", "bg": "A-", "location": "Chawkbazar, Rajshahi", "phone": "01611000005"},
        {"name": "Tariqul Bashar", "email": "tariq.b@gmail.com", "bg": "A-", "location": "Narsingdi Sadar", "phone": "01811000006"},
        
        # B+
        {"name": "Tanvir Rahman", "email": "tanvir.r@gmail.com", "bg": "B+", "location": "Shibbari, Khulna", "phone": "01911000007"},
        {"name": "Fahim Shahriar", "email": "fahim.s@gmail.com", "bg": "B+", "location": "College Road, Barisal", "phone": "01711000008"},
        {"name": "Kawsar Ahmed", "email": "kawsar.a@gmail.com", "bg": "B+", "location": "Uttara, Dhaka", "phone": "01911000009"},
        
        # B-
        {"name": "Arian Karim", "email": "arian.k@gmail.com", "bg": "B-", "location": "Town Hall, Rangpur", "phone": "01811000010"},
        {"name": "Mahir Islam", "email": "mahir.i@gmail.com", "bg": "B-", "location": "Kandirpar, Comilla", "phone": "01511000011"},
        {"name": "Zubaer Hossain", "email": "zubaer.h@gmail.com", "bg": "B-", "location": "Kushtia Sadar", "phone": "01811000012"},
        
        # O+
        {"name": "Sakib Al Hasan", "email": "sakib.h@gmail.com", "bg": "O+", "location": "Gulshan, Dhaka", "phone": "01711000013"},
        {"name": "Naimul Haq", "email": "naimul.h@gmail.com", "bg": "O+", "location": "Sadar, Bogra", "phone": "01311000014"},
        {"name": "Shamim Reza", "email": "shamim.r@gmail.com", "bg": "O+", "location": "Feni Sadar", "phone": "01711000015"},
        
        # O-
        {"name": "Sabbir Ahmed", "email": "sabbir.a@gmail.com", "bg": "O-", "location": "Station Road, Mymensingh", "phone": "01711000016"},
        {"name": "Emon Khan", "email": "emon.k@gmail.com", "bg": "O-", "location": "Chasara, Narayanganj", "phone": "01811000017"},
        {"name": "Mehedi Hasan", "email": "mehedi.h@gmail.com", "bg": "O-", "location": "Tangail Sadar", "phone": "01711000018"},
        
        # AB+
        {"name": "Asif Iqbal", "email": "asif.i@gmail.com", "bg": "AB+", "location": "Sadar, Gazipur", "phone": "01911000019"},
        {"name": "Joy Roy", "email": "joy.r@gmail.com", "bg": "AB+", "location": "Halishahar, Chittagong", "phone": "01611000020"},
        {"name": "Imtiaz Mahmud", "email": "imtiaz.m@gmail.com", "bg": "AB+", "location": "Jessore Sadar", "phone": "01911000021"},
        
        # AB-
        {"name": "Hasan Mahmud", "email": "hasan.m@gmail.com", "bg": "AB-", "location": "Banani, Dhaka", "phone": "01511000022"},
        {"name": "Nibir Mahmud", "email": "nibir.m@gmail.com", "bg": "AB-", "location": "GEC Circle, Chittagong", "phone": "01711000023"},
        {"name": "Shuvo Biswas", "email": "shuvo.b@gmail.com", "bg": "AB-", "location": "Pabna Sadar", "phone": "01511000024"}
    ]

    print("Checking and seeding demo donors...")

    for item in demo_data:
        existing_user = db.query(Users).filter(Users.email == item["email"]).first()
        if not existing_user:
            # Create User with pass123 password
            user = Users(
                name=item["name"],
                username=item["email"],
                email=item["email"],
                phone=item["phone"],
                hash_password=hash_password_func("pass123"), # Updated Password: pass123
                role="user",
                location=item["location"],
                is_active=True
            )
            db.add(user)
            db.flush()

            # Create Donor Profile
            donor = Donors(
                user_id=user.id,
                name=item["name"],
                email=item["email"],
                blood_group=item["bg"],
                phone=item["phone"],
                location=item["location"],
                age=25,
                gender="Male",
                availability=True,
                verified=True
            )
            db.add(donor)

    db.commit()
    db.close()
    print("Successfully added 24 demo donors with password 'pass123'!")

if __name__ == "__main__":
    seed_demo_donors()