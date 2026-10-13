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
from app.services.email_service import (
    send_login_notification,
    send_logout_notification,
    send_admin_login_notification,
    notify_login,
)


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

    async def test_send_admin_login_notification(self):
        with patch("app.services.email_service.send_email", new_callable=AsyncMock) as mock_send:
            await send_admin_login_notification(
                to_email="admin@fastcase.in",
                user_email="lawyer@example.com",
                user_name="Advocate Sharma",
                user_role="associate_advocate",
                ip_address="192.168.1.1",
                user_agent="Chrome/128.0",
                firm_name="Sharma & Partners",
                login_time=datetime.now(timezone.utc),
            )
            self.assertTrue(mock_send.called)
            call_args = mock_send.call_args[0]
            self.assertEqual(call_args[0], "admin@fastcase.in")
            self.assertIn("[Admin Alert] User Login", call_args[1])
            self.assertIn("Advocate Sharma", call_args[2])
            self.assertIn("lawyer@example.com", call_args[2])
            self.assertIn("192.168.1.1", call_args[2])
            self.assertIn("Sharma & Partners", call_args[2])

    async def test_notify_login_dispatches_to_both_user_and_admin(self):
        with patch("app.services.email_service.send_email", new_callable=AsyncMock) as mock_send:
            await notify_login(
                user_email="user@example.com",
                user_name="John Doe",
                ip_address="10.0.0.1",
                user_agent="Firefox/120.0",
                user_role="senior_advocate",
                firm_name="Apex Legal",
                admin_emails=["admin@fastcase.in", "superadmin@fastcase.in"],
                login_time=datetime.now(timezone.utc),
            )
            # Expecting 3 emails: 1 for user, 2 for admins
            self.assertEqual(mock_send.call_count, 3)
            recipients = [call[0][0] for call in mock_send.call_args_list]
            self.assertIn("user@example.com", recipients)
            self.assertIn("admin@fastcase.in", recipients)
            self.assertIn("superadmin@fastcase.in", recipients)

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

