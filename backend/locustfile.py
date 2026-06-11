from locust import HttpUser, task, between
import json

class AdvocateUser(HttpUser):
    wait_time = between(1, 2)
    token = None

    def on_start(self):
        # Login to get JWT
        response = self.client.post("/api/v1/auth/token", data={
            "username": "admin@lagalos.in",
            "password": "lagalos@2025"
        })
        if response.status_code == 200:
            self.token = response.json().get("access_token")

    @task(3)
    def get_cases(self):
        if self.token:
            self.client.get("/api/v1/cases/", headers={"Authorization": f"Bearer {self.token}"})

    @task(2)
    def get_clients(self):
        if self.token:
            self.client.get("/api/v1/clients/", headers={"Authorization": f"Bearer {self.token}"})

    @task(1)
    def search(self):
        if self.token:
            self.client.get("/api/v1/search?q=divorce", headers={"Authorization": f"Bearer {self.token}"})
