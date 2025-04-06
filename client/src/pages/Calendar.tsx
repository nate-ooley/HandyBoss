import React, { useState, useEffect } from 'react';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { BossManImage } from '@/components/BossManImage';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { SideNavigation } from '@/components/SideNavigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { format, parseISO, isToday, startOfMonth, endOfMonth, isSameDay, startOfDay, endOfDay } from 'date-fns';
import { 
  Calendar as CalendarIcon, 
  Clock, 
  MapPin, 
  Search, 
  Download, 
  ChevronLeft, 
  ChevronRight, 
  MessageSquare, 
  X 
} from 'lucide-react';
import { ChatMessage, Jobsite } from '@/types';
import { useWebSocket } from '@/contexts/WebSocketContext';

// Define a union type for calendar events
type CalendarEvent = {
  id: number;
  title: string;
  date: Date;
  endDate?: Date;
  type: 'jobsite' | 'message';
  color: string;
  address?: string; // For jobsites
  status?: string; // For jobsites
  description?: string; // For jobsites
  text?: string; // For messages
  translatedText?: string; // For messages
  [key: string]: any; // Allow for other properties from either type
};

export default function Calendar() {
  // State
  const [date, setDate] = useState<Date>(new Date());
  const [view, setView] = useState<'month' | 'day' | 'list'>('month');
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [filteredEvents, setFilteredEvents] = useState<CalendarEvent[]>([]);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { sendMessage, lastMessage } = useWebSocket();

  // Get calendar events from API
  const { data: events = [], isLoading } = useQuery({
    queryKey: ['/api/calendar/events', startOfMonth(date).toISOString(), endOfMonth(date).toISOString()],
    queryFn: async () => {
      const startDate = startOfMonth(date).toISOString();
      const endDate = endOfMonth(date).toISOString();
      try {
        // Use apiRequest with proper method and query params
        const response = await apiRequest('GET', `/api/calendar/events?startDate=${startDate}&endDate=${endDate}`);
        const data = await response.json();
        return processEvents(data);
      } catch (error) {
        console.error('Error fetching calendar events:', error);
        return [];
      }
    }
  });

  // Convert raw events from API to our CalendarEvent type
  const processEvents = (rawEvents: Array<Jobsite | ChatMessage>): CalendarEvent[] => {
    if (!Array.isArray(rawEvents)) {
      console.error('Expected array of events, got:', rawEvents);
      return [];
    }
    
    return rawEvents.map(event => {
      // Determine if this is a jobsite or message
      if ('name' in event) {
        // This is a jobsite
        return {
          id: typeof event.id === 'string' ? parseInt(event.id) : event.id,
          title: event.name,
          date: parseISO(event.startDate as string),
          endDate: event.endDate ? parseISO(event.endDate as string) : undefined,
          type: 'jobsite',
          color: '#4f46e5', // Indigo for jobsites
          address: event.address,
          status: event.status,
          description: event.description,
        };
      } else {
        // This is a chat message
        return {
          id: typeof event.id === 'string' ? parseInt(event.id) : event.id,
          title: event.eventTitle || 'Chat message',
          date: parseISO(event.timestamp as string),
          type: 'message',
          color: '#10b981', // Green for messages
          text: event.text,
          translatedText: event.translatedText,
        };
      }
    });
  };

  // Filter events based on search query
  useEffect(() => {
    if (!events) return;
    
    if (!searchQuery.trim()) {
      setFilteredEvents(events);
      return;
    }
    
    const query = searchQuery.toLowerCase().trim();
    const filtered = events.filter(event => {
      // Search in title
      if (event.title.toLowerCase().includes(query)) return true;
      
      // Search in message text if it's a message
      if (event.type === 'message' && event.text && 
          event.text.toLowerCase().includes(query)) {
        return true;
      }
      
      // Search in address if it's a jobsite
      if (event.type === 'jobsite' && event.address && 
          event.address.toLowerCase().includes(query)) {
        return true;
      }
      
      return false;
    });
    
    setFilteredEvents(filtered);
  }, [searchQuery, events]);

  // Get events for the selected date
  const getEventsForDate = (day: Date) => {
    return filteredEvents.filter(event => 
      isSameDay(parseISO(event.date.toISOString()), day)
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

  // Handle month navigation
  const goToPreviousMonth = () => {
    const newDate = new Date(date);
    newDate.setMonth(newDate.getMonth() - 1);
    setDate(newDate);
  };

  const goToNextMonth = () => {
    const newDate = new Date(date);
    newDate.setMonth(newDate.getMonth() + 1);
    setDate(newDate);
  };

  const goToToday = () => {
    setDate(new Date());
  };

  // Generate iCalendar file for export
  const generateICalFile = () => {
    // Only include project/jobsite events in the export
    const jobsiteEvents = filteredEvents.filter(event => event.type === 'jobsite');
    
    let icalContent = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//HandyBoss//Calendar//EN',
      'CALSCALE:GREGORIAN',
      'METHOD:PUBLISH'
    ];

    // Add each jobsite event as a VEVENT
    jobsiteEvents.forEach(event => {
      const startDate = format(event.date, "yyyyMMdd'T'HHmmss");
      const endDate = event.endDate 
        ? format(event.endDate, "yyyyMMdd'T'HHmmss")
        : format(new Date(event.date.getTime() + 3600000), "yyyyMMdd'T'HHmmss"); // Default 1 hour
      
      icalContent = [
        ...icalContent,
        'BEGIN:VEVENT',
        `UID:${event.id}@handyboss.com`,
        `DTSTAMP:${format(new Date(), "yyyyMMdd'T'HHmmss")}`,
        `DTSTART:${startDate}`,
        `DTEND:${endDate}`,
        `SUMMARY:${event.title}`,
        `DESCRIPTION:${event.type === 'jobsite' ? `Project at ${event.address || 'N/A'}` : 'N/A'}`,
        'END:VEVENT'
      ];
    });

    icalContent.push('END:VCALENDAR');
    
    // Create the file and trigger download
    const blob = new Blob([icalContent.join('\r\n')], { type: 'text/calendar' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.style.display = 'none';
    a.href = url;
    a.download = `handyboss-calendar-${format(new Date(), 'yyyy-MM-dd')}.ics`;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
    
    toast({
      title: 'Calendar exported',
      description: 'Your calendar has been exported as an iCal file.'
    });
  };

  // Listen for WebSocket real-time updates
  useEffect(() => {
    if (lastMessage && lastMessage.type === 'calendar-event-update') {
      // Invalidate the calendar events query to trigger a refresh
      queryClient.invalidateQueries({ queryKey: ['/api/calendar/events'] });
      
      const { action, event } = lastMessage;
      
      // Show appropriate toast notification
      if (action === 'create') {
        toast({
          title: 'New Calendar Event',
          description: `${event.name || event.eventTitle || 'Event'} has been added to the calendar`,
          duration: 3000,
        });
      } else if (action === 'update') {
        toast({
          title: 'Calendar Event Updated',
          description: `${event.name || 'Event'} details have been updated`,
          duration: 3000,
        });
      }
    }
  }, [lastMessage, queryClient, toast]);

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
    <div className="flex min-h-screen bg-gray-50">
      <SideNavigation />
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
                    <div className="flex justify-between items-center mb-2">
                      <Button variant="outline" size="sm" onClick={goToPreviousMonth}>
                        <ChevronLeft className="h-4 w-4" />
                      </Button>
                      <Button variant="outline" size="sm" onClick={goToToday}>
                        Today
                      </Button>
                      <Button variant="outline" size="sm" onClick={goToNextMonth}>
                        <ChevronRight className="h-4 w-4" />
                      </Button>
                    </div>
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
                      <span className="text-sm">Projects</span>
                    </div>
                    <div className="flex items-center">
                      <div className="h-3 w-3 rounded-full bg-green-500 mr-2"></div>
                      <span className="text-sm">Chat Messages</span>
                    </div>
                  </div>
                  
                  <div className="mt-4">
                    <Button 
                      variant="outline" 
                      className="w-full" 
                      onClick={generateICalFile}
                    >
                      <Download className="mr-2 h-4 w-4" />
                      Export Calendar
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Main content area */}
            <div className="flex-1">
              <Card className="h-full">
                <CardHeader>
                  <div className="flex justify-between items-center">
                    <CardTitle>
                      {view === 'month' && format(date, 'MMMM yyyy')}
                      {view === 'day' && format(date, 'EEEE, MMMM do, yyyy')}
                      {view === 'list' && 'Event List'}
                    </CardTitle>
                    <div className="flex items-center space-x-2">
                      <div className="relative">
                        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input
                          type="search"
                          placeholder="Search events..."
                          className="pl-8 w-[200px]"
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                        />
                        {searchQuery && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="absolute right-0 top-0 h-9 w-9 p-0"
                            onClick={() => setSearchQuery('')}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                  <CardDescription>
                    {isLoading 
                      ? 'Loading events...' 
                      : searchQuery
                        ? `${filteredEvents.length} events found`
                        : `${events.length} events in ${format(date, 'MMMM')}`
                    }
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Tabs defaultValue={view} onValueChange={(value) => setView(value as any)}>
                    <TabsContent value="month" className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {filteredEvents.map(event => (
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
                                  {event.type === 'jobsite' ? 'Project' : 'Message'}
                                </Badge>
                              </div>
                              <CardDescription className="flex items-center mt-1">
                                <Clock className="h-3.5 w-3.5 mr-1" />
                                {format(event.date, 'MMM do, h:mm a')}
                              </CardDescription>
                            </CardHeader>
                          </Card>
                        ))}
                        
                        {filteredEvents.length === 0 && !isLoading && (
                          <div className="col-span-3 flex flex-col items-center justify-center p-8 text-center">
                            <BossManImage mood="angry" size="md" />
                            <h3 className="mt-4 text-lg font-semibold">No events found</h3>
                            <p className="text-muted-foreground">
                              {searchQuery 
                                ? "Try changing your search criteria" 
                                : "No events scheduled for this month"}
                            </p>
                          </div>
                        )}
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
                                    {event.type === 'jobsite' ? 'Project' : 'Message'}
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
                                    <MessageSquare className="h-3.5 w-3.5 mr-1 inline-block" />
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
                        {filteredEvents.length > 0 ? (
                          filteredEvents
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
                                      {event.type === 'jobsite' ? 'Project' : 'Message'}
                                    </Badge>
                                  </div>
                                </CardHeader>
                              </Card>
                            ))
                        ) : (
                          <div className="flex flex-col items-center justify-center p-8 text-center">
                            <BossManImage mood="angry" size="md" />
                            <h3 className="mt-4 text-lg font-semibold">No events found</h3>
                            <p className="text-muted-foreground">
                              {searchQuery 
                                ? "Try changing your search criteria" 
                                : "Try changing the selected month"}
                            </p>
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
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                    <CardDescription>
                      {selectedEvent.type === 'jobsite' ? 'Project Details' : 'Message Details'}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div>
                        <h4 className="text-sm font-medium mb-1">Date & Time</h4>
                        <div className="flex items-center text-sm">
                          <Clock className="h-3.5 w-3.5 mr-1 text-muted-foreground" />
                          {format(selectedEvent.date, 'EEEE, MMMM do, yyyy')}
                        </div>
                        <div className="text-sm ml-5">
                          {format(selectedEvent.date, 'h:mm a')}
                          {selectedEvent.endDate && ` - ${format(selectedEvent.endDate, 'h:mm a')}`}
                        </div>
                      </div>
                      
                      {selectedEvent.type === 'jobsite' && (
                        <>
                          <div>
                            <h4 className="text-sm font-medium mb-1">Address</h4>
                            <div className="flex items-center text-sm">
                              <MapPin className="h-3.5 w-3.5 mr-1 text-muted-foreground" />
                              {selectedEvent.address || 'No address provided'}
                            </div>
                          </div>
                          
                          {selectedEvent.status && (
                            <div>
                              <h4 className="text-sm font-medium mb-1">Status</h4>
                              <Badge>{selectedEvent.status}</Badge>
                            </div>
                          )}
                          
                          {selectedEvent.description && (
                            <div>
                              <h4 className="text-sm font-medium mb-1">Description</h4>
                              <p className="text-sm">{selectedEvent.description}</p>
                            </div>
                          )}
                          
                          {selectedEvent.progress !== undefined && (
                            <div>
                              <h4 className="text-sm font-medium mb-1">Progress</h4>
                              <div className="w-full bg-gray-200 rounded-full h-2.5">
                                <div 
                                  className="bg-primary h-2.5 rounded-full" 
                                  style={{ width: `${selectedEvent.progress}%` }}
                                ></div>
                              </div>
                              <p className="text-xs text-right mt-1">{selectedEvent.progress}%</p>
                            </div>
                          )}
                        </>
                      )}
                      
                      {selectedEvent.type === 'message' && (
                        <div>
                          <h4 className="text-sm font-medium mb-1">Message</h4>
                          <div className="border rounded-md p-3 bg-slate-50">
                            <p className="text-sm">{selectedEvent.text}</p>
                            {selectedEvent.translatedText && (
                              <>
                                <Separator className="my-2" />
                                <p className="text-sm text-muted-foreground italic">
                                  {selectedEvent.translatedText}
                                </p>
                              </>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  </CardContent>
                  <CardFooter>
                    {selectedEvent.type === 'jobsite' && (
                      <Button className="w-full" variant="outline">
                        View Project Details
                      </Button>
                    )}
                  </CardFooter>
                </Card>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}