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
from typing import Any

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
            email_client_cls: Any = EmailClient
            client = email_client_cls.from_connection_string(conn_str)
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


# ── Admin Login notification ──────────────────────────────────────────────────

async def send_admin_login_notification(
    to_email: str,
    user_email: str,
    user_name: str,
    user_role: str,
    ip_address: str | None,
    user_agent: str | None,
    firm_name: str | None = None,
    login_time: datetime | None = None,
) -> None:
    """Send a notification to admin about a user/client login."""
    login_time = login_time or datetime.now(timezone.utc)
    time_str = login_time.strftime("%d %b %Y, %I:%M %p UTC")
    ip_str = ip_address or "Unknown"
    device_str = (user_agent[:120] + "...") if user_agent and len(user_agent) > 120 else (user_agent or "Unknown")
    firm_str = firm_name or "Individual Practice / Direct"
    role_display = user_role.replace("_", " ").title()

    subject = f"[Admin Alert] User Login: {user_name} ({user_email}) - Fastcase ERP"

    html_body = f"""<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>Admin Alert - User Login</title>
  <style>
    body {{ margin:0; padding:0; background:#f4f6fb; font-family:'Segoe UI',Arial,sans-serif; }}
    .wrapper {{ max-width:560px; margin:40px auto; background:#ffffff; border-radius:12px;
                box-shadow:0 4px 20px rgba(0,0,0,0.08); overflow:hidden; }}
    .header {{ background:linear-gradient(135deg,#0f172a 0%,#1e293b 100%);
               padding:36px 32px; text-align:center; }}
    .badge {{ display:inline-block; padding:4px 12px; background:rgba(245,158,11,0.2); border:1px solid #f59e0b; color:#fbbf24; border-radius:20px; font-size:11px; font-weight:700; text-transform:uppercase; letter-spacing:1px; margin-bottom:12px; }}
    .header h1 {{ color:#ffffff; margin:0; font-size:22px; font-weight:700; letter-spacing:0.5px; }}
    .header p  {{ color:#94a3b8; margin:6px 0 0; font-size:13px; }}
    .body {{ padding:32px; }}
    .body p {{ color:#374151; font-size:15px; line-height:1.6; margin:0 0 16px; }}
    .info-box {{ background:#f8fafc; border-left:4px solid #0284c7; border-radius:6px;
                 padding:16px 20px; margin:20px 0; border:1px solid #e2e8f0; border-left:4px solid #0284c7; }}
    .info-row {{ display:flex; justify-content:space-between; padding:8px 0;
                 border-bottom:1px solid #e2e8f0; font-size:14px; }}
    .info-row:last-child {{ border-bottom:none; }}
    .info-label {{ color:#64748b; font-weight:600; }}
    .info-value {{ color:#0f172a; text-align:right; font-weight:600; max-width:300px; word-break:break-all; }}
    .alert-box {{ background:#eff6ff; border-left:4px solid #3b82f6; border-radius:6px;
                  padding:14px 18px; margin:20px 0; font-size:13px; color:#1e40af; }}
    .footer {{ background:#f8fafc; padding:20px 32px; text-align:center;
               font-size:12px; color:#94a3b8; border-top:1px solid #e2e8f0; }}
  </style>
</head>
<body>
  <div class="wrapper">
    <div class="header">
      <div class="badge">Security Audit</div>
      <h1>User Login Activity</h1>
      <p>Fastcase ERP Administrator Notification</p>
    </div>
    <div class="body">
      <p>Hello Administrator,</p>
      <p>A user has successfully authenticated on <strong>Fastcase ERP</strong>. Here are the session details:</p>
      <div class="info-box">
        <div class="info-row">
          <span class="info-label">User Name</span>
          <span class="info-value">{user_name}</span>
        </div>
        <div class="info-row">
          <span class="info-label">User Email</span>
          <span class="info-value">{user_email}</span>
        </div>
        <div class="info-row">
          <span class="info-label">Account Role</span>
          <span class="info-value">{role_display}</span>
        </div>
        <div class="info-row">
          <span class="info-label">Firm / Practice</span>
          <span class="info-value">{firm_str}</span>
        </div>
        <div class="info-row">
          <span class="info-label">Login Time</span>
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
        <strong>Audit Information:</strong> This event has been recorded in the central audit logs. If this login looks suspicious, you can review active sessions or deactivate the account from the Admin Portal.
      </div>
    </div>
    <div class="footer">
      &copy; {login_time.year} Fastcase ERP &nbsp;|&nbsp;
      Automated Administrator Security Notification
    </div>
  </div>
</body>
</html>"""

    text_body = (
        f"Admin Alert: User Login Detected\n\n"
        f"A user has successfully logged in to Fastcase ERP.\n\n"
        f"User Name  : {user_name}\n"
        f"User Email : {user_email}\n"
        f"Role       : {role_display}\n"
        f"Firm       : {firm_str}\n"
        f"Login Time : {time_str}\n"
        f"IP Address : {ip_str}\n"
        f"Device     : {device_str}\n\n"
        f"-- Fastcase ERP Security System"
    )

    await send_email(to_email, subject, html_body, text_body)


