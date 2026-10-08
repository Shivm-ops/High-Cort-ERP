"""
app/services/email_service.py
==============================
Async-friendly email utilities using Azure Communication Services (ACS).

The ACS EmailClient is synchronous, so every send is wrapped in
asyncio.to_thread so the FastAPI event loop is never blocked.
"""

import asyncio
import logging
from datetime import datetime, timezone

from azure.communication.email import EmailClient
from azure.core.exceptions import HttpResponseError

from app.core.config import settings

logger = logging.getLogger(__name__)


import smtplib
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText

# ── Low-level sender ──────────────────────────────────────────────────────────

def _send_email_sync(to_email: str, subject: str, html_body: str, text_body: str = "") -> None:
    """Blocking send — supports Azure Communication Services and SMTP (Amazon SES/Gmail/etc.)."""
    # 1. Try Azure Communication Services if configured
    conn_str = settings.AZURE_COMMUNICATION_CONNECTION_STRING
    if conn_str:
        from_address = f"{settings.AZURE_EMAIL_FROM_NAME} <{settings.AZURE_EMAIL_FROM_ADDRESS}>"
        message = {
            "senderAddress": from_address,
            "recipients": {
                "to": [{"address": to_email}],
            },
            "content": {
                "subject": subject,
                "html": html_body,
                "plainText": text_body,
            },
        }
        try:
            client = EmailClient.from_connection_string(conn_str)
            poller = client.begin_send(message)
            result = poller.result()
            logger.info("ACS email sent to %s | subject: %s | messageId: %s", to_email, subject, result.get("id"))
            return
        except HttpResponseError as exc:
            logger.error("ACS HTTP error sending to %s: %s", to_email, exc)
            return
        except Exception as exc:
            logger.error("Failed to send ACS email to %s: %s", to_email, exc)
            return

    # 2. Try SMTP (Amazon SES, Gmail, Mailtrap, etc.) if configured
    smtp_host = settings.SMTP_HOST
    smtp_username = settings.SMTP_USERNAME
    smtp_password = settings.SMTP_PASSWORD

    is_valid_smtp = bool(
        smtp_host
        and smtp_username
        and not smtp_username.startswith("REPLACE_WITH_")
        and not smtp_password.startswith("REPLACE_WITH_")
    )

    if is_valid_smtp:
        try:
            msg = MIMEMultipart("alternative")
            msg["Subject"] = subject
            from_name = settings.SMTP_FROM_NAME or "Fastcase ERP"
            from_email = settings.SMTP_FROM_EMAIL or "noreply@fastcase.in"
            msg["From"] = f"{from_name} <{from_email}>"
            msg["To"] = to_email

            if text_body:
                msg.attach(MIMEText(text_body, "plain"))
            if html_body:
                msg.attach(MIMEText(html_body, "html"))

            port = settings.SMTP_PORT or 587
            with smtplib.SMTP(smtp_host, port, timeout=10) as server:
                if settings.SMTP_USE_TLS:
                    server.starttls()
                if smtp_username and smtp_password:
                    server.login(smtp_username, smtp_password)
                server.sendmail(from_email, [to_email], msg.as_string())

            logger.info("SMTP email sent to %s | subject: %s", to_email, subject)
            return
        except Exception as exc:
            logger.error("Failed to send SMTP email to %s: %s", to_email, exc)
            return

    # 3. Fallback / Development simulation
    logger.info(
        "[EMAIL SIMULATION] To: %s | Subject: %s | (No active ACS/SMTP credentials configured in .env)",
        to_email,
        subject,
    )


async def send_email(to_email: str, subject: str, html_body: str, text_body: str = "") -> None:
    """Non-blocking wrapper — safe to await inside any FastAPI endpoint."""
    await asyncio.to_thread(_send_email_sync, to_email, subject, html_body, text_body)


# ── Login notification ────────────────────────────────────────────────────────

