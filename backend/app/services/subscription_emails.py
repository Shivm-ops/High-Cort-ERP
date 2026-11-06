"""
app/services/subscription_emails.py
===================================
Automated lifecycle email notifications for Advocate Chambers Subscriptions:
- New Plan Activation & Invoice Delivery
- 7-Day & 3-Day Upcoming Renewal Reminders
- Day-of Expiry Alert
- 3-Day Grace Period Warning
- Account Suspension / Reactivation Notice
- Failed Payment Notification
- Superadmin Revenue & Subscription Alerts
"""

import os
import logging
from datetime import datetime
from app.services.email_service import send_email

logger = logging.getLogger("subscription_emails")


async def send_subscription_activated_email(
    user_email: str,
    user_name: str,
    plan_name: str,
    billing_cycle: str,
    amount_paid: float,
    valid_until: datetime,
    invoice_number: str | None = None,
    invoice_url: str | None = None,
) -> bool:
    """Send branded confirmation and tax receipt upon plan subscription or renewal."""
    try:
        current_year = datetime.now().year
        valid_until_str = valid_until.strftime("%d %B %Y")
        cycle_display = billing_cycle.replace("_", " ").title()

        invoice_button = ""
        if invoice_url:
            invoice_button = f"""
            <div style="text-align: center; margin: 20px 0;">
                <a href="{invoice_url}" style="background: #059669; color: #ffffff; padding: 10px 22px; border-radius: 6px; text-decoration: none; font-weight: 600; font-size: 14px; display: inline-block;">Download Tax Invoice</a>
            </div>
            """

        html = f"""
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #ffffff; border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);">
            <div style="background: linear-gradient(135deg, #064e3b, #059669); padding: 28px 24px; color: #ffffff; text-align: center;">
                <h1 style="margin: 0; font-size: 24px; font-weight: 700;">Subscription Activated!</h1>
                <p style="margin: 6px 0 0 0; font-size: 14px; opacity: 0.9;">Fastcase Legal Practice ERP</p>
            </div>
            <div style="padding: 28px 24px; color: #1e293b; line-height: 1.6;">
                <p style="font-size: 15px; margin: 0 0 16px 0;">Dear <strong>Advocate {user_name}</strong>,</p>
                <p style="margin: 0 0 20px 0;">Thank you for choosing Fastcase. Your chambers subscription has been successfully processed and all plan features are active.</p>

                <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 20px; margin: 20px 0;">
                    <div style="display: flex; justify-content: space-between; margin-bottom: 10px; border-bottom: 1px solid #e2e8f0; pb: 8px;">
                        <span style="font-size: 13px; color: #64748b;">Selected Plan:</span>
                        <strong style="color: #064e3b; font-size: 14px;">{plan_name}</strong>
                    </div>
                    <div style="display: flex; justify-content: space-between; margin-bottom: 10px; border-bottom: 1px solid #e2e8f0; pb: 8px;">
                        <span style="font-size: 13px; color: #64748b;">Billing Cycle:</span>
                        <span style="font-size: 13px; font-weight: 600; color: #334155;">{cycle_display}</span>
                    </div>
                    <div style="display: flex; justify-content: space-between; margin-bottom: 10px; border-bottom: 1px solid #e2e8f0; pb: 8px;">
                        <span style="font-size: 13px; color: #64748b;">Amount Paid:</span>
                        <strong style="color: #0f172a; font-size: 14px;">₹{amount_paid:,.2f} (incl. GST)</strong>
                    </div>
                    <div style="display: flex; justify-content: space-between; margin-bottom: 10px; border-bottom: 1px solid #e2e8f0; pb: 8px;">
                        <span style="font-size: 13px; color: #64748b;">Valid Until:</span>
                        <span style="font-size: 13px; font-weight: 700; color: #059669;">{valid_until_str}</span>
                    </div>
                    {f'<div style="display: flex; justify-content: space-between;"><span style="font-size: 13px; color: #64748b;">Invoice Reference:</span><span style="font-family: monospace; font-size: 12px; color: #475569;">{invoice_number}</span></div>' if invoice_number else ''}
                </div>

                {invoice_button}

                <p style="font-size: 13px; color: #64748b; margin: 20px 0 0 0; text-align: center;">You can manage your subscription and review billing ledgers anytime from your <a href="https://app.fastcase.in/subscription" style="color: #059669; text-decoration: underline; font-weight: 600;">Fastcase Chambers Portal</a>.</p>
            </div>
            <div style="background: #f1f5f9; padding: 14px 20px; text-align: center; font-size: 12px; color: #64748b; border-top: 1px solid #e2e8f0;">
                &copy; {current_year} Fastcase Legal Platform. Section 126 Privileged Digital Chambers.
            </div>
        </div>
        """
        text = f"Fastcase Subscription Activated: {plan_name}\nAmount: ₹{amount_paid:,.2f}\nValid Until: {valid_until_str}\nManage at: https://app.fastcase.in/subscription"
        await send_email(user_email, f"Subscription Confirmed: {plan_name} - Fastcase ERP", html, text)
        return True
    except Exception as exc:
        logger.error(f"Failed to dispatch subscription activated email: {exc}", exc_info=True)
        return False