# ── Unified Login Notification Dispatcher ──────────────────────────────────────

async def notify_login(
    user_email: str,
    user_name: str,
    ip_address: str | None,
    user_agent: str | None,
    user_role: str = "User",
    firm_name: str | None = None,
    admin_emails: list[str] | None = None,
    login_time: datetime | None = None,
) -> None:
    """Send login notification to the user and to all admin recipients."""
    login_time = login_time or datetime.now(timezone.utc)
    tasks = []

    # 1. Send notification to user
    if user_email:
        tasks.append(
            send_login_notification(
                to_email=user_email,
                full_name=user_name,
                ip_address=ip_address,
                user_agent=user_agent,
                login_time=login_time,
            )
        )

    # 2. Send notification to admin(s)
    if admin_emails:
        for admin_email in admin_emails:
            if admin_email:
                tasks.append(
                    send_admin_login_notification(
                        to_email=admin_email,
                        user_email=user_email,
                        user_name=user_name,
                        user_role=user_role,
                        ip_address=ip_address,
                        user_agent=user_agent,
                        firm_name=firm_name,
                        login_time=login_time,
                    )
                )

    if tasks:
        await asyncio.gather(*tasks, return_exceptions=True)


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


# ── 1. User Registration & OTP Verification Email ─────────────────────────────

