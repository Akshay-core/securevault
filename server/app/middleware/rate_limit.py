"""
rate_limit.py

Simple in-process rate limiter. For production, replace with Redis-backed
rate limiting (e.g. slowapi + redis) to work across multiple instances.

Current limits:
- Auth endpoints: 10 req/min per IP (brute-force protection)
- General: 120 req/min per IP
"""

import time
from collections import defaultdict
from fastapi import Request, Response
from starlette.middleware.base import BaseHTTPMiddleware


class RateLimitMiddleware(BaseHTTPMiddleware):
    def __init__(self, app, auth_limit: int = 10, general_limit: int = 120):
        super().__init__(app)
        self.auth_limit = auth_limit
        self.general_limit = general_limit
        self._buckets: dict[str, list[float]] = defaultdict(list)

    async def dispatch(self, request: Request, call_next) -> Response:
        ip = request.client.host if request.client else "unknown"
        path = request.url.path

        is_auth_route = path.startswith("/api/auth/login") or path.startswith("/api/auth/register")
        limit = self.auth_limit if is_auth_route else self.general_limit
        key = f"{ip}:{'auth' if is_auth_route else 'general'}"

        now = time.time()
        window_start = now - 60

        # Prune old entries
        self._buckets[key] = [t for t in self._buckets[key] if t > window_start]

        if len(self._buckets[key]) >= limit:
            return Response(
                content='{"detail":"Too many requests. Slow down."}',
                status_code=429,
                media_type="application/json",
                headers={"Retry-After": "60"},
            )

        self._buckets[key].append(now)
        return await call_next(request)
