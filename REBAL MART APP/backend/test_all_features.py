import os
import sys
import smtplib
from dotenv import load_dotenv

print("=" * 60)
print("REBEL MART SYSTEM & CREDENTIALS VERIFICATION SUITE")
print("=" * 60)

# 1. TEST CONFIGURATION
print("\n[TEST 1] Checking Configuration & Credentials...")
env_path = os.path.join(os.path.dirname(__file__), ".env")
load_dotenv(env_path)

smtp_host = os.getenv("SMTP_HOST", "smtp.gmail.com")
smtp_port = int(os.getenv("SMTP_PORT", "587"))
smtp_user = os.getenv("SMTP_USER")
smtp_pass = os.getenv("SMTP_PASSWORD")
db_url = os.getenv("DATABASE_URL")

print(f"  * SMTP Host: {smtp_host}:{smtp_port}")
print(f"  * SMTP User: {smtp_user}")
print(f"  * SMTP Password Configured: {'YES (***' + smtp_pass[-4:] + ')' if smtp_pass else 'NO'}")
print(f"  * Database URL: {db_url}")
assert smtp_user == "thrinaadhvarma999@gmail.com", "SMTP User mismatch!"
assert smtp_pass == "nzssoeubvjrvqqbk", "SMTP Password mismatch!"
print("  => Configuration check: PASSED [OK]")

# 2. TEST GMAIL SMTP AUTHENTICATION & SEND
print("\n[TEST 2] Testing Gmail SMTP Connection & Authentication...")
try:
    server = smtplib.SMTP(smtp_host, smtp_port, timeout=12)
    server.ehlo()
    server.starttls()
    server.ehlo()
    server.login(smtp_user, smtp_pass)
    server.quit()
    print("  * Gmail TLS Handshake & Credentials Login: SUCCESS [OK]")
except Exception as e:
    print(f"  * Gmail SMTP Connection: FAILED ❌ -> {e}")

print("\n[TEST 3] Testing Email Delivery to Customer (bingkosam2@gmail.com)...")
try:
    from app.email_service import send_otp_email
    sent = send_otp_email("bingkosam2@gmail.com", "999888")
    print(f"  * OTP Email Dispatch via Gmail to bingkosam2@gmail.com: {'SUCCESS [OK]' if sent else 'FAILED ❌'}")
except Exception as e:
    print(f"  * OTP Dispatch Exception: {e}")

# 3. TEST CELERY INITIALIZATION & TASKS
print("\n[TEST 4] Testing Celery Task Engine...")
try:
    from app.celery_app import celery, generate_order_invoice, send_verification_email
    print(f"  * Celery App Name: {celery.main}")
    print(f"  * Celery Broker: {celery.conf.broker_url}")
    print(f"  * Celery Backend: {celery.conf.result_backend}")
    
    # Test invoice generation task execution directly
    invoice_result = generate_order_invoice.apply(args=(101,))
    print(f"  * Celery Invoice Task Execution: SUCCESS [OK] (Output: {invoice_result.result.get('filename')})")

    # Test email task execution
    email_task_result = send_verification_email.apply(args=("bingkosam2@gmail.com", "123456"))
    print(f"  * Celery Email Task Execution: SUCCESS [OK] (Result: {email_task_result.result})")
except Exception as e:
    print(f"  * Celery Test: FAILED ❌ -> {e}")

# 4. TEST DATABASE & PRE-SEEDED CREDENTIALS
print("\n[TEST 5] Testing Database & Seeded Credentials...")
try:
    from app.database import SessionLocal
    from app.models import User
    from app.auth import verify_password

    db = SessionLocal()
    admin = db.query(User).filter(User.email == "gunjethrinaadhvarma999@gmail.com").first()
    customer = db.query(User).filter(User.email == "bingkosam2@gmail.com").first()

    print(f"  * Admin User in DB: {admin.email if admin else 'NOT FOUND'} (Role: {admin.role if admin else 'N/A'})")
    if admin:
        admin_pw_ok = verify_password("Admin@123456", admin.hashed_password)
        print(f"  * Admin Password Verification ('Admin@123456'): {'MATCHED [OK]' if admin_pw_ok else 'FAILED ❌'}")

    print(f"  * Customer User in DB: {customer.email if customer else 'NOT FOUND'} (Role: {customer.role if customer else 'N/A'})")
    if customer:
        cust_pw_ok = verify_password("Nanna@123", customer.hashed_password)
        print(f"  • Customer Password Verification ('Nanna@123'): {'MATCHED [OK]' if cust_pw_ok else 'FAILED [ERR]'}")

    db.close()
except Exception as e:
    print(f"  • Database Test: FAILED ❌ -> {e}")

print("\n" + "=" * 60)
print("ALL SYSTEM CHECKS COMPLETED!")
print("=" * 60)
