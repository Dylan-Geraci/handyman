"""
File-backed cache for Gemini AI responses.

In DEMO_MODE, a cache miss returns None instead of calling the live API,
so the demo never waits on the network or rate limits.
"""

import hashlib
import json
import os
import threading
from typing import Optional

from config import DEMO_MODE

CACHE_DIR = os.path.join(os.path.dirname(os.path.dirname(__file__)), "data")
CACHE_FILE = os.path.join(CACHE_DIR, "gemini_cache.json")

_lock = threading.Lock()
_cache: Optional[dict] = None


def _load() -> dict:
    global _cache
    if _cache is not None:
        return _cache
    if os.path.exists(CACHE_FILE):
        try:
            with open(CACHE_FILE, "r", encoding="utf-8") as f:
                _cache = json.load(f)
        except Exception:
            _cache = {}
    else:
        _cache = {}
    return _cache


def _persist() -> None:
    if _cache is None:
        return
    os.makedirs(CACHE_DIR, exist_ok=True)
    with open(CACHE_FILE, "w", encoding="utf-8") as f:
        json.dump(_cache, f, indent=2)


def make_key(namespace: str, payload: str) -> str:
    digest = hashlib.sha256(payload.encode("utf-8")).hexdigest()[:16]
    return f"{namespace}:{digest}"


def get(key: str):
    with _lock:
        return _load().get(key)


def set(key: str, value) -> None:
    with _lock:
        _load()[key] = value
        _persist()


def is_demo_mode() -> bool:
    return DEMO_MODE
