/* Mock data and generators for Enterprise WLAN Monitor */

export const initialDevices = [
  {
    id: "AP-EDU-001",
    sector: "education",
    location: "Library Building A",
    rssi: -45,
    bandwidth: 850.5,
    clients: 23,
    errorRate: 0.8,
    temperature: 35.2,
    humidity: 60,
    status: "online",
    lastSeen: "2025-07-15T20:30:00Z",
  },
  {
    id: "AP-EDU-002",
    sector: "education",
    location: "Science Block 2F",
    rssi: -58,
    bandwidth: 420.3,
    clients: 12,
    errorRate: 1.2,
    temperature: 38.1,
    humidity: 55,
    status: "online",
    lastSeen: "2025-07-15T20:30:00Z",
  },
  {
    id: "AP-HEA-001",
    sector: "healthcare",
    location: "ER Wing North",
    rssi: -51,
    bandwidth: 760.2,
    clients: 30,
    errorRate: 0.4,
    temperature: 33.7,
    humidity: 48,
    status: "online",
    lastSeen: "2025-07-15T20:30:00Z",
  },
  {
    id: "AP-HEA-002",
    sector: "healthcare",
    location: "ICU Floor 3",
    rssi: -63,
    bandwidth: 210.8,
    clients: 9,
    errorRate: 2.3,
    temperature: 41.9,
    humidity: 50,
    status: "warning",
    lastSeen: "2025-07-15T20:29:30Z",
  },
  {
    id: "AP-LOG-001",
    sector: "logistics",
    location: "Warehouse Dock 5",
    rssi: -70,
    bandwidth: 120.0,
    clients: 6,
    errorRate: 3.8,
    temperature: 29.5,
    humidity: 72,
    status: "online",
    lastSeen: "2025-07-15T20:30:00Z",
  },
  {
    id: "AP-LOG-002",
    sector: "logistics",
    location: "Yard Sensor Hub",
    rssi: -82,
    bandwidth: 30.2,
    clients: 1,
    errorRate: 6.4,
    temperature: 47.3,
    humidity: 30,
    status: "critical",
    lastSeen: "2025-07-15T20:28:10Z",
  },
  {
    id: "AP-GOV-001",
    sector: "government",
    location: "Admin HQ East",
    rssi: -55,
    bandwidth: 540.0,
    clients: 14,
    errorRate: 0.9,
    temperature: 36.4,
    humidity: 45,
    status: "online",
    lastSeen: "2025-07-15T20:30:00Z",
  },
  {
    id: "AP-GOV-002",
    sector: "government",
    location: "Records Archive",
    rssi: -77,
    bandwidth: 80.3,
    clients: 3,
    errorRate: 4.9,
    temperature: 42.2,
    humidity: 35,
    status: "offline",
    lastSeen: "2025-07-15T20:27:10Z",
  },
  {
    id: "AP-EDU-003",
    sector: "education",
    location: "Dormitory C",
    rssi: -67,
    bandwidth: 180.7,
    clients: 11,
    errorRate: 1.9,
    temperature: 32.0,
    humidity: 52,
    status: "online",
    lastSeen: "2025-07-15T20:29:40Z",
  },
  {
    id: "AP-HEA-003",
    sector: "healthcare",
    location: "Lab 2",
    rssi: -60,
    bandwidth: 300.1,
    clients: 8,
    errorRate: 1.1,
    temperature: 34.2,
    humidity: 49,
    status: "online",
    lastSeen: "2025-07-15T20:30:00Z",
  },
  {
    id: "AP-LOG-003",
    sector: "logistics",
    location: "Conveyor Area",
    rssi: -73,
    bandwidth: 95.4,
    clients: 5,
    errorRate: 2.8,
    temperature: 37.8,
    humidity: 61,
    status: "warning",
    lastSeen: "2025-07-15T20:29:50Z",
  },
  {
    id: "AP-GOV-003",
    sector: "government",
    location: "Conference Hall",
    rssi: -52,
    bandwidth: 610.2,
    clients: 21,
    errorRate: 0.6,
    temperature: 31.8,
    humidity: 44,
    status: "online",
    lastSeen: "2025-07-15T20:30:00Z",
  },
];

export const initialAlerts = [
  {
    id: "ALR-001",
    deviceId: "AP-EDU-001",
    severity: "warning",
    message: "High temperature detected",
    timestamp: "2025-07-15T20:25:00Z",
  },
  {
    id: "ALR-002",
    deviceId: "AP-LOG-002",
    severity: "critical",
    message: "Device went offline",
    timestamp: "2025-07-15T20:26:12Z",
  },
  {
    id: "ALR-003",
    deviceId: "AP-HEA-002",
    severity: "warning",
    message: "Elevated error rate",
    timestamp: "2025-07-15T20:27:55Z",
  },
];

export function randomBetween(min, max, precision = 1) {
  const val = Math.random() * (max - min) + min;
  const p = Math.pow(10, precision);
  return Math.round(val * p) / p;
}

export function updateDeviceRandom(device) {
  const delta = () => (Math.random() > 0.5 ? 1 : -1);
  const clamp = (v, min, max) => Math.min(max, Math.max(min, v));
  const rssi = clamp(device.rssi + delta() * randomBetween(0, 3, 0), -90, -30);
  const bandwidth = clamp(device.bandwidth + delta() * randomBetween(5, 60, 1), 0, 1000);
  const clients = clamp(device.clients + delta() * randomBetween(0, 3, 0), 0, 200);
  const errorRate = clamp(device.errorRate + delta() * randomBetween(0, 0.6, 1), 0, 20);
  const temperature = clamp(device.temperature + delta() * randomBetween(0, 1.5, 1), 15, 80);
  const status = rssi &lt; -80 || errorRate &gt; 5 || bandwidth &lt; 20 ? (Math.random() &gt; 0.7 ? "offline" : "critical") : device.status === "offline" &amp;&amp; Math.random() &gt; 0.5 ? "online" : device.status;
  return {
    ...device,
    rssi,
    bandwidth,
    clients,
    errorRate,
    temperature,
    lastSeen: new Date().toISOString(),
    status,
  };
}

export function generateRandomAlert(devices) {
  const d = devices[Math.floor(Math.random() * devices.length)];
  const severities = ["info", "warning", "critical"];
  const severity = severities[Math.floor(Math.random() * severities.length)];
  const messages = {
    info: "Client association spike",
    warning: "High temperature detected",
    critical: "Device went offline",
  };
  return {
    id: `ALR-${Math.random().toString(36).slice(2, 7).toUpperCase()}`,
    deviceId: d.id,
    severity,
    message: messages[severity],
    timestamp: new Date().toISOString(),
  };
}