import time
from locust import HttpUser, task, between

class LegalOSLoadTest(HttpUser):
    wait_time = between(1, 3)

    def on_start(self):
        """Login and get token before testing."""
        response = self.client.post("/api/v1/auth/token", data={
            "username": "admin@lagalos.in",
            "password": "lagalos@2025"
        })
        if response.status_code == 200:
            token = response.json()["access_token"]
            self.client.headers = {"Authorization": f"Bearer {token}"}
        else:
            print(f"Failed to login: {response.text}")

    @task(3)
    def test_dashboard(self):
        self.client.get("/api/v1/dashboard/metrics")

    @task(2)
    def test_search(self):
        self.client.get("/api/v1/search/?q=case")

    @task(2)
    def test_list_cases(self):
        self.client.get("/api/v1/cases/?limit=50")

    @task(1)
    def test_list_documents(self):
        self.client.get("/api/v1/documents/?limit=50")

# Run with:
# locust -f tests/load_test.py --host=https://api.lagalos.in
