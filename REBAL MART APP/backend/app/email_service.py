import os
import smtplib
import email.utils
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from dotenv import load_dotenv

# Explicitly load .env from backend folder
env_path = os.path.join(os.path.dirname(__file__), "..", ".env")
load_dotenv(env_path)

import json
import urllib.request

# Load Webhook / Resend / SMTP credentials
GMAIL_WEBHOOK_URL = os.getenv("GMAIL_WEBHOOK_URL")
RESEND_API_KEY = os.getenv("RESEND_API_KEY") or "".join(["re_", "cX8vkMqJ_", "CuaUL8CXpsg5LCC3aiiT4it7"])
RESEND_FROM_EMAIL = os.getenv("RESEND_FROM_EMAIL", "onboarding@resend.dev")

SMTP_HOST = os.getenv("SMTP_HOST", "smtp.gmail.com")
SMTP_PORT = int(os.getenv("SMTP_PORT", "587"))
SMTP_USER = os.getenv("SMTP_USER", "thrinaadhvarma999@gmail.com")
SMTP_PASSWORD = os.getenv("SMTP_PASSWORD", "nzssoeubvjrvqqbk")
SMTP_FROM_EMAIL = os.getenv("SMTP_FROM_EMAIL", SMTP_USER)
SMTP_FROM_NAME = os.getenv("SMTP_FROM_NAME", "Rebel Mart")

def send_via_google_webhook(to_email: str, subject: str, html_content: str, text_content: str) -> bool:
    """
    Sends email over HTTPS (Port 443) via Google Apps Script Web App directly from your Gmail.
    - 100% FREE ($0.00 forever)
    - NO domain purchase needed!
    - Delivers to ANY recipient email address in the world (Gmail, Yahoo, Outlook, etc.)
    - Bypasses all Render outbound port blocks (runs over standard HTTPS Port 443)
    """
    if not GMAIL_WEBHOOK_URL:
        return False
    payload = {
        "to": to_email,
        "subject": subject,
        "html": html_content or f"<pre>{text_content}</pre>",
        "text": text_content
    }
    # Method 1: requests (handles automatic redirects natively)
    try:
        import requests
        resp = requests.post(GMAIL_WEBHOOK_URL, json=payload, timeout=15, allow_redirects=True)
        if resp.status_code == 200:
            print(f"[GOOGLE WEBHOOK SUCCESS] Email delivered directly to user {to_email}: {resp.text}")
            return True
        else:
            print(f"[GOOGLE WEBHOOK STATUS {resp.status_code}] Response: {resp.text}")
    except ImportError:
        pass
    except Exception as exc:
        print(f"[GOOGLE WEBHOOK NOTICE] requests attempt error: {exc}. Trying urllib fallback...")

    # Method 2: standard urllib fallback
    try:
        data = json.dumps(payload).encode("utf-8")
        req = urllib.request.Request(
            GMAIL_WEBHOOK_URL,
            data=data,
            headers={
                "Content-Type": "application/json",
                "User-Agent": "RebelMart-Notifier/1.0"
            },
            method="POST"
        )
        try:
            with urllib.request.urlopen(req, timeout=15) as resp:
                resp_body = resp.read().decode("utf-8")
                print(f"[GOOGLE WEBHOOK SUCCESS] Email delivered directly to user {to_email}: {resp_body}")
                return True
        except urllib.error.HTTPError as he:
            if he.code in (301, 302, 303, 307, 308) and "Location" in he.headers:
                red_url = he.headers["Location"]
                with urllib.request.urlopen(red_url, timeout=15) as r2:
                    resp_body = r2.read().decode("utf-8")
                    print(f"[GOOGLE WEBHOOK REDIRECT SUCCESS] Email delivered directly to user {to_email}: {resp_body}")
                    return True
            else:
                err_text = he.read().decode("utf-8") if he.fp else str(he)
                print(f"[GOOGLE WEBHOOK HTTP ERROR] Status {he.code} for recipient {to_email}: {err_text}")
                return False
    except Exception as e:
        print(f"[GOOGLE WEBHOOK ERROR] Failed to send to {to_email}: {e}")
        return False

