"use client";

import { createContext, useContext, useEffect, useState, useRef, useCallback } from 'react';
import { useToast } from '@/components/ui/use-toast';

// WebSocket connection states
export enum ConnectionState {
  CONNECTING = 'connecting',
  CONNECTED = 'connected',
  DISCONNECTED = 'disconnected',
  RECONNECTING = 'reconnecting',
  ERROR = 'error'
}

// Message types for WebSocket communication
export interface WebSocketMessage {
  type: string;
  data: any;
  timestamp?: string;
  channel?: string;
}

// WebSocket context interface
interface WebSocketContextType {
  connectionState: ConnectionState;
  isConnected: boolean;
  lastMessage: WebSocketMessage | null;
  subscribe: (channel: string) => void;
  unsubscribe: (channel: string) => void;
  sendMessage: (message: WebSocketMessage) => void;
  reconnect: () => void;
  disconnect: () => void;
  subscribedChannels: Set<string>;
}

const WebSocketContext = createContext<WebSocketContextType | null>(null);

interface WebSocketProviderProps {
  children: React.ReactNode;
  url?: string;
  autoConnect?: boolean;
  reconnectInterval?: number;
  maxReconnectAttempts?: number;
}

export function WebSocketProvider({
  children,
  url = process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:8000/ws/connect',
  autoConnect = true,
  reconnectInterval = 5000,
  maxReconnectAttempts = 5
}: WebSocketProviderProps) {
  const [connectionState, setConnectionState] = useState<ConnectionState>(ConnectionState.DISCONNECTED);
  const [lastMessage, setLastMessage] = useState<WebSocketMessage | null>(null);
  const [subscribedChannels, setSubscribedChannels] = useState<Set<string>>(new Set());
  
  const ws = useRef<WebSocket | null>(null);
  const reconnectAttempts = useRef(0);
  const reconnectTimer = useRef<NodeJS.Timeout | null>(null);
  const pingTimer = useRef<NodeJS.Timeout | null>(null);
  const { toast } = useToast();

  // Connection management
  const connect = useCallback(() => {
    if (ws.current?.readyState === WebSocket.OPEN) {
      return;
    }

    try {
      setConnectionState(ConnectionState.CONNECTING);
      ws.current = new WebSocket(url);

      ws.current.onopen = () => {
        setConnectionState(ConnectionState.CONNECTED);
        reconnectAttempts.current = 0;
        
        toast({
          title: "Connected",
          description: "Real-time connection established",
          duration: 3000,
        });

        // Start ping/pong heartbeat
        startHeartbeat();

        // Re-subscribe to channels
        subscribedChannels.forEach(channel => {
          subscribeToChannel(channel);
        });
      };

      ws.current.onmessage = (event) => {
        try {
          const message: WebSocketMessage = JSON.parse(event.data);
          setLastMessage(message);
          
          // Handle system messages
          if (message.type === 'pong') {
            // Heartbeat response
            return;
          }
          
          if (message.type === 'error') {
            toast({
              variant: "destructive",
              title: "WebSocket Error",
              description: message.data.message || "An error occurred",
            });
          }
          
        } catch (error) {
          console.error('Error parsing WebSocket message:', error);
        }
      };

      ws.current.onclose = (event) => {
        setConnectionState(ConnectionState.DISCONNECTED);
        stopHeartbeat();
        
        if (!event.wasClean && reconnectAttempts.current < maxReconnectAttempts) {
          setConnectionState(ConnectionState.RECONNECTING);
          scheduleReconnect();
        } else if (reconnectAttempts.current >= maxReconnectAttempts) {
          setConnectionState(ConnectionState.ERROR);
          toast({
            variant: "destructive",
            title: "Connection Failed",
            description: "Unable to establish connection after multiple attempts",
          });
        }
      };

      ws.current.onerror = (error) => {
        console.error('WebSocket error:', error);
        setConnectionState(ConnectionState.ERROR);
      };

    } catch (error) {
      console.error('Failed to create WebSocket connection:', error);
      setConnectionState(ConnectionState.ERROR);
    }
  }, [url, maxReconnectAttempts, toast, subscribedChannels]);

  // Disconnect
  const disconnect = useCallback(() => {
    if (reconnectTimer.current) {
      clearTimeout(reconnectTimer.current);
      reconnectTimer.current = null;
    }
    
    stopHeartbeat();
    
    if (ws.current) {
      ws.current.close(1000, 'Client disconnect');
      ws.current = null;
    }
    
    setConnectionState(ConnectionState.DISCONNECTED);
  }, []);

  // Reconnect
  const reconnect = useCallback(() => {
    disconnect();
    setTimeout(connect, 1000);
  }, [connect, disconnect]);

  // Schedule reconnection
  const scheduleReconnect = useCallback(() => {
    if (reconnectTimer.current) {
      clearTimeout(reconnectTimer.current);
    }
    
    reconnectAttempts.current++;
    
    reconnectTimer.current = setTimeout(() => {
      if (connectionState !== ConnectionState.CONNECTED) {
        connect();
      }
    }, reconnectInterval * Math.pow(1.5, reconnectAttempts.current - 1)); // Exponential backoff
  }, [connect, connectionState, reconnectInterval]);

  // Heartbeat management
  const startHeartbeat = useCallback(() => {
    stopHeartbeat();
    
    pingTimer.current = setInterval(() => {
      if (ws.current?.readyState === WebSocket.OPEN) {
        sendMessage({
          type: 'ping',
          data: { timestamp: new Date().toISOString() }
        });
      }
    }, 30000); // Ping every 30 seconds
  }, []);

  const stopHeartbeat = useCallback(() => {
    if (pingTimer.current) {
      clearInterval(pingTimer.current);
      pingTimer.current = null;
    }
  }, []);

  // Send message
  const sendMessage = useCallback((message: WebSocketMessage) => {
    if (ws.current?.readyState === WebSocket.OPEN) {
      try {
        ws.current.send(JSON.stringify({
          ...message,
          timestamp: new Date().toISOString()
        }));
      } catch (error) {
        console.error('Error sending WebSocket message:', error);
        toast({
          variant: "destructive",
          title: "Send Error",
          description: "Failed to send message",
        });
      }
    } else {
      console.warn('WebSocket is not connected. Message not sent:', message);
    }
  }, [toast]);

  // Channel subscription
  const subscribeToChannel = useCallback((channel: string) => {
    sendMessage({
      type: 'subscribe',
      data: { channel }
    });
  }, [sendMessage]);

  const subscribe = useCallback((channel: string) => {
    setSubscribedChannels(prev => {
      const newChannels = new Set(prev);
      newChannels.add(channel);
      return newChannels;
    });
    
    if (connectionState === ConnectionState.CONNECTED) {
      subscribeToChannel(channel);
    }
  }, [connectionState, subscribeToChannel]);

  const unsubscribe = useCallback((channel: string) => {
    setSubscribedChannels(prev => {
      const newChannels = new Set(prev);
      newChannels.delete(channel);
      return newChannels;
    });
    
    if (connectionState === ConnectionState.CONNECTED) {
      sendMessage({
        type: 'unsubscribe',
        data: { channel }
      });
    }
  }, [connectionState, sendMessage]);

  // Auto-connect on mount
  useEffect(() => {
    if (autoConnect) {
      connect();
    }
    
    return () => {
      disconnect();
    };
  }, [autoConnect, connect, disconnect]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      disconnect();
    };
  }, [disconnect]);

  const isConnected = connectionState === ConnectionState.CONNECTED;

  const contextValue: WebSocketContextType = {
    connectionState,
    isConnected,
    lastMessage,
    subscribe,
    unsubscribe,
    sendMessage,
    reconnect,
    disconnect,
    subscribedChannels
  };

  return (
    <WebSocketContext.Provider value={contextValue}>
      {children}
    </WebSocketContext.Provider>
  );
}

