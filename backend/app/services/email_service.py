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
    """Render clean, modern HTML and plain-text templates for 6-digit OTP verification."""
    current_year = datetime.now(timezone.utc).year
    clean_code = str(otp_code).strip()[:6]

    # Clean spaced digit rendering matching app UI
    otp_digits = [d for d in clean_code]
    digit_cells = "".join([
        f'<td style="width:46px; height:54px; background:#f0fdf4; border:1.5px solid #86efac; border-radius:10px; text-align:center; font-family:\'Courier New\',Courier,monospace; font-size:28px; font-weight:800; color:#014D46; margin:0 4px;">{d}</td>'
        for d in otp_digits
    ])

    html_body = f"""<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <meta http-equiv="X-UA-Compatible" content="IE=edge"/>
  <title>Verify Your Email</title>
</head>
<body style="margin:0; padding:0; background-color:#f7f8f6; font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif; -webkit-font-smoothing:antialiased; color:#334155;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#f7f8f6; padding:32px 12px;">
    <tr>
      <td align="center">
        <!-- Main Card -->
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:540px; background-color:#ffffff; border-radius:16px; border:1px solid #e2e8f0; overflow:hidden; box-shadow:0 4px 16px rgba(0,0,0,0.06);">
          
          <!-- Clean Header -->
          <tr>
            <td style="background:linear-gradient(160deg, #013B36 0%, #014D46 100%); padding:28px 32px; text-align:center;">
              <div style="font-size:22px; font-weight:800; color:#ffffff; letter-spacing:0.5px;">
                Fastcase
              </div>
              <div style="font-size:11px; color:#6ee7b7; text-transform:uppercase; letter-spacing:1.5px; font-weight:700; margin-top:2px;">
                Legal Platform
              </div>
            </td>
          </tr>

          <!-- Content Body -->
          <tr>
            <td style="padding:36px 32px; background-color:#ffffff;">
              <h2 style="font-size:22px; font-weight:800; color:#0f172a; margin:0 0 12px; line-height:1.3;">
                Verify Your Email
              </h2>
              
              <p style="font-size:15px; color:#475569; line-height:1.6; margin:0 0 16px;">
                Hello <strong>{user_name}</strong>,
              </p>
              
              <p style="font-size:15px; color:#475569; line-height:1.6; margin:0 0 24px;">
                We sent a 6-digit verification code to activate your chambers:
              </p>

              <!-- OTP Code Display -->
              <div style="background-color:#f8fafc; border:1px solid #e2e8f0; border-radius:12px; padding:24px 16px; text-align:center; margin:20px 0;">
                <table role="presentation" cellpadding="0" cellspacing="6" align="center" style="margin:0 auto;">
                  <tr>
                    {digit_cells}
                  </tr>
                </table>
                
                <div style="display:none; font-size:0; max-height:0; line-height:0; mso-hide:all;">{otp_code}</div>

                <div style="font-size:13px; color:#64748b; margin-top:16px;">
                  ⏳ This code expires in <strong style="color:#0f172a;">{expiry_minutes} minutes</strong>.
                </div>
              </div>

              <div style="background-color:#f0fdf4; border-left:3px solid #059669; border-radius:4px; padding:12px 14px; margin:24px 0 0; font-size:12px; color:#065f46; line-height:1.5;">
                🛡️ Section 126 Privileged Digital Chambers Protection
              </div>

              <p style="font-size:13px; color:#94a3b8; line-height:1.5; margin:20px 0 0;">
                If you did not initiate this request, you can safely ignore this email.
              </p>

              <!-- Sign-off -->
              <p style="font-size:14px; color:#475569; line-height:1.6; margin:24px 0 0; padding-top:16px; border-top:1px solid #f1f5f9;">
                Warm regards,<br/>
                <strong style="color:#0f172a;">The Fastcase Team</strong>
              </p>
            </td>
          </tr>

          <!-- Clean Footer -->
          <tr>
            <td style="background-color:#f8fafc; padding:20px 32px; text-align:center; border-top:1px solid #e2e8f0; font-size:12px; color:#94a3b8; line-height:1.5;">
              &copy; {current_year} Fastcase &bull; India's Complete Legal Operating System
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>"""

    text_body = (
        f"FASTCASE — VERIFY YOUR EMAIL\n"
        f"====================================================\n\n"
        f"Hello {user_name},\n\n"
        f"We sent a 6-digit verification code to activate your chambers:\n\n"
        f"    >>> {otp_code} <<<\n\n"
        f"This code expires in {expiry_minutes} minutes.\n\n"
        f"If you did not initiate this request, you can safely ignore this email.\n\n"
        f"Warm regards,\n"
        f"The Fastcase Team\n"
        f"https://app.fastcase.in"
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
    plan_name: str = "Chambers Workspace",
    dashboard_url: str = "https://app.fastcase.in/login",
) -> tuple[str, str]:
    """Render clean, warm, professional welcome email using exact application language."""
    current_year = datetime.now(timezone.utc).year

    html_body = f"""<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <meta http-equiv="X-UA-Compatible" content="IE=edge"/>
  <title>Welcome to Fastcase</title>
</head>
<body style="margin:0; padding:0; background-color:#f7f8f6; font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif; -webkit-font-smoothing:antialiased; color:#334155;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#f7f8f6; padding:32px 12px;">
    <tr>
      <td align="center">
        <!-- Main Card -->
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:580px; background-color:#ffffff; border-radius:16px; border:1px solid #e2e8f0; overflow:hidden; box-shadow:0 4px 16px rgba(0,0,0,0.06);">
          
          <!-- Header Banner -->
          <tr>
            <td style="background:linear-gradient(160deg, #013B36 0%, #014D46 100%); padding:32px; text-align:center;">
              <div style="font-size:24px; font-weight:800; color:#ffffff; letter-spacing:0.5px;">
                Fastcase
              </div>
              <div style="font-size:11px; color:#6ee7b7; text-transform:uppercase; letter-spacing:1.5px; font-weight:700; margin-top:2px;">
                Legal Platform
              </div>
            </td>
          </tr>

          <!-- Main Content -->
          <tr>
            <td style="padding:36px 32px; background-color:#ffffff;">

              <!-- Greeting -->
              <h2 style="font-size:22px; font-weight:800; color:#0f172a; margin:0 0 10px; line-height:1.3;">
                Welcome to Fastcase, {user_name}!
              </h2>

              <p style="font-size:15px; color:#014D46; font-weight:700; line-height:1.5; margin:0 0 8px;">
                India's Complete Legal Operating System
              </p>

              <p style="font-size:14px; color:#475569; line-height:1.6; margin:0 0 24px;">
                Manage cases, draft documents, track hearings, and run your practice — all in one platform.
              </p>

              <!-- Exact Application Features List -->
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#f8fafc; border:1px solid #e2e8f0; border-radius:12px; padding:16px; margin-bottom:24px;">
                <tr>
                  <td style="padding:10px 0;">
                    <div style="font-size:14px; font-weight:700; color:#0f172a;">Smart Legal Drafting</div>
                    <div style="font-size:13px; color:#64748b; margin-top:2px;">Generate bail applications, writs, notices in seconds</div>
                  </td>
                </tr>
                <tr>
                  <td style="padding:10px 0; border-top:1px solid #edf2f7;">
                    <div style="font-size:14px; font-weight:700; color:#0f172a;">Smart Case Management</div>
                    <div style="font-size:13px; color:#64748b; margin-top:2px;">Track every case stage with real-time updates</div>
                  </td>
                </tr>
                <tr>
                  <td style="padding:10px 0; border-top:1px solid #edf2f7;">
                    <div style="font-size:14px; font-weight:700; color:#0f172a;">Document Intelligence</div>
                    <div style="font-size:13px; color:#64748b; margin-top:2px;">OCR, search, and analyze any legal document</div>
                  </td>
                </tr>
                <tr>
                  <td style="padding:10px 0; border-top:1px solid #edf2f7;">
                    <div style="font-size:14px; font-weight:700; color:#0f172a;">Secure & Private</div>
                    <div style="font-size:13px; color:#64748b; margin-top:2px;">Section 126 Privileged Digital Chambers Protection</div>
                  </td>
                </tr>
              </table>

              <!-- Primary CTA Button -->
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:24px;">
                <tr>
                  <td align="center">
                    <a href="{dashboard_url}" target="_blank" style="display:inline-block; background-color:#014D46; color:#ffffff !important; text-decoration:none; padding:14px 32px; font-size:15px; font-weight:700; border-radius:10px; text-align:center;">
                      Enter Practice &rarr;
                    </a>
                  </td>
                </tr>
              </table>

              <!-- Sign-off -->
              <p style="font-size:14px; color:#475569; line-height:1.6; margin:0; padding-top:16px; border-top:1px solid #f1f5f9;">
                Warm regards,<br/>
                <strong style="color:#0f172a;">The Fastcase Team</strong>
              </p>

            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color:#f8fafc; padding:20px 32px; text-align:center; border-top:1px solid #e2e8f0; font-size:12px; color:#94a3b8; line-height:1.5;">
              &copy; {current_year} Fastcase &bull; India's Complete Legal Operating System
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>"""

    text_body = (
        f"WELCOME TO FASTCASE\n"
        f"India's Complete Legal Operating System\n"
        f"====================================================\n\n"
        f"Hello {user_name},\n\n"
        f"Manage cases, draft documents, track hearings, and run your practice — all in one platform.\n\n"
        f"• Smart Legal Drafting: Generate bail applications, writs, notices in seconds\n"
        f"• Smart Case Management: Track every case stage with real-time updates\n"
        f"• Document Intelligence: OCR, search, and analyze any legal document\n"
        f"• Secure & Private: Section 126 Privileged Digital Chambers Protection\n\n"
        f"Enter Practice:\n"
        f"{dashboard_url}\n\n"
        f"Warm regards,\n"
        f"The Fastcase Team\n"
        f"https://app.fastcase.in"
    )

    return html_body, text_body