async def send_renewal_reminder_email(
    user_email: str,
    user_name: str,
    plan_name: str,
    days_left: int,
    expiry_date: datetime,
    renewal_url: str = "https://app.fastcase.in/subscription",
) -> bool:
    """Send reminder 7 days, 3 days, or on the day of subscription expiry."""
    try:
        current_year = datetime.now().year
        expiry_str = expiry_date.strftime("%d %B %Y")
        urgency_label = "Expiring Today!" if days_left <= 0 else f"Expiring in {days_left} Days"
        header_color = "#dc2626" if days_left <= 1 else "#d97706" if days_left <= 3 else "#064e3b"

        html = f"""
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #ffffff; border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);">
            <div style="background: linear-gradient(135deg, {header_color}, #0f172a); padding: 26px 20px; color: #ffffff; text-align: center;">
                <h2 style="margin: 0; font-size: 22px; font-weight: 700;">Subscription Renewal Notice</h2>
                <p style="margin: 4px 0 0 0; font-size: 13px; opacity: 0.9;">{urgency_label}</p>
            </div>
            <div style="padding: 26px 20px; color: #1e293b; line-height: 1.6;">
                <p style="font-size: 15px; margin: 0 0 14px 0;">Dear <strong>Advocate {user_name}</strong>,</p>
                <p style="margin: 0 0 16px 0;">This is a friendly reminder that your Fastcase <strong>{plan_name}</strong> subscription is scheduled to expire on <strong>{expiry_str}</strong>.</p>
                
                <div style="background: #fffbeb; border: 1px solid #fef3c7; border-left: 4px solid #f59e0b; padding: 16px; border-radius: 4px; margin: 20px 0;">
                    <p style="margin: 0; font-size: 13px; color: #92400e;">
                        Renewing now ensures uninterrupted access to your <strong>official cause lists, AI drafting studio, client matter ledgers, and court hearing SMS/email reminders</strong>.
                    </p>
                </div>

                <div style="text-align: center; margin: 24px 0 14px 0;">
                    <a href="{renewal_url}" style="background: #059669; color: #ffffff; padding: 12px 28px; border-radius: 8px; text-decoration: none; font-weight: 700; font-size: 15px; display: inline-block; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">Renew Subscription Now &rarr;</a>
                </div>

                <p style="font-size: 12px; color: #64748b; text-align: center; margin: 16px 0 0 0;">
                    Support UPI (GPay/PhonePe), Credit/Debit Cards, and Net Banking. Instant invoice generation.
                </p>
            </div>
            <div style="background: #f1f5f9; padding: 12px 20px; text-align: center; font-size: 12px; color: #64748b;">
                &copy; {current_year} Fastcase Legal Platform. Section 126 Privileged Digital Chambers.
            </div>
        </div>
        """
        subject = f"Urgent: Your Fastcase Subscription is {urgency_label}" if days_left <= 3 else f"Reminder: Fastcase Subscription Renewal ({urgency_label})"
        await send_email(user_email, subject, html, f"Your subscription expires on {expiry_str}. Renew at {renewal_url}")
        return True
    except Exception as exc:
        logger.error(f"Failed to send renewal reminder email: {exc}", exc_info=True)
        return False


