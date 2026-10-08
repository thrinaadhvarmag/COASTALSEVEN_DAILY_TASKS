import { useCallback, useEffect, useRef, useState } from "react";

export type WebSocketStatus =
  | "idle"
  | "connecting"
  | "open"
  | "reconnecting"
  | "closed";

interface UseWebSocketOptions {
  enabled?: boolean;
  reconnect?: boolean;
  baseDelayMs?: number;
  maxDelayMs?: number;
  onMessage?: (message: unknown) => void;
  onOpen?: () => void;
  onClose?: () => void;
}

export interface UseWebSocketResult {
  status: WebSocketStatus;
  reconnectAttempt: number;
  send: (message: unknown) => boolean;
  reconnectNow: () => void;
}

/**
 * Reusable native WebSocket hook with automatic exponential-backoff reconnects.
 * It deliberately uses the browser WebSocket API, so no extra client library is
 * required and the same hook can power order updates and customer support chat.
 */
export function useWebSocket(
  url: string | null,
  options: UseWebSocketOptions = {},
): UseWebSocketResult {
  const {
    enabled = true,
    reconnect = true,
    baseDelayMs = 1000,
    maxDelayMs = 30000,
    onMessage,
    onOpen,
    onClose,
  } = options;

  const socketRef = useRef<WebSocket | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const attemptRef = useRef(0);
  const disposedRef = useRef(false);
  const connectRef = useRef<() => void>(() => undefined);
  const callbacksRef = useRef({ onMessage, onOpen, onClose });
  const [status, setStatus] = useState<WebSocketStatus>(enabled && url ? "connecting" : "idle");
  const [reconnectAttempt, setReconnectAttempt] = useState(0);

  useEffect(() => {
    callbacksRef.current = { onMessage, onOpen, onClose };
  }, [onClose, onMessage, onOpen]);

  const reconnectNow = useCallback(() => {
    attemptRef.current = 0;
    setReconnectAttempt(0);
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    if (socketRef.current) {
      socketRef.current.close();
    } else {
      connectRef.current();
    }
  }, []);

  const send = useCallback((message: unknown): boolean => {
    const socket = socketRef.current;
    if (!socket || socket.readyState !== WebSocket.OPEN) return false;
    socket.send(typeof message === "string" ? message : JSON.stringify(message));
    return true;
  }, []);

  useEffect(() => {
    disposedRef.current = false;
    attemptRef.current = 0;

    if (!enabled || !url) {
      socketRef.current?.close();
      socketRef.current = null;
      return () => undefined;
    }

    const connect = () => {
      if (disposedRef.current) return;

      if (socketRef.current?.readyState === WebSocket.OPEN || socketRef.current?.readyState === WebSocket.CONNECTING) {
        return;
      }

      setStatus(attemptRef.current === 0 ? "connecting" : "reconnecting");
      const socket = new WebSocket(url);
      socketRef.current = socket;

      socket.onopen = () => {
        attemptRef.current = 0;
        setReconnectAttempt(0);
        setStatus("open");
        callbacksRef.current.onOpen?.();
      };

      socket.onmessage = (event) => {
        try {
          callbacksRef.current.onMessage?.(JSON.parse(event.data));
        } catch {
          callbacksRef.current.onMessage?.(event.data);
        }
      };

      socket.onerror = () => {
        // onclose owns the retry lifecycle. Keeping this callback intentionally small
        // avoids creating duplicate reconnect timers after transient errors.
      };

      socket.onclose = () => {
        socketRef.current = null;
        callbacksRef.current.onClose?.();
        if (disposedRef.current) {
          setStatus("closed");
          return;
        }

        if (!reconnect) {
          setStatus("closed");
          return;
        }

        attemptRef.current += 1;
        setReconnectAttempt(attemptRef.current);
        const delay = Math.min(
          maxDelayMs,
          baseDelayMs * 2 ** Math.max(0, attemptRef.current - 1),
        );
        setStatus("reconnecting");
        timerRef.current = setTimeout(connect, delay);
      };
    };

    connectRef.current = connect;
    connect();

    return () => {
      disposedRef.current = true;
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
      const socket = socketRef.current;
      socketRef.current = null;
      socket?.close();
    };
  }, [baseDelayMs, enabled, maxDelayMs, reconnect, url]);

  return { status, reconnectAttempt, send, reconnectNow };
}
