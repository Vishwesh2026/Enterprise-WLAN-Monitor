import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import { initialDevices, initialAlerts, updateDeviceRandom, generateRandomAlert } from "../mock";
import useWebSocketMock from "../hooks/useWebSocket";
import { useToast } from "../hooks/use-toast";
import { api } from "../utils/api";

const AppContext = createContext(null);

export function AppProvider({ children }) {
  const { toast } = useToast();
  const [devices, setDevices] = useState(initialDevices);
  const [alerts, setAlerts] = useState(initialAlerts);
  const [activeSector, setActiveSector] = useState(() => localStorage.getItem("wlan_sector") || "all");
  const [search, setSearch] = useState("");
  const [selectedDeviceId, setSelectedDeviceId] = useState(null);
  const ws = useWebSocketMock();

  // Load from backend if available
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const [dRes, aRes] = await Promise.all([
          api.get("/devices"),
          api.get("/alerts"),
        ]);
        if (!mounted) return;
        if (Array.isArray(dRes.data) && dRes.data.length) setDevices(dRes.data);
        if (Array.isArray(aRes.data) && aRes.data.length) setAlerts(aRes.data);
      } catch (e) {
        console.warn("Backend not ready, using mocks", e?.message || e);
      }
    })();
    return () => { mounted = false; };
  }, []);

  // Persist only simple preferences
  useEffect(() => {
    localStorage.setItem("wlan_sector", activeSector);
  }, [activeSector]);

  // Simulate realtime device updates for UI feel
  useEffect(() => {
    const interval = setInterval(() => {
      setDevices((prev) => prev.map((d) => updateDeviceRandom(d)));
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  // Simulate random alerts and show toast
  useEffect(() => {
    const interval = setInterval(() => {
      if (Math.random() < 0.4) {
        setAlerts((prev) => {
          const next = [...prev, generateRandomAlert(devices)];
          if (next.length > 50) next.shift();
          return next;
        });
      }
    }, 5000);
    return () => clearInterval(interval);
  }, [devices]);

  // Show toast on latest alert
  useEffect(() => {
    if (!alerts.length) return;
    const a = alerts[alerts.length - 1];
    toast({
      title: `New ${a.severity.toUpperCase()} alert`,
      description: `${a.message} on ${a.deviceId}`,
    });
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

  // Expose a sync function to push current mock data to backend
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