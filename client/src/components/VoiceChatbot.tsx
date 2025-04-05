import React, { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Mic, SendHorizontal } from 'lucide-react';
import { BossManCharacter } from './BossManCharacter';
import { ChatMessage } from '../types';
import { useVoice } from '../contexts/VoiceContext';
import { useWebSocket } from '../contexts/WebSocketContext';

export const VoiceChatbot: React.FC = () => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { startListening, isListening, synthesizeSpeech } = useVoice();
  const { sendMessage, lastMessage } = useWebSocket();

  useEffect(() => {
    if (lastMessage && lastMessage.type === 'chat-response') {
      const newMessage: ChatMessage = {
        id: Date.now().toString(),
        text: lastMessage.text,
        isUser: false,
        timestamp: new Date().toISOString(),
      };
      
      setMessages(prev => [...prev, newMessage]);
      
      // Speak the response
      synthesizeSpeech(lastMessage.text);
    }
  }, [lastMessage, synthesizeSpeech]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSend = () => {
    if (!input.trim()) return;
    
    const newMessage: ChatMessage = {
      id: Date.now().toString(),
      text: input,
      isUser: true,
      timestamp: new Date().toISOString(),
    };
    
    setMessages(prev => [...prev, newMessage]);
    sendMessage({
      type: 'chat-message',
      text: input,
      timestamp: new Date().toISOString()
    });
    
    setInput('');
  };

  const handleVoiceInput = () => {
    startListening((transcript) => {
      if (transcript) {
        setInput(transcript);
      }
    });
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSend();
    }
  };

  return (
    <div className="mt-6 border border-gray-200 rounded-xl p-6">
      <h2 className="text-xl font-bold text-dark mb-4">VOICE ASSISTANT</h2>
      
      <div className="bg-light rounded-xl p-4 mb-4 max-h-80 overflow-y-auto">
        <div className="flex flex-col space-y-4">
          {messages.map((message) => (
            <div 
              key={message.id} 
              className={`flex items-start space-x-3 ${message.isUser ? '' : 'justify-end'}`}
            >
              {message.isUser && <BossManCharacter size="sm" mood="normal" />}
              
              <div className={`p-3 rounded-xl max-w-md ${
                message.isUser 
                  ? 'bg-primary bg-opacity-10' 
                  : 'bg-secondary bg-opacity-10'
              }`}>
                <p className="text-dark">{message.text}</p>
              </div>
              
              {!message.isUser && <BossManCharacter size="sm" mood="happy" />}
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>
      </div>
      
      <div className="flex items-center space-x-3">
        <div className="flex-1 relative">
          <input
            type="text"
            placeholder="Ask a question or give a command..."
            className="w-full p-4 pr-12 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyPress}
          />
          <button 
            className={`absolute right-3 top-1/2 transform -translate-y-1/2 text-primary ${isListening ? 'microphone-pulse' : ''}`}
            onClick={handleVoiceInput}
          >
            <Mic className="h-5 w-5" />
          </button>
        </div>
        <Button 
          className="bg-primary text-white p-4 rounded-xl"
          onClick={handleSend}
        >
          <SendHorizontal className="h-5 w-5" />
        </Button>
      </div>
    </div>
  );
};
