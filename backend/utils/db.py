from typing import AsyncGenerator
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy import event
import os

from .config import settings
from utils.logger import logger
from models.base import Base


def _make_async_url(sync_url: str) -> str:
	# Convert sqlite:///./foo.db to sqlite+aiosqlite:///./foo.db
	if sync_url.startswith("sqlite:///"):
		return sync_url.replace("sqlite:///", "sqlite+aiosqlite:///", 1)
	return sync_url


ASYNC_DATABASE_URL = _make_async_url(settings.database_url)
engine = create_async_engine(ASYNC_DATABASE_URL, echo=False, future=True)
SessionLocal: async_sessionmaker[AsyncSession] = async_sessionmaker(
	bind=engine,
	expire_on_commit=False,
	autoflush=False,
	autocommit=False,
)


async def init_db() -> None:
	async with engine.begin() as conn:
		await conn.run_sync(Base.metadata.create_all)
	logger.info("Database initialized")


async def get_db() -> AsyncGenerator[AsyncSession, None]:
	async with SessionLocal() as session:
		yield session
