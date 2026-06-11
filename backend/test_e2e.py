import pytest
import requests

BASE_URL = "http://127.0.0.1:8000"

@pytest.fixture(scope="session")
def token():
    response = requests.post(f"{BASE_URL}/api/v1/auth/token", data={
        "username": "admin@lagalos.in",
        "password": "lagalos@2025"
    })
    assert response.status_code == 200
    assert "access_token" in response.json()
    return response.json()["access_token"]

def test_get_cases(token):
    response = requests.get(f"{BASE_URL}/api/v1/cases/", headers={"Authorization": f"Bearer {token}"})
    assert response.status_code == 200
    assert len(response.json()) > 0

def test_kyc_flow(token):
    # Simulate KYC Submission
    pass

def run_tests():
    token = test_login()
    print("Login Test: PASSED")
    test_get_cases(token)
    print("Case Retrieval Test: PASSED")
    print("All E2E API Tests PASSED")

if __name__ == "__main__":
    run_tests()
