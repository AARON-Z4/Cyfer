import os
from dataclasses import dataclass
from typing import List, Tuple

from dotenv import load_dotenv

# Load environment variables from .env if present
load_dotenv()


def _get_list(var_name: str, default: str = "") -> Tuple[str, ...]:
	value = os.getenv(var_name, default)
	return tuple(v.strip() for v in value.split(",") if v.strip())


@dataclass(frozen=True)
class Settings:
	app_name: str = os.getenv("APP_NAME", "AI Threat Detector")
	env: str = os.getenv("ENV", "development")
	log_level: str = os.getenv("LOG_LEVEL", "INFO")

	backend_host: str = os.getenv("BACKEND_HOST", "0.0.0.0")
	backend_port: int = int(os.getenv("BACKEND_PORT", "8000"))

	cors_origins: Tuple[str, ...] = _get_list("CORS_ORIGINS", "http://localhost:5173")

	database_url: str = os.getenv("DATABASE_URL", "sqlite:///./data/threat_detector.db")

	websocket_path: str = os.getenv("WEBSOCKET_PATH", "/ws/threats")

	# Keys
	virus_total_api_key: str = os.getenv("1cd20397d55ae1b845425a1ea65c65f98046c2334f95a735bfa2072751102ae7", "")
	abuseipdb_api_key: str = os.getenv("9d1bb3c11ed902a03d5a89c60f4a1e25d0b2619de758cf17f668f2a64a01eef06ff710ff29fc115f", "")
	nvd_api_key: str = os.getenv("NVD_API_KEY", "")

	# Feeds
	phishtank_url: str = os.getenv("PHISHTANK_URL", "")
	openphish_url: str = os.getenv("OPENPHISH_URL", "")

	model_name: str = os.getenv("MODEL_NAME", "gpt-simulated")
	model_temperature: float = float(os.getenv("MODEL_TEMPERATURE", "0.0"))

	yara_rules_path: str = os.getenv("YARA_RULES_PATH", "./data/yara")


settings = Settings()
