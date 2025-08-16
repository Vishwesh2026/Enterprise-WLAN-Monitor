import React from "react";

// Native WebSocket hook with auto-reconnect, timeout, and error handling
// Exposes: { status, lastMessage, send }
// status: connecting | connected | disconnected | error
export default function useWebSocket({ url, connectTimeoutMs = 10000 }) {
  const [status, setStatus] = React.useState("connecting");
  const [lastMessage, setLastMessage] = React.useState(null);
  const wsRef = React.useRef(null);
  const reconnectAttempts = React.useRef(0);
  const reconnectTimer = React.useRef(null);
  const connectTimer = React.useRef(null);

  const cleanup = React.useCallback(() => {
    if (connectTimer.current) { clearTimeout(connectTimer.current); connectTimer.current = null; }
    if (reconnectTimer.current) { clearTimeout(reconnectTimer.current); reconnectTimer.current = null; }
    try { wsRef.current && wsRef.current.close(); } catch {}
    wsRef.current = null;
  }, []);

  const scheduleReconnect = React.useCallback(() => {
    if (!url) return;
    const attempt = Math.min(reconnectAttempts.current + 1, 8);
    reconnectAttempts.current = attempt;
    const delay = Math.min(1000 * attempt, 8000);
    if (reconnectTimer.current) clearTimeout(reconnectTimer.current);
    reconnectTimer.current = setTimeout(() => {
      openSocket();
    }, delay);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [url]);

  function openSocket() {
    cleanup();
    if (!url) return;
    setStatus("connecting");
    try {
      const socket = new WebSocket(url);
      wsRef.current = socket;

      connectTimer.current = setTimeout(() => {
        // If still not open, consider timeout
        if (wsRef.current && wsRef.current.readyState !== WebSocket.OPEN) {
          try { wsRef.current.close(); } catch {}
          setStatus("error");
          setLastMessage({ type: "connect_error", error: "Connection timeout", ts: Date.now() });
          scheduleReconnect();
        }
      }, connectTimeoutMs);

      socket.onopen = () => {
        reconnectAttempts.current = 0;
        if (connectTimer.current) { clearTimeout(connectTimer.current); connectTimer.current = null; }
        setStatus("connected");
      };

      socket.onmessage = (ev) => {
        try {
          const data = typeof ev.data === "string" ? JSON.parse(ev.data) : ev.data;
          if (data && data.type) {
            // Convert server types into hook messages
            if (data.type === "device_update") {
              setLastMessage({ type: "device_update", payload: { devices: data.devices, timestamp: data.timestamp }, ts: Date.now() });
            } else if (data.type === "alert") {
              setLastMessage({ type: "alert", payload: data, ts: Date.now() });
            } else if (data.type === "heartbeat") {
              setLastMessage({ type: "heartbeat", ts: Date.now() });
            } else {
              setLastMessage({ type: data.type, payload: data, ts: Date.now() });
            }
          }
        } catch (e) {
          // Non-JSON message, ignore or log
          setLastMessage({ type: "raw", payload: ev.data, ts: Date.now() });
        }
      };

      socket.onerror = (err) => {
        setStatus("error");
        setLastMessage({ type: "connect_error", error: err?.message || "WebSocket error", ts: Date.now() });
      };

      socket.onclose = () => {
        setStatus("disconnected");
        scheduleReconnect();
      };
    } catch (e) {
      setStatus("error");
      setLastMessage({ type: "connect_error", error: e?.message || String(e), ts: Date.now() });
      scheduleReconnect();
    }
  }

  React.useEffect(() => {
    openSocket();
    return () => {
      cleanup();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [url]);

  const send = React.useCallback((payload) => {
    if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) return;
    try { wsRef.current.send(typeof payload === "string" ? payload : JSON.stringify(payload)); } catch {}
  }, []);

  return { status, lastMessage, send };
}