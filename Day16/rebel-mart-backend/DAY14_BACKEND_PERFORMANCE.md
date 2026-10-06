# Backend performance additions

- GZip middleware compresses larger JSON responses.
- Uploaded product/profile assets receive browser cache headers from the request middleware.
- Existing Redis product caching and paginated FastAPI endpoints remain unchanged and continue to support the TanStack Query frontend.
- No database migration is required.