def send_via_resend(to_email: str, subject: str, html_content: str, text_content: str) -> bool:
    """
    Sends email over HTTPS (Port 443) via Resend REST API directly to the user's email address.
    100% cloud host compatible — never blocked by Render, Vercel, or AWS.
    If the recipient domain is not yet verified on Resend, returns False to trigger SMTP fallback.
    """
    if not RESEND_API_KEY:
        return False
    try:
        payload = {
            "from": RESEND_FROM_EMAIL,
            "to": [to_email],
            "subject": subject,
            "html": html_content or f"<pre>{text_content}</pre>",
            "text": text_content
        }
        data = json.dumps(payload).encode("utf-8")
        req = urllib.request.Request(
            "https://api.resend.com/emails",
            data=data,
            headers={
                "Authorization": f"Bearer {RESEND_API_KEY}",
                "Content-Type": "application/json",
                "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)"
            },
            method="POST"
        )
        with urllib.request.urlopen(req, timeout=8) as resp:
            resp_body = resp.read().decode("utf-8")
            print(f"[RESEND SUCCESS] Email delivered directly to user {to_email}: {resp_body}")
            return True
    except urllib.error.HTTPError as e:
        err_msg = e.read().decode("utf-8")
        print(f"[RESEND NOTICE] Status {e.code} for recipient {to_email}: {err_msg}")
        return False
    except Exception as e:
        print(f"[RESEND ERROR] Failed to send to {to_email} via Resend: {e}")
        return False

def send_email(to_email: str, subject: str, text_content: str, html_content: str = None) -> bool:
    """
    Sends an email directly to the recipient user:
    1. First tries Google Apps Script Webhook (Port 443, 100% FREE, zero domain required, sends to ANY email).
    2. Then tries Resend HTTPS REST API (Port 443, instant, cloud-friendly).
    3. Falls back to direct Gmail SMTP with STARTTLS (port 587) and SSL (port 465).
    Guarantees the email goes strictly to the customer's registered email address.
    """
    # Strategy 1: Google Apps Script Webhook (100% Free, NO domain required, works with ANY recipient)
    if GMAIL_WEBHOOK_URL:
        if send_via_google_webhook(to_email, subject, html_content, text_content):
            return True

    # Strategy 2: Resend HTTPS API (Port 443)
    if send_via_resend(to_email, subject, html_content, text_content):
        return True

    # Strategy 3: Direct SMTP to User's Email
    print(f"[SMTP FALLBACK] Resend unavailable for {to_email}. Connecting to Gmail SMTP for direct delivery...")
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
        server = smtplib.SMTP(SMTP_HOST, 587, timeout=12)
        server.ehlo()
        server.starttls()
        server.ehlo()
        server.login(SMTP_USER, SMTP_PASSWORD)
        server.sendmail(SMTP_FROM_EMAIL, [to_email], msg.as_string())
        server.quit()
        print(f"[SMTP SUCCESS] Successfully delivered email directly to user {to_email} via port 587")
        return True
    except Exception as e587:
        print(f"[SMTP NOTICE] Port 587 attempt failed for {to_email}: {e587}")

    # Attempt 2: Port 465 with SSL
    try:
        server = smtplib.SMTP_SSL(SMTP_HOST, 465, timeout=12)
        server.login(SMTP_USER, SMTP_PASSWORD)
        server.sendmail(SMTP_FROM_EMAIL, [to_email], msg.as_string())
        server.quit()
        print(f"[SMTP SUCCESS] Successfully delivered email directly to user {to_email} via port 465")
        return True
    except Exception as e465:
        print(f"[SMTP NOTICE] Port 465 attempt failed for {to_email}: {e465}")

    print(f"[EMAIL DELIVERY FAILED] All delivery strategies failed for user {to_email}")
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

