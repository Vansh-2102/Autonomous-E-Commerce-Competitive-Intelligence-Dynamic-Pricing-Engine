import asyncio
import json
import logging
from typing import List
from fastapi import APIRouter, WebSocket, WebSocketDisconnect
import redis.asyncio as aioredis

from app.core.config import settings

logger = logging.getLogger(__name__)
router = APIRouter(tags=["websockets"])

class ConnectionManager:
    def __init__(self):
        self.active_connections: List[WebSocket] = []

    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.append(websocket)
        logger.info(f"WebSocket client connected. Total clients: {len(self.active_connections)}")

    def disconnect(self, websocket: WebSocket):
        if websocket in self.active_connections:
            self.active_connections.remove(websocket)
            logger.info(f"WebSocket client disconnected. Remaining clients: {len(self.active_connections)}")

    async def broadcast(self, message: str):
        for connection in self.active_connections:
            try:
                await connection.send_text(message)
            except Exception as e:
                logger.error(f"Error broadcasting message to client: {e}")

manager = ConnectionManager()

@router.websocket("/ws/pricing-feed")
async def pricing_feed(websocket: WebSocket):
    await manager.connect(websocket)
    try:
        # Subscribe to Redis Pub/Sub channel
        r = aioredis.from_url(settings.REDIS_URL, decode_responses=True)
        pubsub = r.pubsub()
        await pubsub.subscribe("pricing_updates")

        async def listen_redis():
            async for message in pubsub.listen():
                if message and message["type"] == "message":
                    data = message["data"]
                    await manager.broadcast(data)

        # Start Redis subscriber background listener
        listen_task = asyncio.create_task(listen_redis())

        try:
            while True:
                # Keep connection open and accept ping/heartbeat from client
                data = await websocket.receive_text()
                if data == "ping":
                    await websocket.send_text(json.dumps({"type": "pong"}))
        except WebSocketDisconnect:
            manager.disconnect(websocket)
            listen_task.cancel()
        except Exception as e:
            logger.error(f"WebSocket connection error: {e}")
            manager.disconnect(websocket)
            listen_task.cancel()
    except Exception as err:
        logger.warning(f"Could not connect Redis pubsub, running direct WebSocket mode: {err}")
        try:
            while True:
                msg = await websocket.receive_text()
                if msg == "ping":
                    await websocket.send_text(json.dumps({"type": "pong"}))
        except WebSocketDisconnect:
            manager.disconnect(websocket)
