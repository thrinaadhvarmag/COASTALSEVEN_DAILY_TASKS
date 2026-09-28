from email.message import EmailMessage
import smtplib

from app.core.config import settings
from app.tasks.celery_app import celery_app


@celery_app.task(
    name="send_order_confirmation_email"
)
def send_order_confirmation_email(
    email: str,
    order_id: int,
    total_amount: float,
) -> str:

    message = EmailMessage()

    message["Subject"] = (
        f"Order Confirmation #{order_id}"
    )

    message["From"] = settings.SMTP_USERNAME
    message["To"] = email

    message.set_content(
        f"""
Hello,

Your order has been successfully placed.

Order ID: {order_id}
Total Amount: ₹{total_amount:.2f}

Thank you for shopping with us.

E-Commerce Team
"""
    )

    with smtplib.SMTP(
        settings.SMTP_HOST,
        settings.SMTP_PORT,
    ) as server:

        server.starttls()

        server.login(
            settings.SMTP_USERNAME,
            settings.SMTP_PASSWORD,
        )

        server.send_message(message)

    return (
        f"Order confirmation email sent "
        f"for order {order_id}"
    )