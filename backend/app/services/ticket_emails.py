"""
app/services/ticket_emails.py
=============================
Email notification templates and dispatchers for Support Tickets & Help Center.
Uses send_email from app.services.email_service for verified delivery via Brevo / VPS SMTP.
"""

import os
import logging
from datetime import datetime
from app.services.email_service import send_email

logger = logging.getLogger("ticket_emails")


async def send_ticket_created_notification(
    user_email: str,
    user_name: str,
    ticket_number: str,
    subject: str,
    category: str,
    priority: str,
    description: str,
    admin_emails: list[str] | None = None,
) -> bool:
    """Send confirmation email to user and alert to support desk upon new ticket creation."""
    try:
        current_year = datetime.now().year
        cat_display = category.replace("_", " ").title()
        prio_display = priority.capitalize()
        prio_color = "#dc2626" if priority in ("critical", "high") else "#d97706" if priority == "medium" else "#2563eb"

        user_html = f"""
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #ffffff; border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);">
            <div style="background: linear-gradient(135deg, #064e3b, #059669); padding: 28px 24px; color: #ffffff; text-align: center;">
                <h1 style="margin: 0; font-size: 24px; font-weight: 700; letter-spacing: -0.5px;">Fastcase Legal ERP</h1>
                <p style="margin: 6px 0 0 0; font-size: 14px; opacity: 0.9;">Customer Support Desk</p>
            </div>
            <div style="padding: 28px 24px; color: #1e293b; line-height: 1.6;">
                <p style="font-size: 16px; margin: 0 0 16px 0;">Dear <strong>{user_name}</strong>,</p>
                <p style="margin: 0 0 20px 0;">We have received your support ticket. Our technical and legal operations team has been notified and is reviewing your inquiry.</p>
                
                <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 20px; margin: 20px 0;">
                    <div style="margin-bottom: 12px;">
                        <span style="font-size: 13px; color: #64748b; font-weight: 600; text-transform: uppercase;">Ticket Reference: </span>
                        <span style="font-family: monospace; font-weight: 700; color: #064e3b; font-size: 15px;">{ticket_number}</span>
                    </div>
                    <div style="margin-bottom: 8px;">
                        <span style="font-size: 13px; color: #64748b;">Subject: </span>
                        <strong style="color: #0f172a;">{subject}</strong>
                    </div>
                    <div style="margin-bottom: 8px;">
                        <span style="font-size: 13px; color: #64748b;">Category: </span>
                        <span style="background: #e2e8f0; color: #334155; padding: 2px 8px; border-radius: 4px; font-size: 12px; font-weight: 600;">{cat_display}</span>
                    </div>
                    <div style="margin-bottom: 12px;">
                        <span style="font-size: 13px; color: #64748b;">Priority: </span>
                        <span style="background: {prio_color}20; color: {prio_color}; border: 1px solid {prio_color}40; padding: 2px 8px; border-radius: 4px; font-size: 12px; font-weight: 600;">{prio_display}</span>
                    </div>
                    <div style="border-top: 1px solid #cbd5e1; padding-top: 12px; margin-top: 12px;">
                        <span style="font-size: 13px; color: #64748b; display: block; margin-bottom: 4px;">Initial Message:</span>
                        <p style="margin: 0; font-size: 14px; color: #334155; white-space: pre-wrap; background: #ffffff; padding: 12px; border-radius: 6px; border: 1px solid #e2e8f0;">{description}</p>
                    </div>
                </div>

                <p style="font-size: 14px; color: #475569; margin: 20px 0 0 0;">You can view live status updates and reply directly inside your <a href="https://app.fastcase.in/support" style="color: #059669; text-decoration: underline; font-weight: 600;">Fastcase Help Center</a>.</p>
            </div>
            <div style="background: #f1f5f9; padding: 16px 24px; text-align: center; font-size: 12px; color: #64748b; border-top: 1px solid #e2e8f0;">
                <p style="margin: 0;">&copy; {current_year} Fastcase Legal Platform. Section 126 Privileged Digital Chambers.</p>
            </div>
        </div>
        """
        user_text = f"Fastcase Support Ticket Received: {ticket_number}\nSubject: {subject}\nCategory: {cat_display}\nPriority: {prio_display}\n\nOur team is reviewing your ticket."
        await send_email(user_email, f"Support Ticket Received [{ticket_number}]: {subject}", user_html, user_text)

        # Alert support / admin desk
        support_recipient = os.environ.get("SUPPORT_ADMIN_EMAIL", "support@fastcase.in")
        admin_list = admin_emails or [support_recipient]
        for adm in admin_list:
            if adm:
                await send_email(
                    adm,
                    f"[New Support Ticket {ticket_number}] {subject} ({prio_display})",
                    user_html.replace("We have received your support ticket", f"New support ticket submitted by <strong>{user_name}</strong> ({user_email})"),
                    user_text,
                )
        return True
    except Exception as exc:
        logger.error(f"Failed to dispatch ticket creation email: {exc}", exc_info=True)
        return False