async def send_login_notification(
    to_email: str,
    full_name: str,
    ip_address: str | None,
    user_agent: str | None,
    login_time: datetime | None = None,
) -> None:
    """Send a 'New login detected' email to the user."""
    login_time = login_time or datetime.now(timezone.utc)
    time_str = login_time.strftime("%d %b %Y, %I:%M %p UTC")
    ip_str = ip_address or "Unknown"
    device_str = (user_agent[:120] + "...") if user_agent and len(user_agent) > 120 else (user_agent or "Unknown")

    subject = "New Login Detected - Fastcase ERP"

    html_body = f"""<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>Login Notification</title>
  <style>
    body {{ margin:0; padding:0; background:#f4f6fb; font-family:'Segoe UI',Arial,sans-serif; }}
    .wrapper {{ max-width:560px; margin:40px auto; background:#ffffff; border-radius:12px;
                box-shadow:0 4px 20px rgba(0,0,0,0.08); overflow:hidden; }}
    .header {{ background:linear-gradient(135deg,#0078d4 0%,#005a9e 100%);
               padding:36px 32px; text-align:center; }}
    .header h1 {{ color:#ffffff; margin:0; font-size:22px; font-weight:700; letter-spacing:0.5px; }}
    .header p  {{ color:#cce4f7; margin:6px 0 0; font-size:13px; }}
    .body {{ padding:32px; }}
    .body p {{ color:#374151; font-size:15px; line-height:1.6; margin:0 0 16px; }}
    .info-box {{ background:#f0f7ff; border-left:4px solid #0078d4; border-radius:6px;
                 padding:16px 20px; margin:20px 0; }}
    .info-row {{ display:flex; justify-content:space-between; padding:6px 0;
                 border-bottom:1px solid #dde4f0; font-size:14px; }}
    .info-row:last-child {{ border-bottom:none; }}
    .info-label {{ color:#6b7280; font-weight:600; }}
    .info-value {{ color:#111827; text-align:right; max-width:280px; word-break:break-all; }}
    .alert-box {{ background:#fff8e1; border-left:4px solid #f59e0b; border-radius:6px;
                  padding:14px 18px; margin:20px 0; font-size:13px; color:#78350f; }}
    .footer {{ background:#f9fafb; padding:20px 32px; text-align:center;
               font-size:12px; color:#9ca3af; border-top:1px solid #e5e7eb; }}
  </style>
</head>
<body>
  <div class="wrapper">
    <div class="header">
      <h1>New Login Detected</h1>
      <p>Fastcase ERP Security Alert</p>
    </div>
    <div class="body">
      <p>Hi <strong>{full_name}</strong>,</p>
      <p>We noticed a new login to your <strong>Fastcase ERP</strong> account. Here are the details:</p>
      <div class="info-box">
        <div class="info-row">
          <span class="info-label">Time</span>
          <span class="info-value">{time_str}</span>
        </div>
        <div class="info-row">
          <span class="info-label">IP Address</span>
          <span class="info-value">{ip_str}</span>
        </div>
        <div class="info-row">
          <span class="info-label">Device / Browser</span>
          <span class="info-value">{device_str}</span>
        </div>
      </div>
      <div class="alert-box">
        <strong>Not you?</strong> If you did not perform this login, please
        <strong>change your password immediately</strong> and contact your system administrator.
      </div>
      <p>If this was you, no action is needed. Stay secure!</p>
    </div>
    <div class="footer">
      &copy; {login_time.year} Fastcase ERP &nbsp;|&nbsp;
      This is an automated security notification. Please do not reply to this email.
    </div>
  </div>
</body>
</html>"""

    text_body = (
        f"Hi {full_name},\n\n"
        f"A new login was detected on your Fastcase ERP account.\n\n"
        f"Time       : {time_str}\n"
        f"IP Address : {ip_str}\n"
        f"Device     : {device_str}\n\n"
        f"If this was not you, please change your password immediately.\n\n"
        f"-- Fastcase ERP Security Team"
    )

    await send_email(to_email, subject, html_body, text_body)


# ── Logout notification ───────────────────────────────────────────────────────