async def send_grace_period_email(
    user_email: str,
    user_name: str,
    plan_name: str,
    grace_days_left: int,
    renewal_url: str = "https://app.fastcase.in/subscription",
) -> bool:
    """Send grace period alert warning of pending suspension."""
    try:
        current_year = datetime.now().year
        html = f"""
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #ffffff; border: 1px solid #fee2e2; border-radius: 12px; overflow: hidden;">
            <div style="background: #dc2626; padding: 24px; color: #ffffff; text-align: center;">
                <h2 style="margin: 0; font-size: 22px; font-weight: 700;">Account in Grace Period</h2>
                <p style="margin: 4px 0 0 0; font-size: 13px; opacity: 0.9;">{grace_days_left} day(s) remaining before service suspension</p>
            </div>
            <div style="padding: 24px; color: #1e293b; line-height: 1.6;">
                <p style="font-size: 15px; margin: 0 0 12px 0;">Dear <strong>Advocate {user_name}</strong>,</p>
                <p style="margin: 0 0 16px 0;">Your <strong>{plan_name}</strong> subscription has expired. We have temporarily placed your chambers in a <strong>{grace_days_left}-day grace period</strong> so your team does not lose access during court filings.</p>

                <p style="font-size: 14px; color: #b91c1c; font-weight: 600;">
                    Please renew your subscription today to avoid automatic suspension of AI Draft Studio and Cause List tracking.
                </p>

                <div style="text-align: center; margin: 24px 0;">
                    <a href="{renewal_url}" style="background: #dc2626; color: #ffffff; padding: 12px 28px; border-radius: 8px; text-decoration: none; font-weight: 700; font-size: 15px; display: inline-block;">Renew & Keep Chambers Active</a>
                </div>
            </div>
            <div style="background: #f1f5f9; padding: 12px 20px; text-align: center; font-size: 12px; color: #64748b;">
                &copy; {current_year} Fastcase Legal Platform.
            </div>
        </div>
        """
        await send_email(user_email, f"Action Required: Fastcase Account in Grace Period ({grace_days_left} days left)", html, f"Renew at {renewal_url}")
        return True
    except Exception as exc:
        logger.error(f"Failed to send grace period email: {exc}", exc_info=True)
        return False


async def send_subscription_expired_email(
    user_email: str,
    user_name: str,
    plan_name: str,
    reactivate_url: str = "https://app.fastcase.in/subscription",
) -> bool:
    """Send notice when subscription grace period ends and premium features are suspended."""
    try:
        current_year = datetime.now().year
        html = f"""
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #ffffff; border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden;">
            <div style="background: #475569; padding: 24px; color: #ffffff; text-align: center;">
                <h2 style="margin: 0; font-size: 20px; font-weight: 700;">Subscription Suspended</h2>
                <p style="margin: 4px 0 0 0; font-size: 13px; opacity: 0.9;">Your case data is safely archived</p>
            </div>
            <div style="padding: 24px; color: #1e293b; line-height: 1.6;">
                <p style="font-size: 15px; margin: 0 0 12px 0;">Hello <strong>Advocate {user_name}</strong>,</p>
                <p style="margin: 0 0 16px 0;">Your <strong>{plan_name}</strong> subscription has expired and premium practice tools have been temporarily locked.</p>
                
                <p style="font-size: 13px; color: #475569;">
                    Your existing case documents, client records, and past draft files remain <strong>100% safe, confidential, and preserved</strong>. You can instantly reactivate your account at any time.
                </p>

                <div style="text-align: center; margin: 24px 0;">
                    <a href="{reactivate_url}" style="background: #059669; color: #ffffff; padding: 12px 28px; border-radius: 8px; text-decoration: none; font-weight: 700; font-size: 14px; display: inline-block;">Reactivate My Chambers</a>
                </div>
            </div>
            <div style="background: #f1f5f9; padding: 12px 20px; text-align: center; font-size: 12px; color: #64748b;">
                &copy; {current_year} Fastcase Legal Platform.
            </div>
        </div>
        """
        await send_email(user_email, "Notice: Fastcase Subscription Suspended - Reactivate Anytime", html, f"Reactivate at {reactivate_url}")
        return True
    except Exception as exc:
        logger.error(f"Failed to send subscription expired email: {exc}", exc_info=True)
        return False
