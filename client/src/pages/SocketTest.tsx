import React, { useEffect, useState } from 'react';
import { createWebSocket } from '../lib/webSocket';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

export default function SocketTest() {
  const [status, setStatus] = useState('Disconnected');
  const [messages, setMessages] = useState<string[]>([]);
  const [inputText, setInputText] = useState('');
  const [role, setRole] = useState<'boss' | 'worker'>('boss');
  const [language, setLanguage] = useState<'en' | 'es'>('en');
  const [translatedText, setTranslatedText] = useState('');
  const [originalText, setOriginalText] = useState('');
  const [socket, setSocket] = useState<ReturnType<typeof createWebSocket> | null>(null);
  
  useEffect(() => {
    // Create WebSocket connection
    const webSocketInst = createWebSocket();
    setSocket(webSocketInst);
    
    // Set up message handler
    const cleanup = webSocketInst.onMessage(message => {
      console.log('Received:', message);
      
      // Update status on welcome message
      if (message.type === 'welcome') {
        setStatus('Connected');
        setMessages(prev => [...prev, `[SERVER]: ${message.message}`]);
      }
      
      // Handle chat response
      if (message.type === 'chat-response') {
        setTranslatedText(message.translatedText);
        setOriginalText(message.text);
        setMessages(prev => [...prev, `[TRANSLATED]: ${message.translatedText}`]);
      }
      
      // Handle errors
      if (message.type === 'error') {
        setMessages(prev => [...prev, `[ERROR]: ${message.message}`]);
      }
      
      // Handle echo
      if (message.type === 'echo') {
        setMessages(prev => [...prev, `[ECHO]: ${JSON.stringify(message.originalMessage)}`]);
      }
    });
    
    // Return cleanup function
    return () => {
      cleanup();
    };
  }, []);
  
  const sendMessage = () => {
    if (!socket || !inputText.trim()) return;
    
    // Create message based on role and language
    const message = {
      type: 'chat-message',
      text: inputText,
      role,
      language,
      timestamp: new Date().toISOString(),
      requestId: Date.now().toString()
    };
    
    // Send the message
    socket.sendMessage(message);
    setMessages(prev => [...prev, `[${role.toUpperCase()}]: ${inputText}`]);
    setInputText('');
  };
  
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };
  
  const clearMessages = () => {
    setMessages([]);
    setTranslatedText('');
    setOriginalText('');
  };
  
  return (
    <div className="container mx-auto p-4 max-w-3xl">
      <h1 className="text-2xl font-bold mb-4">WebSocket Translation Test</h1>
      
      <div className="grid grid-cols-1 gap-4 mb-4">
        <Card>
          <CardHeader>
            <CardTitle>Connection Status: <span className={status === 'Connected' ? 'text-green-500' : 'text-red-500'}>{status}</span></CardTitle>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="chat">
              <TabsList className="mb-2">
                <TabsTrigger value="chat">Chat</TabsTrigger>
                <TabsTrigger value="settings">Settings</TabsTrigger>
              </TabsList>
              
              <TabsContent value="chat" className="space-y-4">
                <div className="border rounded-md p-3 h-64 overflow-y-auto bg-muted">
                  {messages.map((msg, idx) => (
                    <div key={idx} className="mb-2">
                      {msg}
                    </div>
                  ))}
                </div>
                
                <div className="flex">
                  <Button 
                    onClick={clearMessages}
                    variant="outline" 
                    className="mr-2"
                  >
                    Clear
                  </Button>
                  
                  <Button 
                    onClick={() => {
                      if (socket) {
                        socket.sendMessage({ type: 'ping', timestamp: new Date().toISOString() });
                        setMessages(prev => [...prev, '[CLIENT]: Sent ping']);
                      }
                    }}
                    variant="outline"
                  >
                    Ping
                  </Button>
                </div>
                
                {translatedText && (
                  <Card className="bg-primary/5">
                    <CardContent className="pt-4">
                      <p className="text-sm text-muted-foreground">Original: {originalText}</p>
                      <p className="font-medium">Translated: {translatedText}</p>
                    </CardContent>
                  </Card>
                )}
                
                <div className="flex">
                  <Textarea
                    value={inputText}
                    onChange={(e) => setInputText(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="Type a message to translate..."
                    className="resize-none mr-2"
                    rows={2}
                  />
                  <Button onClick={sendMessage} disabled={!inputText.trim() || status !== 'Connected'}>
                    Send
                  </Button>
                </div>
              </TabsContent>
              
              <TabsContent value="settings">
                <div className="space-y-4">
                  <div>
                    <h3 className="font-medium mb-2">Role</h3>
                    <div className="flex space-x-2">
                      <Button
                        variant={role === 'boss' ? 'default' : 'outline'}
                        onClick={() => setRole('boss')}
                      >
                        Boss
                      </Button>
                      <Button
                        variant={role === 'worker' ? 'default' : 'outline'}
                        onClick={() => setRole('worker')}
                      >
                        Worker
                      </Button>
                    </div>
                  </div>
                  
                  <div>
                    <h3 className="font-medium mb-2">Language</h3>
                    <div className="flex space-x-2">
                      <Button
                        variant={language === 'en' ? 'default' : 'outline'}
                        onClick={() => setLanguage('en')}
                      >
                        English
                      </Button>
                      <Button
                        variant={language === 'es' ? 'default' : 'outline'}
                        onClick={() => setLanguage('es')}
                      >
                        Spanish
                      </Button>
                    </div>
                  </div>
                  
                  <div className="pt-2">
                    <p className="text-sm text-muted-foreground">
                      Current mode: {role === 'boss' ? 'Boss' : 'Worker'} speaking in {language === 'en' ? 'English' : 'Spanish'}
                    </p>
                    {(role === 'boss' && language === 'en') || (role === 'worker' && language === 'es') ? (
                      <p className="text-sm text-green-600 mt-1">
                        ✓ This is a natural configuration. Translation will work as expected.
                      </p>
                    ) : (
                      <p className="text-sm text-yellow-600 mt-1">
                        ⚠️ This is a less common configuration. {role === 'boss' ? 'Bosses' : 'Workers'} typically speak in {role === 'boss' ? 'English' : 'Spanish'}.
                      </p>
                    )}
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}