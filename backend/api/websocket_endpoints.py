"""
WebSocket API endpoints for real-time data streaming
"""
import uuid
import json
import logging
from datetime import datetime
from typing import Optional, Dict, Any
from fastapi import APIRouter, WebSocket, WebSocketDisconnect, Query, Depends
from fastapi.responses import HTMLResponse
from pydantic import BaseModel

from utils.websocket_manager import connection_manager, streaming_manager

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/ws", tags=["websocket"])

class SubscriptionRequest(BaseModel):
    """WebSocket subscription request"""
    action: str  # "subscribe" or "unsubscribe"
    channel: str
    
class ClientInfo(BaseModel):
    """Client connection information"""
    user_agent: Optional[str] = None
    client_type: Optional[str] = "web"
    location: Optional[str] = None

@router.websocket("/connect")
async def websocket_endpoint(
    websocket: WebSocket,
    client_type: str = Query(default="web"),
    client_id: Optional[str] = Query(default=None)
):
    """Main WebSocket connection endpoint"""
    connection_id = client_id or str(uuid.uuid4())
    
    client_info = {
        "client_type": client_type,
        "user_agent": websocket.headers.get("user-agent"),
        "client_id": client_id
    }
    
    # Establish connection
    connected = await connection_manager.connect(websocket, connection_id, client_info)
    if not connected:
        return
    
    # Start streaming if this is the first connection
    if len(connection_manager.active_connections) == 1:
        await streaming_manager.start_streaming()
    
    try:
        while True:
            # Receive messages from client
            data = await websocket.receive_text()
            
            try:
                message = json.loads(data)
                await handle_client_message(connection_id, message)
            except json.JSONDecodeError:
                error_response = {
                    "type": "error",
                    "message": "Invalid JSON format",
                    "timestamp": datetime.utcnow().isoformat()
                }
                await connection_manager.send_personal_message(error_response, connection_id)
            except Exception as e:
                logger.error(f"Error handling message from {connection_id}: {e}")
                error_response = {
                    "type": "error", 
                    "message": f"Internal error: {str(e)}",
                    "timestamp": datetime.utcnow().isoformat()
                }
                await connection_manager.send_personal_message(error_response, connection_id)
                
    except WebSocketDisconnect:
        connection_manager.disconnect(connection_id)
        logger.info(f"Client {connection_id} disconnected")
        
        # Stop streaming if no more connections
        if len(connection_manager.active_connections) == 0:
            await streaming_manager.stop_streaming()

async def handle_client_message(connection_id: str, message: Dict[str, Any]):
    """Handle incoming messages from WebSocket clients"""
    message_type = message.get("type")
    
    if message_type == "ping":
        # Respond to ping with pong
        pong_response = {
            "type": "pong",
            "timestamp": datetime.utcnow().isoformat()
        }
        await connection_manager.send_personal_message(pong_response, connection_id)
        
    elif message_type == "subscribe":
        channel = message.get("channel")
        if channel:
            success = await connection_manager.subscribe(connection_id, channel)
            response = {
                "type": "subscription_response",
                "action": "subscribe",
                "channel": channel,
                "success": success,
                "timestamp": datetime.utcnow().isoformat()
            }
            await connection_manager.send_personal_message(response, connection_id)
        
    elif message_type == "unsubscribe":
        channel = message.get("channel")
        if channel:
            success = await connection_manager.unsubscribe(connection_id, channel)
            response = {
                "type": "subscription_response",
                "action": "unsubscribe", 
                "channel": channel,
                "success": success,
                "timestamp": datetime.utcnow().isoformat()
            }
            await connection_manager.send_personal_message(response, connection_id)
            
    elif message_type == "get_stats":
        stats = connection_manager.get_connection_stats()
        response = {
            "type": "stats_response",
            "data": stats,
            "timestamp": datetime.utcnow().isoformat()
        }
        await connection_manager.send_personal_message(response, connection_id)
        
    elif message_type == "custom_request":
        # Handle custom client requests
        request_data = message.get("data", {})
        response_data = await handle_custom_request(request_data)
        response = {
            "type": "custom_response",
            "data": response_data,
            "timestamp": datetime.utcnow().isoformat()
        }
        await connection_manager.send_personal_message(response, connection_id)
        
    else:
        error_response = {
            "type": "error",
            "message": f"Unknown message type: {message_type}",
            "timestamp": datetime.utcnow().isoformat()
        }
        await connection_manager.send_personal_message(error_response, connection_id)

async def handle_custom_request(request_data: Dict[str, Any]) -> Dict[str, Any]:
    """Handle custom client requests"""
    request_type = request_data.get("type")
    
    if request_type == "fire_prediction":
        # Handle custom fire prediction request
        location = request_data.get("location", {})
        time_horizon = request_data.get("time_horizon", 24)
        
        # Simulate prediction response
        prediction_result = {
            "location": location,
            "time_horizon": time_horizon,
            "risk_level": "medium",
            "probability": 0.65,
            "quantum_processed": True,
            "confidence": 0.89,
            "factors": [
                {"name": "weather", "contribution": 0.4},
                {"name": "terrain", "contribution": 0.3}, 
                {"name": "historical", "contribution": 0.3}
            ]
        }
        return {"prediction": prediction_result}
        
    elif request_type == "quantum_metrics":
        # Return current quantum processing metrics
        return {
            "entanglement_strength": 0.85,
            "coherence_time": 125.3,
            "fidelity": 0.94,
            "quantum_advantage": 2.3
        }
        
    else:
        return {"error": f"Unknown request type: {request_type}"}

