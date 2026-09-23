from fastapi.testclient import TestClient
from main import app
from fastapi import status

client = TestClient(app)

# Test root redirect to /docs
def test_root_endpoint():
    response = client.get('/', follow_redirects=True)
    assert response.status_code == status.HTTP_200_OK

# Test health check endpoint
def test_health_check():
    response = client.get('/health')
    assert response.status_code == status.HTTP_200_OK
    assert response.json()['status'] == 'healthy'

# Test unauthenticated access to protected endpoint
def test_unauthenticated_request():
    app.dependency_overrides.clear()
    response = client.get('/donor/me')
    assert response.status_code == status.HTTP_401_UNAUTHORIZED
