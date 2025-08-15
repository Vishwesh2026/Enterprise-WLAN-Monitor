import pytest
from httpx import AsyncClient
import sys, os
os.environ["USE_INMEM_DB"] = "1"
sys.path.append(os.path.dirname(os.path.dirname(__file__)))
from server import app


@pytest.fixture
def anyio_backend():
    return "asyncio"


@pytest.mark.anyio
async def test_root_ok():
    async with AsyncClient(app=app, base_url="http://test") as ac:
        r = await ac.get("/api/")
        assert r.status_code == 200
        assert r.json().get("message") == "Hello World"


@pytest.mark.anyio
async def test_devices_flow():
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
    async with AsyncClient(app=app, base_url="http://test") as ac:
        r = await ac.post("/api/devices", json=payload)
        assert r.status_code in (200, 201)
        r = await ac.get("/api/devices")
        assert r.status_code == 200
        assert any(d["id"] == "TEST-1" for d in r.json())
        r = await ac.get("/api/sectors/education/devices")
        assert r.status_code == 200
        assert any(d["id"] == "TEST-1" for d in r.json())


@pytest.mark.anyio
async def test_alerts_bulk():
    alerts = [
        {"id": "ALR-T1", "deviceId": "TEST-1", "severity": "info", "message": "test", "timestamp": "2025-07-15T20:30:00Z"}
    ]
    async with AsyncClient(app=app, base_url="http://test") as ac:
        r = await ac.post("/api/alerts/bulk", json={"alerts": alerts})
        assert r.status_code in (200, 201)
        r = await ac.get("/api/alerts", params={"deviceId": "TEST-1"})
        assert r.status_code == 200
        assert any(a["id"] == "ALR-T1" for a in r.json())