@router.get("/stats")
async def get_websocket_stats():
    """Get current WebSocket connection statistics"""
    return connection_manager.get_connection_stats()

@router.post("/broadcast/{channel}")
async def broadcast_message(channel: str, message: Dict[str, Any]):
    """Broadcast a message to all subscribers of a channel (admin endpoint)"""
    broadcast_msg = {
        "type": "admin_broadcast",
        "channel": channel,
        "data": message,
        "timestamp": datetime.utcnow().isoformat(),
        "source": "admin_api"
    }
    
    await connection_manager.broadcast_to_channel(broadcast_msg, channel)
    
    return {
        "success": True,
        "message": f"Broadcasted to channel {channel}",
        "subscribers": len(connection_manager.subscriptions.get(channel, set()))
    }

@router.get("/test")
async def websocket_test_page():
    """Simple test page for WebSocket connections"""
    html_content = """
    <!DOCTYPE html>
    <html>
    <head>
        <title>WebSocket Test</title>
        <style>
            body { font-family: Arial, sans-serif; margin: 20px; }
            .container { max-width: 800px; margin: 0 auto; }
            .status { padding: 10px; margin: 10px 0; border-radius: 5px; }
            .connected { background-color: #d4edda; border: 1px solid #c3e6cb; color: #155724; }
            .disconnected { background-color: #f8d7da; border: 1px solid #f5c6cb; color: #721c24; }
            .messages { height: 300px; overflow-y: auto; border: 1px solid #ccc; padding: 10px; }
            .controls { margin: 10px 0; }
            button { margin: 5px; padding: 10px 15px; }
        </style>
    </head>
    <body>
        <div class="container">
            <h1>Quantum Fire Prediction - WebSocket Test</h1>
            
            <div id="status" class="status disconnected">Disconnected</div>
            
            <div class="controls">
                <button onclick="connect()">Connect</button>
                <button onclick="disconnect()">Disconnect</button>
                <button onclick="subscribeToFires()">Subscribe to Fire Updates</button>
                <button onclick="subscribeToWeather()">Subscribe to Weather</button>
                <button onclick="subscribeToQuantum()">Subscribe to Quantum</button>
                <button onclick="ping()">Ping</button>
                <button onclick="getStats()">Get Stats</button>
            </div>
            
            <div id="messages" class="messages"></div>
        </div>

        <script>
            let ws = null;
            
            function connect() {
                if (ws) {
                    ws.close();
                }
                
                ws = new WebSocket('ws://localhost:8000/ws/connect?client_type=test');
                
                ws.onopen = function(event) {
                    updateStatus('Connected', true);
                    addMessage('Connected to WebSocket');
                };
                
                ws.onmessage = function(event) {
                    const data = JSON.parse(event.data);
                    addMessage('Received: ' + JSON.stringify(data, null, 2));
                };
                
                ws.onclose = function(event) {
                    updateStatus('Disconnected', false);
                    addMessage('WebSocket closed');
                };
                
                ws.onerror = function(error) {
                    addMessage('WebSocket error: ' + error);
                };
            }
            
            function disconnect() {
                if (ws) {
                    ws.close();
                }
            }
            
            function sendMessage(message) {
                if (ws && ws.readyState === WebSocket.OPEN) {
                    ws.send(JSON.stringify(message));
                    addMessage('Sent: ' + JSON.stringify(message));
                } else {
                    addMessage('WebSocket not connected');
                }
            }
            
            function subscribeToFires() {
                sendMessage({type: 'subscribe', channel: 'fire_updates'});
            }
            
            function subscribeToWeather() {
                sendMessage({type: 'subscribe', channel: 'weather_updates'});
            }
            
            function subscribeToQuantum() {
                sendMessage({type: 'subscribe', channel: 'quantum_processing'});
            }
            
            function ping() {
                sendMessage({type: 'ping'});
            }
            
            function getStats() {
                sendMessage({type: 'get_stats'});
            }
            
            function updateStatus(text, connected) {
                const status = document.getElementById('status');
                status.textContent = text;
                status.className = 'status ' + (connected ? 'connected' : 'disconnected');
            }
            
            function addMessage(message) {
                const messages = document.getElementById('messages');
                const div = document.createElement('div');
                div.textContent = new Date().toLocaleTimeString() + ': ' + message;
                messages.appendChild(div);
                messages.scrollTop = messages.scrollHeight;
            }
        </script>
    </body>
    </html>
    """
    return HTMLResponse(content=html_content)
