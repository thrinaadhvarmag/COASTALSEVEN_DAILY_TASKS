# Rebel Mart – Batch 7 Final Status

## Existing features retained
- Zustand global cart store with optimistic operations and rollback.
- Order History and Order Details pages.
- Admin Dashboard with product CRUD, image upload/replacement, inventory and order status management.
- Dark/Light theme with localStorage persistence.
- TanStack React Query for server-state caching and synchronization.
- TypeScript API boundary and tests.
- Protected customer/admin routes.
- Email OTP authentication and Redis/Celery background processing.

## Batch 7 additions in this archive
- SlowAPI + Redis-backed API rate limiting.
- OWASP-oriented security hardening and security headers.
- Trusted Host validation.
- Auth/resource-specific rate limits.
- Existing GZip response compression verified and retained.
- Vite production bundle splitting and ES2022 optimization.
- Image loading/dimension optimizations.
- Lighthouse CI script and JSON report workflow.
- Locust load-test profile for 50 concurrent users.
- Batch 7 security/load-testing documentation and automated security tests.

## Install
Backend:
```bash
pip install -r requirements.txt
```
Frontend:
```bash
npm install
```
Do not commit `.env`, virtual environments, `node_modules`, uploads or Python cache directories.
