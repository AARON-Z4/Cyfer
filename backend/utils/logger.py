import logging
import sys

from .config import settings


def setup_logger() -> logging.Logger:
	logger = logging.getLogger(settings.app_name)
	level = getattr(logging, settings.log_level.upper(), logging.INFO)
	logger.setLevel(level)

	if not logger.handlers:
		handler = logging.StreamHandler(sys.stdout)
		formatter = logging.Formatter(
			"%(asctime)s | %(levelname)s | %(name)s | %(message)s"
		)
		handler.setFormatter(formatter)
		logger.addHandler(handler)

	logger.propagate = False
	return logger


logger = setup_logger()
