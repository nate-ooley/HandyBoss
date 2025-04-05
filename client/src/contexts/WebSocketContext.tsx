import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { createWebSocket, WebSocketMessage } from '../lib/webSocket';
import { isClient } from '../lib/utils';
import { useToast } from '@/hooks/use-toast';

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
  const { toast } = useToast();
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
      // Handle different message types
      if (message.type === 'message-reaction-update') {
        // Show a toast notification for reactions
        const { action, emoji, messageId } = message;
        if (action === 'add') {
          toast({
            title: `Reaction added: ${emoji}`,
            description: "Team reaction has been shared with all users",
            duration: 2000,
          });
        }
      }
      
      // Save the last message for other components to use
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
  }, [toast]);

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
