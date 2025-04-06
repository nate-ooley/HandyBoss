import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { BossManImage } from '@/components/BossManImage';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { SideNavigation } from '@/components/SideNavigation';
import { MobileNavigation } from '@/components/MobileNavigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { format, parseISO, isToday, startOfMonth, endOfMonth, isSameDay, startOfDay, endOfDay, addDays, subDays } from 'date-fns';
import useEmblaCarousel from 'embla-carousel-react';
import { 
  Calendar as CalendarIcon, 
  Clock, 
  MapPin, 
  Search, 
  Download, 
  ChevronLeft, 
  ChevronRight, 
  MessageSquare, 
  X,
  MoveRight,
  MoveLeft 
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
  const [view, setView] = useState<'month' | 'day' | 'list'>('day');
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [filteredEvents, setFilteredEvents] = useState<CalendarEvent[]>([]);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { sendMessage, lastMessage } = useWebSocket();
  
  // Embla carousel for day view
  const [emblaRef, emblaApi] = useEmblaCarousel({ 
    loop: false,
    align: 'center',
    containScroll: 'trimSnaps',
    dragFree: true
  });
  const daysChanging = useRef<boolean>(false); // Ref to prevent infinite loops
  const [dayViewIndex, setDayViewIndex] = useState(0);
  const [days, setDays] = useState<Date[]>([]);
  const [eventTypeFilter, setEventTypeFilter] = useState<'all' | 'jobsite' | 'message'>('all');

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
    return filteredEvents.filter(event => {
      // First filter by date
      const matchesDate = isSameDay(parseISO(event.date.toISOString()), day);
      
      // Then filter by event type if a specific filter is active
      if (eventTypeFilter !== 'all') {
        return matchesDate && event.type === eventTypeFilter;
      }
      
      return matchesDate;
    });
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
  
  // Optional: WebSocket support for notifying other users about views
  // We've removed the WebSocket-based data fetching to prevent infinite loops
  // Now we're only using React Query for data fetching
  
  // Generate days for carousel view
  useEffect(() => {
    if (view === 'day') {
      // Generate 7 days, 3 before and 3 after the selected date
      const daysArray = [];
      for (let i = -3; i <= 3; i++) {
        daysArray.push(addDays(date, i));
      }
      setDays(daysArray);
    }
  }, [date, view]);
  
  // Handle scrolling to center day when view changes or emblaApi is initialized
  useEffect(() => {
    if (emblaApi && view === 'day' && !daysChanging.current) {
      // The middle index (3) should be the selected date
      emblaApi.scrollTo(3);
      setDayViewIndex(3);
    }
  }, [emblaApi, view]);
  
  // Listen for carousel slide changes
  useEffect(() => {
    if (!emblaApi || view !== 'day') return;
    
    const onSelect = () => {
      // Get the current index
      const index = emblaApi.selectedScrollSnap();
      
      // Only update if the index has actually changed to prevent loops
      if (index !== dayViewIndex) {
        setDayViewIndex(index);
        
        // Only update the date if this wasn't triggered by a date change
        if (!daysChanging.current && days[index]) {
          daysChanging.current = true;
          // Using setTimeout to break the potential infinite loop
          setTimeout(() => {
            setDate(days[index]);
            // Reset flag after a delay to prevent update loops
            setTimeout(() => {
              daysChanging.current = false;
            }, 100);
          }, 0);
        }
      }
    };
    
    emblaApi.on('select', onSelect);
    return () => {
      emblaApi.off('select', onSelect);
    };
  }, [emblaApi, days, dayViewIndex, view]);
  
  // Navigation for day view
  const goToPreviousDay = useCallback(() => {
    if (emblaApi && emblaApi.canScrollPrev()) {
      emblaApi.scrollPrev();
    } else {
      setDate(subDays(date, 1));
    }
  }, [emblaApi, date]);
  
  const goToNextDay = useCallback(() => {
    if (emblaApi && emblaApi.canScrollNext()) {
      emblaApi.scrollNext();
    } else {
      setDate(addDays(date, 1));
    }
  }, [emblaApi, date]);

  return (
    <div className="flex min-h-screen bg-gray-50">
      {/* Hide sidebar on smaller screens, show on larger (iPad and up) */}
      <div className="hidden md:block">
        <SideNavigation />
      </div>
      <div className="flex-1">
        <div className="container mx-auto px-2 sm:px-4 py-4 sm:py-6">
          <div className="flex flex-col space-y-3 sm:space-y-4">
            {/* Top section with view selector and controls - Mobile-optimized */}
            <Card className="shadow-sm">
              <CardHeader className="py-3 px-3 sm:p-6">
                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center space-y-2 sm:space-y-0">
                  <div className="flex justify-between items-center w-full sm:w-auto">
                    <CardTitle className="flex items-center text-lg">
                      <CalendarIcon className="mr-2 h-5 w-5" />
                      Calendar
                    </CardTitle>
                    
                    {/* Mobile menu button - visible on small screens */}
                    <div className="block sm:hidden">
                      <Tabs defaultValue="day" value={view} onValueChange={(value) => setView(value as any)}>
                        <TabsList className="grid grid-cols-3 w-full">
                          <TabsTrigger value="day" className="text-xs py-1.5">Day</TabsTrigger>
                          <TabsTrigger value="month" className="text-xs py-1.5">Month</TabsTrigger>
                          <TabsTrigger value="list" className="text-xs py-1.5">List</TabsTrigger>
                        </TabsList>
                      </Tabs>
                    </div>
                  </div>
                  
                  {/* Tablet/Desktop view selector - hidden on mobile */}
                  <div className="hidden sm:block">
                    <Tabs defaultValue="day" value={view} onValueChange={(value) => setView(value as any)}>
                      <TabsList className="grid grid-cols-3">
                        <TabsTrigger value="day">Day</TabsTrigger>
                        <TabsTrigger value="month">Month</TabsTrigger>
                        <TabsTrigger value="list">List</TabsTrigger>
                      </TabsList>
                    </Tabs>
                  </div>
                </div>
              </CardHeader>
            </Card>
            
            {/* Main content area */}
            <div className="flex flex-col lg:flex-row gap-3 sm:gap-4">
              {/* Main content section */}
              <div className="flex-1">
                <Card className="h-full shadow-sm">
                  <CardHeader className="py-3 px-3 sm:p-6">
                    <div className="flex flex-col space-y-3 sm:space-y-0 sm:flex-row sm:justify-between sm:items-center">
                      <CardTitle className="text-base sm:text-lg order-1">
                        {view === 'month' && format(date, 'MMM yyyy')}
                        {view === 'day' && format(date, 'EEE, MMM do')}
                        {view === 'list' && 'Event List'}
                      </CardTitle>

                      {/* Controls that stack on mobile */}
                      <div className="flex flex-col space-y-2 sm:flex-row sm:space-y-0 sm:space-x-2 order-3 sm:order-2">
                        {/* Filters section - now stacks on mobile, showing filters only when needed */}
                        <div className="flex items-center justify-between sm:justify-start space-x-2">
                          {/* Event type filter */}
                          <Select value={eventTypeFilter} onValueChange={(value) => setEventTypeFilter(value as 'all' | 'jobsite' | 'message')}>
                            <SelectTrigger className="w-[130px] sm:w-[140px] text-xs sm:text-sm h-8 sm:h-10">
                              <SelectValue placeholder="Filter by type" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="all">All Events</SelectItem>
                              <SelectItem value="jobsite">Projects Only</SelectItem>
                              <SelectItem value="message">Messages Only</SelectItem>
                            </SelectContent>
                          </Select>
                          
                          {/* Search input - smaller on mobile */}
                          <div className="relative flex-1 sm:flex-none">
                            <Search className="absolute left-2 top-[9px] h-3.5 w-3.5 sm:h-4 sm:w-4 text-muted-foreground" />
                            <Input
                              type="search"
                              placeholder="Search..."
                              className="pl-7 sm:pl-8 h-8 sm:h-10 text-xs sm:text-sm w-full sm:w-[160px] md:w-[200px]"
                              value={searchQuery}
                              onChange={(e) => setSearchQuery(e.target.value)}
                            />
                            {searchQuery && (
                              <Button
                                variant="ghost"
                                size="sm"
                                className="absolute right-0 top-0 h-8 sm:h-10 w-8 sm:w-10 p-0"
                                onClick={() => setSearchQuery('')}
                              >
                                <X className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                              </Button>
                            )}
                          </div>
                          
                          {/* Export button - icon only on mobile */}
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            onClick={generateICalFile}
                            className="h-8 sm:h-10 px-2 sm:px-3 text-xs sm:text-sm"
                          >
                            <Download className="h-3.5 w-3.5 sm:h-4 sm:w-4 sm:mr-1" />
                            <span className="hidden sm:inline">Export</span>
                          </Button>
                        </div>
                      </div>
                      
                      {/* Navigation buttons - more compact on mobile */}
                      <div className="flex justify-between items-center order-2 sm:order-3">
                        <div className="flex items-center space-x-1 sm:space-x-2">
                          {view === 'month' && (
                            <>
                              <Button variant="outline" size="sm" onClick={goToPreviousMonth} className="h-8 sm:h-10 px-2 sm:px-3 text-xs sm:text-sm">
                                <ChevronLeft className="h-3.5 w-3.5 sm:h-4 sm:w-4 sm:mr-1" />
                                <span className="hidden sm:inline">Previous</span>
                              </Button>
                              <Button variant="outline" size="sm" onClick={goToNextMonth} className="h-8 sm:h-10 px-2 sm:px-3 text-xs sm:text-sm">
                                <span className="hidden sm:inline">Next</span>
                                <ChevronRight className="h-3.5 w-3.5 sm:h-4 sm:w-4 sm:ml-1" />
                              </Button>
                            </>
                          )}
                          {view === 'day' && (
                            <>
                              <Button variant="outline" size="sm" onClick={goToPreviousDay} className="h-8 sm:h-10 px-2 sm:px-3 text-xs sm:text-sm">
                                <ChevronLeft className="h-3.5 w-3.5 sm:h-4 sm:w-4 sm:mr-1" />
                                <span className="hidden sm:inline">Previous</span>
                              </Button>
                              <Button variant="outline" size="sm" onClick={goToNextDay} className="h-8 sm:h-10 px-2 sm:px-3 text-xs sm:text-sm">
                                <span className="hidden sm:inline">Next</span>
                                <ChevronRight className="h-3.5 w-3.5 sm:h-4 sm:w-4 sm:ml-1" />
                              </Button>
                            </>
                          )}
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            onClick={goToToday}
                            className="h-8 sm:h-10 px-2 sm:px-3 text-xs sm:text-sm"
                          >
                            Today
                          </Button>
                        </div>
                      </div>
                    </div>
                  </CardHeader>
                  
                  <CardContent>
                    {/* Day view carousel */}
                    {view === 'day' && (
                      <div className="mx-auto max-w-3xl">
                        <div className="overflow-hidden" ref={emblaRef}>
                          <div className="flex select-none -ml-4">
                            {days.map((day, i) => (
                              <div 
                                key={day.toISOString()} 
                                className="min-w-0 flex-[0_0_100%] pl-4"
                                role="group"
                                aria-roledescription="slide"
                              >
                                <Card className={`
                                  border-2 h-full
                                  ${isToday(day) ? 'border-primary' : 'border-transparent'}
                                  ${dayViewIndex === i ? 'shadow-md' : ''}
                                `}>
                                  <CardHeader className="p-4 pb-2">
                                    <CardTitle className="text-xl">
                                      {format(day, 'EEEE')}
                                    </CardTitle>
                                    <CardDescription className="text-sm flex items-center">
                                      <CalendarIcon className="h-3.5 w-3.5 mr-1" />
                                      {format(day, 'MMMM do, yyyy')}
                                    </CardDescription>
                                  </CardHeader>
                                  <CardContent className="p-4 pt-2">
                                    <div className="space-y-3">
                                      {isLoading ? (
                                        <div className="flex justify-center py-8">
                                          <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full"></div>
                                        </div>
                                      ) : getEventsForDate(day).length > 0 ? (
                                        getEventsForDate(day).map(event => (
                                          <div 
                                            key={`${event.type}-${event.id}`}
                                            className="p-3 rounded-md cursor-pointer hover:bg-gray-100"
                                            onClick={() => handleSelectEvent(event)}
                                          >
                                            <div className="flex items-start justify-between">
                                              <div className="flex-1">
                                                <h4 className="font-medium">{event.title}</h4>
                                                <div className="flex items-center text-sm text-gray-500">
                                                  <Clock className="h-3.5 w-3.5 mr-1" />
                                                  {format(event.date, 'h:mm a')}
                                                </div>
                                                {event.type === 'jobsite' && event.address && (
                                                  <div className="flex items-center text-sm text-gray-500 mt-1">
                                                    <MapPin className="h-3.5 w-3.5 mr-1" />
                                                    {event.address}
                                                  </div>
                                                )}
                                              </div>
                                              <Badge 
                                                variant={event.type === 'jobsite' ? 'default' : 'outline'}
                                                className={event.type === 'jobsite' ? 'bg-indigo-500' : 'bg-green-500 text-white'}
                                              >
                                                {event.type === 'jobsite' ? 'Project' : 'Message'}
                                              </Badge>
                                            </div>
                                          </div>
                                        ))
                                      ) : (
                                        <div className="py-8 text-center">
                                          <MessageSquare className="h-8 w-8 mx-auto text-gray-400" />
                                          <p className="mt-2 text-gray-500">No events for this day</p>
                                        </div>
                                      )}
                                    </div>
                                  </CardContent>
                                </Card>
                              </div>
                            ))}
                          </div>
                        </div>
                        
                        {/* Mobile carousel controls */}
                        <div className="flex justify-between mt-4 md:hidden">
                          <Button variant="outline" size="sm" onClick={goToPreviousDay}>
                            <MoveLeft className="h-4 w-4" />
                          </Button>
                          <Button variant="outline" size="sm" onClick={goToNextDay}>
                            <MoveRight className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    )}
                    
                    {/* Content container for different views */}
                    <div className="mt-4">
                      <Tabs value={view}>
                        <TabsContent value="month" className="space-y-3 sm:space-y-4">
                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2 sm:gap-4">
                            {filteredEvents.map(event => (
                              <Card 
                                key={`${event.type}-${event.id}`} 
                                className="cursor-pointer hover:shadow-md transition-shadow"
                                onClick={() => handleSelectEvent(event)}
                              >
                                <CardHeader className="p-3 sm:p-4">
                                  <div className="flex items-start justify-between">
                                    <CardTitle className="text-sm sm:text-base">
                                      {event.title}
                                    </CardTitle>
                                    <Badge 
                                      variant={event.type === 'jobsite' ? 'default' : 'outline'}
                                      className={`text-xs ${event.type === 'jobsite' ? 'bg-indigo-500' : 'bg-green-500 text-white'}`}
                                    >
                                      {event.type === 'jobsite' ? 'Project' : 'Message'}
                                    </Badge>
                                  </div>
                                  <CardDescription className="flex items-center mt-1 text-xs sm:text-sm">
                                    <Clock className="h-3 w-3 sm:h-3.5 sm:w-3.5 mr-1" />
                                    {format(event.date, 'MMM do, h:mm a')}
                                  </CardDescription>
                                </CardHeader>
                              </Card>
                            ))}
                            
                            {filteredEvents.length === 0 && !isLoading && (
                              <div className="col-span-3 flex flex-col items-center justify-center p-4 sm:p-8 text-center">
                                <BossManImage mood="angry" size="sm" className="sm:hidden" />
                                <BossManImage mood="angry" size="md" className="hidden sm:block" />
                                <h3 className="mt-3 sm:mt-4 text-base sm:text-lg font-semibold">No events found</h3>
                                <p className="text-xs sm:text-sm text-muted-foreground">
                                  {searchQuery 
                                    ? "Try changing your search criteria" 
                                    : "No events scheduled for this month"}
                                </p>
                              </div>
                            )}
                          </div>
                        </TabsContent>

                        <TabsContent value="day">
                          {/* Day view content is above the tabs, outside TabsContent */}
                          {/* This is just a placeholder to make the tab navigation work */}
                        </TabsContent>

                        <TabsContent value="list" className="space-y-2 sm:space-y-4">
                          <div className="space-y-2 sm:space-y-4">
                            {filteredEvents.length > 0 ? (
                              filteredEvents
                                .sort((a, b) => a.date.getTime() - b.date.getTime())
                                .map(event => (
                                  <Card 
                                    key={`${event.type}-${event.id}`} 
                                    className="cursor-pointer hover:shadow-md transition-shadow"
                                    onClick={() => handleSelectEvent(event)}
                                  >
                                    <CardHeader className="py-2 px-3 sm:py-3 sm:px-4">
                                      <div className="flex items-center justify-between">
                                        <div>
                                          <CardTitle className="text-sm sm:text-base font-medium">
                                            {event.title}
                                          </CardTitle>
                                          <CardDescription className="text-xs sm:text-sm mt-0.5">
                                            {format(event.date, 'EEE, MMM do')}
                                          </CardDescription>
                                        </div>
                                        <Badge 
                                          variant={event.type === 'jobsite' ? 'default' : 'outline'}
                                          className={`text-xs ${event.type === 'jobsite' ? 'bg-indigo-500' : 'bg-green-500 text-white'}`}
                                        >
                                          {event.type === 'jobsite' ? 'Project' : 'Message'}
                                        </Badge>
                                      </div>
                                    </CardHeader>
                                  </Card>
                                ))
                            ) : (
                              <div className="flex flex-col items-center justify-center p-4 sm:p-8 text-center">
                                <BossManImage mood="angry" size="sm" className="sm:hidden" />
                                <BossManImage mood="angry" size="md" className="hidden sm:block" />
                                <h3 className="mt-3 sm:mt-4 text-base sm:text-lg font-semibold">No events found</h3>
                                <p className="text-xs sm:text-sm text-muted-foreground">
                                  {searchQuery 
                                    ? "Try changing your search criteria" 
                                    : "Try changing the selected month"}
                                </p>
                              </div>
                            )}
                          </div>
                        </TabsContent>
                      </Tabs>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Event details panel - shows in modal on mobile, sidebar on tablet/desktop */}
              {selectedEvent && (
                <div className={`
                  ${view === 'month' ? 'mt-4 lg:mt-0' : ''}
                  w-full lg:w-80 z-10
                  fixed inset-0 bg-black/50 lg:static lg:bg-transparent
                  flex items-center justify-center lg:block
                `}>
                  <Card className="w-[calc(100%-32px)] max-w-md lg:w-full max-h-[80vh] lg:max-h-none overflow-auto">
                    <CardHeader className="p-3 sm:p-6 sticky top-0 bg-white z-10 border-b">
                      <div className="flex justify-between items-start">
                        <CardTitle className="text-base sm:text-lg mr-4">{selectedEvent.title}</CardTitle>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          onClick={() => setSelectedEvent(null)}
                          className="h-8 w-8 p-0 rounded-full"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                      <CardDescription className="text-xs sm:text-sm">
                        {selectedEvent.type === 'jobsite' ? 'Project Details' : 'Message Details'}
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="p-3 sm:p-6 pt-2 sm:pt-4">
                      <div className="space-y-3 sm:space-y-4">
                        <div>
                          <h4 className="text-xs sm:text-sm font-medium mb-1">Date & Time</h4>
                          <div className="flex items-center text-xs sm:text-sm">
                            <Clock className="h-3 w-3 sm:h-3.5 sm:w-3.5 mr-1 text-muted-foreground" />
                            {format(selectedEvent.date, 'EEEE, MMM do, yyyy')}
                          </div>
                          <div className="text-xs sm:text-sm ml-4 sm:ml-5">
                            {format(selectedEvent.date, 'h:mm a')}
                            {selectedEvent.endDate && ` - ${format(selectedEvent.endDate, 'h:mm a')}`}
                          </div>
                        </div>
                        
                        {selectedEvent.type === 'jobsite' && (
                          <>
                            <div>
                              <h4 className="text-xs sm:text-sm font-medium mb-1">Address</h4>
                              <div className="flex items-center text-xs sm:text-sm">
                                <MapPin className="h-3 w-3 sm:h-3.5 sm:w-3.5 mr-1 text-muted-foreground" />
                                {selectedEvent.address || 'No address provided'}
                              </div>
                            </div>
                            
                            {selectedEvent.status && (
                              <div>
                                <h4 className="text-xs sm:text-sm font-medium mb-1">Status</h4>
                                <Badge className="text-xs">{selectedEvent.status}</Badge>
                              </div>
                            )}
                            
                            {selectedEvent.description && (
                              <div>
                                <h4 className="text-xs sm:text-sm font-medium mb-1">Description</h4>
                                <p className="text-xs sm:text-sm">{selectedEvent.description}</p>
                              </div>
                            )}
                            
                            {selectedEvent.progress !== undefined && (
                              <div>
                                <h4 className="text-xs sm:text-sm font-medium mb-1">Progress</h4>
                                <div className="w-full bg-gray-200 rounded-full h-2">
                                  <div 
                                    className="bg-primary h-2 rounded-full" 
                                    style={{ width: `${selectedEvent.progress}%` }}
                                  ></div>
                                </div>
                                <p className="text-[10px] sm:text-xs text-right mt-1">{selectedEvent.progress}%</p>
                              </div>
                            )}
                          </>
                        )}
                        
                        {selectedEvent.type === 'message' && (
                          <div>
                            <h4 className="text-xs sm:text-sm font-medium mb-1">Message</h4>
                            <div className="border rounded-md p-2 sm:p-3 bg-slate-50">
                              <p className="text-xs sm:text-sm">{selectedEvent.text}</p>
                              {selectedEvent.translatedText && (
                                <>
                                  <Separator className="my-1.5 sm:my-2" />
                                  <p className="text-xs sm:text-sm text-muted-foreground italic">
                                    {selectedEvent.translatedText}
                                  </p>
                                </>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    </CardContent>
                    <CardFooter className="p-3 sm:p-6 pt-0 sm:pt-0 border-t mt-2">
                      {selectedEvent.type === 'jobsite' && (
                        <Button 
                          className="w-full h-9 sm:h-10 text-xs sm:text-sm" 
                          variant="outline"
                        >
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
    </div>
  );
}