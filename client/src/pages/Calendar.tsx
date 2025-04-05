import React, { useState, useEffect } from 'react';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { BossManImage } from '@/components/BossManImage';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { format, parseISO, isToday, startOfMonth, endOfMonth, isSameDay } from 'date-fns';
import { Calendar as CalendarIcon, Clock, MapPin, Clipboard, MessageSquare } from 'lucide-react';
import { ChatMessage, Jobsite } from '@/types';
import { useWebSocket } from '@/contexts/WebSocketContext';

// Define a union type for calendar events
type CalendarEvent = (Jobsite | ChatMessage) & {
  // Common fields we need to handle both types
  id: number;
  title?: string;
  date: Date;
  endDate?: Date;
  type: 'jobsite' | 'message';
  color: string;
};

export default function Calendar() {
  const [date, setDate] = useState<Date>(new Date());
  const [view, setView] = useState<'month' | 'day' | 'list'>('month');
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { sendMessage } = useWebSocket();

  // Get calendar events from API
  const { data: events = [], isLoading } = useQuery({
    queryKey: ['/api/calendar/events'],
    queryFn: async () => {
      const startDate = startOfMonth(date).toISOString();
      const endDate = endOfMonth(date).toISOString();
      try {
        const response = await apiRequest(`/api/calendar/events?startDate=${startDate}&endDate=${endDate}`);
        return processEvents(response);
      } catch (error) {
        console.error('Error fetching calendar events:', error);
        return [];
      }
    }
  });

  // Convert raw events from API to our CalendarEvent type
  const processEvents = (rawEvents: Array<Jobsite | ChatMessage>): CalendarEvent[] => {
    return rawEvents.map(event => {
      // Determine if this is a jobsite or message
      if ('name' in event) {
        // This is a jobsite
        return {
          ...event,
          title: event.name,
          date: parseISO(event.startDate as string),
          endDate: event.endDate ? parseISO(event.endDate as string) : undefined,
          type: 'jobsite',
          color: '#4f46e5', // Indigo for jobsites
        };
      } else {
        // This is a chat message
        return {
          ...event,
          title: event.eventTitle || 'Event from message',
          date: parseISO(event.timestamp as string),
          type: 'message',
          color: '#10b981', // Green for messages
        };
      }
    });
  };

  // Get events for the selected date
  const getEventsForDate = (date: Date) => {
    return events.filter(event => 
      isSameDay(parseISO(event.date.toISOString()), date)
    );
  };

  // Handle date cell rendering to add dots for events
  const renderDateCell = (day: Date) => {
    const dayEvents = getEventsForDate(day);
    const hasJobsites = dayEvents.some(e => e.type === 'jobsite');
    const hasMessages = dayEvents.some(e => e.type === 'message');

    return (
      <div className="relative w-full h-full p-2">
        <div className={`text-center ${isToday(day) ? 'font-bold' : ''}`}>
          {day.getDate()}
        </div>
        
        {(hasJobsites || hasMessages) && (
          <div className="flex justify-center mt-1 space-x-1">
            {hasJobsites && <div className="h-1.5 w-1.5 rounded-full bg-indigo-500"></div>}
            {hasMessages && <div className="h-1.5 w-1.5 rounded-full bg-green-500"></div>}
          </div>
        )}
      </div>
    );
  };

  // Handle selecting an event
  const handleSelectEvent = (event: CalendarEvent) => {
    setSelectedEvent(event);
  };

  // Create mutation for marking a message as calendar event
  const markAsCalendarEvent = useMutation({
    mutationFn: async ({ messageId, title }: { messageId: number, title: string }) => {
      await apiRequest(`/api/calendar/message/${messageId}/event`, {
        method: 'POST',
        body: JSON.stringify({ title }),
        headers: { 'Content-Type': 'application/json' }
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/calendar/events'] });
      toast({
        title: 'Success',
        description: 'Message marked as calendar event',
      });
    },
    onError: () => {
      toast({
        title: 'Error',
        description: 'Failed to mark message as calendar event',
        variant: 'destructive',
      });
    }
  });

  // Update jobsite dates mutation
  const updateJobsiteDates = useMutation({
    mutationFn: async ({ jobsiteId, startDate, endDate }: { jobsiteId: number, startDate: string, endDate?: string }) => {
      await apiRequest(`/api/calendar/jobsite/${jobsiteId}/dates`, {
        method: 'POST',
        body: JSON.stringify({ startDate, endDate }),
        headers: { 'Content-Type': 'application/json' }
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/calendar/events'] });
      toast({
        title: 'Success',
        description: 'Jobsite dates updated',
      });
    },
    onError: () => {
      toast({
        title: 'Error',
        description: 'Failed to update jobsite dates',
        variant: 'destructive',
      });
    }
  });

  // WebSocket support for realtime calendar event updates
  useEffect(() => {
    // This is the request ID to identify this request
    const requestId = `calendar-events-${Date.now()}`;
    
    // Send a WebSocket request to fetch calendar events
    sendMessage({
      type: 'calendar-event',
      action: 'fetch',
      startDate: startOfMonth(date).toISOString(),
      endDate: endOfMonth(date).toISOString(),
      requestId
    });
    
    // Clean up effect
    return () => {
      // Any cleanup if needed
    };
  }, [date, sendMessage]);

  return (
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
                {isLoading ? 'Loading events...' : `${events.length} events`}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue={view} onValueChange={(value) => setView(value as any)}>
                <TabsContent value="month" className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {events.map(event => (
                      <Card 
                        key={`${event.type}-${event.id}`} 
                        className="cursor-pointer hover:shadow-md transition-shadow"
                        onClick={() => handleSelectEvent(event)}
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
                            <Clock className="h-3.5 w-3.5 mr-1" />
                            {format(event.date, 'MMM do, h:mm a')}
                          </CardDescription>
                        </CardHeader>
                      </Card>
                    ))}
                  </div>
                </TabsContent>

                <TabsContent value="day" className="space-y-4">
                  <div className="space-y-4">
                    {getEventsForDate(date).length > 0 ? (
                      getEventsForDate(date).map(event => (
                        <Card 
                          key={`${event.type}-${event.id}`} 
                          className="cursor-pointer hover:shadow-md transition-shadow"
                          onClick={() => handleSelectEvent(event)}
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
                            <div className="flex items-center text-sm text-muted-foreground">
                              <Clock className="h-3.5 w-3.5 mr-1" />
                              {format(event.date, 'h:mm a')}
                              {event.endDate && ` - ${format(event.endDate, 'h:mm a')}`}
                            </div>
                            {'address' in event && event.address && (
                              <div className="flex items-center mt-2 text-sm text-muted-foreground">
                                <MapPin className="h-3.5 w-3.5 mr-1" />
                                {event.address}
                              </div>
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
                    {events.length > 0 ? (
                      events
                        .sort((a, b) => a.date.getTime() - b.date.getTime())
                        .map(event => (
                          <Card 
                            key={`${event.type}-${event.id}`} 
                            className="cursor-pointer hover:shadow-md transition-shadow"
                            onClick={() => handleSelectEvent(event)}
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

        {/* Event details panel - shown when an event is selected */}
        {selectedEvent && (
          <div className="w-full md:w-80">
            <Card>
              <CardHeader>
                <div className="flex justify-between items-start">
                  <CardTitle>{selectedEvent.title}</CardTitle>
                  <Button variant="ghost" size="sm" onClick={() => setSelectedEvent(null)}>
                    ✕
                  </Button>
                </div>
                <CardDescription>
                  {selectedEvent.type === 'jobsite' ? 'Jobsite Details' : 'Message Event'}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <div className="flex items-center mb-1">
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      <span className="font-medium">Date</span>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {format(selectedEvent.date, 'EEEE, MMMM do, yyyy')}
                    </p>
                    {selectedEvent.endDate && (
                      <p className="text-sm text-muted-foreground mt-1">
                        End: {format(selectedEvent.endDate, 'EEEE, MMMM do, yyyy')}
                      </p>
                    )}
                  </div>

                  <Separator />

                  {selectedEvent.type === 'jobsite' && 'address' in selectedEvent && (
                    <div>
                      <div className="flex items-center mb-1">
                        <MapPin className="mr-2 h-4 w-4" />
                        <span className="font-medium">Location</span>
                      </div>
                      <p className="text-sm text-muted-foreground">{selectedEvent.address}</p>
                    </div>
                  )}

                  {selectedEvent.type === 'jobsite' && 'status' in selectedEvent && (
                    <div>
                      <div className="flex items-center mb-1">
                        <Clipboard className="mr-2 h-4 w-4" />
                        <span className="font-medium">Status</span>
                      </div>
                      <Badge variant={
                        selectedEvent.status.toLowerCase().includes('delay') ? 'destructive' : 
                        selectedEvent.status.toLowerCase().includes('alert') ? 'warning' : 
                        'success'
                      }>
                        {selectedEvent.status}
                      </Badge>
                    </div>
                  )}

                  {selectedEvent.type === 'message' && 'text' in selectedEvent && (
                    <div>
                      <div className="flex items-center mb-1">
                        <MessageSquare className="mr-2 h-4 w-4" />
                        <span className="font-medium">Message</span>
                      </div>
                      <p className="text-sm text-muted-foreground">{selectedEvent.text}</p>
                      {selectedEvent.translatedText && (
                        <div className="mt-2 p-2 bg-muted rounded-md">
                          <p className="text-xs font-medium">Translation:</p>
                          <p className="text-sm">{selectedEvent.translatedText}</p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}