def render_otp_verification_template(otp_code: str, user_name: str = "Advocate", expiry_minutes: int = 10) -> tuple[str, str]:
    """Render HTML and plain-text templates for 6-digit OTP verification."""
    # Split digits for stylish tabular rendering
    otp_digits = [d for d in str(otp_code).strip()[:6]]
    digit_cells = "".join([
        f'<td style="width:44px; height:52px; background:#f1f5f9; border:1.5px solid #cbd5e1; border-radius:8px; text-align:center; font-family:\'Courier New\',Courier,monospace; font-size:28px; font-weight:700; color:#0f172a; margin:0 4px;">{d}</td>'
        for d in otp_digits
    ])

    html_body = f"""<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <meta http-equiv="X-UA-Compatible" content="IE=edge"/>
  <title>Secure Verification Code</title>
  <style>
    body {{ margin:0; padding:0; background-color:#0b0f19; font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif; -webkit-font-smoothing:antialiased; }}
    table {{ border-collapse:separate; }}
    .email-container {{ max-width:600px; margin:40px auto; background-color:#ffffff; border-radius:12px; overflow:hidden; box-shadow:0 10px 30px rgba(0,0,0,0.15); }}
    .header {{ background:linear-gradient(135deg, #0f172a 0%, #1e293b 100%); padding:36px 32px; text-align:center; border-bottom:3px solid #2563eb; }}
    .brand {{ font-size:22px; font-weight:800; color:#ffffff; letter-spacing:1px; text-transform:uppercase; margin:0; }}
    .brand-accent {{ color:#38bdf8; }}
    .content {{ padding:36px 32px; background-color:#ffffff; }}
    .greeting {{ font-size:18px; font-weight:700; color:#0f172a; margin:0 0 16px; }}
    .copy {{ font-size:15px; color:#475569; line-height:1.65; margin:0 0 24px; }}
    .otp-wrapper {{ background-color:#f8fafc; border:1px solid #e2e8f0; border-radius:10px; padding:24px; text-align:center; margin:28px 0; }}
    .otp-label {{ font-size:12px; font-weight:600; color:#64748b; text-transform:uppercase; letter-spacing:1.5px; margin-bottom:12px; }}
    .expiry-note {{ font-size:13px; color:#64748b; margin-top:14px; font-weight:500; }}
    .expiry-badge {{ display:inline-block; background-color:#fef3c7; color:#92400e; font-weight:700; padding:3px 8px; border-radius:4px; font-size:12px; }}
    .disclaimer-box {{ background-color:#f1f5f9; border-left:4px solid #64748b; border-radius:4px; padding:14px 16px; margin:24px 0 0; font-size:13px; color:#475569; line-height:1.5; }}
    .footer {{ background-color:#f8fafc; padding:24px 32px; text-align:center; border-top:1px solid #e2e8f0; font-size:12px; color:#94a3b8; line-height:1.6; }}
    .footer a {{ color:#2563eb; text-decoration:none; }}
  </style>
</head>
<body style="margin:0; padding:0; background-color:#0b0f19;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#0b0f19; padding:24px 12px;">
    <tr>
      <td align="center">
        <table role="presentation" class="email-container" width="600" cellpadding="0" cellspacing="0" style="max-width:600px; background-color:#ffffff; border-radius:12px; overflow:hidden;">
          <tr>
            <td class="header" style="background:linear-gradient(135deg, #0f172a 0%, #1e293b 100%); padding:36px 32px; text-align:center; border-bottom:3px solid #2563eb;">
              <h1 class="brand" style="margin:0; font-size:22px; font-weight:800; color:#ffffff; letter-spacing:1px; text-transform:uppercase;">
                FASTCASE<span class="brand-accent" style="color:#38bdf8;">.IN</span>
              </h1>
              <p style="margin:6px 0 0; color:#94a3b8; font-size:13px; letter-spacing:0.5px;">Advocate & Legal Practice ERP Platform</p>
            </td>
          </tr>
          <tr>
            <td class="content" style="padding:36px 32px;">
              <h2 class="greeting" style="font-size:18px; font-weight:700; color:#0f172a; margin:0 0 16px;">Hello {user_name},</h2>
              <p class="copy" style="font-size:15px; color:#475569; line-height:1.65; margin:0 0 20px;">
                Thank you for registering with <strong>Fastcase</strong>. To complete your account verification and secure your advocate portal, please enter the One-Time Password (OTP) below:
              </p>
              
              <div class="otp-wrapper" style="background-color:#f8fafc; border:1px solid #e2e8f0; border-radius:10px; padding:24px 16px; text-align:center; margin:24px 0;">
                <div class="otp-label" style="font-size:12px; font-weight:600; color:#64748b; text-transform:uppercase; letter-spacing:1.5px; margin-bottom:14px;">Your 6-Digit One-Time Password</div>
                <!-- Accessible/Copyable code snippet -->
                <div style="display:none; font-size:0; max-height:0; line-height:0; mso-hide:all;">{otp_code}</div>
                <table role="presentation" cellpadding="0" cellspacing="6" align="center" style="margin:0 auto;">
                  <tr>
                    {digit_cells}
                  </tr>
                </table>
                <p class="expiry-note" style="font-size:13px; color:#64748b; margin-top:16px; margin-bottom:0;">
                  ⏳ This verification code expires in <span class="expiry-badge" style="background-color:#fef3c7; color:#92400e; font-weight:700; padding:2px 8px; border-radius:4px;">{expiry_minutes} minutes</span> for security purposes.
                </p>
              </div>

              <div class="disclaimer-box" style="background-color:#f8fafc; border-left:4px solid #94a3b8; border-radius:4px; padding:14px 16px; margin:24px 0 0; font-size:13px; color:#475569; line-height:1.5;">
                <strong>Security Disclaimer:</strong> If you did not initiate this registration or request this verification code, please ignore this email. No changes will be made to your contact details without this OTP.
              </div>
            </td>
          </tr>
          <tr>
            <td class="footer" style="background-color:#f8fafc; padding:24px 32px; text-align:center; border-top:1px solid #e2e8f0; font-size:12px; color:#94a3b8; line-height:1.6;">
              &copy; {datetime.now(timezone.utc).year} <a href="https://fastcase.in/" style="color:#2563eb; text-decoration:none; font-weight:600;">Fastcase.in</a> &bull; All Rights Reserved.<br/>
              High Court & District Court Enterprise Legal Practice Automation.
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>"""

    text_body = (
        f"FASTCASE.IN — SECURE VERIFICATION CODE\n"
        f"====================================================\n\n"
        f"Hello {user_name},\n\n"
        f"Thank you for registering with Fastcase (https://fastcase.in/).\n"
        f"Your 6-digit One-Time Password (OTP) for account verification is:\n\n"
        f"    >>> {otp_code} <<<\n\n"
        f"SECURITY NOTICE: This code will expire in {expiry_minutes} minutes.\n\n"
        f"If you did not request this code, you can safely ignore this email.\n\n"
        f"-- Fastcase Security Team\n"
        f"https://fastcase.in"
    )

    return html_body, text_body


