"""
SSL Certificate Helpers for External API Connections
Location: backend/utils/ssl_helpers.py
"""

import logging
import ssl
import certifi
import aiohttp
from typing import Optional, Dict, Any

logger = logging.getLogger(__name__)

def create_ssl_context() -> ssl.SSLContext:
    """
    Create an SSL context with proper certificate verification
    using the certifi certificate bundle.
    """
    ssl_context = ssl.create_default_context(cafile=certifi.where())
    return ssl_context

async def create_verified_session(
    headers: Optional[Dict[str, str]] = None,
    timeout: int = 30
) -> aiohttp.ClientSession:
    """
    Create an aiohttp ClientSession with proper SSL verification

    Args:
        headers: Optional headers to include in all requests
        timeout: Connection timeout in seconds

    Returns:
        aiohttp.ClientSession: Configured session with SSL verification
    """
    if headers is None:
        headers = {'User-Agent': 'QuantumFirePrediction/1.0'}

    ssl_context = create_ssl_context()

    connector = aiohttp.TCPConnector(
        ssl=ssl_context,
        limit=100,  # Connection pool size
        ttl_dns_cache=300,  # DNS cache TTL in seconds
        enable_cleanup_closed=True  # Clean up closed connections
    )

    timeout_obj = aiohttp.ClientTimeout(
        total=timeout,
        connect=10,
        sock_connect=10,
        sock_read=30
    )

    session = aiohttp.ClientSession(
        connector=connector,
        timeout=timeout_obj,
        headers=headers
    )

    logger.debug("Created aiohttp session with verified SSL context")
    return session
