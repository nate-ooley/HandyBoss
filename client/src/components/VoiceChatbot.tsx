import React, { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Mic, SendHorizontal } from 'lucide-react';
import { BossManImage } from './BossManImage';
import { BossManHeader } from './BossManHeader';
import { ChatMessage } from '../types';
import { useVoice } from '../contexts/VoiceContext';
import { useWebSocket } from '../contexts/WebSocketContext';

export const VoiceChatbot: React.FC = () => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { startListening, isListening, synthesizeSpeech } = useVoice();
  const { sendMessage, lastMessage } = useWebSocket();
  const [bossMode, setBossMode] = useState<boolean>(true);

  useEffect(() => {
    if (lastMessage && lastMessage.type === 'chat-response') {
      const newMessage: ChatMessage = {
        id: Date.now().toString(),
        text: lastMessage.text,
        isUser: false,
        timestamp: new Date().toISOString(),
      };
      
      setMessages(prev => [...prev, newMessage]);
      
      // Speak the response if boss mode is on
      if (bossMode) {
        synthesizeSpeech(lastMessage.text);
      }
    }
  }, [lastMessage, synthesizeSpeech, bossMode]);

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

  // Function to get the appropriate mood for the boss character
  const getBossMoodForMessage = (messageText: string, isUser: boolean): any => {
    if (isUser) return 'angry'; // Default for user messages
    
    // For boss responses, determine mood based on message content
    const lowerText = messageText.toLowerCase();
    if (lowerText.includes('error') || lowerText.includes('cannot') || lowerText.includes('failed')) {
      return 'raging';
    } else if (lowerText.includes('urgent') || lowerText.includes('important')) {
      return 'shouting';
    } else if (lowerText.includes('call') || lowerText.includes('phone')) {
      return 'phoneAngry';
    } else {
      return 'yelling'; // Default response mood
    }
  };

  return (
    <div className="mt-6 border border-gray-200 rounded-xl overflow-hidden shadow-lg">
      <BossManHeader 
        title="BOSS ASSISTANT" 
        onMicClick={handleVoiceInput} 
        isBossMode={bossMode}
        toggleBossMode={() => setBossMode(!bossMode)}
      />
      
      <div className="p-4 bg-gray-50">
        <div className="bg-white rounded-xl p-4 mb-4 max-h-80 overflow-y-auto shadow-inner">
          <div className="flex flex-col space-y-4">
            {messages.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                <p>Ask the boss a question or give a command...</p>
                <BossManImage 
                  mood="phoneAngry" 
                  size="lg" 
                  className="mx-auto mt-4"
                  withSpeechBubble
                  speechText="What do you need help with?"
                />
              </div>
            )}
            
            {messages.map((message) => (
              <div 
                key={message.id} 
                className={`flex items-start ${message.isUser ? 'justify-start' : 'justify-end'} gap-3`}
              >
                {message.isUser ? (
                  <>
                    <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center">
                      <span className="text-gray-600">You</span>
                    </div>
                    <div className="bg-gray-100 p-3 rounded-2xl rounded-tl-none max-w-[75%]">
                      <p className="text-gray-800">{message.text}</p>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="bg-primary/10 p-3 rounded-2xl rounded-tr-none max-w-[75%]">
                      <p className="text-gray-800">{message.text}</p>
                    </div>
                    <BossManImage 
                      size="sm" 
                      mood={getBossMoodForMessage(message.text, message.isUser)} 
                    />
                  </>
                )}
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          <div className="flex-1 relative">
            <input
              type="text"
              placeholder="Type your message..."
              className="w-full p-4 pr-12 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyPress}
            />
            <button 
              className={`absolute right-3 top-1/2 transform -translate-y-1/2 text-primary p-2 rounded-full ${isListening ? 'microphone-pulse bg-primary/10' : 'hover:bg-primary/5'}`}
              onClick={handleVoiceInput}
              aria-label="Voice input"
            >
              <Mic className="h-5 w-5" />
            </button>
          </div>
          <Button 
            onClick={handleSend}
            className="bg-primary hover:bg-primary/90 text-white p-4 h-auto rounded-xl"
          >
            <SendHorizontal className="h-5 w-5" />
          </Button>
        </div>
      </div>
    </div>
  );
};
