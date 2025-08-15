# API Contracts – Enterprise WLAN Health Monitor

Purpose: Define stable backend contracts, mock-to-real mapping, backend scope, and integration plan.

A) REST API Contracts (all prefixed with /api)
1) GET /api/devices
   - Query: optional sector (string)
   - Response: 200 OK [{ id, sector, location, rssi, bandwidth, clients, errorRate, temperature, humidity, status, lastSeen }]

2) GET /api/sectors/{sector}/devices
   - Path: sector in [education, healthcare, logistics, government]
   - Response: 200 OK same as #1

3) POST /api/devices
   - Body: { id, sector, location, rssi, bandwidth, clients, errorRate, temperature, humidity, status, lastSeen }
   - Response: 201 Created { ...device }

4) POST /api/devices/bulk
   - Body: { devices: [DeviceCreate, ...] }
   - Response: 201 Created [Device, ...]

5) GET /api/devices/{device_id}
   - Response: 200 OK { ...device } or 404

6) PATCH /api/devices/{device_id}
   - Body: Partial fields to update
   - Response: 200 OK { ...device }

7) GET /api/alerts
   - Query: optional deviceId (string)
   - Response: 200 OK [{ id, deviceId, severity, message, timestamp }]

8) POST /api/alerts
   - Body: { id, deviceId, severity, message, timestamp }
   - Response: 201 Created { ...alert }

9) POST /api/alerts/bulk
   - Body: { alerts: [AlertCreate, ...] }
   - Response: 201 Created [Alert, ...]

Notes:
- All timestamps are ISO8601 strings (UTC).
- All ids are app-level strings (we also store Mongo _id but do not expose it).
- CORS enabled. All routes must remain under /api per ingress.

B) Data mocked in frontend/src/mock.js (to be replaced by backend data)
- devices: array of 12 sample devices across sectors
- alerts: array of 3 initial alerts
- updateDeviceRandom() and generateRandomAlert() are mock realtime simulators for UI only

C) Backend Implementation Scope
- MongoDB collections: devices, alerts, status_checks (existing)
- Pydantic models for Device, Alert with validation
- CRUD endpoints as listed above
- Optional: simple summary counts (not required for first pass)

D) Frontend Integration Plan
1) Add utils/api.js → axios instance with baseURL `${process.env.REACT_APP_BACKEND_URL}/api`.
2) In AppContext:
   - On mount: fetch /devices and /alerts. If non-empty, use backend data; else keep mock state.
   - Add syncMocksToBackend(): POST /devices/bulk and /alerts/bulk with current mock state, then refetch.
   - Expose syncMocksToBackend in context. Hook settings menu action to call it.
3) Keep mock realtime animations for UX until websocket is implemented.
4) When ready, replace useWebSocketMock with real Socket.IO client and server (separate play).

E) Testing
- Add pytest tests to verify: create + list devices, filter by sector, bulk insert alerts.
- Do not use curl per platform rule.

This contracts.md is the single source of truth for the first backend iteration and FE-BE wiring.