import asyncio
import time
import logging
from collections import deque

# Configure logging
logger = logging.getLogger(__name__)


class PerformanceMonitor:
    def __init__(self, interval_seconds: int = 60):
        self.interval = interval_seconds
        self.request_latencies = deque(maxlen=1000)  # Store last 1000 latencies
        self.error_count = 0
        self.request_count = 0
        self._task = None

    def record_request(self, latency: float):
        """Records the latency of a single request."""
        self.request_latencies.append(latency)
        self.request_count += 1

    def record_error(self):
        """Increments the error counter."""
        self.error_count += 1

    async def _monitor_loop(self):
        """The background task that periodically logs performance metrics."""
        while True:
            await asyncio.sleep(self.interval)

            if not self.request_latencies:
                avg_latency = 0
                max_latency = 0
            else:
                avg_latency = sum(self.request_latencies) / len(self.request_latencies)
                max_latency = max(self.request_latencies)

            logger.info(
                f"[Performance Report] Last {self.interval}s: "
                f"Total Requests: {self.request_count}, "
                f"Avg Latency: {avg_latency:.4f}s, "
                f"Max Latency: {max_latency:.4f}s, "
                f"Errors: {self.error_count}"
            )

            # Reset counters for the next interval
            self.request_count = 0
            self.error_count = 0
            self.request_latencies.clear()

    async def start(self):
        """Starts the monitoring background task."""
        if self._task is None:
            logger.info("Starting performance monitor...")
            self._task = asyncio.create_task(self._monitor_loop())

    async def stop(self):
        """Stops the monitoring background task."""
        if self._task:
            logger.info("Stopping performance monitor...")
            self._task.cancel()
            self._task = None


# --- CORRECTED LINE: Renamed the instance to match the import request ---
quantum_performance_tracker = PerformanceMonitor()