from fastapi import FastAPI, APIRouter, HTTPException
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
import uuid
from datetime import datetime


ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# Create the main app without a prefix
app = FastAPI()

# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")


# ---- Models ----
class StatusCheck(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    client_name: str
    timestamp: datetime = Field(default_factory=datetime.utcnow)

class StatusCheckCreate(BaseModel):
    client_name: str


class DeviceBase(BaseModel):
    id: str
    sector: str
    location: str
    rssi: float
    bandwidth: float
    clients: int
    errorRate: float
    temperature: float
    humidity: Optional[float] = None
    status: str
    lastSeen: datetime

class DeviceCreate(DeviceBase):
    pass

class Device(DeviceBase):
    pass

class AlertBase(BaseModel):
    id: str
    deviceId: str
    severity: str
    message: str
    timestamp: datetime

class AlertCreate(AlertBase):
    pass

class Alert(AlertBase):
    pass


# ---- Helpers ----
async def get_device_or_404(device_id: str) -> Dict[str, Any]:
    doc = await db.devices.find_one({"id": device_id})
    if not doc:
        raise HTTPException(status_code=404, detail="Device not found")
    return doc


# ---- Routes ----
@api_router.get("/")
async def root():
    return {"message": "Hello World"}


@api_router.post("/status", response_model=StatusCheck)
async def create_status_check(input: StatusCheckCreate):
    status_dict = input.dict()
    status_obj = StatusCheck(**status_dict)
    _ = await db.status_checks.insert_one(status_obj.dict())
    return status_obj

@api_router.get("/status", response_model=List[StatusCheck])
async def get_status_checks():
    status_checks = await db.status_checks.find().to_list(1000)
    return [StatusCheck(**status_check) for status_check in status_checks]


# Devices
@api_router.get("/devices", response_model=List[Device])
async def list_devices(sector: Optional[str] = None):
    query: Dict[str, Any] = {}
    if sector and sector != "all":
        query["sector"] = sector
    docs = await db.devices.find(query).to_list(2000)
    return [Device(**d) for d in docs]


@api_router.get("/sectors/{sector}/devices", response_model=List[Device])
async def list_devices_by_sector(sector: str):
    docs = await db.devices.find({"sector": sector}).to_list(2000)
    return [Device(**d) for d in docs]


@api_router.post("/devices", response_model=Device, status_code=201)
async def create_device(dev: DeviceCreate):
    await db.devices.update_one({"id": dev.id}, {"$set": dev.dict()}, upsert=True)
    return dev


@api_router.post("/devices/bulk", response_model=List[Device], status_code=201)
async def bulk_devices(payload: Dict[str, List[DeviceCreate]]):
    items = payload.get("devices", [])
    if not items:
        return []
    # upsert each (simple, safe for first pass)
    for it in items:
        await db.devices.update_one({"id": it.id}, {"$set": it.dict()}, upsert=True)
    docs = await db.devices.find({"id": {"$in": [it.id for it in items]}}).to_list(2000)
    return [Device(**d) for d in docs]


@api_router.get("/devices/{device_id}", response_model=Device)
async def get_device(device_id: str):
    doc = await get_device_or_404(device_id)
    return Device(**doc)


@api_router.patch("/devices/{device_id}", response_model=Device)
async def update_device(device_id: str, patch: Dict[str, Any]):
    _ = await db.devices.update_one({"id": device_id}, {"$set": patch})
    doc = await get_device_or_404(device_id)
    return Device(**doc)


# Alerts
@api_router.get("/alerts", response_model=List[Alert])
async def list_alerts(deviceId: Optional[str] = None):
    query: Dict[str, Any] = {"deviceId": deviceId} if deviceId else {}
    docs = await db.alerts.find(query).to_list(2000)
    return [Alert(**d) for d in docs]


@api_router.post("/alerts", response_model=Alert, status_code=201)
async def create_alert(alert: AlertCreate):
    await db.alerts.update_one({"id": alert.id}, {"$set": alert.dict()}, upsert=True)
    return alert


@api_router.post("/alerts/bulk", response_model=List[Alert], status_code=201)
async def bulk_alerts(payload: Dict[str, List[AlertCreate]]):
    items = payload.get("alerts", [])
    if not items:
        return []
    for it in items:
        await db.alerts.update_one({"id": it.id}, {"$set": it.dict()}, upsert=True)
    docs = await db.alerts.find({"id": {"$in": [it.id for it in items]}}).to_list(2000)
    return [Alert(**d) for d in docs]


# Include the router in the main app
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()