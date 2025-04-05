import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { createWebSocket, WebSocketMessage } from '../lib/webSocket';
import { isClient } from '../lib/utils';

interface WebSocketContextType {
  isConnected: boolean;
  lastMessage: WebSocketMessage | null;
  sendMessage: (message: WebSocketMessage) => void;
}

const WebSocketContext = createContext<WebSocketContextType>({
  isConnected: false,
  lastMessage: null,
  sendMessage: () => {}, 
});

export const useWebSocket = () => useContext(WebSocketContext);

export const WebSocketProvider: React.FC<React.PropsWithChildren> = ({ children }) => {
  const [isConnected, setIsConnected] = useState(false);
  const [lastMessage, setLastMessage] = useState<WebSocketMessage | null>(null);
  const [wsInstance, setWsInstance] = useState<ReturnType<typeof createWebSocket> | null>(null);

  // Initialize WebSocket connection
  useEffect(() => {
    if (!isClient) return;
    
    const ws = createWebSocket();
    setWsInstance(ws);
    
    // Setup connection and message handler
    const socket = ws.connect();
    
    const unsubscribe = ws.onMessage((message) => {
      setLastMessage(message);
    });
    
    setIsConnected(socket.readyState === WebSocket.OPEN);
    
    // Update connection status when the socket state changes
    const checkConnection = () => {
      if (socket) {
        setIsConnected(socket.readyState === WebSocket.OPEN);
      }
    };
    
    socket.addEventListener('open', checkConnection);
    socket.addEventListener('close', checkConnection);
    
    // Reconnect when window regains focus
    const handleFocus = () => {
      if (socket && socket.readyState !== WebSocket.OPEN) {
        ws.connect();
      }
    };
    
    window.addEventListener('focus', handleFocus);
    
    return () => {
      unsubscribe();
      ws.disconnect();
      window.removeEventListener('focus', handleFocus);
    };
  }, []);

  // Send message function
  const sendMessage = useCallback((message: WebSocketMessage) => {
    if (wsInstance) {
      wsInstance.sendMessage(message);
    }
  }, [wsInstance]);

  return (
    <WebSocketContext.Provider value={{ isConnected, lastMessage, sendMessage }}>
      {children}
    </WebSocketContext.Provider>
  );
};
