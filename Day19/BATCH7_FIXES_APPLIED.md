# Batch 7 test fixes applied

This archive is based on the project ZIP supplied by the user. The following targeted fixes were applied:

- Rate limiting is disabled only when `ENVIRONMENT` is `testing` or `test`; it remains enabled in development/staging/production.
- TrustedHostMiddleware now uses the centralized `settings.allowed_hosts`, which includes `testserver` for the testing environment.
- CartService retains atomic Redis `HINCRBY` behavior and has a fallback for lightweight Redis-compatible test doubles that implement `hget`/`hset` only.
- Insufficient stock during checkout returns HTTP 400, matching the project's current tests/API contract.
- Order confirmation email gets the user's username as a fallback when checkout/customer name is not provided.

Validation performed here: Python syntax compilation passed for the five updated Python files. The full pytest suite was not run in this environment because the project requires its backend dependencies and database/Redis setup. Run `pytest -q --tb=short` from the backend virtual environment to verify against your local setup.
