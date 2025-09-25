from fastapi import FastAPI, WebSocket
from fastapi.middleware.cors import CORSMiddleware
from fastapi import WebSocketDisconnect

from utils.config import settings
from utils.logger import logger
from utils.db import init_db

# Routers and WS
from api.routes import api_router
from api.websocket import ws_manager

app = FastAPI(title=settings.app_name)

# CORS
app.add_middleware(
	CORSMiddleware,
	allow_origins=list(settings.cors_origins),
	allow_credentials=True,
	allow_methods=["*"],
	allow_headers=["*"],
)

# Include API routes
app.include_router(api_router, prefix="/api")


@app.on_event("startup")
async def on_startup() -> None:
	await init_db()
	logger.info("Application startup complete")


@app.websocket(settings.websocket_path)
async def websocket_endpoint(websocket: WebSocket):
	await ws_manager.connect(websocket)
	logger.info("WebSocket client connected")
	try:
		while True:
			await websocket.receive_text()
	except WebSocketDisconnect:
		ws_manager.disconnect(websocket)
		logger.info("WebSocket client disconnected")


@app.get("/")
async def root():
	return {"app": settings.app_name, "status": "ok"}


if __name__ == "__main__":
	import uvicorn

	uvicorn.run(
		"main:app",
		host=settings.backend_host,
		port=settings.backend_port,
		reload=settings.env == "development",
	)
