import logging
import asyncio

logger = logging.getLogger(__name__)

class WhatsAppService:
    """Mock WhatsApp Service for Advocate ERP.
    Simulates sending templated WhatsApp messages to clients via Meta Cloud API / Twilio.
    """

    @staticmethod
    async def send_message(phone_number: str, message: str) -> bool:
        """Simulate sending a WhatsApp message."""
        logger.info(f"📲 [WhatsApp Mock] Sending message to {phone_number}...")
        await asyncio.sleep(1) # Simulate network delay
        logger.info(f"✅ [WhatsApp Mock] Message sent successfully to {phone_number}:\n{message}")
        return True

    @staticmethod
    async def send_hearing_reminder(phone_number: str, client_name: str, case_title: str, hearing_date: str, court: str) -> bool:
        """Send a templated reminder for an upcoming hearing."""
        message = (
            f"Hello {client_name},\n\n"
            f"This is a reminder regarding your case: *{case_title}*.\n"
            f"Your next hearing is scheduled on *{hearing_date}* at *{court}*.\n\n"
            f"Please ensure you are available or have provided all necessary documents to your advocate.\n\n"
            f"Regards,\nLegalOS Legal Team"
        )
        return await WhatsAppService.send_message(phone_number, message)

    @staticmethod
    async def send_invoice_alert(phone_number: str, client_name: str, invoice_no: str, amount: float, due_date: str) -> bool:
        """Send a templated alert for a generated invoice."""
        message = (
            f"Hello {client_name},\n\n"
            f"A new invoice *{invoice_no}* for the amount of *₹{amount}* has been generated for your legal services.\n"
            f"The due date for this payment is *{due_date}*.\n\n"
            f"You can view and pay your invoice securely by logging into your Client Portal.\n\n"
            f"Regards,\nLegalOS Billing Team"
        )
        return await WhatsAppService.send_message(phone_number, message)
