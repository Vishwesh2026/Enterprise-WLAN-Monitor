import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import { initialDevices, initialAlerts, updateDeviceRandom } from "../mock";
import useWebSocket from "../hooks/useWebSocket";
import { useToast } from "../hooks/use-toast";
import { api } from "../utils/api";

const WS_URL = "ws://10.78.44.141:8080"; // provided by user (raw WebSocket)

const AppContext = createContext(null);

export function AppProvider({ children }) {
  const { toast } = useToast();
  const [devices, setDevices] = useState(initialDevices);
  const [alerts, setAlerts] = useState(initialAlerts);
  const [activeSector, setActiveSector] = useState(() => localStorage.getItem("wlan_sector") || "all");
  const [search, setSearch] = useState("");
  const [selectedDeviceId, setSelectedDeviceId] = useState(null);

  // Real WebSocket connection (raw WS)
  const ws = useWebSocket({ url: WS_URL });

  // Load from backend if available
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const [dRes, aRes] = await Promise.all([api.get("/devices"), api.get("/alerts")]);
        if (!mounted) return;
        if (Array.isArray(dRes.data) && dRes.data.length) setDevices(dRes.data);
        if (Array.isArray(aRes.data) && aRes.data.length) setAlerts(aRes.data);
      } catch (e) { console.warn("Backend not ready, using mocks", e?.message || e); }
    })();
    return () => { mounted = false; };
  }, []);

  useEffect(() => { localStorage.setItem("wlan_sector", activeSector); }, [activeSector]);

  // Handle incoming WebSocket messages
  useEffect(() => {
    if (!ws.lastMessage) return;
    const m = ws.lastMessage;
    if (m.type === "device_update" && m.payload?.devices) {
      setDevices(m.payload.devices);
      return;
    }
    if (m.type === "alert" && m.payload) {
      setAlerts((prev) => {
        const next = [...prev, m.payload];
        if (next.length > 200) next.shift();
        return next;
      });
      return;
    }
    if (m.type === "connect_error") {
      toast({ title: "WebSocket error", description: String(m.error) });
    }
  }, [ws.lastMessage, toast]);

  // Fallback jitter if no real updates
  useEffect(() => {
    const t = setInterval(() => { setDevices((prev) => prev.map((d) => updateDeviceRandom(d))); }, 5000);
    return () => clearInterval(t);
  }, []);

  // Toast on latest alert
  useEffect(() => {
    if (!alerts.length) return;
    const a = alerts[alerts.length - 1];
    if (!a || !a.message || !a.deviceId) return;
    toast({ title: `New ${String(a.severity || "").toUpperCase()} alert`, description: `${a.message} on ${a.deviceId}` });
  }, [alerts, toast]);

  const sectors = useMemo(() => {
    const counts = { education: 0, healthcare: 0, logistics: 0, government: 0 };
    devices.forEach((d) => { if (counts[d.sector] !== undefined) counts[d.sector] += 1; });
    return [
      { key: "all", label: "All Devices", count: devices.length },
      { key: "education", label: "Education", count: counts.education },
      { key: "healthcare", label: "Healthcare", count: counts.healthcare },
      { key: "logistics", label: "Logistics", count: counts.logistics },
      { key: "government", label: "Government", count: counts.government },
    ];
  }, [devices]);

  const filteredDevices = useMemo(() => {
    const term = search.trim().toLowerCase();
    return devices.filter((d) => {
      if (activeSector !== "all" && d.sector !== activeSector) return false;
      if (!term) return true;
      return (
        d.id.toLowerCase().includes(term) ||
        d.location.toLowerCase().includes(term) ||
        d.sector.toLowerCase().includes(term)
      );
    });
  }, [devices, activeSector, search]);

  async function syncMocksToBackend() {
    try {
      await api.post("/devices/bulk", { devices });
      await api.post("/alerts/bulk", { alerts });
      const [dRes, aRes] = await Promise.all([api.get("/devices"), api.get("/alerts")]);
      setDevices(Array.isArray(dRes.data) ? dRes.data : devices);
      setAlerts(Array.isArray(aRes.data) ? aRes.data : alerts);
      toast({ title: "Synced to backend", description: "Mocks stored in database." });
    } catch (e) {
      toast({ title: "Sync failed", description: String(e?.message || e) });
    }
  }

  const value = {
    devices,
    alerts,
    sectors,
    filteredDevices,
    activeSector,
    setActiveSector,
    search,
    setSearch,
    selectedDeviceId,
    setSelectedDeviceId,
    connectionStatus: ws.status,
    syncMocksToBackend,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useApp must be used within AppProvider");
  return ctx;
}