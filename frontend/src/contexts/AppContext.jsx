import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import { initialDevices, initialAlerts, updateDeviceRandom, generateRandomAlert } from "../mock";
import useWebSocketMock from "../hooks/useWebSocket";
import { useToast } from "../hooks/use-toast";

const AppContext = createContext(null);

export function AppProvider({ children }) {
  const { toast } = useToast();
  const [devices, setDevices] = useState(() => {
    try {
      const cached = localStorage.getItem("wlan_devices");
      return cached ? JSON.parse(cached) : initialDevices;
    } catch {
      return initialDevices;
    }
  });
  const [alerts, setAlerts] = useState(() => {
    try {
      const cached = localStorage.getItem("wlan_alerts");
      return cached ? JSON.parse(cached) : initialAlerts;
    } catch {
      return initialAlerts;
    }
  });
  const [activeSector, setActiveSector] = useState(() => localStorage.getItem("wlan_sector") || "all");
  const [search, setSearch] = useState("");
  const [selectedDeviceId, setSelectedDeviceId] = useState(null);
  const ws = useWebSocketMock();

  // Persist
  useEffect(() => {
    localStorage.setItem("wlan_devices", JSON.stringify(devices));
  }, [devices]);
  useEffect(() => {
    localStorage.setItem("wlan_alerts", JSON.stringify(alerts));
  }, [alerts]);
  useEffect(() => {
    localStorage.setItem("wlan_sector", activeSector);
  }, [activeSector]);

  // Simulate realtime device updates
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
          if (next.length &gt; 50) next.shift();
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
    devices.forEach((d) => {
      if (counts[d.sector] !== undefined) counts[d.sector] += 1;
    });
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
      if (activeSector !== "all" &amp;&amp; d.sector !== activeSector) return false;
      if (!term) return true;
      return (
        d.id.toLowerCase().includes(term) ||
        d.location.toLowerCase().includes(term) ||
        d.sector.toLowerCase().includes(term)
      );
    });
  }, [devices, activeSector, search]);

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
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useApp must be used within AppProvider");
  return ctx;
}