async def send_otp_verification_email(
    to_email: str,
    otp_code: str,
    user_name: str = "Advocate",
    expiry_minutes: int = 10,
) -> None:
    """Send OTP email verification for user registration."""
    subject = "Secure Verification Code for Your Account"
    html_body, text_body = render_otp_verification_template(otp_code, user_name, expiry_minutes)
    await send_email(to_email, subject, html_body, text_body)


# ── 2. Welcome & Subscription Activation Email ────────────────────────────────

def render_welcome_subscription_template(
    user_name: str,
    plan_name: str = "Advocate Pro Practice",
    dashboard_url: str = "https://fastcase.in/login",
) -> tuple[str, str]:
    """Render HTML and plain-text templates for advocate subscription onboarding."""
    current_year = datetime.now(timezone.utc).year

    html_body = f"""<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <meta http-equiv="X-UA-Compatible" content="IE=edge"/>
  <title>Welcome to Fastcase</title>
</head>
<body style="margin:0; padding:0; background-color:#0b1120; font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif; -webkit-font-smoothing:antialiased;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#0b1120; padding:32px 12px;">
    <tr>
      <td align="center">
        <!-- Container -->
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:620px; background-color:#ffffff; border-radius:12px; overflow:hidden; box-shadow:0 12px 40px rgba(0,0,0,0.25);">
          
          <!-- Header Banner -->
          <tr>
            <td style="background:linear-gradient(135deg, #0f172a 0%, #1e293b 100%); padding:40px 36px; text-align:center; border-bottom:3px solid #2563eb;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td align="center">
                    <div style="font-size:24px; font-weight:800; color:#ffffff; letter-spacing:1.5px; text-transform:uppercase;">
                      FASTCASE<span style="color:#38bdf8;">.IN</span>
                    </div>
                    <div style="font-size:13px; color:#94a3b8; font-weight:500; margin-top:6px; letter-spacing:0.5px;">
                      Enterprise Legal Practice Automation & Chambers ERP
                    </div>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Main Content Body -->
          <tr>
            <td style="padding:40px 36px; background-color:#ffffff;">
              
              <!-- Plan Badge -->
              <table role="presentation" cellpadding="0" cellspacing="0" style="margin-bottom:20px;">
                <tr>
                  <td style="background-color:#eff6ff; border:1px solid #bfdbfe; border-radius:20px; padding:6px 14px; font-size:12px; font-weight:700; color:#1d4ed8; text-transform:uppercase; letter-spacing:0.8px;">
                    ✓ {plan_name} Activated
                  </td>
                </tr>
              </table>

              <!-- Greeting -->
              <h2 style="font-size:22px; font-weight:700; color:#0f172a; margin:0 0 16px; line-height:1.3;">
                Dear Advocate {user_name},
              </h2>

              <p style="font-size:15px; color:#475569; line-height:1.7; margin:0 0 20px;">
                Welcome to <strong>Fastcase</strong>. Your legal chambers workspace has been successfully provisioned and configured. Your practice is now equipped with enterprise-grade litigation automation engineered specifically for advocates, law firms, and legal counsels practicing across India.
              </p>

              <!-- Divider -->
              <hr style="border:none; border-top:1px solid #e2e8f0; margin:24px 0;"/>

              <!-- Features Header -->
              <div style="font-size:13px; font-weight:700; color:#0f172a; text-transform:uppercase; letter-spacing:1px; margin-bottom:16px;">
                Core Platform Capabilities
              </div>

              <!-- Feature 1: CNR Cause List -->
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:12px; background-color:#f8fafc; border:1px solid #e2e8f0; border-radius:8px; padding:16px;">
                <tr>
                  <td width="40" valign="top" style="font-size:22px; padding-right:12px;">⚡</td>
                  <td valign="top">
                    <div style="font-size:15px; font-weight:700; color:#0f172a; margin-bottom:4px;">CNR & Cause List Synchronization</div>
                    <div style="font-size:13px; color:#64748b; line-height:1.5;">Automated real-time e-Courts tracking, hearing board status, and daily cause list alerts across all High Courts and District Courts.</div>
                  </td>
                </tr>
              </table>

              <!-- Feature 2: 500+ Multilingual Drafts -->
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:12px; background-color:#f8fafc; border:1px solid #e2e8f0; border-radius:8px; padding:16px;">
                <tr>
                  <td width="40" valign="top" style="font-size:22px; padding-right:12px;">⚖️</td>
                  <td valign="top">
                    <div style="font-size:15px; font-weight:700; color:#0f172a; margin-bottom:4px;">500+ Multilingual Vernacular Legal Drafts</div>
                    <div style="font-size:13px; color:#64748b; line-height:1.5;">Jurisdiction-vetted pleadings, bail applications, civil & criminal petitions, writ petitions, and legal notices across English and regional languages.</div>
                  </td>
                </tr>
              </table>

              <!-- Feature 3: GST Invoicing -->
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:28px; background-color:#f8fafc; border:1px solid #e2e8f0; border-radius:8px; padding:16px;">
                <tr>
                  <td width="40" valign="top" style="font-size:22px; padding-right:12px;">💳</td>
                  <td valign="top">
                    <div style="font-size:15px; font-weight:700; color:#0f172a; margin-bottom:4px;">GST-Compliant Fee Invoicing & Ledgers</div>
                    <div style="font-size:13px; color:#64748b; line-height:1.5;">Professional chamber billing, client trust accounting, automated tax invoicing, and digital receipting.</div>
                  </td>
                </tr>
              </table>

              <!-- Primary CTA Button -->
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:28px;">
                <tr>
                  <td align="center">
                    <a href="{dashboard_url}" target="_blank" style="display:block; width:100%; box-sizing:border-box; background:linear-gradient(135deg, #1e40af 0%, #2563eb 100%); color:#ffffff !important; text-decoration:none; padding:16px 28px; font-size:15px; font-weight:700; border-radius:8px; text-align:center; box-shadow:0 4px 12px rgba(37,99,235,0.25);">
                      Launch Your Chambers Dashboard &rarr;
                    </a>
                  </td>
                </tr>
              </table>

              <!-- Recommendations & Compliance Box -->
              <div style="background-color:#f0fdf4; border-left:4px solid #16a34a; border-radius:6px; padding:18px 20px; font-size:13px; color:#14532d; line-height:1.6;">
                <div style="font-weight:700; color:#15803d; font-size:14px; margin-bottom:8px;">
                  Recommended Chamber Setup:
                </div>
                <ul style="margin:0; padding-left:18px;">
                  <li style="margin-bottom:8px;">
                    <strong>Invite Chamber Associates & Staff:</strong> Delegate cases with role-based access controls for partners, associates, and chamber clerks.
                  </li>
                  <li>
                    <strong>Configure Section 126 Privileged Client Vaults:</strong> Secure confidential client communications and documents under Section 126 of the Indian Evidence Act / Section 132 of the Bharatiya Sakshya Adhiniyam, 2023 with end-to-end encrypted storage.
                  </li>
                </ul>
              </div>

              <!-- Sign-off -->
              <p style="font-size:14px; color:#64748b; line-height:1.6; margin:28px 0 0;">
                Warm regards,<br/>
                <strong style="color:#0f172a;">The Fastcase Practice Success Team</strong><br/>
                <span style="font-size:12px; color:#94a3b8;">Supreme Court, High Court & District Court Practice Automation</span>
              </p>

            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color:#f8fafc; padding:24px 36px; text-align:center; border-top:1px solid #e2e8f0; font-size:12px; color:#94a3b8; line-height:1.6;">
              Need assistance setting up your chambers? Contact us anytime at 
              <a href="mailto:support@fastcase.in" style="color:#2563eb; text-decoration:none; font-weight:600;">support@fastcase.in</a><br/>
              &copy; {current_year} <a href="https://fastcase.in/" style="color:#2563eb; text-decoration:none; font-weight:600;">Fastcase.in</a> &bull; All Rights Reserved.<br/>
              <span style="font-size:11px; color:#cbd5e1;">This is a privileged transactional notice sent to verified Fastcase practitioners.</span>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>"""

    text_body = (
        f"WELCOME TO FASTCASE — YOUR LEGAL PRACTICE PLATFORM IS READY\n"
        f"============================================================\n\n"
        f"Dear Advocate {user_name},\n\n"
        f"Welcome to Fastcase. Your digital chambers workspace has been successfully\n"
        f"provisioned under the {plan_name} plan.\n\n"
        f"CORE PLATFORM CAPABILITIES:\n"
        f"1. CNR & Cause List Sync: Real-time automated cause list updates across High Courts & District Courts.\n"
        f"2. 500+ Multilingual Vernacular Drafts: Battle-tested legal notices, petitions, and drafts in English & regional languages.\n"
        f"3. GST-Compliant Invoicing: Professional billing, client trust ledgers, and automated tax invoices.\n\n"
        f"ACCESS YOUR ACCOUNT:\n"
        f"Dashboard Login: {dashboard_url}\n\n"
        f"RECOMMENDED NEXT STEPS:\n"
        f"- Add chamber team members (partners, associates, clerks) with role-based access control.\n"
        f"- Establish Section 126 privileged client vaults under the Indian Evidence Act / BSA 2023.\n\n"
        f"Need assistance? Contact our team at support@fastcase.in\n\n"
        f"Warm regards,\n"
        f"The Fastcase Practice Success Team\n"
        f"https://fastcase.in"
    )

    return html_body, text_body