async def send_logout_notification(
    to_email: str,
    full_name: str,
    ip_address: str | None,
    user_agent: str | None,
    logout_time: datetime | None = None,
) -> None:
    """Send a 'Logout confirmed' security email to the user."""
    logout_time = logout_time or datetime.now(timezone.utc)
    time_str = logout_time.strftime("%d %b %Y, %I:%M %p UTC")
    ip_str = ip_address or "Unknown"
    device_str = (user_agent[:120] + "...") if user_agent and len(user_agent) > 120 else (user_agent or "Unknown")

    subject = "Account Logged Out - Fastcase ERP"

    html_body = f"""<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>Logout Notification</title>
  <style>
    body {{ margin:0; padding:0; background:#f4f6fb; font-family:'Segoe UI',Arial,sans-serif; }}
    .wrapper {{ max-width:560px; margin:40px auto; background:#ffffff; border-radius:12px;
                box-shadow:0 4px 20px rgba(0,0,0,0.08); overflow:hidden; }}
    .header {{ background:linear-gradient(135deg,#374151 0%,#1f2937 100%);
               padding:36px 32px; text-align:center; }}
    .header h1 {{ color:#ffffff; margin:0; font-size:22px; font-weight:700; letter-spacing:0.5px; }}
    .header p  {{ color:#9ca3af; margin:6px 0 0; font-size:13px; }}
    .body {{ padding:32px; }}
    .body p {{ color:#374151; font-size:15px; line-height:1.6; margin:0 0 16px; }}
    .info-box {{ background:#f9fafb; border-left:4px solid #6b7280; border-radius:6px;
                 padding:16px 20px; margin:20px 0; }}
    .info-row {{ display:flex; justify-content:space-between; padding:6px 0;
                 border-bottom:1px solid #e5e7eb; font-size:14px; }}
    .info-row:last-child {{ border-bottom:none; }}
    .info-label {{ color:#6b7280; font-weight:600; }}
    .info-value {{ color:#111827; text-align:right; max-width:280px; word-break:break-all; }}
    .alert-box {{ background:#fef2f2; border-left:4px solid #ef4444; border-radius:6px;
                  padding:14px 18px; margin:20px 0; font-size:13px; color:#991b1b; }}
    .footer {{ background:#f9fafb; padding:20px 32px; text-align:center;
               font-size:12px; color:#9ca3af; border-top:1px solid #e5e7eb; }}
  </style>
</head>
<body>
  <div class="wrapper">
    <div class="header">
      <h1>Account Logged Out</h1>
      <p>Fastcase ERP Security Notification</p>
    </div>
    <div class="body">
      <p>Hi <strong>{full_name}</strong>,</p>
      <p>You have successfully logged out of your <strong>Fastcase ERP</strong> session. Here are the session details:</p>
      <div class="info-box">
        <div class="info-row">
          <span class="info-label">Time</span>
          <span class="info-value">{time_str}</span>
        </div>
        <div class="info-row">
          <span class="info-label">IP Address</span>
          <span class="info-value">{ip_str}</span>
        </div>
        <div class="info-row">
          <span class="info-label">Device / Browser</span>
          <span class="info-value">{device_str}</span>
        </div>
      </div>
      <div class="alert-box">
        <strong>Didn't log out?</strong> If this was not you or you believe someone else accessed your account, please
        <strong>change your password immediately</strong> and contact your administrator.
      </div>
      <p>Thank you for using Fastcase ERP.</p>
    </div>
    <div class="footer">
      &copy; {logout_time.year} Fastcase ERP &nbsp;|&nbsp;
      This is an automated security notification. Please do not reply to this email.
    </div>
  </div>
</body>
</html>"""

    text_body = (
        f"Hi {full_name},\n\n"
        f"You have been logged out of your Fastcase ERP session.\n\n"
        f"Time       : {time_str}\n"
        f"IP Address : {ip_str}\n"
        f"Device     : {device_str}\n\n"
        f"If this was not done by you, please reset your password immediately.\n\n"
        f"-- Fastcase ERP Security Team"
    )

    await send_email(to_email, subject, html_body, text_body)

