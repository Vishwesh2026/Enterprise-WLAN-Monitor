import React from "react";

// Mocked WebSocket hook with auto-reconnect simulation
export default function useWebSocketMock() {
  const [status, setStatus] = React.useState("connecting"); // connecting | connected | disconnected
  const [lastMessage, setLastMessage] = React.useState(null);
  const reconnectRef = React.useRef(null);

  React.useEffect(() => {
    let mounted = true;
    // Simulate initial connection delay
    const t = setTimeout(() => mounted &amp;&amp; setStatus("connected"), 600);

    // Periodically simulate random disconnects and reconnects
    reconnectRef.current = setInterval(() => {
      if (Math.random() &lt; 0.08) {
        setStatus("disconnected");
        setTimeout(() => setStatus("connected"), 1200);
      }
      // Emit a heartbeat message
      setLastMessage({ type: "heartbeat", ts: Date.now() });
    }, 3000);

    return () => {
      mounted = false;
      clearTimeout(t);
      if (reconnectRef.current) clearInterval(reconnectRef.current);
    };
  }, []);

  const send = React.useCallback((msg) => {
    // In mock mode, just echo back after a short delay
    setTimeout(() => setLastMessage({ type: "echo", payload: msg, ts: Date.now() }), 300);
  }, []);

  return { status, lastMessage, send };
}