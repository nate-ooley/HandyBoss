import { isClient } from './utils';

export type WebSocketMessage = {
  type: string;
  [key: string]: any;
};

export const createWebSocket = (): {
  socket: WebSocket | null;
  connect: () => WebSocket;
  disconnect: () => void;
  sendMessage: (message: WebSocketMessage) => void;
  onMessage: (callback: (message: WebSocketMessage) => void) => () => void;
} => {
  let socket: WebSocket | null = null;
  const messageListeners: ((message: WebSocketMessage) => void)[] = [];

  const connect = () => {
    if (!isClient) {
      throw new Error('WebSocket can only be created on the client');
    }

    if (socket && socket.readyState === WebSocket.OPEN) {
      return socket;
    }

    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${window.location.host}/ws`;
    
    socket = new WebSocket(wsUrl);
    
    socket.onopen = () => {
      console.log('WebSocket connection established');
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
    
    socket.onclose = () => {
      console.log('WebSocket connection closed');
      // Auto-reconnect after a delay
      setTimeout(() => {
        if (socket?.readyState === WebSocket.CLOSED) {
          connect();
        }
      }, 5000);
    };
    
    return socket;
  };
  
  const disconnect = () => {
    if (socket) {
      socket.close();
      socket = null;
    }
  };
  
  const sendMessage = (message: WebSocketMessage) => {
    if (!socket || socket.readyState !== WebSocket.OPEN) {
      socket = connect();
      // Wait briefly for connection to establish
      setTimeout(() => {
        if (socket && socket.readyState === WebSocket.OPEN) {
          socket.send(JSON.stringify(message));
        } else {
          console.error('Failed to send message, WebSocket not open');
        }
      }, 500);
    } else {
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
