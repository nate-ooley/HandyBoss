import { isClient } from './utils';

export type WebSocketMessage = {
  type: string;
  [key: string]: any;
};

// Import WebSocket for readyState constants
// This ensures we have access to the constants even before socket is created
const WS_OPEN = 1; // WebSocket.OPEN
const WS_CLOSED = 3; // WebSocket.CLOSED

export const createWebSocket = (): {
  socket: WebSocket | null;
  connect: () => WebSocket;
  disconnect: () => void;
  sendMessage: (message: WebSocketMessage) => void;
  onMessage: (callback: (message: WebSocketMessage) => void) => () => void;
} => {
  let socket: WebSocket | null = null;
  let reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  const messageListeners: ((message: WebSocketMessage) => void)[] = [];
  let messageQueue: WebSocketMessage[] = [];

  const clearReconnectTimer = () => {
    if (reconnectTimer) {
      clearTimeout(reconnectTimer);
      reconnectTimer = null;
    }
  };

  const connect = () => {
    if (!isClient) {
      throw new Error('WebSocket can only be created on the client');
    }

    // Clear any existing reconnect timers
    clearReconnectTimer();

    // If we already have an open connection, just return it
    if (socket && socket.readyState === WS_OPEN) {
      return socket;
    }

    // Close any existing socket that isn't already closed
    if (socket && socket.readyState !== WS_CLOSED) {
      socket.close();
    }

    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${window.location.host}/ws`;
    
    socket = new WebSocket(wsUrl);
    
    socket.onopen = () => {
      console.log('WebSocket connection established');
      
      // Process any queued messages
      if (messageQueue.length > 0) {
        console.log(`Processing ${messageQueue.length} queued messages`);
        messageQueue.forEach(msg => {
          if (socket && socket.readyState === WS_OPEN) {
            socket.send(JSON.stringify(msg));
          }
        });
        messageQueue = [];
      }
    };
    
    socket.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data) as WebSocketMessage;
        messageListeners.forEach(listener => listener(message));
      } catch (error) {
        console.error('Error parsing WebSocket message:', error);
      }
    };
    
    socket.onerror = (error) => {
      console.error('WebSocket error:', error);
    };
    
    socket.onclose = (event) => {
      console.log(`WebSocket connection closed (code: ${event.code}, reason: ${event.reason || 'No reason provided'})`);
      
      // Auto-reconnect after a delay, only if not closed intentionally
      if (!event.wasClean) {
        clearReconnectTimer();
        reconnectTimer = setTimeout(() => {
          console.log('Attempting to reconnect WebSocket...');
          connect();
        }, 3000);
      }
    };
    
    return socket;
  };
  
  const disconnect = () => {
    clearReconnectTimer();
    
    if (socket) {
      socket.close(1000, 'Client disconnected intentionally');
      socket = null;
    }
    
    // Clear message queue on intentional disconnect
    messageQueue = [];
  };
  
  const sendMessage = (message: WebSocketMessage) => {
    if (!socket || socket.readyState !== WS_OPEN) {
      // Queue the message for later
      messageQueue.push(message);
      
      // Start a connection if needed
      if (!socket || socket.readyState === WS_CLOSED) {
        socket = connect();
      }
    } else {
      // Send immediately if connection is open
      socket.send(JSON.stringify(message));
    }
  };
  
  const onMessage = (callback: (message: WebSocketMessage) => void) => {
    messageListeners.push(callback);
    return () => {
      const index = messageListeners.indexOf(callback);
      if (index !== -1) {
        messageListeners.splice(index, 1);
      }
    };
  };
  
  return {
    socket,
    connect,
    disconnect,
    sendMessage,
    onMessage
  };
};