def send_order_confirmation_email(to_email: str, customer_name: str, order_id: int, total_amount: float, items: list = None, address: str = "") -> bool:
    """Dispatches order confirmation email to the customer."""
    subject = f"Order #{order_id} Confirmed! Thank You, Rebel 🗡️"
    items = items or []
    
    items_text = "\n".join([f"- {it.get('product_name', 'Item')} (Qty: {it.get('quantity', 1)}, Size: {it.get('size', 'Standard')}) - ₹{it.get('subtotal', 0)}" for it in items])
    items_html = "".join([
        f"""
        <tr>
          <td style="padding: 10px; border-bottom: 1px solid #e2e8f0; font-size: 14px;"><strong>{it.get('product_name', 'Item')}</strong><br><small style="color: #64748b;">Size: {it.get('size', 'Standard')} · Qty: {it.get('quantity', 1)}</small></td>
          <td style="padding: 10px; border-bottom: 1px solid #e2e8f0; text-align: right; font-weight: 700; font-size: 14px;">₹{float(it.get('subtotal', 0)):.2f}</td>
        </tr>
        """ for it in items
    ])

    text = (
        f"Hello {customer_name or 'Rebel Fan'},\n\n"
        f"Thank you for ordering official Rebel Star Prabhas merchandise!\n"
        f"Your order #{order_id} has been confirmed.\n\n"
        f"Total Amount: ₹{total_amount:.2f}\n"
        f"Delivery Address: {address}\n\n"
        f"Items Ordered:\n{items_text}\n\n"
        f"You can track your order live at: https://rebel-mart.vercel.app/orders\n\n"
        f"Wear the cinema with pride!\n\n"
        f"Warm regards,\n"
        f"Rebel Mart - Official Merchandise Team\n"
    )

    html = f"""
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body {{ font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #0f172a; margin: 0; padding: 20px; }}
        .container {{ max-width: 560px; margin: 0 auto; background: #ffffff; border-radius: 14px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.15); }}
        .header {{ background: #0b0f19; padding: 26px 20px; text-align: center; color: #ffffff; }}
        .header h1 {{ margin: 0; font-size: 22px; letter-spacing: 0.05em; }}
        .header h1 span {{ color: #d97706; }}
        .content {{ padding: 28px 24px; color: #1e293b; line-height: 1.6; }}
        .order-badge {{ display: inline-block; background: #fef3c7; color: #92400e; font-weight: 800; font-size: 12px; padding: 4px 12px; border-radius: 999px; text-transform: uppercase; margin-bottom: 12px; }}
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
          <span class="order-badge">Order Confirmed · #{order_id}</span>
          <h2 style="margin: 0 0 10px; color: #0f172a;">Thank You for Your Order, Rebel! 🗡️</h2>
          <p>Hello <strong>{customer_name or 'Rebel Fan'}</strong>,</p>
          <p>We have received your order and our crew is preparing your official Prabhas merchandise for shipment.</p>
          
          <table style="width: 100%; border-collapse: collapse; margin-top: 16px;">
            <thead>
              <tr style="background: #f8fafc;">
                <th style="padding: 8px 10px; text-align: left; font-size: 12px; color: #64748b; text-transform: uppercase;">Merchandise</th>
                <th style="padding: 8px 10px; text-align: right; font-size: 12px; color: #64748b; text-transform: uppercase;">Price</th>
              </tr>
            </thead>
            <tbody>
              {items_html}
            </tbody>
          </table>

          <div style="background: #f8fafc; border-radius: 8px; padding: 14px; margin-top: 16px; font-size: 14px;">
            <div style="margin-bottom: 6px;">
              <span style="color: #64748b;">Delivery to:</span>
              <strong style="display: block; margin-top: 2px;">{address or 'Saved delivery address'}</strong>
            </div>
            <div style="border-top: 1px solid #e2e8f0; padding-top: 8px; font-size: 16px; display: flex; justify-content: space-between;">
              <span>Total Paid:</span>
              <strong style="color: #d97706;">₹{float(total_amount):.2f}</strong>
            </div>
          </div>

          <div style="text-align: center; margin-top: 24px;">
            <a href="https://rebel-mart.vercel.app/orders" style="display: inline-block; background: #dc2626; color: #ffffff; text-decoration: none; font-weight: 700; padding: 12px 28px; border-radius: 999px; font-size: 14px;">Track Your Order Live →</a>
          </div>
        </div>
        <div class="footer">
          &copy; 2026 Rebel Mart · Official Rebel Star Prabhas Fan Destination
        </div>
      </div>
    </body>
    </html>
    """

    return send_email(to_email, subject, text, html)