// Hook to use WebSocket context
export function useWebSocket() {
  const context = useContext(WebSocketContext);
  if (!context) {
    throw new Error('useWebSocket must be used within a WebSocketProvider');
  }
  return context;
}

// Hook for subscribing to specific channels
export function useWebSocketChannel(channel: string) {
  const { subscribe, unsubscribe, lastMessage, isConnected } = useWebSocket();
  const [channelMessages, setChannelMessages] = useState<WebSocketMessage[]>([]);

  useEffect(() => {
    subscribe(channel);
    return () => unsubscribe(channel);
  }, [channel, subscribe, unsubscribe]);

  useEffect(() => {
    if (lastMessage && lastMessage.channel === channel) {
      setChannelMessages(prev => [...prev.slice(-99), lastMessage]); // Keep last 100 messages
    }
  }, [lastMessage, channel]);

  return {
    messages: channelMessages,
    isConnected,
    clearMessages: () => setChannelMessages([])
  };
}

// Hook for real-time fire data
export function useFireUpdates() {
  const { messages, isConnected } = useWebSocketChannel('fire_updates');
  const [fireData, setFireData] = useState<any[]>([]);
  const [alerts, setAlerts] = useState<any[]>([]);

  useEffect(() => {
    messages.forEach(message => {
      if (message.type === 'fire_detection') {
        setFireData(prev => [message.data, ...prev.slice(0, 49)]); // Keep last 50
      } else if (message.type === 'fire_alert') {
        setAlerts(prev => [message.data, ...prev.slice(0, 19)]); // Keep last 20
      }
    });
  }, [messages]);

  return { fireData, alerts, isConnected };
}

// Hook for real-time weather data
export function useWeatherUpdates() {
  const { messages, isConnected } = useWebSocketChannel('weather_updates');
  const [weatherData, setWeatherData] = useState<any>(null);

  useEffect(() => {
    messages.forEach(message => {
      if (message.type === 'weather_data') {
        setWeatherData(message.data);
      }
    });
  }, [messages]);

  return { weatherData, isConnected };
}

// Hook for quantum processing updates
export function useQuantumUpdates() {
  const { messages, isConnected } = useWebSocketChannel('quantum_processing');
  const [quantumMetrics, setQuantumMetrics] = useState<any>(null);
  const [processingStatus, setProcessingStatus] = useState<string>('idle');

  useEffect(() => {
    messages.forEach(message => {
      if (message.type === 'quantum_metrics') {
        setQuantumMetrics(message.data);
      } else if (message.type === 'quantum_status') {
        setProcessingStatus(message.data.status);
      }
    });
  }, [messages]);

  return { quantumMetrics, processingStatus, isConnected };
}

// Hook for system monitoring
export function useSystemMonitoring() {
  const { messages, isConnected } = useWebSocketChannel('system_monitoring');
  const [systemMetrics, setSystemMetrics] = useState<any>(null);
  const [performance, setPerformance] = useState<any>(null);

  useEffect(() => {
    messages.forEach(message => {
      if (message.type === 'system_metrics') {
        setSystemMetrics(message.data);
      } else if (message.type === 'performance_data') {
        setPerformance(message.data);
      }
    });
  }, [messages]);

  return { systemMetrics, performance, isConnected };
}
