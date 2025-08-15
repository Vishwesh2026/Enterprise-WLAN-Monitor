from fastapi.testclient import TestClient
from server import app

client = TestClient(app)


def test_root_ok():
    r = client.get("/api/")
    assert r.status_code == 200
    assert r.json().get("message") == "Hello World"


def test_devices_flow():
    # create one
    payload = {
        "id": "TEST-1",
        "sector": "education",
        "location": "Test Lab",
        "rssi": -50,
        "bandwidth": 100.5,
        "clients": 5,
        "errorRate": 0.3,
        "temperature": 30.0,
        "humidity": 40.0,
        "status": "online",
        "lastSeen": "2025-07-15T20:30:00Z",
    }
    r = client.post("/api/devices", json=payload)
    assert r.status_code in (200, 201)
    # list
    r = client.get("/api/devices")
    assert r.status_code == 200
    assert any(d["id"] == "TEST-1" for d in r.json())
    # sector filter
    r = client.get("/api/sectors/education/devices")
    assert r.status_code == 200
    assert any(d["id"] == "TEST-1" for d in r.json())


def test_alerts_bulk():
    alerts = [
        {"id": "ALR-T1", "deviceId": "TEST-1", "severity": "info", "message": "test", "timestamp": "2025-07-15T20:30:00Z"}
    ]
    r = client.post("/api/alerts/bulk", json={"alerts": alerts})
    assert r.status_code in (200, 201)
    r = client.get("/api/alerts", params={"deviceId": "TEST-1"})
    assert r.status_code == 200
    assert any(a["id"] == "ALR-T1" for a in r.json())