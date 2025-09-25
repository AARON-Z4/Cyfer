from fastapi import FastAPI, WebSocket, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi import WebSocketDisconnect
from fastapi.responses import JSONResponse
from fastapi.exceptions import RequestValidationError
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.concurrency import iterate_in_threadpool
from contextlib import asynccontextmanager
import asyncio
import time
from sqlalchemy.exc import SQLAlchemyError
import uuid

from utils.config import settings
from utils.logger import logger
from utils.db import init_db, dispose_engine

# Routers and WS
from api.routes import api_router
from api.websocket import ws_manager
import contextlib



@asynccontextmanager
async def lifespan(app: FastAPI):
    await init_db()
    logger.info("Application startup complete (lifespan)")

    # Periodic WS heartbeat
    async def heartbeat_loop():
        while True:
            try:
                await ws_manager.heartbeat()
            except Exception:
                logger.warning("Heartbeat tick failed", exc_info=True)
            await asyncio.sleep(30)

    heartbeat_task = asyncio.create_task(heartbeat_loop())
    try:
        yield
    finally:
        heartbeat_task.cancel()
        with contextlib.suppress(Exception):
            await heartbeat_task
        await dispose_engine()
        logger.info("Application shutdown complete")


app = FastAPI(title=settings.app_name, lifespan=lifespan)

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


# Startup handled by lifespan


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


@app.get("/healthz")
async def healthz():
    return {"status": "ok"}


@app.get("/readyz")
async def readyz():
    return {"status": "ready"}


# ---------------- Middleware -----------------

class RequestResponseLoggerMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        start = time.perf_counter()
        request_id = str(uuid.uuid4())
        request.state.request_id = request_id
        try:
            response = await call_next(request)
        except Exception as exc:
            duration_ms = int((time.perf_counter() - start) * 1000)
            logger.exception(f"HTTP {request.method} {request.url.path} failed in {duration_ms}ms: {exc}")
            raise
        duration_ms = int((time.perf_counter() - start) * 1000)
        logger.info(f"HTTP {request.method} {request.url.path} -> {response.status_code} in {duration_ms}ms")
        response.headers["X-Request-ID"] = request_id
        return response


class RateLimitMiddleware(BaseHTTPMiddleware):
    def __init__(self, app: FastAPI, rate_per_minute: int = 60) -> None:
        super().__init__(app)
        self.tokens: dict[str, tuple[int, float]] = {}
        self.capacity = rate_per_minute
        self.refill_rate = rate_per_minute / 60.0

    async def dispatch(self, request: Request, call_next):
        client_ip = request.client.host if request.client else "unknown"
        now = time.time()
        tokens, last = self.tokens.get(client_ip, (self.capacity, now))
        # Refill
        tokens = min(self.capacity, tokens + (now - last) * self.refill_rate)
        if tokens < 1:
            return JSONResponse({"detail": "Rate limit exceeded"}, status_code=429)
        self.tokens[client_ip] = (tokens - 1, now)
        return await call_next(request)


app.add_middleware(RequestResponseLoggerMiddleware)
app.add_middleware(RateLimitMiddleware)


# --------------- Exception Handlers ----------------

@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError):
    return JSONResponse({"error": "validation_error", "detail": exc.errors()}, status_code=422)


@app.exception_handler(SQLAlchemyError)
async def sqlalchemy_exception_handler(request: Request, exc: SQLAlchemyError):
    logger.exception("Database error")
    return JSONResponse({"error": "database_error"}, status_code=500)


@app.exception_handler(Exception)
async def unhandled_exception_handler(request: Request, exc: Exception):
    logger.exception("Unhandled error")
    return JSONResponse({"error": "internal_server_error"}, status_code=500)


if __name__ == "__main__":
    import os
    import uvicorn

    # Disable reload on Windows to avoid multiprocessing/reloader crashes
    enable_reload = settings.env == "development" and os.name != "nt"

    uvicorn.run(
        "main:app",
        host=settings.backend_host,
        port=settings.backend_port,
        reload=enable_reload,
    )