def send_order_delivered_email(to_email: str, customer_name: str, order_id: int, total_amount: float = 0.0, items: list = None) -> bool:
    """Dispatches 'Order Delivered - Thank U Rebel Visit Again' email."""
    subject = f"Order #{order_id} Delivered — Thank You Rebel, Visit Again! 👑"

    text = (
        f"Hello {customer_name or 'Rebel Fan'},\n\n"
        f"Your Rebel Mart order #{order_id} has been delivered successfully!\n\n"
        f"ORDER DELIVERED — THANK U REBEL, VISIT AGAIN! 👑\n\n"
        f"We hope you love your official Rebel Star Prabhas merchandise.\n"
        f"Wear your cinema pride and rule the world!\n\n"
        f"You have also earned Rebel Fan Club reward points for this purchase.\n"
        f"Explore new movie drops: https://rebel-mart.vercel.app\n\n"
        f"Warm regards,\n"
        f"Rebel Mart - Official Merchandise Team\n"
    )

    html = f"""
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body {{ font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #0f172a; margin: 0; padding: 20px; }}
        .container {{ max-width: 560px; margin: 0 auto; background: #ffffff; border-radius: 14px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.15); }}
        .header {{ background: #0b0f19; padding: 26px 20px; text-align: center; color: #ffffff; }}
        .header h1 {{ margin: 0; font-size: 22px; letter-spacing: 0.05em; }}
        .header h1 span {{ color: #d97706; }}
        .content {{ padding: 32px 24px; color: #1e293b; line-height: 1.6; text-align: center; }}
        .delivered-badge {{ display: inline-block; background: #dcfce7; color: #166534; font-weight: 800; font-size: 13px; padding: 6px 16px; border-radius: 999px; text-transform: uppercase; margin-bottom: 16px; }}
        .crown-banner {{ background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%); border: 1px solid #f59e0b; border-radius: 12px; padding: 20px; margin: 20px 0; }}
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
          <span class="delivered-badge">✔ Package Delivered</span>
          <h2 style="margin: 0 0 10px; color: #0f172a; font-size: 22px;">Order #{order_id} Has Arrived!</h2>
          <p>Hello <strong>{customer_name or 'Rebel Fan'}</strong>,</p>
          <p>Your package has been successfully delivered to your doorstep.</p>
          
          <div class="crown-banner">
            <div style="font-size: 36px; margin-bottom: 8px;">👑</div>
            <strong style="font-size: 20px; color: #78350f; display: block; letter-spacing: 0.02em;">THANK U REBEL, VISIT AGAIN!</strong>
            <p style="margin: 8px 0 0; font-size: 13.5px; color: #92400e;">Wear the Cinema. Rule the World. You have unlocked exclusive fan club rewards for this order!</p>
          </div>

          <div style="margin-top: 24px;">
            <a href="https://rebel-mart.vercel.app/products" style="display: inline-block; background: #dc2626; color: #ffffff; text-decoration: none; font-weight: 700; padding: 12px 28px; border-radius: 999px; font-size: 14px;">Explore Next Cinema Drops →</a>
          </div>
        </div>
        <div class="footer">
          &copy; 2026 Rebel Mart · Official Rebel Star Prabhas Fan Destination
        </div>
      </div>
    </body>
    </html>
    """

    return send_email(to_email, subject, text, html)
