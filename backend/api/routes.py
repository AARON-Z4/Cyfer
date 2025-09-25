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
from api.websocket import ThreatWebSocketManager

api_router = APIRouter()
ws_manager = ThreatWebSocketManager()


class URLScanRequest(BaseModel):
	url: HttpUrl


async def _save_result(db: AsyncSession, agent: str, category: str, threat_level: str, metadata: dict) -> None:
	obj = ScanResult(agent=agent, category=category, threat_level=threat_level, metadata=metadata)
	db.add(obj)
	await db.commit()


@api_router.post("/scan/url")
async def scan_url(payload: URLScanRequest, db: AsyncSession = Depends(get_db)) -> Dict[str, Any]:
	logger.info(f"Scanning URL: {payload.url}")
	agent = URLThreatAnalyzer()
	result = await agent.analyze_url(str(payload.url))
	await _save_result(db, agent.name, "url", result.get("threat_level", "low"), result)
	await ws_manager.broadcast({"type": "url_scan", "data": result})
	return {"agent": agent.name, "result": result}


@api_router.post("/scan/device")
async def scan_device(db: AsyncSession = Depends(get_db)) -> Dict[str, Any]:
	agent = DeviceSecurityScanner()
	result = await agent.assess_device()
	await _save_result(db, agent.name, "device", result.get("threat_level", "low"), result)
	await ws_manager.broadcast({"type": "device_scan", "data": result})
	return {"agent": agent.name, "result": result}


@api_router.post("/scan/network")
async def scan_network(db: AsyncSession = Depends(get_db)) -> Dict[str, Any]:
	agent = NetworkTrafficMonitor()
	result = await agent.inspect_network()
	await _save_result(db, agent.name, "network", result.get("threat_level", "low"), result)
	await ws_manager.broadcast({"type": "network_scan", "data": result})
	return {"agent": agent.name, "result": result}


@api_router.post("/scan/file")
async def scan_file(file: UploadFile = File(...), db: AsyncSession = Depends(get_db)) -> Dict[str, Any]:
	content = await file.read()
	agent = FileThreatDetector()
	result = await agent.scan_bytes(content, filename=file.filename)
	await _save_result(db, agent.name, "file", result.get("threat_level", "low"), result)
	await ws_manager.broadcast({"type": "file_scan", "data": result})
	return {"agent": agent.name, "result": result}


@api_router.get("/agents/status")
async def agents_status() -> Dict[str, Any]:
	return {
		"agents": [
			{"name": "URLThreatAnalyzer", "status": "ready"},
			{"name": "DeviceSecurityScanner", "status": "ready"},
			{"name": "NetworkTrafficMonitor", "status": "ready"},
			{"name": "FileThreatDetector", "status": "ready"},
			{"name": "VulnerabilityAssessmentAgent", "status": "ready"},
		]
	}
