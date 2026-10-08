import unittest
from unittest.mock import AsyncMock, patch
from datetime import datetime, timezone
import uuid
import sys
import os
import asyncio

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from app.models.user import User
from app.core.security import get_password_hash
from app.services.email_service import send_login_notification, send_logout_notification


class TestAuthEmailNotifications(unittest.IsolatedAsyncioTestCase):

    async def test_send_login_notification(self):
        with patch("app.services.email_service.send_email", new_callable=AsyncMock) as mock_send:
            await send_login_notification(
                to_email="lawyer@example.com",
                full_name="Advocate Sharma",
                ip_address="192.168.1.1",
                user_agent="Chrome/128.0",
                login_time=datetime.now(timezone.utc),
            )
            self.assertTrue(mock_send.called)
            call_args = mock_send.call_args[0]
            self.assertEqual(call_args[0], "lawyer@example.com")
            self.assertIn("New Login Detected", call_args[1])
            self.assertIn("Advocate Sharma", call_args[2])
            self.assertIn("192.168.1.1", call_args[2])

    async def test_send_logout_notification(self):
        with patch("app.services.email_service.send_email", new_callable=AsyncMock) as mock_send:
            await send_logout_notification(
                to_email="lawyer@example.com",
                full_name="Advocate Sharma",
                ip_address="192.168.1.1",
                user_agent="Chrome/128.0",
                logout_time=datetime.now(timezone.utc),
            )
            self.assertTrue(mock_send.called)
            call_args = mock_send.call_args[0]
            self.assertEqual(call_args[0], "lawyer@example.com")
            self.assertIn("Account Logged Out", call_args[1])
            self.assertIn("Advocate Sharma", call_args[2])
            self.assertIn("192.168.1.1", call_args[2])


if __name__ == "__main__":
    unittest.main()
