from email.message import EmailMessage
import logging
import smtplib

from app.core.config import settings
from app.tasks.celery_app import celery_app

logger = logging.getLogger("ecommerce.email")


@celery_app.task(
    name="send_order_confirmation_email",
    autoretry_for=(smtplib.SMTPException, OSError),
    retry_backoff=True,
    retry_kwargs={"max_retries": 3},
)
def send_order_confirmation_email(email: str, order_id: int, total_amount: float) -> str:
    if not settings.SMTP_HOST or not settings.SMTP_USERNAME or not settings.SMTP_PASSWORD:
        logger.warning("SMTP is not configured; skipping email for order_id=%s", order_id)
        return "SMTP not configured; email skipped"

    message = EmailMessage()
    message["Subject"] = f"Order Confirmation #{order_id}"
    message["From"] = settings.SMTP_USERNAME
    message["To"] = email
    message.set_content(
        f"""Hello,

Your order has been successfully placed.

Order ID: {order_id}
Total Amount: ₹{total_amount:.2f}

Thank you for shopping with us.

E-Commerce Team
"""
    )

    with smtplib.SMTP(settings.SMTP_HOST, settings.SMTP_PORT, timeout=15) as server:
        if settings.SMTP_USE_TLS:
            server.starttls()
        server.login(settings.SMTP_USERNAME, settings.SMTP_PASSWORD)
        server.send_message(message)

    return f"Order confirmation email sent for order {order_id}"
