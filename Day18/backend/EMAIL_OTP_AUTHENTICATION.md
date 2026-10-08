# Email OTP Authentication

Rebel Mart now uses a two-step login flow backed by Celery.

## Flow

1. User enters registered email + password.
2. FastAPI validates the password.
3. Backend generates a cryptographically random 6-digit OTP.
4. Only a hash of the OTP is stored in PostgreSQL.
5. The raw OTP is sent to the user's registered email through a Celery task.
6. React displays the OTP screen.
7. User enters the OTP.
8. Backend checks expiry and attempt limits.
9. A JWT is issued only after successful OTP verification.

## Security

- OTP expires after `LOGIN_OTP_EXPIRE_MINUTES` (default 5 minutes).
- Resend is rate limited by `LOGIN_OTP_RESEND_SECONDS` (default 60 seconds).
- Maximum incorrect attempts are controlled by `LOGIN_OTP_MAX_ATTEMPTS` (default 5).
- OTP plaintext is never stored in PostgreSQL.
- Changing an account email resets `email_verified` to false.
- Order confirmation emails continue to go to the email stored on the user's order account.

## Gmail SMTP

Use a real Gmail account for the application's SMTP sender. For Gmail, use a Google App Password rather than the normal account password when required by Google's account security settings.

```env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USERNAME=your-sender@gmail.com
SMTP_PASSWORD=your-16-character-app-password
SMTP_USE_TLS=true
LOGIN_OTP_EXPIRE_MINUTES=5
LOGIN_OTP_RESEND_SECONDS=60
LOGIN_OTP_MAX_ATTEMPTS=5
```

The sender account does not have to be the same as every customer's email. Each customer receives the OTP and order confirmation at the email address stored in their own Rebel Mart account.
