import React, { useState } from 'react';
import { VoiceCommandInterface } from '@/components/VoiceCommandInterface';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import BossManCharacter from "../components/BossManCharacter";
import { apiRequest } from '@/lib/queryClient';

interface CommandResult {
  intent: string;
  action: string;
  entities: string[];
  time?: string;
  date?: string;
  priority: 'high' | 'medium' | 'low';
  jobsiteRelevant: boolean;
  requiresResponse: boolean;
  raw?: any;
}

export default function VoiceCommandsPage() {
  const [language, setLanguage] = useState<'en' | 'es'>('en');
  const [lastCommand, setLastCommand] = useState<CommandResult | null>(null);
  const [commandHistory, setCommandHistory] = useState<CommandResult[]>([]);
  const [selectedJobsiteId, setSelectedJobsiteId] = useState<number | null>(null);
  const [commandView, setCommandView] = useState<'basic' | 'advanced'>('basic');
  
  // Process the voice command with our server-side AI
  const processVoiceCommand = async (text: string): Promise<CommandResult> => {
    try {
      // Call server-side API to process the command with Claude AI
      const response = await apiRequest('POST', '/api/voice/process-command', {
        text,
        language,
        jobsiteId: selectedJobsiteId
      });
      
      if (!response.ok) {
        throw new Error('Failed to process voice command');
      }
      
      const data = await response.json();
      
      // Convert API response to our internal format
      return {
        intent: data.intent || 'unknown',
        action: data.action || text,
        entities: data.entities || [],
        time: data.time,
        date: data.date,
        priority: data.priority || 'medium',
        jobsiteRelevant: data.jobsiteRelevant || false,
        requiresResponse: data.requiresResponse || false,
        raw: data
      };
    } catch (error) {
      console.error('Error processing voice command:', error);
      
      // Fallback with basic information
      return {
        intent: 'unknown',
        action: text,
        entities: [],
        priority: 'medium',
        jobsiteRelevant: selectedJobsiteId !== null,
        requiresResponse: text.endsWith('?'),
        raw: { error: true, message: 'Failed to process command' }
      };
    }
  };
  
  // Handle the processed command from VoiceCommandInterface
  const handleCommandProcessed = async (commandText: string) => {
    // Process the command text with our AI
    const result = await processVoiceCommand(commandText);
    
    setLastCommand(result);
    setCommandHistory(prev => [result, ...prev]);
    
    // If this command should create a notification or other side effect,
    // we would handle that here based on the intent
    
    // Voice feedback
    if (result.raw?.response) {
      // In a real implementation, we would use text-to-speech here
      console.log('Voice response:', result.raw.response);
    }
  };
  
  // Get badge color based on priority
  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'bg-red-500';
      case 'medium':
        return 'bg-amber-500';
      case 'low':
        return 'bg-green-500';
      default:
        return 'bg-blue-500';
    }
  };

  return (
    <div className="container mx-auto py-8">
      <div className="flex items-center gap-4 mb-8">
        <BossManCharacter mood="neutral" size="md" />
        <div>
          <h1 className="text-3xl font-bold">Voice Command Center</h1>
          <p className="text-muted-foreground">
            Speak commands to control the BossMan platform
          </p>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Left Column - Voice Interface */}
        <div className="md:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle>Voice Controls</CardTitle>
              <CardDescription>
                Speak commands in English or Spanish
              </CardDescription>
              
              <div className="flex items-center space-x-2 mt-4">
                <Label htmlFor="language-toggle">English</Label>
                <Switch 
                  id="language-toggle" 
                  checked={language === 'es'}
                  onCheckedChange={(checked) => setLanguage(checked ? 'es' : 'en')}
                />
                <Label htmlFor="language-toggle">Español</Label>
              </div>
            </CardHeader>
            
            <CardContent>
              <VoiceCommandInterface 
                language={language}
                onCommandProcessed={handleCommandProcessed}
                jobsiteId={selectedJobsiteId || undefined}
              />
            </CardContent>
          </Card>
        </div>
        
        {/* Right Column - Results and History */}
        <div className="md:col-span-2">
          <Tabs defaultValue="current" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="current">Current Result</TabsTrigger>
              <TabsTrigger value="history">Command History</TabsTrigger>
              <TabsTrigger value="help">Available Commands</TabsTrigger>
            </TabsList>
            
            <TabsContent value="current" className="mt-4">
              <Card>
                <CardHeader>
                  <CardTitle>Command Result</CardTitle>
                  <CardDescription>
                    The processed result of your last voice command
                  </CardDescription>
                  
                  <div className="flex items-center space-x-2 mt-4">
                    <Label htmlFor="view-toggle">Basic View</Label>
                    <Switch 
                      id="view-toggle" 
                      checked={commandView === 'advanced'}
                      onCheckedChange={(checked) => setCommandView(checked ? 'advanced' : 'basic')}
                    />
                    <Label htmlFor="view-toggle">Advanced View</Label>
                  </div>
                </CardHeader>
                
                <CardContent>
                  {lastCommand ? (
                    <div className="space-y-4">
                      <div className="flex items-center gap-2">
                        <Badge>{lastCommand.intent}</Badge>
                        <Badge className={getPriorityColor(lastCommand.priority)}>
                          {lastCommand.priority} priority
                        </Badge>
                        {lastCommand.jobsiteRelevant && (
                          <Badge variant="outline">Job Site Specific</Badge>
                        )}
                      </div>
                      
                      <div className="bg-muted p-4 rounded-md">
                        <h3 className="font-medium">Action</h3>
                        <p>{lastCommand.action}</p>
                        
                        {lastCommand.entities.length > 0 && (
                          <div className="mt-3">
                            <h3 className="font-medium">Entities</h3>
                            <div className="flex flex-wrap gap-2 mt-1">
                              {lastCommand.entities.map((entity, idx) => (
                                <Badge key={idx} variant="secondary">{entity}</Badge>
                              ))}
                            </div>
                          </div>
                        )}
                        
                        {(lastCommand.date || lastCommand.time) && (
                          <div className="mt-3">
                            <h3 className="font-medium">When</h3>
                            <p>{[lastCommand.date, lastCommand.time].filter(Boolean).join(' at ')}</p>
                          </div>
                        )}
                      </div>
                      
                      {commandView === 'advanced' && lastCommand.raw && (
                        <div className="mt-4">
                          <Separator className="my-2" />
                          <h3 className="font-medium mb-2">Raw Command Data</h3>
                          <ScrollArea className="h-[200px] w-full rounded-md border p-4">
                            <pre className="text-xs">{JSON.stringify(lastCommand.raw, null, 2)}</pre>
                          </ScrollArea>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="text-center py-12 text-muted-foreground">
                      <p>No commands processed yet.</p>
                      <p className="text-sm mt-2">Try speaking a command like:</p>
                      <p className="italic mt-1">
                        {language === 'en' 
                          ? '"Schedule material delivery for tomorrow morning"'
                          : '"Programa entrega de materiales para mañana por la mañana"'
                        }
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="history" className="mt-4">
              <Card>
                <CardHeader>
                  <CardTitle>Command History</CardTitle>
                  <CardDescription>
                    Recently processed voice commands
                  </CardDescription>
                </CardHeader>
                
                <CardContent>
                  {commandHistory.length > 0 ? (
                    <ScrollArea className="h-[400px] w-full">
                      <div className="space-y-4">
                        {commandHistory.map((cmd, idx) => (
                          <div key={idx} className="p-4 border rounded-md">
                            <div className="flex items-center justify-between">
                              <Badge>{cmd.intent}</Badge>
                              <Badge className={getPriorityColor(cmd.priority)}>
                                {cmd.priority}
                              </Badge>
                            </div>
                            <p className="mt-2 font-medium">{cmd.action}</p>
                            
                            {cmd.entities.length > 0 && (
                              <div className="flex flex-wrap gap-1 mt-2">
                                {cmd.entities.map((entity, i) => (
                                  <Badge key={i} variant="outline" className="text-xs">
                                    {entity}
                                  </Badge>
                                ))}
                              </div>
                            )}
                            
                            {(cmd.date || cmd.time) && (
                              <p className="text-sm text-muted-foreground mt-2">
                                When: {[cmd.date, cmd.time].filter(Boolean).join(' at ')}
                              </p>
                            )}
                          </div>
                        ))}
                      </div>
                    </ScrollArea>
                  ) : (
                    <div className="text-center py-12 text-muted-foreground">
                      <p>No command history yet.</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="help" className="mt-4">
              <Card>
                <CardHeader>
                  <CardTitle>Available Voice Commands</CardTitle>
                  <CardDescription>
                    Examples of commands you can try
                  </CardDescription>
                </CardHeader>
                
                <CardContent>
                  <ScrollArea className="h-[400px] w-full">
                    <div className="space-y-6">
                      <div>
                        <h3 className="font-medium text-lg mb-2">Scheduling</h3>
                        <ul className="space-y-2">
                          <li className="p-2 bg-muted/50 rounded-md">
                            "Schedule material delivery for tomorrow at 9 AM"
                          </li>
                          <li className="p-2 bg-muted/50 rounded-md">
                            "Move the concrete pour to next Monday"
                          </li>
                          <li className="p-2 bg-muted/50 rounded-md">
                            "Set up inspection for Building B on Friday"
                          </li>
                        </ul>
                      </div>
                      
                      <div>
                        <h3 className="font-medium text-lg mb-2">Reporting</h3>
                        <ul className="space-y-2">
                          <li className="p-2 bg-muted/50 rounded-md">
                            "Report safety issue: missing guardrail on east scaffold"
                          </li>
                          <li className="p-2 bg-muted/50 rounded-md">
                            "Update progress: foundation work 80% complete"
                          </li>
                          <li className="p-2 bg-muted/50 rounded-md">
                            "Log delay: electrical materials not delivered"
                          </li>
                        </ul>
                      </div>
                      
                      <div>
                        <h3 className="font-medium text-lg mb-2">Requests</h3>
                        <ul className="space-y-2">
                          <li className="p-2 bg-muted/50 rounded-md">
                            "Request additional workers for Thursday"
                          </li>
                          <li className="p-2 bg-muted/50 rounded-md">
                            "Order 20 more bags of cement"
                          </li>
                          <li className="p-2 bg-muted/50 rounded-md">
                            "Send blueprints to the plumbing team"
                          </li>
                        </ul>
                      </div>
                      
                      <div>
                        <h3 className="font-medium text-lg mb-2">Alerts</h3>
                        <ul className="space-y-2">
                          <li className="p-2 bg-muted/50 rounded-md">
                            "Send weather alert to all teams on Riverside project"
                          </li>
                          <li className="p-2 bg-muted/50 rounded-md">
                            "Notify everyone about road closure on Main Street"
                          </li>
                          <li className="p-2 bg-muted/50 rounded-md">
                            "Alert: potential delay due to permit issue"
                          </li>
                        </ul>
                      </div>
                      
                      <div>
                        <h3 className="font-medium text-lg mb-2">Information</h3>
                        <ul className="space-y-2">
                          <li className="p-2 bg-muted/50 rounded-md">
                            "Show me today's schedule for Riverside project"
                          </li>
                          <li className="p-2 bg-muted/50 rounded-md">
                            "Get contact information for electrician team"
                          </li>
                          <li className="p-2 bg-muted/50 rounded-md">
                            "Check inventory of drywall materials"
                          </li>
                        </ul>
                      </div>
                      
                      <div className="pt-4">
                        <Separator className="my-2" />
                        <p className="text-sm text-muted-foreground italic">
                          Note: Commands work in both English and Spanish - just toggle the language setting.
                        </p>
                      </div>
                    </div>
                  </ScrollArea>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}