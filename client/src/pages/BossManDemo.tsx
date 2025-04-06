import React, { useState } from 'react';
import BossManCharacter from '../components/BossManCharacter.tsx';
import { Button } from '@/components/ui/button';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { AlertTriangle, MessageSquare, Construction, Calendar, MapPin, User } from 'lucide-react';

const BossManDemo = () => {
  const [mood, setMood] = useState<'neutral' | 'happy' | 'angry' | 'confused' | 'excited' | 'concerned'>('neutral');
  const [message, setMessage] = useState<string>('Hello, I\'m BossMan! I help you manage your construction projects.');
  
  const handleMoodChange = (newMood: 'neutral' | 'happy' | 'angry' | 'confused' | 'excited' | 'concerned') => {
    setMood(newMood);
    
    // Set a default message for each mood
    switch (newMood) {
      case 'neutral':
        setMessage('Hello, I\'m BossMan! I help you manage your construction projects.');
        break;
      case 'happy':
        setMessage('Great job on completing the project ahead of schedule!');
        break;
      case 'angry':
        setMessage('WHERE ARE THOSE MATERIALS?! They were supposed to be here yesterday!');
        break;
      case 'confused':
        setMessage('Wait, why is the concrete truck at the wrong site?');
        break;
      case 'excited':
        setMessage('We just got approved for that big downtown project!');
        break;
      case 'concerned':
        setMessage('There\'s a storm warning for tomorrow. We should secure the site.');
        break;
    }
  };

  // Sample construction commands
  const commands = [
    "Schedule inspection for Downtown site on Friday",
    "Tell Juan we need more concrete at Eastside construction",
    "Log a safety incident at the Main Street project",
    "Order more lumber for the Johnson project",
    "Update client about weather delay at North Hills",
    "Set up a meeting with all foremen on Monday"
  ];
  
  // Sample construction alerts
  const alerts = [
    { type: 'weather', message: 'Heavy rain expected at Downtown site', severity: 'warning' },
    { type: 'safety', message: 'Safety harness inspection needed at Riverside', severity: 'critical' },
    { type: 'delay', message: 'Material delivery delayed at Westside', severity: 'warning' },
    { type: 'personnel', message: 'Crew shortage at Lakefront project', severity: 'info' }
  ];
  
  return (
    <div className="container py-8">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold mb-2">BossMan Character Demo</h1>
        <p className="text-xl text-muted-foreground">
          An expressive mascot for our construction management platform
        </p>
      </div>
      
      <div className="grid md:grid-cols-2 gap-8">
        <div>
          <Card className="mb-8">
            <CardHeader>
              <CardTitle>Meet BossMan</CardTitle>
              <CardDescription>
                Our Pixar-inspired construction manager character
              </CardDescription>
            </CardHeader>
            <CardContent className="flex justify-center py-8">
              <BossManCharacter 
                mood={mood} 
                message={message} 
                size="xl"
              />
            </CardContent>
            <CardFooter className="flex flex-wrap gap-2 justify-center">
              <Button 
                variant={mood === 'neutral' ? 'default' : 'outline'} 
                onClick={() => handleMoodChange('neutral')}
              >
                Neutral
              </Button>
              <Button 
                variant={mood === 'happy' ? 'default' : 'outline'} 
                onClick={() => handleMoodChange('happy')}
              >
                Happy
              </Button>
              <Button 
                variant={mood === 'angry' ? 'default' : 'outline'} 
                onClick={() => handleMoodChange('angry')}
              >
                Angry
              </Button>
              <Button 
                variant={mood === 'confused' ? 'default' : 'outline'} 
                onClick={() => handleMoodChange('confused')}
              >
                Confused
              </Button>
              <Button 
                variant={mood === 'excited' ? 'default' : 'outline'} 
                onClick={() => handleMoodChange('excited')}
              >
                Excited
              </Button>
              <Button 
                variant={mood === 'concerned' ? 'default' : 'outline'} 
                onClick={() => handleMoodChange('concerned')}
              >
                Concerned
              </Button>
            </CardFooter>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>BossMan in Different Contexts</CardTitle>
              <CardDescription>
                How BossMan appears across the application
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="chat">
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="chat">Chat</TabsTrigger>
                  <TabsTrigger value="alerts">Alerts</TabsTrigger>
                  <TabsTrigger value="commands">Commands</TabsTrigger>
                </TabsList>
                
                <TabsContent value="chat" className="p-4">
                  <div className="flex items-start mb-4">
                    <BossManCharacter 
                      mood="neutral" 
                      message="Good morning! There are 3 active projects today." 
                      size="md"
                    />
                  </div>
                  <div className="flex justify-end mb-4">
                    <div className="bg-primary/10 rounded-lg p-3 max-w-xs">
                      <p className="text-sm">What's the status of the Downtown project?</p>
                    </div>
                  </div>
                  <div className="flex items-start">
                    <BossManCharacter 
                      mood="happy" 
                      message="Downtown project is on schedule. Materials delivered yesterday, and the team is making good progress!" 
                      size="md"
                    />
                  </div>
                </TabsContent>
                
                <TabsContent value="alerts" className="space-y-4 p-4">
                  {alerts.map((alert, index) => (
                    <div key={index} className="flex items-start">
                      <BossManCharacter 
                        mood={alert.severity === 'critical' ? 'angry' : 
                              alert.severity === 'warning' ? 'concerned' : 'neutral'} 
                        showSpeechBubble={false}
                        size="sm"
                      />
                      <div className={`ml-2 p-3 rounded-lg flex-1 ${
                        alert.severity === 'critical' ? 'bg-red-100 text-red-800' : 
                        alert.severity === 'warning' ? 'bg-yellow-100 text-yellow-800' : 
                        'bg-blue-100 text-blue-800'
                      }`}>
                        <div className="flex items-center">
                          {alert.type === 'weather' && <AlertTriangle className="w-4 h-4 mr-1" />}
                          {alert.type === 'safety' && <Construction className="w-4 h-4 mr-1" />}
                          {alert.type === 'delay' && <Calendar className="w-4 h-4 mr-1" />}
                          {alert.type === 'personnel' && <User className="w-4 h-4 mr-1" />}
                          <p className="text-sm font-medium">{alert.message}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </TabsContent>
                
                <TabsContent value="commands" className="p-4">
                  <div className="space-y-3">
                    {commands.map((command, index) => (
                      <div key={index} className="flex items-center p-2 rounded-lg hover:bg-gray-50 transition-colors">
                        <BossManCharacter 
                          mood="neutral" 
                          showSpeechBubble={false}
                          size="sm"
                        />
                        <div className="ml-3 flex-1">
                          <div className="flex items-center">
                            <MessageSquare className="w-4 h-4 text-gray-500 mr-2" />
                            <p className="text-sm">{command}</p>
                          </div>
                        </div>
                        <Button variant="ghost" size="sm">Run</Button>
                      </div>
                    ))}
                  </div>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </div>
        
        <div>
          <Card className="mb-8">
            <CardHeader>
              <CardTitle>Application Integration</CardTitle>
              <CardDescription>
                How BossMan enhances the user experience
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="text-lg font-medium mb-2 flex items-center">
                  <MessageSquare className="w-5 h-5 mr-2 text-primary" />
                  Voice Command Interface
                </h3>
                <p className="text-sm text-gray-600 mb-4">
                  BossMan processes natural language commands and responds appropriately.
                </p>
                <div className="flex items-start bg-white p-4 rounded-md shadow-sm border">
                  <BossManCharacter 
                    mood="neutral" 
                    message="How can I help you today, boss?" 
                    size="md"
                  />
                </div>
                <div className="mt-4 bg-gray-100 p-3 rounded-md">
                  <div className="flex items-center text-sm text-gray-600">
                    <svg className="w-4 h-4 mr-2" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M12 18.75C15.3137 18.75 18 16.0637 18 12.75V11.25M12 18.75C8.68629 18.75 6 16.0637 6 12.75V11.25M12 18.75V22.5M8.25 22.5H15.75M12 15.75C10.3431 15.75 9 14.4069 9 12.75V4.5C9 2.84315 10.3431 1.5 12 1.5C13.6569 1.5 15 2.84315 15 4.5V12.75C15 14.4069 13.6569 15.75 12 15.75Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                    Try saying: "Send a message to the crew about tomorrow's schedule change"
                  </div>
                </div>
              </div>
              
              <Separator />
              
              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="text-lg font-medium mb-2 flex items-center">
                  <MapPin className="w-5 h-5 mr-2 text-primary" />
                  Jobsite Monitoring
                </h3>
                <p className="text-sm text-gray-600 mb-4">
                  BossMan alerts you to important events at your construction sites.
                </p>
                <div className="flex items-start bg-white p-4 rounded-md shadow-sm border">
                  <BossManCharacter 
                    mood="concerned" 
                    message="Weather alert: Heavy rain expected at the Downtown site tomorrow. Should I notify the crew?" 
                    size="md"
                  />
                </div>
                <div className="mt-3 flex space-x-2">
                  <Button size="sm" variant="default">Yes, notify them</Button>
                  <Button size="sm" variant="outline">Not now</Button>
                </div>
              </div>
              
              <Separator />
              
              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="text-lg font-medium mb-2 flex items-center">
                  <Calendar className="w-5 h-5 mr-2 text-primary" />
                  Schedule Management
                </h3>
                <p className="text-sm text-gray-600 mb-4">
                  BossMan helps you keep track of your project timelines.
                </p>
                <div className="flex items-start bg-white p-4 rounded-md shadow-sm border">
                  <BossManCharacter 
                    mood="excited" 
                    message="I've analyzed your schedule and found a way to optimize the crew allocation. Want to see the suggested changes?" 
                    size="md"
                  />
                </div>
                <div className="mt-3 flex space-x-2">
                  <Button size="sm" variant="default">Show me</Button>
                  <Button size="sm" variant="outline">Later</Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default BossManDemo;