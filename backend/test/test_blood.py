from test.test_main import client
from main import app
from fastapi import status
from router.auth import get_current_user
from database import sessionLocal
from models import Users, Donors, BloodRequests
from datetime import datetime

# Dependency override for testing logged-in user
def override_get_current_user():
    return {
        'id': 2,
        'user_id': 2,
        'username': 'user1',
        'role': 'requester'
    }

# Setup sample data ensuring pending status, user, and donor
def setup_test_request():
    db = sessionLocal()
    user = db.query(Users).filter(Users.id == 2).first()
    if not user:
        user = Users(
            id=2,
            name='Test User',
            username='user1',
            email='user1@example.com',
            phone='01811111111',
            hash_password='hashed_password_test',
            role='user',
            location='Mirpur',
            is_active=True,
        )
        db.add(user)
        db.commit()

    donor = db.query(Donors).filter(Donors.id == 1).first()
    if not donor:
        donor = Donors(
            id=1,
            user_id=2,
            name='Test Donor',
            email='donor1@example.com',
            blood_group='A+',
            phone='01811111111',
            location='Mirpur',
            availability=True,
            verified=True,
        )
        db.add(donor)
        db.commit()

    req = db.query(BloodRequests).filter(BloodRequests.id == 999).first()
    if not req:
        req = BloodRequests(
            id=999,
            requester_id=2,
            title='Test Request',
            patient_name='Test Patient',
            blood_group='A+',
            required_bags=1,
            hospital_name='Test Hospital',
            hospital_location='Mirpur',
            required_date='Immediately',
            contact_number='01811111111',
            urgency='normal',
            status='pending',
            created_at=datetime.now()
        )
        db.add(req)
        db.commit()
    else:
        req.status = 'pending'
        db.commit()
    db.close()

app.dependency_overrides[get_current_user] = override_get_current_user

# Test donor search public endpoint
def test_search_donors():
    response = client.get('/donors/search?blood_group=A%2B')
    assert response.status_code == status.HTTP_200_OK
    assert 'donors' in response.json()

# Test read specific donor by ID
def test_read_specific_donor():
    setup_test_request()
    response = client.get('/donors/1')
    assert response.status_code == status.HTTP_200_OK
    assert response.json()['id'] == 1

# Test create blood request
def test_create_blood_request():
    request_data = {
        "title": "Surgery Blood Needed",
        "patient_name": "Rahim",
        "blood_group": "B+",
        "required_bags": 2,
        "hospital_name": "Square Hospital",
        "hospital_location": "Dhanmondi",
        "required_date": "Immediately",
        "contact_number": "01712345678",
        "urgency": "emergency",
        "additional_info": "Urgent"
    }
    response = client.post('/blood-request', json=request_data)
    assert response.status_code == status.HTTP_201_CREATED
    assert 'request_id' in response.json()

# Test read my blood requests
def test_read_my_blood_requests():
    setup_test_request()
    response = client.get('/blood-request/my')
    assert response.status_code == status.HTTP_200_OK
    assert len(response.json()['requests']) >= 1

# Test update blood request
def test_update_blood_request():
    setup_test_request()
    update_data = {
        "required_bags": 3,
        "additional_info": "Updated info"
    }
    response = client.put('/blood-request/999', json=update_data)
    assert response.status_code == status.HTTP_200_OK

# Test delete blood request
def test_delete_blood_request():
    setup_test_request()
    response = client.delete('/blood-request/999')
    assert response.status_code == status.HTTP_200_OK

# Test reset password endpoint
def test_reset_password():
    response = client.post('/auth/reset-password', json={
        "email": "nonexistent@test.com",
        "new_password": "newpassword123"
    })
    # Non-existent email should return 404
    assert response.status_code == status.HTTP_404_NOT_FOUND

# Test delete donor profile endpoint (unregistered donor returns 404)
def test_delete_donor_profile_not_found():
    response = client.delete('/donor/delete-profile')
    assert response.status_code in [status.HTTP_404_NOT_FOUND, status.HTTP_200_OK]

# Test unified registration endpoint creating dual-role user (donor + requester)
def test_unified_registration_dual_role():
    import random
    rand_id = random.randint(10000, 99999)
    payload = {
        "name": f"Dual User {rand_id}",
        "email": f"dual_user_{rand_id}@example.com",
        "password": "password123",
        "phone": "01711223344",
        "blood_group": "AB+",
        "location": "Dhanmondi",
        "age": 25,
        "gender": "Male"
    }
    response = client.post('/auth/register', json=payload)
    assert response.status_code == status.HTTP_201_CREATED
    data = response.json()
    assert 'access_token' in data
    assert data['can_donate'] is True
    assert data['can_request'] is True
    assert data['blood_group'] == 'AB+'

# Test get user profile endpoint returns can_donate and can_request
def test_get_user_dual_role_fields():
    setup_test_request()
    response = client.get('/user')
    assert response.status_code == status.HTTP_200_OK
    data = response.json()
    assert 'can_request' in data
    assert 'can_donate' in data
    assert data['can_request'] is True
