# Day 14 — Backend Support

The backend supports the React Day 14 architecture with:

- `/products?page=&page_size=&search=` server-side pagination.
- `/products/count` catalog metadata for page-number navigation.
- Redis-backed first-page product caching from the existing project.
- Product-detail Redis caching.
- Cache invalidation after product create/update/delete/image changes.
- GZip compression for larger responses.
- One-year-like browser caching for uploaded media via `Cache-Control` middleware.
- Short private cache headers for authenticated product/count responses; TanStack Query remains the primary server-state cache in the browser.
- Existing PostgreSQL persistence and Celery/WebSocket features remain intact.

The frontend owns the UX decisions (Context/Zustand/TanStack Query/Load More/page navigation), while the backend remains responsible for authoritative data and pagination.
