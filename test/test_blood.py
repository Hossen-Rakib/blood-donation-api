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

# Setup sample data ensuring pending status
def setup_test_request():
    db = sessionLocal()
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
