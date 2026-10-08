# Rebel Mart — Real-Time Communication

## Implemented
- Environment-driven CORS remains configured by `CORS_ORIGINS` in the FastAPI settings and the React API base URL remains `VITE_API_URL`.
- JWT authentication is reused for WebSocket handshakes through the `token` query parameter; the backend verifies the token before accepting a connection.
- Reusable React `useWebSocket` hook with automatic exponential-backoff reconnection.
- `/ws/orders/{user_id}` pushes order creation and admin/customer status changes.
- React Query order caches are updated and invalidated when a live order event arrives.
- A global notifications panel surfaces live order events without page refreshes.
- `/ws/chat/{customer_id}` provides authenticated customer/admin real-time messaging.
- Customers get a live support chat; admins can select an order and chat with that customer.

## WebSocket endpoints
- `ws://localhost:8000/ws/orders/<user_id>?token=<JWT>`
- `ws://localhost:8000/ws/chat/<customer_id>?token=<JWT>`

## Reconnection strategy
The client retries after 1s, 2s, 4s, 8s, 16s and then caps the delay at 30s. Closing/unmounting a component cancels the pending retry so sockets do not leak.
