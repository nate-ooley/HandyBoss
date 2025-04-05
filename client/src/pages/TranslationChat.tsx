import React, { useState, useEffect, useRef } from 'react';
import { useVoice } from '@/contexts/VoiceContext';
import { useWebSocket } from '@/contexts/WebSocketContext';
import { detectLanguage, translateText } from '@/lib/translationService';
import { BossManImage } from '@/components/BossManImage';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { Mic, MicOff, Send, RefreshCw, BatteryCharging, Phone } from 'lucide-react';
import { useMobile } from '@/hooks/use-mobile';
import { useToast } from '@/hooks/use-toast';

// Types for our messages
interface ChatMessage {
  id: string;
  text: string;
  translatedText?: string;
  isUser: boolean;
  role: 'boss' | 'worker' | 'system';
  language: 'en' | 'es';
  timestamp: string;
}

export default function TranslationChat() {
  const { toast } = useToast();
  const isMobile = useMobile();
  const messageEndRef = useRef<HTMLDivElement>(null);
  const { isConnected, lastMessage, sendMessage } = useWebSocket();
  const { isListening, startListening, stopListening, synthesizeSpeech } = useVoice();
  
  const [role, setRole] = useState<'boss' | 'worker'>('boss');
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: '1',
      text: role === 'boss' ? 'Hello! I am your construction assistant. How can I help you today?' : '¡Hola! Soy tu asistente de construcción. ¿Cómo puedo ayudarte hoy?',
      isUser: false,
      role: 'system',
      language: role === 'boss' ? 'en' : 'es',
      timestamp: new Date().toISOString(),
    },
  ]);
  const [inputText, setInputText] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  
  // Listen for WebSocket messages
  useEffect(() => {
    if (lastMessage && lastMessage.type === 'chat-response') {
      const { text, originalText, translatedText, translatedResponse, messageId, timestamp } = lastMessage;
      
      // Determine which text to display based on role
      const displayText = role === 'boss' ? text : translatedResponse || translatedText || text;
      
      const newMessage: ChatMessage = {
        id: messageId || Date.now().toString(),
        text: displayText,
        translatedText: translatedText,
        isUser: false,
        role: 'system',
        language: role === 'boss' ? 'en' : 'es',
        timestamp: timestamp || new Date().toISOString(),
      };
      
      setMessages(prev => [...prev, newMessage]);
      setIsProcessing(false);
      
      // Optional: Speak the response if in mobile mode
      if (isMobile && !isSpeaking) {
        speakMessage(displayText, role === 'boss' ? 'en' : 'es');
      }
    }
  }, [lastMessage]);
  
  // Scroll to bottom when messages change
  useEffect(() => {
    messageEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);
  
  // Handle role change
  const handleRoleChange = (newRole: 'boss' | 'worker') => {
    setRole(newRole);
    
    // Add system message indicating role change
    const systemMessage: ChatMessage = {
      id: Date.now().toString(),
      text: newRole === 'boss' 
        ? 'Switched to Boss mode (English)' 
        : 'Cambió a modo Trabajador (Español)',
      isUser: false,
      role: 'system',
      language: newRole === 'boss' ? 'en' : 'es',
      timestamp: new Date().toISOString(),
    };
    
    setMessages(prev => [...prev, systemMessage]);
  };
  
  // Handle voice input
  const handleVoiceInput = () => {
    if (isListening) {
      stopListening();
    } else {
      setInputText('');
      startListening((transcript) => {
        setInputText(transcript);
      });
      
      // Auto-detect language and switch role if needed
      setTimeout(() => {
        if (inputText) {
          const detectedLang = detectLanguage(inputText);
          if ((detectedLang === 'es' && role === 'boss') || (detectedLang === 'en' && role === 'worker')) {
            const newRole = detectedLang === 'es' ? 'worker' : 'boss';
            handleRoleChange(newRole);
            toast({
              title: 'Language detected',
              description: `Switched to ${newRole === 'boss' ? 'Boss' : 'Worker'} mode based on your speech`,
              duration: 3000,
            });
          }
        }
      }, 1500);
    }
  };
  
  // Handle sending message
  const handleSendMessage = async () => {
    if (!inputText.trim() || isProcessing) return;
    
    const language = role === 'boss' ? 'en' : 'es';
    
    // Add user message to the chat
    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      text: inputText,
      isUser: true,
      role,
      language,
      timestamp: new Date().toISOString(),
    };
    
    setMessages(prev => [...prev, userMessage]);
    setIsProcessing(true);
    
    // Send message to server for translation and response
    sendMessage({
      type: 'chat-message',
      text: inputText,
      role,
      language,
      timestamp: new Date().toISOString(),
    });
    
    // Clear input
    setInputText('');
    
    // Stop listening if active
    if (isListening) {
      stopListening();
    }
  };
  
  // Speak message using voice synthesis
  const speakMessage = async (text: string, language: 'en' | 'es') => {
    try {
      setIsSpeaking(true);
      await synthesizeSpeech(text, {
        voice: language === 'en' ? 'en-US' : 'es-ES',
        rate: 1.0,
        pitch: 1.0
      });
      setIsSpeaking(false);
    } catch (error) {
      console.error('Error speaking message:', error);
      setIsSpeaking(false);
    }
  };
  
  // Handle keypress (Enter to send)
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };
  
  return (
    <div className="flex flex-col h-full max-h-screen">
      {/* Header with role selector */}
      <header className="bg-primary text-primary-foreground py-3 px-4 flex items-center justify-between border-b">
        <div className="flex items-center">
          <BossManImage 
            mood={role === 'boss' ? "phoneRaging" : "phoneAngry"} 
            size="sm"
            className="-ml-1 -mb-1 transform -translate-y-1" 
          />
          <h1 className="text-xl font-bold ml-2">
            {role === 'boss' ? 'Boss Mode' : 'Modo Trabajador'}
          </h1>
        </div>
        
        <Tabs value={role} onValueChange={(value) => handleRoleChange(value as 'boss' | 'worker')} className="w-auto">
          <TabsList>
            <TabsTrigger value="boss" className="text-sm">
              Boss (English)
            </TabsTrigger>
            <TabsTrigger value="worker" className="text-sm">
              Trabajador (Español)
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </header>
      
      {/* Connection status */}
      {!isConnected && (
        <div className="bg-amber-500 text-white px-4 py-2 text-center text-sm">
          <RefreshCw className="inline-block w-4 h-4 mr-2 animate-spin" />
          {role === 'boss' 
            ? 'Connecting to server...' 
            : 'Conectando al servidor...'}
        </div>
      )}
      
      {/* Chat message area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex ${message.isUser ? 'justify-end' : 'justify-start'}`}
          >
            <Card
              className={`p-3 max-w-[80%] ${
                message.isUser
                  ? 'bg-primary text-primary-foreground'
                  : message.role === 'system'
                  ? 'bg-secondary text-secondary-foreground'
                  : 'bg-muted text-foreground'
              }`}
            >
              {/* Message role indicator */}
              {message.role !== 'system' && (
                <div className="text-xs opacity-70 mb-1">
                  {message.role === 'boss' ? 'Boss' : 'Trabajador'}:
                </div>
              )}
              
              {/* Message content */}
              <div className="text-sm">
                {message.text}
              </div>
              
              {/* Translation (shown if available and user requested) */}
              {message.translatedText && message.isUser && (
                <div className="text-xs mt-1 opacity-80 border-t border-t-white/20 pt-1">
                  <span className="font-semibold">
                    {role === 'boss' ? 'Translated to Spanish:' : 'Traducido al inglés:'}
                  </span>
                  <div>{message.translatedText}</div>
                </div>
              )}
              
              {/* Timestamp */}
              <div className="text-[10px] mt-1 opacity-60 text-right">
                {new Date(message.timestamp).toLocaleTimeString()}
              </div>
            </Card>
            
            {/* Message actions for mobile */}
            {isMobile && (
              <div className="flex flex-col ml-2 justify-center">
                <Button 
                  size="sm" 
                  variant="ghost" 
                  className="h-6 w-6 rounded-full p-0"
                  onClick={() => speakMessage(message.text, message.language)}
                  disabled={isSpeaking}
                >
                  <Phone className="h-3 w-3" />
                </Button>
              </div>
            )}
          </div>
        ))}
        <div ref={messageEndRef} />
        
        {/* Loading indicator */}
        {isProcessing && (
          <div className="flex justify-center">
            <Card className="p-2 bg-muted">
              <div className="flex items-center text-sm text-muted-foreground">
                <RefreshCw className="h-3 w-3 mr-2 animate-spin" />
                {role === 'boss' ? 'Translating...' : 'Traduciendo...'}
              </div>
            </Card>
          </div>
        )}
      </div>
      
      {/* Input area */}
      <div className="p-4 border-t bg-background">
        <div className="flex">
          <Button
            type="button"
            size="icon"
            variant={isListening ? "destructive" : "outline"}
            className="mr-2"
            onClick={handleVoiceInput}
          >
            {isListening ? <MicOff /> : <Mic />}
          </Button>
          
          <Textarea
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyDown={handleKeyPress}
            placeholder={
              role === 'boss' 
                ? 'Type or speak your message in English...' 
                : 'Escribe o habla tu mensaje en español...'
            }
            className="flex-1 resize-none"
            rows={1}
          />
          
          <Button
            type="button"
            size="icon"
            variant="default"
            className="ml-2"
            disabled={!inputText.trim() || isProcessing}
            onClick={handleSendMessage}
          >
            <Send />
          </Button>
        </div>
        
        {/* Translation service indicator */}
        <div className="text-xs text-muted-foreground mt-2 flex items-center">
          <BatteryCharging className="h-3 w-3 mr-1" />
          {role === 'boss' 
            ? 'Using OpenAI API for translation (will use Gemma LLM on-device in future)' 
            : 'Usando API de OpenAI para traducción (usará Gemma LLM en el dispositivo en el futuro)'}
        </div>
      </div>
    </div>
  );
}