async def send_welcome_subscription_email(
    to_email: str,
    user_name: str,
    plan_name: str = "Advocate Pro Practice",
    dashboard_url: str = "https://fastcase.in/login",
) -> None:
    """Send welcome onboarding email upon subscription activation."""
    subject = "Welcome to Fastcase — Your Legal Practice Platform is Ready"
    html_body, text_body = render_welcome_subscription_template(user_name, plan_name, dashboard_url)
    await send_email(to_email, subject, html_body, text_body)


# ── 3. Login Alert & Security Notification ────────────────────────────────────

def render_security_login_alert_template(
    user_name: str,
    ip_address: str | None,
    user_agent: str | None,
    location: str | None = None,
    login_time: datetime | None = None,
    reset_url: str = "https://fastcase.in/reset-password",
    support_email: str = "support@fastcase.in",
) -> tuple[str, str]:
    """Render automated security notification for new device, browser, or IP login."""
    login_time = login_time or datetime.now(timezone.utc)
    time_str = login_time.strftime("%d %b %Y, %I:%M:%S %p UTC")
    ip_str = ip_address or "Unknown IP"
    device_str = user_agent or "Unknown Device / Browser"
    loc_str = location or "Approx. Location from IP"

    html_body = f"""<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>New Sign-in Alert</title>
  <style>
    body {{ margin:0; padding:0; background-color:#0b0f19; font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif; }}
    .email-container {{ max-width:600px; margin:40px auto; background-color:#ffffff; border-radius:12px; overflow:hidden; box-shadow:0 10px 30px rgba(0,0,0,0.15); }}
    .header {{ background:linear-gradient(135deg, #7f1d1d 0%, #991b1b 100%); padding:32px; text-align:center; border-bottom:3px solid #dc2626; }}
    .content {{ padding:32px; }}
    .meta-box {{ background-color:#f8fafc; border:1px solid #e2e8f0; border-radius:8px; padding:18px; margin:20px 0; }}
    .meta-row {{ display:flex; justify-content:space-between; padding:8px 0; border-bottom:1px solid #edf2f7; font-size:14px; }}
    .meta-row:last-child {{ border-bottom:none; }}
    .meta-key {{ color:#64748b; font-weight:600; }}
    .meta-val {{ color:#0f172a; font-weight:700; text-align:right; max-width:320px; word-break:break-all; }}
    .action-box {{ background-color:#fef2f2; border:1px solid #fecaca; border-radius:8px; padding:18px; margin:24px 0; }}
    .btn-reset {{ display:inline-block; background-color:#dc2626; color:#ffffff !important; text-decoration:none; padding:12px 24px; font-size:14px; font-weight:700; border-radius:6px; margin-top:12px; }}
    .footer {{ background-color:#f8fafc; padding:24px 32px; text-align:center; border-top:1px solid #e2e8f0; font-size:12px; color:#94a3b8; }}
  </style>
</head>
<body style="margin:0; padding:0; background-color:#0b0f19;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#0b0f19; padding:24px 12px;">
    <tr>
      <td align="center">
        <table role="presentation" class="email-container" width="600" cellpadding="0" cellspacing="0" style="max-width:600px; background-color:#ffffff; border-radius:12px; overflow:hidden;">
          <tr>
            <td class="header" style="background:linear-gradient(135deg, #1e293b 0%, #0f172a 100%); padding:32px; text-align:center; border-bottom:3px solid #f59e0b;">
              <div style="display:inline-block; padding:4px 12px; background:rgba(245,158,11,0.15); border:1px solid #f59e0b; color:#fbbf24; border-radius:20px; font-size:11px; font-weight:700; text-transform:uppercase; letter-spacing:1px; margin-bottom:10px;">Security Alert</div>
              <h1 style="margin:0; font-size:22px; font-weight:800; color:#ffffff;">New Sign-in Alert for Your Account</h1>
              <p style="margin:6px 0 0; color:#94a3b8; font-size:13px;">Fastcase Legal Enterprise Protection</p>
            </td>
          </tr>
          <tr>
            <td class="content" style="padding:32px;">
              <p style="font-size:15px; color:#334155; line-height:1.6; margin:0 0 16px;">
                Hello <strong>{user_name}</strong>,
              </p>
              <p style="font-size:14px; color:#475569; line-height:1.6; margin:0 0 20px;">
                We detected a recent sign-in to your <strong>Fastcase</strong> account from a device, browser, or network location not previously associated with your account:
              </p>

              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#f8fafc; border:1px solid #e2e8f0; border-radius:8px; padding:16px; margin:20px 0;">
                <tr>
                  <td style="padding:6px 0; color:#64748b; font-size:13px; font-weight:600; border-bottom:1px solid #edf2f7;">Timestamp</td>
                  <td align="right" style="padding:6px 0; color:#0f172a; font-size:13px; font-weight:600; border-bottom:1px solid #edf2f7;">{time_str}</td>
                </tr>
                <tr>
                  <td style="padding:6px 0; color:#64748b; font-size:13px; font-weight:600; border-bottom:1px solid #edf2f7;">IP Address</td>
                  <td align="right" style="padding:6px 0; color:#0f172a; font-size:13px; font-weight:600; font-family:monospace; border-bottom:1px solid #edf2f7;">{ip_str}</td>
                </tr>
                <tr>
                  <td style="padding:6px 0; color:#64748b; font-size:13px; font-weight:600; border-bottom:1px solid #edf2f7;">Approx. Location</td>
                  <td align="right" style="padding:6px 0; color:#0f172a; font-size:13px; font-weight:600; border-bottom:1px solid #edf2f7;">{loc_str}</td>
                </tr>
                <tr>
                  <td style="padding:6px 0; color:#64748b; font-size:13px; font-weight:600;">Device / Browser</td>
                  <td align="right" style="padding:6px 0; color:#0f172a; font-size:13px; font-weight:600; max-width:280px; word-break:break-all;">{device_str}</td>
                </tr>
              </table>

              <div style="background-color:#fef2f2; border:1px solid #fecaca; border-radius:8px; padding:18px; margin:24px 0;">
                <div style="font-weight:700; color:#991b1b; font-size:14px; margin-bottom:6px;">Did you not recognize this activity?</div>
                <p style="font-size:13px; color:#7f1d1d; margin:0 0 12px; line-height:1.5;">
                  If this was not you, someone else may have gained unauthorized access to your account. Please reset your password immediately and revoke all active sessions.
                </p>
                <a href="{reset_url}" style="display:inline-block; background-color:#dc2626; color:#ffffff !important; text-decoration:none; padding:10px 20px; font-size:13px; font-weight:700; border-radius:6px;">
                  Secure Account & Reset Password &rarr;
                </a>
              </div>

              <p style="font-size:13px; color:#64748b; margin:16px 0 0; line-height:1.5;">
                If this login was authorized by you, no further action is necessary. You can also reach our security operations team directly at <a href="mailto:{support_email}" style="color:#2563eb; text-decoration:none;">{support_email}</a>.
              </p>
            </td>
          </tr>
          <tr>
            <td class="footer" style="background-color:#f8fafc; padding:24px 32px; text-align:center; border-top:1px solid #e2e8f0; font-size:12px; color:#94a3b8; line-height:1.6;">
              &copy; {login_time.year} Fastcase.in &bull; Automated Security Operations<br/>
              This is a critical security advisory regarding your advocate credentials.
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>"""

    text_body = (
        f"NEW SIGN-IN ALERT FOR YOUR ACCOUNT\n"
        f"===================================\n\n"
        f"Hello {user_name},\n\n"
        f"A sign-in was detected on your Fastcase account with the following details:\n\n"
        f"Time              : {time_str}\n"
        f"IP Address        : {ip_str}\n"
        f"Approx. Location  : {loc_str}\n"
        f"Device / Browser  : {device_str}\n\n"
        f"IF THIS WAS NOT YOU:\n"
        f"1. Reset your password immediately: {reset_url}\n"
        f"2. Contact Fastcase Security Support at {support_email}\n\n"
        f"If this was you, you can safely disregard this alert.\n\n"
        f"-- Fastcase Security Operations\n"
        f"https://fastcase.in"
    )

    return html_body, text_body


