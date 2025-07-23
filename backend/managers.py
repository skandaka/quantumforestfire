"""
Global managers for the Quantum Fire Prediction System.
This file helps prevent circular imports.
Location: backend/managers.py
"""

from typing import Optional, List
from fastapi import WebSocket

# These will be initialized in main.py during the application lifespan startup.
data_manager = None
quantum_manager = None
classiq_manager = None
performance_monitor = None
active_websockets: List[WebSocket] = []