import React, { useState } from 'react';
import { format } from 'date-fns';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';

import { BossManImage } from '@/components/BossManImage';
import { CalendarIcon } from 'lucide-react';

export default function Calendar() {
  // State
  const [date, setDate] = useState<Date>(new Date());
  const [view, setView] = useState<'month' | 'day' | 'list'>('month');

  // Mock data for development - these would come from the API in real implementation
  const mockEvents = [
    {
      id: 1,
      title: 'Westside Project',
      date: new Date('2025-04-06'),
      type: 'jobsite',
      status: 'Delayed (20 min)',
      address: '123 Main St, Building A'
    },
    {
      id: 2,
      title: 'Downtown Renovation',
      date: new Date('2025-04-12'),
      type: 'jobsite',
      status: 'Weather Alert',
      address: '456 Center Ave, Floor 3'
    },
    {
      id: 3,
      title: 'Team Meeting',
      date: new Date('2025-04-05'),
      type: 'message',
      text: 'Team meeting scheduled for tomorrow morning at 8AM'
    }
  ];

  return (
    <div className="flex min-h-screen bg-gray-50">
      <div className="flex-1">
        <div className="container mx-auto px-4 py-8">
          <div className="flex flex-col md:flex-row space-y-4 md:space-y-0 md:space-x-4">
            {/* Calendar sidebar */}
            <div className="w-full md:w-64">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <CalendarIcon className="mr-2 h-5 w-5" />
                    Calendar
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <Tabs defaultValue="month" onValueChange={(value) => setView(value as any)}>
                    <TabsList className="grid w-full grid-cols-3">
                      <TabsTrigger value="month">Month</TabsTrigger>
                      <TabsTrigger value="day">Day</TabsTrigger>
                      <TabsTrigger value="list">List</TabsTrigger>
                    </TabsList>
                  </Tabs>
                  
                  <div className="mt-4">
                    <CalendarComponent
                      mode="single"
                      selected={date}
                      onSelect={(date) => date && setDate(date)}
                      className="rounded-md border"
                    />
                  </div>
                  
                  <div className="mt-4 space-y-2">
                    <div className="flex items-center">
                      <div className="h-3 w-3 rounded-full bg-indigo-500 mr-2"></div>
                      <span className="text-sm">Jobsites</span>
                    </div>
                    <div className="flex items-center">
                      <div className="h-3 w-3 rounded-full bg-green-500 mr-2"></div>
                      <span className="text-sm">Chat Events</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Main content area */}
            <div className="flex-1">
              <Card className="h-full">
                <CardHeader>
                  <CardTitle>
                    {view === 'month' && format(date, 'MMMM yyyy')}
                    {view === 'day' && format(date, 'EEEE, MMMM do, yyyy')}
                    {view === 'list' && 'Event List'}
                  </CardTitle>
                  <CardDescription>
                    {mockEvents.length} events
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Tabs defaultValue={view} onValueChange={(value) => setView(value as any)}>
                    <TabsContent value="month" className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {mockEvents.map(event => (
                          <Card 
                            key={`${event.type}-${event.id}`} 
                            className="cursor-pointer hover:shadow-md transition-shadow"
                          >
                            <CardHeader className="p-4">
                              <div className="flex items-start justify-between">
                                <CardTitle className="text-base">
                                  {event.title}
                                </CardTitle>
                                <Badge 
                                  variant={event.type === 'jobsite' ? 'default' : 'outline'}
                                  className={event.type === 'jobsite' ? 'bg-indigo-500' : 'bg-green-500 text-white'}
                                >
                                  {event.type === 'jobsite' ? 'Jobsite' : 'Message'}
                                </Badge>
                              </div>
                              <CardDescription className="flex items-center mt-1">
                                {format(event.date, 'MMM do, yyyy')}
                              </CardDescription>
                            </CardHeader>
                          </Card>
                        ))}
                      </div>
                    </TabsContent>

                    <TabsContent value="day" className="space-y-4">
                      <div className="space-y-4">
                        {mockEvents.filter(event => 
                          event.date.getDate() === date.getDate() &&
                          event.date.getMonth() === date.getMonth() &&
                          event.date.getFullYear() === date.getFullYear()
                        ).length > 0 ? (
                          mockEvents.filter(event => 
                            event.date.getDate() === date.getDate() &&
                            event.date.getMonth() === date.getMonth() &&
                            event.date.getFullYear() === date.getFullYear()
                          ).map(event => (
                            <Card 
                              key={`${event.type}-${event.id}`} 
                              className="cursor-pointer hover:shadow-md transition-shadow"
                            >
                              <CardHeader className="py-3 px-4">
                                <div className="flex items-start justify-between">
                                  <CardTitle className="text-base">
                                    {event.title}
                                  </CardTitle>
                                  <Badge 
                                    variant={event.type === 'jobsite' ? 'default' : 'outline'}
                                    className={event.type === 'jobsite' ? 'bg-indigo-500' : 'bg-green-500 text-white'}
                                  >
                                    {event.type === 'jobsite' ? 'Jobsite' : 'Message'}
                                  </Badge>
                                </div>
                              </CardHeader>
                              <CardContent className="py-2 px-4">
                                {'status' in event && (
                                  <Badge>{event.status}</Badge>
                                )}
                                {'text' in event && (
                                  <div className="mt-2 text-sm">
                                    {event.text}
                                  </div>
                                )}
                              </CardContent>
                            </Card>
                          ))
                        ) : (
                          <div className="flex flex-col items-center justify-center p-8 text-center">
                            <BossManImage mood="angry" size="md" />
                            <h3 className="mt-4 text-lg font-semibold">No events for this day</h3>
                            <p className="text-muted-foreground">Select another day or create a new event.</p>
                          </div>
                        )}
                      </div>
                    </TabsContent>

                    <TabsContent value="list" className="space-y-4">
                      <div className="space-y-4">
                        {mockEvents.length > 0 ? (
                          mockEvents
                            .sort((a, b) => a.date.getTime() - b.date.getTime())
                            .map(event => (
                              <Card 
                                key={`${event.type}-${event.id}`} 
                                className="cursor-pointer hover:shadow-md transition-shadow"
                              >
                                <CardHeader className="py-3 px-4">
                                  <div className="flex items-center justify-between">
                                    <div>
                                      <CardTitle className="text-base">
                                        {event.title}
                                      </CardTitle>
                                      <CardDescription>
                                        {format(event.date, 'EEE, MMM do')}
                                      </CardDescription>
                                    </div>
                                    <Badge 
                                      variant={event.type === 'jobsite' ? 'default' : 'outline'}
                                      className={event.type === 'jobsite' ? 'bg-indigo-500' : 'bg-green-500 text-white'}
                                    >
                                      {event.type === 'jobsite' ? 'Jobsite' : 'Message'}
                                    </Badge>
                                  </div>
                                </CardHeader>
                              </Card>
                            ))
                        ) : (
                          <div className="flex flex-col items-center justify-center p-8 text-center">
                            <BossManImage mood="angry" size="md" />
                            <h3 className="mt-4 text-lg font-semibold">No events found</h3>
                            <p className="text-muted-foreground">Try changing the selected month or create a new event.</p>
                          </div>
                        )}
                      </div>
                    </TabsContent>
                  </Tabs>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}