async def send_ticket_reply_notification(
    to_email: str,
    recipient_name: str,
    ticket_number: str,
    subject: str,
    reply_message: str,
    sender_name: str,
    is_admin_reply: bool,
) -> bool:
    """Send notification when a new reply is posted to a ticket."""
    try:
        current_year = datetime.now().year
        role_label = "Fastcase Support Team" if is_admin_reply else "Advocate Client"

        html = f"""
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #ffffff; border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);">
            <div style="background: linear-gradient(135deg, #064e3b, #059669); padding: 24px; color: #ffffff; text-align: center;">
                <h2 style="margin: 0; font-size: 20px; font-weight: 700;">Fastcase Help Center</h2>
                <p style="margin: 4px 0 0 0; font-size: 13px; opacity: 0.9;">New message on ticket #{ticket_number}</p>
            </div>
            <div style="padding: 24px; color: #1e293b; line-height: 1.6;">
                <p style="font-size: 15px; margin: 0 0 12px 0;">Hello <strong>{recipient_name}</strong>,</p>
                <p style="margin: 0 0 16px 0;"><strong>{sender_name}</strong> ({role_label}) posted a new response to ticket <strong>#{ticket_number}</strong>:</p>

                <div style="background: #f8fafc; border-left: 4px solid #059669; padding: 16px; border-radius: 0 8px 8px 0; margin: 16px 0; font-size: 14px; color: #334155; white-space: pre-wrap;">{reply_message}</div>

                <div style="text-align: center; margin: 24px 0 12px 0;">
                    <a href="https://app.fastcase.in/support" style="background: #059669; color: #ffffff; padding: 10px 20px; border-radius: 6px; text-decoration: none; font-weight: 600; display: inline-block;">View Ticket & Reply</a>
                </div>
            </div>
            <div style="background: #f1f5f9; padding: 14px 20px; text-align: center; font-size: 12px; color: #64748b;">
                &copy; {current_year} Fastcase Legal Platform. All rights reserved.
            </div>
        </div>
        """
        email_subject = f"Re: [{ticket_number}] {subject} - New Reply"
        await send_email(to_email, email_subject, html, reply_message)
        return True
    except Exception as exc:
        logger.error(f"Failed to send ticket reply email: {exc}", exc_info=True)
        return False


async def send_ticket_status_notification(
    user_email: str,
    user_name: str,
    ticket_number: str,
    subject: str,
    new_status: str,
) -> bool:
    """Send notification when ticket status is changed (e.g. Resolved or In Progress)."""
    try:
        current_year = datetime.now().year
        status_display = new_status.replace("_", " ").title()
        badge_bg = "#dcfce7" if new_status in ("resolved", "closed") else "#dbeafe"
        badge_color = "#15803d" if new_status in ("resolved", "closed") else "#1d4ed8"

        html = f"""
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #ffffff; border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);">
            <div style="background: linear-gradient(135deg, #064e3b, #059669); padding: 24px; color: #ffffff; text-align: center;">
                <h2 style="margin: 0; font-size: 20px; font-weight: 700;">Ticket Status Update</h2>
                <p style="margin: 4px 0 0 0; font-size: 13px; opacity: 0.9;">Ticket Reference #{ticket_number}</p>
            </div>
            <div style="padding: 24px; color: #1e293b; line-height: 1.6;">
                <p style="font-size: 15px; margin: 0 0 12px 0;">Hello <strong>{user_name}</strong>,</p>
                <p style="margin: 0 0 16px 0;">The status of your support ticket <strong>"{subject}"</strong> has been updated to:</p>
                
                <div style="text-align: center; margin: 20px 0;">
                    <span style="background: {badge_bg}; color: {badge_color}; padding: 8px 18px; border-radius: 9999px; font-weight: 700; font-size: 15px; letter-spacing: 0.5px; display: inline-block;">
                        {status_display}
                    </span>
                </div>

                <p style="font-size: 14px; color: #475569;">If you have further questions or if your issue is not completely resolved, you can reopen or post another message anytime from your support dashboard.</p>
                <div style="text-align: center; margin: 20px 0 10px 0;">
                    <a href="https://app.fastcase.in/support" style="background: #059669; color: #ffffff; padding: 10px 20px; border-radius: 6px; text-decoration: none; font-weight: 600; display: inline-block;">Open Fastcase Support</a>
                </div>
            </div>
            <div style="background: #f1f5f9; padding: 14px 20px; text-align: center; font-size: 12px; color: #64748b;">
                &copy; {current_year} Fastcase Legal Platform. All rights reserved.
            </div>
        </div>
        """
        email_subj = f"[{ticket_number}] Status Update: {status_display} - {subject}"
        await send_email(user_email, email_subj, html, f"Your ticket {ticket_number} status is now {status_display}.")
        return True
    except Exception as exc:
        logger.error(f"Failed to send ticket status email: {exc}", exc_info=True)
        return False
