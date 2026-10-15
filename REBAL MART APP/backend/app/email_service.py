import os
import smtplib
import email.utils
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from dotenv import load_dotenv

# Explicitly load .env from backend folder
env_path = os.path.join(os.path.dirname(__file__), "..", ".env")
load_dotenv(env_path)

SMTP_HOST = os.getenv("SMTP_HOST", "smtp.gmail.com")
SMTP_PORT = int(os.getenv("SMTP_PORT", "587"))
SMTP_USER = os.getenv("SMTP_USER", "thrinaadhvarma999@gmail.com")
SMTP_PASSWORD = os.getenv("SMTP_PASSWORD", "nzssoeubvjrvqqbk")
SMTP_FROM_EMAIL = os.getenv("SMTP_FROM_EMAIL", SMTP_USER)
SMTP_FROM_NAME = os.getenv("SMTP_FROM_NAME", "Rebel Mart")

def send_email(to_email: str, subject: str, text_content: str, html_content: str = None) -> bool:
    """
    Sends an email using configured SMTP host with TLS/SSL encryption.
    Tries primary port (587 STARTTLS) and fallback port (465 SSL) with short timeouts.
    """
    msg = MIMEMultipart("alternative")
    msg["Subject"] = subject
    msg["From"] = f"{SMTP_FROM_NAME} <{SMTP_FROM_EMAIL}>"
    msg["To"] = to_email
    msg["Date"] = email.utils.formatdate(localtime=True)
    msg["Message-ID"] = email.utils.make_msgid(domain="gmail.com")
    msg["Reply-To"] = SMTP_FROM_EMAIL

    # Attach plain text
    part1 = MIMEText(text_content, "plain", "utf-8")
    msg.attach(part1)

    # Attach HTML if provided
    if html_content:
        part2 = MIMEText(html_content, "html", "utf-8")
        msg.attach(part2)

    # Attempt 1: Port 587 with STARTTLS
    try:
        server = smtplib.SMTP(SMTP_HOST, 587, timeout=4)
        server.ehlo()
        server.starttls()
        server.ehlo()
        server.login(SMTP_USER, SMTP_PASSWORD)
        server.sendmail(SMTP_FROM_EMAIL, [to_email], msg.as_string())
        server.quit()
        print(f"[SMTP] Successfully sent email to {to_email} via port 587")
        return True
    except Exception as e587:
        print(f"[SMTP NOTICE] Port 587 failed: {e587}. Trying port 465 SSL...")

    # Attempt 2: Port 465 with SSL
    try:
        server = smtplib.SMTP_SSL(SMTP_HOST, 465, timeout=4)
        server.login(SMTP_USER, SMTP_PASSWORD)
        server.sendmail(SMTP_FROM_EMAIL, [to_email], msg.as_string())
        server.quit()
        print(f"[SMTP] Successfully sent email to {to_email} via port 465")
        return True
    except Exception as e465:
        print(f"[SMTP NOTICE] Port 465 failed: {e465}. Cloud host likely blocks outbound SMTP.")

    return False

def send_otp_email(to_email: str, otp_code: str) -> bool:
    subject = f"Your Rebel Mart Verification Code: {otp_code}"
    
    text = (
        f"Hello Rebel Fan,\n\n"
        f"Your 2-step verification code to access Rebel Mart is:\n\n"
        f"  {otp_code}\n\n"
        f"This code will expire in 10 minutes. If you did not request this, please ignore this email.\n\n"
        f"Warm regards,\n"
        f"Rebel Mart - Official Rebel Star Prabhas Merchandise Store\n"
    )

    html = f"""
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body {{ font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #0f172a; margin: 0; padding: 20px; }}
        .container {{ max-width: 540px; margin: 0 auto; background: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.15); }}
        .header {{ background: #0b0f19; padding: 24px; text-align: center; color: #ffffff; }}
        .header h1 {{ margin: 0; font-size: 22px; letter-spacing: 0.05em; }}
        .header h1 span {{ color: #d97706; }}
        .content {{ padding: 32px 24px; color: #1e293b; line-height: 1.6; }}
        .otp-box {{ background: #f8fafc; border: 2px dashed #d97706; border-radius: 8px; padding: 20px; text-align: center; margin: 24px 0; }}
        .otp-code {{ font-size: 32px; font-weight: 800; letter-spacing: 0.25em; color: #0f172a; font-family: monospace; }}
        .footer {{ background: #f1f5f9; padding: 16px; text-align: center; font-size: 12px; color: #64748b; }}
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>REBEL <span>MART</span></h1>
          <p style="margin: 4px 0 0; font-size: 11px; text-transform: uppercase; letter-spacing: 0.1em; color: #94a3b8;">Official Prabhas Merchandise Store</p>
        </div>
        <div class="content">
          <h2 style="margin-top: 0; color: #0f172a;">Sign-In Verification</h2>
          <p>Hello Rebel Fan,</p>
          <p>Please enter the verification code below to complete your sign in:</p>
          <div class="otp-box">
            <div class="otp-code">{otp_code}</div>
          </div>
          <p style="font-size: 13px; color: #64748b;">This code is valid for 10 minutes. If you did not request this sign-in, please ignore this email.</p>
        </div>
        <div class="footer">
          &copy; 2026 Rebel Mart · All Rights Reserved
        </div>
      </div>
    </body>
    </html>
    """

    return send_email(to_email, subject, text, html)