async def send_welcome_subscription_email(
    to_email: str,
    user_name: str,
    plan_name: str = "Advocate Chambers Pro (14-Day Free Trial)",
    dashboard_url: str = "https://app.fastcase.in/login",
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
        elif template in ("court_hearing", "hearing_notice", "hearing_reminder"):
            html_body, text_body = render_court_hearing_template(
                client_name=payload.get("client_name", "Valued Client"),
                case_title=payload.get("case_title", "Case Proceeding"),
                case_no=payload.get("case_no", "N/A"),
                hearing_date=str(payload.get("hearing_date", "")),
                hearing_time=payload.get("hearing_time"),
                court=payload.get("court"),
                courtroom=payload.get("courtroom"),
                judge=payload.get("judge"),
                purpose=payload.get("purpose"),
                notes=payload.get("notes"),
                advocate_name=payload.get("advocate_name"),
                firm_name=payload.get("firm_name"),
                advocate_phone=payload.get("advocate_phone"),
                advocate_email=payload.get("advocate_email"),
                notice_type=payload.get("notice_type", "scheduled"),
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


# ── 5. Court Hearing Date Notification & Reminder ─────────────────────────────

def render_court_hearing_template(
    client_name: str,
    case_title: str,
    case_no: str,
    hearing_date: str | date,
    hearing_time: str | time | None = None,
    court: str | None = None,
    courtroom: str | None = None,
    judge: str | None = None,
    purpose: str | None = None,
    notes: str | None = None,
    advocate_name: str | None = None,
    firm_name: str | None = None,
    advocate_phone: str | None = None,
    advocate_email: str | None = None,
    notice_type: str = "scheduled",  # "scheduled" | "rescheduled" | "reminder"
) -> tuple[str, str]:
    """
    Render professional branded HTML and plain-text templates for Court Hearing Date
    notifications and reminders to clients and advocates.
    """
    current_year = datetime.now(timezone.utc).year
    firm_display = firm_name or "Fastcase Chambers"
    advocate_display = advocate_name or "Your Legal Counsel"
    court_display = court or "Hon'ble Court"
    courtroom_display = courtroom or "Check Daily Cause List"
    purpose_display = purpose or "Hearing / Proceedings"

    # Format hearing date nicely
    formatted_date_str = str(hearing_date)
    try:
        if isinstance(hearing_date, str):
            dt_obj = datetime.strptime(hearing_date.split("T")[0], "%Y-%m-%d")
        elif isinstance(hearing_date, date):
            dt_obj = datetime.combine(hearing_date, datetime.min.time())
        else:
            dt_obj = None

        if dt_obj:
            formatted_date_str = dt_obj.strftime("%A, %d %B %Y")
    except Exception:
        formatted_date_str = str(hearing_date)

    # Format hearing time nicely
    time_display = "10:30 AM onwards (As per Cause List)"
    if hearing_time:
        t_str = str(hearing_time)
        try:
            parts = t_str.split(":")
            hr = int(parts[0])
            minute = int(parts[1]) if len(parts) > 1 else 0
            am_pm = "AM" if hr < 12 else "PM"
            hr12 = hr % 12
            if hr12 == 0:
                hr12 = 12
            time_display = f"{hr12:02d}:{minute:02d} {am_pm}"
        except Exception:
            time_display = t_str

    # Notice type nuances
    if notice_type == "reminder":
        badge_text = "COURT DATE REMINDER"
        badge_bg = "#eff6ff"
        badge_border = "#93c5fd"
        badge_color = "#1d4ed8"
        headline = "Upcoming Court Hearing Reminder"
        sub_message = f"This is an automated reminder regarding your upcoming court hearing scheduled on <strong>{formatted_date_str}</strong>."
    elif notice_type == "rescheduled":
        badge_text = "COURT DATE RESCHEDULED"
        badge_bg = "#fffbeb"
        badge_border = "#fde68a"
        badge_color = "#b45309"
        headline = "Court Hearing Date Rescheduled"
        sub_message = f"Please be informed that the court hearing for your matter has been rescheduled to <strong>{formatted_date_str}</strong>."
    else:
        badge_text = "COURT HEARING NOTICE"
        badge_bg = "#ecfdf5"
        badge_border = "#a7f3d0"
        badge_color = "#047857"
        headline = "Your Court Hearing Date is Scheduled"
        sub_message = f"Please find below the official details of your scheduled court hearing on <strong>{formatted_date_str}</strong>."

    notes_html = ""
    if notes and notes.strip():
        notes_html = f"""
        <tr>
          <td style="padding:10px 14px; font-size:13px; font-weight:700; color:#475569; width:35%; border-bottom:1px solid #f1f5f9;">Special Instructions:</td>
          <td style="padding:10px 14px; font-size:13px; color:#0f172a; border-bottom:1px solid #f1f5f9; line-height:1.4;">{notes}</td>
        </tr>
        """

    advocate_contact_rows = []
    if advocate_phone:
        advocate_contact_rows.append(f'<strong>Phone:</strong> <a href="tel:{advocate_phone}" style="color:#014D46; text-decoration:none;">{advocate_phone}</a>')
    if advocate_email:
        advocate_contact_rows.append(f'<strong>Email:</strong> <a href="mailto:{advocate_email}" style="color:#014D46; text-decoration:none;">{advocate_email}</a>')
    advocate_contact_str = " &nbsp;|&nbsp; ".join(advocate_contact_rows) if advocate_contact_rows else "Contact your legal chambers for queries."

    html_body = f"""<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <meta http-equiv="X-UA-Compatible" content="IE=edge"/>
  <title>{headline}</title>
</head>
<body style="margin:0; padding:0; background-color:#f8fafc; font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif; -webkit-font-smoothing:antialiased; color:#334155;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#f8fafc; padding:32px 12px;">
    <tr>
      <td align="center">
        <!-- Main Card -->
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:580px; background-color:#ffffff; border-radius:16px; border:1px solid #e2e8f0; overflow:hidden; box-shadow:0 4px 20px rgba(0,0,0,0.06);">
          
          <!-- Header Banner -->
          <tr>
            <td style="background:linear-gradient(160deg, #013B36 0%, #014D46 100%); padding:28px 32px; text-align:center;">
              <div style="font-size:24px; font-weight:800; color:#ffffff; letter-spacing:0.5px;">
                Fastcase
              </div>
              <div style="font-size:11px; color:#6ee7b7; text-transform:uppercase; letter-spacing:1.5px; font-weight:700; margin-top:2px;">
                Chambers &amp; Court Operating System
              </div>
            </td>
          </tr>

          <!-- Main Body -->
          <tr>
            <td style="padding:32px; background-color:#ffffff;">

              <!-- Status Badge -->
              <div style="text-align:center; margin-bottom:16px;">
                <span style="display:inline-block; padding:5px 14px; background-color:{badge_bg}; border:1px solid {badge_border}; border-radius:20px; font-size:11px; font-weight:800; color:{badge_color}; letter-spacing:1px; text-transform:uppercase;">
                  {badge_text}
                </span>
              </div>

              <!-- Title & Greeting -->
              <h2 style="font-size:22px; font-weight:800; color:#0f172a; margin:0 0 10px; text-align:center; line-height:1.3;">
                {headline}
              </h2>

              <p style="font-size:14px; color:#475569; line-height:1.6; margin:0 0 20px; text-align:center;">
                Dear <strong>{client_name}</strong>,<br/>
                {sub_message}
              </p>

              <!-- Highlighted Court Date Box -->
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:linear-gradient(135deg, #f0fdf4 0%, #ecfdf5 100%); border:2px solid #10b981; border-radius:14px; margin-bottom:24px; text-align:center; padding:18px;">
                <tr>
                  <td>
                    <div style="font-size:11px; font-weight:800; color:#047857; text-transform:uppercase; letter-spacing:1.5px;">
                      COURT HEARING DATE
                    </div>
                    <div style="font-size:24px; font-weight:900; color:#014D46; margin:6px 0 4px; letter-spacing:-0.2px;">
                      {formatted_date_str}
                    </div>
                    <div style="font-size:13px; font-weight:700; color:#059669;">
                      ⏰ Scheduled Time: {time_display}
                    </div>
                  </td>
                </tr>
              </table>

              <!-- Detailed Case Information Table -->
              <div style="font-size:12px; font-weight:800; color:#64748b; text-transform:uppercase; letter-spacing:1px; margin-bottom:8px;">
                Case &amp; Courtroom Details
              </div>
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #e2e8f0; border-radius:12px; overflow:hidden; background-color:#ffffff; margin-bottom:24px;">
                <tr style="background-color:#f8fafc;">
                  <td style="padding:10px 14px; font-size:13px; font-weight:700; color:#475569; width:35%; border-bottom:1px solid #f1f5f9;">Case Title:</td>
                  <td style="padding:10px 14px; font-size:13px; font-weight:700; color:#0f172a; border-bottom:1px solid #f1f5f9;">{case_title}</td>
                </tr>
                <tr>
                  <td style="padding:10px 14px; font-size:13px; font-weight:700; color:#475569; border-bottom:1px solid #f1f5f9;">Case No. / CNR:</td>
                  <td style="padding:10px 14px; font-size:13px; color:#0f172a; border-bottom:1px solid #f1f5f9;">{case_no}</td>
                </tr>
                <tr style="background-color:#f8fafc;">
                  <td style="padding:10px 14px; font-size:13px; font-weight:700; color:#475569; border-bottom:1px solid #f1f5f9;">Court:</td>
                  <td style="padding:10px 14px; font-size:13px; font-weight:600; color:#0f172a; border-bottom:1px solid #f1f5f9;">{court_display}</td>
                </tr>
                <tr>
                  <td style="padding:10px 14px; font-size:13px; font-weight:700; color:#475569; border-bottom:1px solid #f1f5f9;">Courtroom / Bench:</td>
                  <td style="padding:10px 14px; font-size:13px; color:#0f172a; border-bottom:1px solid #f1f5f9;">{courtroom_display}</td>
                </tr>
                {f'<tr style="background-color:#f8fafc;"><td style="padding:10px 14px; font-size:13px; font-weight:700; color:#475569; border-bottom:1px solid #f1f5f9;">Presiding Judge:</td><td style="padding:10px 14px; font-size:13px; color:#0f172a; border-bottom:1px solid #f1f5f9;">{judge}</td></tr>' if judge else ''}
                <tr>
                  <td style="padding:10px 14px; font-size:13px; font-weight:700; color:#475569; border-bottom:1px solid #f1f5f9;">Purpose / Stage:</td>
                  <td style="padding:10px 14px; font-size:13px; color:#014D46; font-weight:700; border-bottom:1px solid #f1f5f9;">{purpose_display}</td>
                </tr>
                {notes_html}
              </table>

              <!-- Action Guidelines for Client -->
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#f8fafc; border-left:4px solid #014D46; border-radius:6px; padding:14px 16px; margin-bottom:24px;">
                <tr>
                  <td>
                    <div style="font-size:13px; font-weight:800; color:#014D46; margin-bottom:6px;">
                      📋 Important Instructions for Client:
                    </div>
                    <ul style="margin:0; padding-left:18px; font-size:12px; color:#475569; line-height:1.7;">
                      <li>Please arrive at the court premises at least <strong>30 minutes</strong> prior to the scheduled time.</li>
                      <li>Carry a valid government photo ID card (Aadhaar, Voter ID, or Passport).</li>
                      <li>Bring any case documents, original receipts, or exhibits requested by your counsel.</li>
                      <li>Ensure your mobile phone is kept on silent mode inside the courtroom.</li>
                    </ul>
                  </td>
                </tr>
              </table>

              <!-- Advocate & Law Firm Contact Box -->
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#ffffff; border:1px solid #e2e8f0; border-radius:12px; padding:16px; text-align:center;">
                <tr>
                  <td>
                    <div style="font-size:11px; font-weight:800; color:#94a3b8; text-transform:uppercase; letter-spacing:1px; margin-bottom:4px;">
                      Legal Counsel
                    </div>
                    <div style="font-size:15px; font-weight:800; color:#0f172a;">
                      {advocate_display}
                    </div>
                    <div style="font-size:12px; color:#64748b; margin-top:2px; font-weight:600;">
                      {firm_display}
                    </div>
                    <div style="font-size:12px; color:#475569; margin-top:10px;">
                      {advocate_contact_str}
                    </div>
                  </td>
                </tr>
              </table>

            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding:20px 32px; background-color:#f8fafc; border-top:1px solid #e2e8f0; text-align:center;">
              <p style="font-size:11px; color:#94a3b8; line-height:1.6; margin:0;">
                This legal notification was generated automatically on behalf of {firm_display}.<br/>
                &copy; {current_year} Fastcase. All rights reserved. Confidential &amp; Privileged.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
"""

    text_body = f"""COURT HEARING NOTICE - FASTCASE LEGAL PLATFORM
--------------------------------------------------
Notice Type: {badge_text}
Dear {client_name},

This is an official notice regarding your court case hearing:

COURT HEARING DATE: {formatted_date_str}
TIME: {time_display}

CASE DETAILS:
- Case Title: {case_title}
- Case No.: {case_no}
- Court: {court_display}
- Courtroom / Bench: {courtroom_display}
{f'- Presiding Judge: {judge}' if judge else ''}
- Purpose / Stage: {purpose_display}
{f'- Notes: {notes}' if notes else ''}

INSTRUCTIONS FOR CLIENT:
1. Please reach the court premises at least 30 minutes in advance.
2. Carry your government photo ID and any documents requested by counsel.
3. Switch your mobile phone to silent inside the courtroom.

LEGAL COUNSEL:
Advocate: {advocate_display}
Firm: {firm_display}
{advocate_contact_str.replace('&nbsp;|&nbsp;', '|').replace('<strong>', '').replace('</strong>', '')}

(c) {current_year} Fastcase Legal Platform. Confidential.
"""

    return html_body, text_body


async def send_court_hearing_email(
    to_email: str,
    client_name: str,
    case_title: str,
    case_no: str,
    hearing_date: str | date,
    hearing_time: str | time | None = None,
    court: str | None = None,
    courtroom: str | None = None,
    judge: str | None = None,
    purpose: str | None = None,
    notes: str | None = None,
    advocate_name: str | None = None,
    firm_name: str | None = None,
    advocate_phone: str | None = None,
    advocate_email: str | None = None,
    notice_type: str = "scheduled",
) -> bool:
    """Async dispatch helper for court date notification & reminder emails."""
    try:
        html_body, text_body = render_court_hearing_template(
            client_name=client_name,
            case_title=case_title,
            case_no=case_no,
            hearing_date=hearing_date,
            hearing_time=hearing_time,
            court=court,
            courtroom=courtroom,
            judge=judge,
            purpose=purpose,
            notes=notes,
            advocate_name=advocate_name,
            firm_name=firm_name,
            advocate_phone=advocate_phone,
            advocate_email=advocate_email,
            notice_type=notice_type,
        )

        formatted_date = str(hearing_date).split("T")[0]
        if notice_type == "reminder":
            subject = f"Court Hearing Reminder: {case_title} on {formatted_date}"
        elif notice_type == "rescheduled":
            subject = f"Updated Court Hearing Date: {case_title} - {formatted_date}"
        else:
            subject = f"Court Hearing Date Notice: {case_title} on {formatted_date}"

        await send_email(to_email, subject, html_body, text_body)
        logger.info("Successfully sent court hearing email (%s) to %s for case %s", notice_type, to_email, case_no)
        return True
    except Exception as exc:
        logger.error("Failed to send court hearing email to %s: %s", to_email, exc, exc_info=True)
        return False



