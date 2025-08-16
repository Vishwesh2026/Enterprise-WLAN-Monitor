import React from "react";
import { io } from "socket.io-client";

// Real WebSocket via socket.io-client with auto-reconnect and error handling
export default function useWebSocket({ url }) {
  const [status, setStatus] = React.useState("connecting"); // connecting | connected | disconnected | error
  const [lastMessage, setLastMessage] = React.useState(null);
  const socketRef = React.useRef(null);
  const reconnectAttempts = React.useRef(0);

  React.useEffect(() => {
    if (!url) return;

    // Connect with reconnection enabled
    const socket = io(url, {
      transports: ["websocket"],
      reconnection: true,
      reconnectionAttempts: Infinity,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 8000,
      timeout: 10000,
    });

    socketRef.current = socket;

    const onConnect = () => {
      reconnectAttempts.current = 0;
      setStatus("connected");
    };
    const onDisconnect = () => setStatus("disconnected");
    const onConnectError = (err) => {
      setStatus("error");
      setLastMessage({ type: "connect_error", error: err?.message || String(err), ts: Date.now() });
    };

    socket.on("connect", onConnect);
    socket.on("disconnect", onDisconnect);
    socket.on("connect_error", onConnectError);

    // Generic channel for server-emitted updates, e.g., { type, payload }
    socket.on("wlan:update", (data) => setLastMessage({ type: "update", payload: data, ts: Date.now() }));
    socket.on("wlan:alert", (data) => setLastMessage({ type: "alert", payload: data, ts: Date.now() }));

    // Heartbeat or ping from server
    socket.on("wlan:heartbeat", () => setLastMessage({ type: "heartbeat", ts: Date.now() }));

    return () => {
      try { socket.close(); } catch {}
      socketRef.current = null;
    };
  }, [url]);

  const send = React.useCallback((event, payload) => {
    if (!socketRef.current) return;
    try { socketRef.current.emit(event, payload); } catch {}
  }, []);

  return { status, lastMessage, send };
}