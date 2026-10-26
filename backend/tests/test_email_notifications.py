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

    async def test_send_otp_verification_email(self):
        from app.services.email_service import send_otp_verification_email
        with patch("app.services.email_service.send_email", new_callable=AsyncMock) as mock_send:
            await send_otp_verification_email(
                to_email="new_advocate@fastcase.in",
                otp_code="948210",
                user_name="Pooja Verma",
                expiry_minutes=10,
            )
            self.assertTrue(mock_send.called)
            args = mock_send.call_args[0]
            self.assertEqual(args[0], "new_advocate@fastcase.in")
            self.assertEqual(args[1], "Secure Verification Code for Your Account")
            self.assertIn("948210", args[2])  # HTML contains OTP
            self.assertIn("10 minutes", args[2])
            self.assertIn("948210", args[3])  # Plain text fallback contains OTP

    async def test_send_welcome_subscription_email(self):
        from app.services.email_service import send_welcome_subscription_email
        with patch("app.services.email_service.send_email", new_callable=AsyncMock) as mock_send:
            await send_welcome_subscription_email(
                to_email="subscriber@fastcase.in",
                user_name="Rajesh Khanna",
                plan_name="Advocate Chambers Enterprise",
                dashboard_url="https://fastcase.in/login",
            )
            self.assertTrue(mock_send.called)
            args = mock_send.call_args[0]
            self.assertEqual(args[0], "subscriber@fastcase.in")
            self.assertIn("Smart Legal Drafting", args[2])
            self.assertIn("Smart Case Management", args[2])
            self.assertIn("Document Intelligence", args[2])
            self.assertIn("Section 126", args[2])

    async def test_send_new_device_login_alert(self):
        from app.services.email_service import send_new_device_login_alert
        with patch("app.services.email_service.send_email", new_callable=AsyncMock) as mock_send:
            await send_new_device_login_alert(
                to_email="lawyer@fastcase.in",
                user_name="Advocate Sharma",
                ip_address="49.37.12.88",
                user_agent="Firefox 125 on Ubuntu Linux",
                location="Bengaluru, Karnataka, India",
                reset_url="https://fastcase.in/reset-password?token=sec_123",
            )
            self.assertTrue(mock_send.called)
            args = mock_send.call_args[0]
            self.assertEqual(args[0], "lawyer@fastcase.in")
            self.assertEqual(args[1], "New Sign-in Alert for Your Account")
            self.assertIn("49.37.12.88", args[2])
            self.assertIn("Bengaluru, Karnataka, India", args[2])
            self.assertIn("https://fastcase.in/reset-password?token=sec_123", args[2])

    async def test_send_transactional_email_dispatcher(self):
        from app.services.email_service import send_transactional_email
        with patch("app.services.email_service.send_email", new_callable=AsyncMock) as mock_send:
            res = await send_transactional_email(
                to="test@fastcase.in",
                subject="Secure Verification Code for Your Account",
                template="otp_verification",
                data={"otp_code": "654321", "user_name": "Advocate Anand"},
            )
            self.assertTrue(res)
            self.assertTrue(mock_send.called)

    def test_otp_service_lifecycle(self):
        from app.services.otp_service import (
            generate_otp,
            store_registration_otp,
            verify_and_clear_registration_otp,
            get_registration_otp_payload,
        )
        email = "advocate_test_lifecycle@fastcase.in"
        otp = generate_otp()
        self.assertEqual(len(otp), 6)
        self.assertTrue(otp.isdigit())

        reg_data = {"full_name": "Test Advocate", "phone": "9876543210"}
        store_registration_otp(email, reg_data, otp, expiry_seconds=300)

        # Check retrieval
        payload = get_registration_otp_payload(email)
        self.assertIsNotNone(payload)
        self.assertEqual(payload["otp"], otp)
        self.assertEqual(payload["data"]["full_name"], "Test Advocate")

        # Wrong OTP fails
        is_valid, _ = verify_and_clear_registration_otp(email, "000000")
        self.assertFalse(is_valid)

        # Correct OTP succeeds and clears
        is_valid, data = verify_and_clear_registration_otp(email, otp)
        self.assertTrue(is_valid)
        self.assertEqual(data["full_name"], "Test Advocate")

        # Second attempt fails (one-time protection)
        is_valid, _ = verify_and_clear_registration_otp(email, otp)
        self.assertFalse(is_valid)


if __name__ == "__main__":
    unittest.main()




