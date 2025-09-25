from fastapi import APIRouter, UploadFile, File, Depends
from pydantic import BaseModel, HttpUrl
from typing import Any, Dict
from sqlalchemy.ext.asyncio import AsyncSession

from utils.logger import logger
from agents.url_analyzer import URLThreatAnalyzer
from agents.device_scanner import DeviceSecurityScanner
from agents.network_monitor import NetworkTrafficMonitor
from agents.file_detector import FileThreatDetector
from agents.vuln_assessment import VulnerabilityAssessmentAgent
from models.base import ScanResult
from utils.db import get_db
from utils.cache import cache
from api.websocket import ws_manager

api_router = APIRouter()


class URLScanRequest(BaseModel):
	url: HttpUrl


class ScanResponse(BaseModel):
	agent: str
	result: Dict[str, Any]


async def _save_result(db: AsyncSession, agent: str, category: str, threat_level: str, metadata: dict) -> None:
	obj = ScanResult(agent=agent, category=category, threat_level=threat_level, details=metadata)
	db.add(obj)
	await db.commit()


@api_router.post("/scan/url", response_model=ScanResponse)
async def scan_url(payload: URLScanRequest, db: AsyncSession = Depends(get_db)) -> ScanResponse:
	logger.info(f"Scanning URL: {payload.url}")
	cached = cache.get(f"url:{payload.url}")
	if cached:
		return {"agent": "URLThreatAnalyzer", "result": cached}
	agent = URLThreatAnalyzer()
	result = await agent.analyze_url(str(payload.url))
	await _save_result(db, agent.name, "url", result.get("threat_level", "low"), result)
	cache.set(f"url:{payload.url}", result, ttl=60)
	await ws_manager.broadcast({"type": "url_scan", "data": result})
	return {"agent": agent.name, "result": result}


@api_router.post("/scan/device", response_model=ScanResponse)
async def scan_device(db: AsyncSession = Depends(get_db)) -> ScanResponse:
	agent = DeviceSecurityScanner()
	result = await agent.assess_device()
	await _save_result(db, agent.name, "device", result.get("threat_level", "low"), result)
	await ws_manager.broadcast({"type": "device_scan", "data": result})
	return {"agent": agent.name, "result": result}


@api_router.post("/scan/network", response_model=ScanResponse)
async def scan_network(db: AsyncSession = Depends(get_db)) -> ScanResponse:
	agent = NetworkTrafficMonitor()
	result = await agent.inspect_network()
	await _save_result(db, agent.name, "network", result.get("threat_level", "low"), result)
	await ws_manager.broadcast({"type": "network_scan", "data": result})
	return {"agent": agent.name, "result": result}


class FileScanResponse(ScanResponse):
	pass


@api_router.post("/scan/file", response_model=FileScanResponse)
async def scan_file(file: UploadFile = File(...), db: AsyncSession = Depends(get_db)) -> FileScanResponse:
	content = await file.read()
	agent = FileThreatDetector()
	result = await agent.scan_bytes(content, filename=file.filename)
	await _save_result(db, agent.name, "file", result.get("threat_level", "low"), result)
	await ws_manager.broadcast({"type": "file_scan", "data": result})
	return {"agent": agent.name, "result": result}


class AgentStatusItem(BaseModel):
	name: str
	status: str


class AgentsStatusResponse(BaseModel):
	agents: list[AgentStatusItem]


@api_router.get("/agents/status", response_model=AgentsStatusResponse)
async def agents_status() -> AgentsStatusResponse:
	return {
		"agents": [
			{"name": "URLThreatAnalyzer", "status": "ready"},
			{"name": "DeviceSecurityScanner", "status": "ready"},
			{"name": "NetworkTrafficMonitor", "status": "ready"},
			{"name": "FileThreatDetector", "status": "ready"},
			{"name": "VulnerabilityAssessmentAgent", "status": "ready"},
		]
	}