async def send_new_device_login_alert(
    to_email: str,
    user_name: str,
    ip_address: str | None,
    user_agent: str | None,
    location: str | None = None,
    login_time: datetime | None = None,
    reset_url: str = "https://fastcase.in/reset-password",
) -> None:
    """Send high-priority security alert when a sign-in is observed from a new device/IP."""
    subject = "New Sign-in Alert for Your Account"
    html_body, text_body = render_security_login_alert_template(
        user_name=user_name,
        ip_address=ip_address,
        user_agent=user_agent,
        location=location,
        login_time=login_time,
        reset_url=reset_url,
    )
    await send_email(to_email, subject, html_body, text_body)


# ── 4. Centralized Transactional Email Dispatcher ──────────────────────────────

async def send_transactional_email(
    to: str,
    subject: str,
    template: str,
    data: dict[str, Any] | None = None,
) -> bool:
    """
    Centralized transactional email service function.
    
    Compiles templates dynamically based on `template` identifier:
    - 'otp_verification'
    - 'welcome_subscription'
    - 'login_alert'
    - 'login_notification'
    - 'logout_notification'
    """
    payload = data or {}
    try:
        if template in ("otp", "otp_verification"):
            html_body, text_body = render_otp_verification_template(
                otp_code=str(payload.get("otp_code", "")),
                user_name=payload.get("user_name", "Advocate"),
                expiry_minutes=int(payload.get("expiry_minutes", 10)),
            )
        elif template in ("welcome", "welcome_subscription"):
            html_body, text_body = render_welcome_subscription_template(
                user_name=payload.get("user_name", "Advocate"),
                plan_name=payload.get("plan_name", "Advocate Pro Practice"),
                dashboard_url=payload.get("dashboard_url", "https://fastcase.in/login"),
            )
        elif template in ("login_alert", "security_login_alert"):
            html_body, text_body = render_security_login_alert_template(
                user_name=payload.get("user_name", "Advocate"),
                ip_address=payload.get("ip_address"),
                user_agent=payload.get("user_agent"),
                location=payload.get("location"),
                login_time=payload.get("login_time"),
                reset_url=payload.get("reset_url", "https://fastcase.in/reset-password"),
            )
        else:
            # Direct custom HTML/plain text payload fallback
            html_body = payload.get("html", "<p>Notification from Fastcase</p>")
            text_body = payload.get("text", "Notification from Fastcase")

        await send_email(to, subject, html_body, text_body)
        logger.info("Successfully dispatched transactional email '%s' to %s", template, to)
        return True
    except Exception as exc:
        logger.error("Failed to compile or dispatch transactional email '%s' to %s: %s", template, to, exc, exc_info=True)
        return False


