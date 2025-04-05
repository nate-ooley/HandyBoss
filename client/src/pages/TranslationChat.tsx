import React, { useState, useEffect, useRef } from 'react';
import { useVoice } from '@/contexts/VoiceContext';
import { useWebSocket } from '@/contexts/WebSocketContext';
import { detectLanguage, translateText } from '@/lib/translationService';
import { BossManImage } from '@/components/BossManImage';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Mic, MicOff, Send, RefreshCw, BatteryCharging, Phone, MapPin, Building, Calendar, Smile } from 'lucide-react';
import { useMobile } from '@/hooks/use-mobile';
import { useToast } from '@/hooks/use-toast';
import { useQuery } from '@tanstack/react-query';
import type { Jobsite } from '@/types';

// Types for our messages
interface ChatMessage {
  id: string;
  text: string;
  translatedText?: string;
  isUser: boolean;
  role: 'boss' | 'worker' | 'system';
  language: 'en' | 'es';
  timestamp: string;
  jobsiteId?: number;
  jobsiteName?: string;
  location?: {
    lat: number;
    lng: number;
    address?: string;
  };
  reactions?: Record<string, string[]>; // emoji -> array of user IDs
}

export default function TranslationChat() {
  const { toast } = useToast();
  const isMobile = useMobile();
  const messageEndRef = useRef<HTMLDivElement>(null);
  const { isConnected, lastMessage, sendMessage } = useWebSocket();
  const { isListening, startListening, stopListening, synthesizeSpeech } = useVoice();
  
  // Fetch jobsites
  const { data: jobsites = [] } = useQuery<Jobsite[]>({
    queryKey: ['/api/jobsites'],
    staleTime: 30000,
  });
  
  const [role, setRole] = useState<'boss' | 'worker'>('boss');
  const [selectedJobsiteId, setSelectedJobsiteId] = useState<string | null>(null);
  // Mock user location - in a real app, this would use the Geolocation API
  const [userLocation, setUserLocation] = useState<{lat: number, lng: number}>({
    lat: 34.0522, // Los Angeles coordinates as example
    lng: -118.2437
  });
  
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
  
  // Get selected jobsite details
  const selectedJobsite = jobsites.find((job: Jobsite) => job.id.toString() === selectedJobsiteId);
  
  // Listen for WebSocket messages
  useEffect(() => {
    if (lastMessage) {
      if (lastMessage.type === 'chat-response') {
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
      else if (lastMessage.type === 'message-reaction-update' || lastMessage.type === 'reaction-response') {
        const { messageId, reactions } = lastMessage;
        
        if (messageId && reactions) {
          // Update the message with new reactions
          setMessages(prev => prev.map(msg => 
            msg.id === messageId ? { ...msg, reactions } : msg
          ));
        }
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
        
        // Auto-detect language and switch role as soon as we have enough text
        if (transcript && transcript.length > 5) {
          const detectedLang = detectLanguage(transcript);
          
          if ((detectedLang === 'es' && role === 'boss') || (detectedLang === 'en' && role === 'worker')) {
            const newRole = detectedLang === 'es' ? 'worker' : 'boss';
            handleRoleChange(newRole);
            
            toast({
              title: detectedLang === 'es' ? '¡Español detectado!' : 'English detected!',
              description: detectedLang === 'es' 
                ? 'Cambiado a modo Trabajador' 
                : 'Switched to Boss mode',
              duration: 3000,
            });
          }
        }
      });
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
      // Include jobsite information if selected
      ...(selectedJobsite && {
        jobsiteId: selectedJobsite.id,
        jobsiteName: selectedJobsite.name,
      }),
      // Include user location
      location: {
        ...userLocation,
        address: role === 'boss' ? 'Central Office' : selectedJobsite?.address || 'On-site'
      }
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
      jobsiteId: selectedJobsite?.id,
      jobsiteName: selectedJobsite?.name,
      location: userMessage.location,
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
  
  // Handle adding an emoji reaction
  const handleEmojiReaction = (messageId: string, emoji: string) => {
    if (!isConnected) return;
    
    // Send the reaction to the server
    sendMessage({
      type: 'message-reaction',
      messageId,
      userId: 1, // Default user ID
      emoji,
      action: 'add',
      timestamp: new Date().toISOString(),
    });
  };
  
  // Handle removing an emoji reaction
  const handleRemoveReaction = (messageId: string, emoji: string) => {
    if (!isConnected) return;
    
    // Send the reaction removal to the server
    sendMessage({
      type: 'message-reaction',
      messageId,
      userId: 1, // Default user ID
      emoji,
      action: 'remove',
      timestamp: new Date().toISOString(),
    });
  };
  
  return (
    <div className="flex flex-col h-full max-h-screen">
      {/* Header with role selector */}
      <header className="bg-primary text-primary-foreground py-3 px-4 flex items-center justify-between border-b">
        <div className="flex items-center">
          {role === 'boss' ? (
            <BossManImage 
              mood="phoneRaging" 
              size="sm"
              className="-ml-1 -mb-1 transform -translate-y-1" 
            />
          ) : (
            <div className="w-12 h-12 flex items-center justify-center text-4xl">
              👷
            </div>
          )}
          <h1 className="text-xl font-bold ml-2">
            {role === 'boss' ? 'Boss Mode' : 'Modo Trabajador'}
          </h1>
        </div>
        
        <Tabs value={role} onValueChange={(value) => handleRoleChange(value as 'boss' | 'worker')} className="w-auto">
          <TabsList>
            <TabsTrigger value="boss" className="text-sm">
              👨‍💼 Boss (English)
            </TabsTrigger>
            <TabsTrigger value="worker" className="text-sm">
              👷 Trabajador (Español)
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </header>
      
      {/* Project/Jobsite selector */}
      <div className="bg-muted/50 px-4 py-2 flex items-center justify-between border-b">
        <div className="flex items-center text-sm">
          <Building className="h-4 w-4 mr-2 text-muted-foreground" />
          {role === 'boss' ? 'Project:' : 'Proyecto:'}
        </div>
        
        <Select value={selectedJobsiteId || ''} onValueChange={setSelectedJobsiteId}>
          <SelectTrigger className="w-[210px] h-8 text-sm">
            <SelectValue placeholder={role === 'boss' ? "Select project..." : "Seleccionar proyecto..."} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="general">
              {role === 'boss' ? "General communication" : "Comunicación general"}
            </SelectItem>
            {jobsites.map((job) => (
              <SelectItem key={job.id} value={job.id.toString()}>
                {job.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      
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
                <div className="text-xs opacity-70 mb-1 flex items-center">
                  {message.role === 'boss' ? '👨‍💼 Boss:' : '👷 Trabajador:'}
                </div>
              )}
              
              {/* Jobsite info - if available */}
              {message.jobsiteName && (
                <div className="text-[10px] mb-1 flex items-center text-muted-foreground">
                  <Building className="h-3 w-3 mr-1 inline" />
                  {message.jobsiteName}
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
              
              {/* Location - if available */}
              {message.location && (
                <div className="text-[10px] mt-1 opacity-70 flex items-center">
                  <MapPin className="h-3 w-3 mr-1 inline" />
                  {message.location.address || 
                    `${message.location.lat.toFixed(4)}, ${message.location.lng.toFixed(4)}`}
                </div>
              )}
              
              {/* Message reactions if any */}
              {message.reactions && Object.keys(message.reactions).length > 0 && (
                <div className="flex flex-wrap gap-1 mt-1">
                  {Object.entries(message.reactions).map(([emoji, userIds]) => (
                    <div 
                      key={emoji} 
                      className="bg-background text-foreground rounded-full px-1.5 py-0.5 flex items-center text-xs cursor-pointer hover:bg-muted"
                      onClick={() => {
                        // Check if current user reacted, if so, remove it
                        if (userIds.includes('1')) {
                          handleRemoveReaction(message.id, emoji);
                        } else {
                          handleEmojiReaction(message.id, emoji);
                        }
                      }}
                    >
                      <span className="mr-1">{emoji}</span>
                      <span className="opacity-70">{userIds.length}</span>
                    </div>
                  ))}
                </div>
              )}
              
              {/* Timestamp with reaction button */}
              <div className="text-[10px] mt-1 opacity-60 flex justify-between items-center">
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="ghost"
                      className="h-6 w-6 rounded-full p-0 opacity-60 hover:opacity-100"
                    >
                      <Smile className="h-3 w-3" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-2" align="start">
                    <div className="flex gap-2">
                      {['👍', '👎', '❤️', '😀', '😢', '🔥', '🚧', '🛠️'].map(emoji => (
                        <button
                          key={emoji}
                          className="text-lg hover:bg-muted p-1 rounded"
                          onClick={() => handleEmojiReaction(message.id, emoji)}
                        >
                          {emoji}
                        </button>
                      ))}
                    </div>
                  </PopoverContent>
                </Popover>
                <span>{new Date(message.timestamp).toLocaleTimeString()}</span>
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
      
      {/* Quick message buttons */}
      <div className="px-4 py-2 bg-muted/30 border-t overflow-x-auto">
        <div className="flex space-x-2">
          {role === 'boss' ? (
            // English quick messages for boss
            <>
              <Button 
                variant="outline" 
                size="sm" 
                className="whitespace-nowrap"
                onClick={() => {
                  setInputText("I'll be late today");
                  setTimeout(() => handleSendMessage(), 100);
                }}
              >
                I'll be late today
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                className="whitespace-nowrap"
                onClick={() => {
                  setInputText("Need more materials");
                  setTimeout(() => handleSendMessage(), 100);
                }}
              >
                Need more materials
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                className="whitespace-nowrap"
                onClick={() => {
                  setInputText("When will the job be done?");
                  setTimeout(() => handleSendMessage(), 100);
                }}
              >
                When will job be done?
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                className="whitespace-nowrap"
                onClick={() => {
                  setInputText("Send more workers");
                  setTimeout(() => handleSendMessage(), 100);
                }}
              >
                Send more workers
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                className="whitespace-nowrap"
                onClick={() => {
                  setInputText("I'll be at the jobsite at 2pm");
                  setTimeout(() => handleSendMessage(), 100);
                }}
              >
                I'll be at jobsite at 2pm
              </Button>
            </>
          ) : (
            // Spanish quick messages for worker
            <>
              <Button 
                variant="outline" 
                size="sm" 
                className="whitespace-nowrap"
                onClick={() => {
                  setInputText("Llegaré tarde hoy");
                  setTimeout(() => handleSendMessage(), 100);
                }}
              >
                Llegaré tarde hoy
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                className="whitespace-nowrap"
                onClick={() => {
                  setInputText("Necesitamos más materiales");
                  setTimeout(() => handleSendMessage(), 100);
                }}
              >
                Necesitamos materiales
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                className="whitespace-nowrap"
                onClick={() => {
                  setInputText("¿Cuándo estará terminado?");
                  setTimeout(() => handleSendMessage(), 100);
                }}
              >
                ¿Cuándo terminará?
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                className="whitespace-nowrap"
                onClick={() => {
                  setInputText("Necesitamos más trabajadores");
                  setTimeout(() => handleSendMessage(), 100);
                }}
              >
                Más trabajadores
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                className="whitespace-nowrap"
                onClick={() => {
                  setInputText("Hay un problema con la electricidad");
                  setTimeout(() => handleSendMessage(), 100);
                }}
              >
                Problema con electricidad
              </Button>
            </>
          )}
        </div>
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
            title={role === 'boss' ? "Speak in English" : "Habla en español"}
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
            title={role === 'boss' ? "Send message" : "Enviar mensaje"}
          >
            <Send />
          </Button>
        </div>
        
        {/* Voice instructions */}
        <div className="mt-2 mb-3 text-sm text-center">
          {isListening ? (
            <div className="text-destructive font-medium animate-pulse">
              {role === 'boss' 
                ? '🎤 Listening... Speak clearly in English' 
                : '🎤 Escuchando... Habla claramente en español'}
            </div>
          ) : (
            <div className="text-muted-foreground">
              {role === 'boss' 
                ? 'Press the microphone button and speak in English' 
                : 'Presiona el botón del micrófono y habla en español'}
            </div>
          )}
        </div>
        
        {/* Service indicators */}
        <div className="text-xs text-muted-foreground mt-2 flex items-center justify-between">
          <div className="flex items-center">
            <BatteryCharging className="h-3 w-3 mr-1" />
            {role === 'boss' 
              ? 'Using OpenAI API for translation (will use Gemma LLM on-device in future)' 
              : 'Usando API de OpenAI para traducción (usará Gemma LLM en el dispositivo en el futuro)'}
          </div>
          
          <div className="flex items-center">
            <MapPin className="h-3 w-3 mr-1" />
            {role === 'boss' 
              ? 'Central Office' 
              : selectedJobsite?.name 
                ? `${selectedJobsite.name} - ${selectedJobsite.address}` 
                : 'On-site'}
          </div>
        </div>
      </div>
    </div>
  );
}