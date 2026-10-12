from email.message import EmailMessage
import logging
import smtplib

from app.core.config import settings
from app.tasks.celery_app import celery_app

logger = logging.getLogger("ecommerce.email")


def _send_message(message: EmailMessage) -> None:
    if not settings.SMTP_HOST or not settings.SMTP_USERNAME or not settings.SMTP_PASSWORD:
        raise RuntimeError("SMTP is not configured")

    with smtplib.SMTP(settings.SMTP_HOST, settings.SMTP_PORT, timeout=15) as server:
        server.ehlo()
        if settings.SMTP_USE_TLS:
            server.starttls()
            server.ehlo()
        server.login(settings.SMTP_USERNAME, settings.SMTP_PASSWORD)
        server.send_message(message)


def _rebel_name(customer_name: str | None) -> str:
    """Return the customer name used in RebelMart customer emails."""
    name = (customer_name or "Customer").strip()
    return f"REBEL {name}"


@celery_app.task(
    name="send_order_confirmation_email",
    autoretry_for=(smtplib.SMTPException, OSError),
    retry_backoff=True,
    retry_kwargs={"max_retries": 3},
)
def send_order_confirmation_email(
    email: str,
    order_id: int,
    total_amount: float,
    customer_name: str | None = None,
) -> str:
    display_name = _rebel_name(customer_name)

    message = EmailMessage()
    message["Subject"] = f"REBELMART - Order Confirmation #{order_id}"
    message["From"] = settings.SMTP_USERNAME or "Rebel Mart"
    message["To"] = email
    message.set_content(
        f"""Hello {display_name},

Your RebelMart order has been successfully placed.

Order ID: {order_id}
Total Amount: ₹{total_amount:.2f}

We have received your order and will keep you updated as it moves through
confirmation, processing, shipping, and delivery.

Thank you for shopping with RebelMart.

REBELMART Team
"""
    )
    _send_message(message)
    return f"Order confirmation email sent for order {order_id}"


@celery_app.task(
    name="send_order_delivered_email",
    autoretry_for=(smtplib.SMTPException, OSError),
    retry_backoff=True,
    retry_kwargs={"max_retries": 3},
)
def send_order_delivered_email(
    email: str,
    order_id: int,
    customer_name: str | None = None,
) -> str:
    display_name = _rebel_name(customer_name)

    message = EmailMessage()
    message["Subject"] = f"REBELMART - Order Delivered #{order_id}"
    message["From"] = settings.SMTP_USERNAME or "Rebel Mart"
    message["To"] = email
    message.set_content(
        f"""Hello {display_name},

Great news! Your RebelMart order #{order_id} has been delivered successfully.

We hope you enjoy your Prabhas collection purchase.

Thank you for shopping with RebelMart.

REBELMART Team
"""
    )
    _send_message(message)
    return f"Order delivered email sent for order {order_id}"


@celery_app.task(
    name="send_login_otp_email",
    autoretry_for=(smtplib.SMTPException, OSError),
    retry_backoff=True,
    retry_kwargs={"max_retries": 3},
)
def send_login_otp_email(email: str, otp: str) -> str:
    message = EmailMessage()
    message["Subject"] = "Your Rebel Mart login verification code"
    message["From"] = settings.SMTP_USERNAME or "Rebel Mart"
    message["To"] = email
    message.set_content(
        f"""Hello,

Your Rebel Mart login verification code is: {otp}

This code expires in {settings.LOGIN_OTP_EXPIRE_MINUTES} minutes.
If you did not try to sign in, you can safely ignore this email.

Rebel Mart Team
"""
    )
    _send_message(message)
    logger.info("Login OTP email sent to %s", email)
    return f"Login OTP email sent to {email}"
