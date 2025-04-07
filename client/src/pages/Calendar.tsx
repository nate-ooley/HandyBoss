import React, { useState, useEffect, useCallback } from 'react';
import { format, addDays, subDays, startOfMonth, endOfMonth, setHours, isToday } from 'date-fns';
import { Calendar as CalendarIcon, Clock, MapPin, X, ChevronLeft, ChevronRight } from 'lucide-react';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { Loading } from '@/components/Loading';
import { useMobile } from '@/hooks/use-mobile';

// Define calendar event type that can handle both jobsites and messages
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
  jobsiteId?: number; // Used for messages and jobsites
  relatedMessages?: ChatMessage[]; // Collection of messages for the same date/jobsite
  [key: string]: any; // Allow for other properties from either type
};

interface ChatMessage {
  id: number;
  sender: string;
  text: string;
  translatedText?: string;
  timestamp: Date;
  jobsiteId?: number;
  // Add other properties as needed
}

export default function Calendar() {
  const { isMobile } = useMobile();
  const { toast } = useToast();
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [currentDate, setCurrentDate] = useState(new Date());
  const [view, setView] = useState<'day' | 'month' | 'list'>('day');
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [datePickerOpen, setDatePickerOpen] = useState(false);

  // Filter events based on the current view and search query
  const filteredEvents = events.filter(event => {
    const matchesSearch = searchQuery ? 
      event.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (event.description && event.description.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (event.text && event.text.toLowerCase().includes(searchQuery.toLowerCase())) :
      true;
    
    if (view === 'day') {
      const eventDate = new Date(event.date);
      return eventDate.toDateString() === currentDate.toDateString() && matchesSearch;
    } else if (view === 'month') {
      const start = startOfMonth(currentDate);
      const end = endOfMonth(currentDate);
      const eventDate = new Date(event.date);
      return eventDate >= start && eventDate <= end && matchesSearch;
    }
    
    return matchesSearch;
  });

  // Fetch calendar events from API
  const fetchEvents = useCallback(async () => {
    setIsLoading(true);
    try {
      const startDate = startOfMonth(currentDate);
      const endDate = endOfMonth(currentDate);
      
      const response = await apiRequest('GET', `/api/calendar/events?startDate=${startDate.toISOString()}&endDate=${endDate.toISOString()}`);
      const data = await response.json();
      
      // Convert the data to CalendarEvent format
      const calendarEvents: CalendarEvent[] = data.map((item: any) => {
        const baseEvent = {
          id: item.id,
          date: new Date(item.date || item.startDate || item.timestamp),
          endDate: item.endDate ? new Date(item.endDate) : undefined,
          color: item.color || (item.type === 'jobsite' ? '#3498db' : '#e67e22')
        };
        
        if (item.name) {
          // This is a jobsite
          return {
            ...baseEvent,
            type: 'jobsite',
            title: item.name,
            address: item.address,
            status: item.status,
            description: item.description,
            progress: item.progress,
            jobsiteId: item.id
          };
        } else {
          // This is a message
          return {
            ...baseEvent,
            type: 'message',
            title: item.isCalendarEvent ? item.calendarTitle : `Message from ${item.sender}`,
            text: item.text,
            translatedText: item.translatedText,
            sender: item.sender,
            jobsiteId: item.jobsiteId,
            // Group related messages if they exist
            relatedMessages: item.relatedMessages || [item]
          };
        }
      });
      
      setEvents(calendarEvents);
    } catch (error) {
      console.error('Error fetching calendar events:', error);
      toast({
        title: 'Error fetching events',
        description: 'Could not load calendar events. Please try again.',
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  }, [currentDate, toast]);

  useEffect(() => {
    fetchEvents();
  }, [fetchEvents]);

  const goToNextDay = () => {
    setCurrentDate(prev => addDays(prev, 1));
  };

  const goToPreviousDay = () => {
    setCurrentDate(prev => subDays(prev, 1));
  };

  const handleDateSelect = (date: Date | undefined) => {
    if (date) {
      setCurrentDate(date);
      setDatePickerOpen(false);
      setView('day');
    }
  };

  const getEventsForDate = (day: Date) => {
    return events.filter(event => {
      const eventDate = new Date(event.date);
      return eventDate.toDateString() === day.toDateString();
    });
  };

  const renderDateCell = (day: Date) => {
    const dayEvents = getEventsForDate(day);
    const hasEvents = dayEvents.length > 0;
    const dayClasses = `relative text-center ${isToday(day) ? 'font-bold' : 'font-normal'}`;
    
    return (
      <div className={dayClasses}>
        <span className={`${hasEvents ? 'text-blue-700' : ''}`}>
          {format(day, 'd')}
        </span>
        {hasEvents && (
          <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-1 h-1 rounded-full bg-blue-500" />
        )}
      </div>
    );
  };

  const handleSelectEvent = (event: CalendarEvent) => {
    setSelectedEvent(event);
    // For mobile view, we scroll up to ensure the event details are visible
    if (isMobile) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  return (
    <div className="container max-w-screen-xl mx-auto px-3 sm:px-4 py-3 sm:py-6">
      <div className="flex flex-col lg:flex-row lg:space-x-4">
        <div className="w-full">
          <Card className="w-full">
            <CardContent className="p-4 sm:p-6">
              {/* Header with title and view selection */}
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 sm:mb-6">
                <div className="flex items-center">
                  <h1 className="text-xl sm:text-2xl font-bold mr-3">Calendar</h1>
                </div>
                <div className="flex space-x-2 mt-2 sm:mt-0">
                  <TabsList className="rounded-full">
                    <TabsTrigger 
                      value="day" 
                      onClick={() => setView('day')}
                      className={view === 'day' ? 'bg-blue-50 sm:bg-primary/10 text-primary' : ''}
                    >
                      Day
                    </TabsTrigger>
                    <TabsTrigger 
                      value="month" 
                      onClick={() => setView('month')}
                      className={view === 'month' ? 'bg-blue-50 sm:bg-primary/10 text-primary' : ''}
                    >
                      Month
                    </TabsTrigger>
                    <TabsTrigger 
                      value="list" 
                      onClick={() => setView('list')}
                      className={view === 'list' ? 'bg-blue-50 sm:bg-primary/10 text-primary' : ''}
                    >
                      List
                    </TabsTrigger>
                  </TabsList>
                  
                  <div className="relative">
                    <Search className="absolute left-2.5 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <input
                      type="text"
                      placeholder="Search..."
                      className="pl-8 h-9 rounded-lg text-sm bg-slate-100/80 border border-slate-200 focus:border-primary focus:bg-white focus:outline-none"
                      value={searchQuery}
                      onChange={e => setSearchQuery(e.target.value)}
                    />
                  </div>
                </div>
              </div>
              
              {/* Date display and navigation for day view */}
              {view === 'day' && (
                <div>
                  <div className="mb-3 sm:mb-4">
                    <div className="flex justify-between items-center">
                      <h2 className="text-lg sm:text-xl font-semibold">
                        {format(currentDate, 'EEE, MMM do')}
                        {isToday(currentDate) && <span className="ml-2 text-sm text-primary font-medium">Today</span>}
                      </h2>
                    </div>
                  </div>
                  
                  {/* Day events display */}
                  {isLoading ? (
                    <div className="flex items-center justify-center h-48">
                      <Loading />
                    </div>
                  ) : (
                    <div className="space-y-2 sm:space-y-3 mb-8">
                      {filteredEvents.length > 0 ? (
                        filteredEvents
                          .sort((a, b) => a.date.getTime() - b.date.getTime())
                          .map(event => (
                            <div 
                              key={`${event.type}-${event.id}`} 
                              className={`fancy-card ${event.type === 'jobsite' ? 'border-l-4 border-l-blue-100' : 'border-l-4 border-l-amber-100'}`}
                              onClick={() => handleSelectEvent(event)}
                            >
                              <div className="p-3 sm:p-4">
                                <div className="flex justify-between">
                                  <div className="flex-1">
                                    <h3 className="text-sm sm:text-base font-medium text-card-foreground">
                                      {event.title}
                                    </h3>
                                    <div className="flex items-center mt-1 text-xs sm:text-sm text-card-foreground/70">
                                      <Clock className="h-3 w-3 sm:h-3.5 sm:w-3.5 mr-1" />
                                      {format(event.date, 'h:mm a')}
                                      {event.endDate && ` - ${format(event.endDate, 'h:mm a')}`}
                                    </div>
                                    {event.type === 'jobsite' && event.address && (
                                      <div className="flex items-center mt-1 text-xs sm:text-sm text-card-foreground/70">
                                        <MapPin className="h-3 w-3 sm:h-3.5 sm:w-3.5 mr-1" />
                                        {event.address}
                                      </div>
                                    )}
                                    {event.type === 'message' && event.text && (
                                      <div className="mt-1.5 text-xs sm:text-sm text-card-foreground/90 line-clamp-1">
                                        {event.text}
                                      </div>
                                    )}
                                  </div>
                                  <Badge 
                                    variant={event.type === 'jobsite' ? 'secondary' : 'outline'}
                                    className="ml-2 text-xs font-medium h-fit whitespace-nowrap"
                                  >
                                    {event.type === 'jobsite' ? 'Project' : 'Message'}
                                  </Badge>
                                </div>
                              </div>
                            </div>
                          ))
                      ) : (
                        <div className="flex flex-col items-center justify-center p-8 sm:p-12 text-center">
                          <BossManImage mood="angry" size="sm" className="sm:hidden" />
                          <BossManImage mood="angry" size="md" className="hidden sm:block" />
                          <h3 className="mt-3 sm:mt-4 text-base sm:text-lg font-semibold">No events today</h3>
                          <p className="text-xs sm:text-sm text-muted-foreground">
                            {searchQuery 
                              ? "Try changing your search criteria" 
                              : "Try selecting a different date"}
                          </p>
                        </div>
                      )}
                    </div>
                  )}
                  
                  {/* Mobile carousel controls - Styled EXACTLY as in screenshot */}
                  <div className="fixed bottom-20 left-0 right-0 z-50 flex justify-center items-center md:hidden">
                    <div className="flex items-center space-x-6">
                      <div className="bg-white border border-gray-200 h-12 w-12 rounded-full shadow flex items-center justify-center">
                        <button onClick={goToPreviousDay} aria-label="Previous day" className="flex items-center justify-center w-full h-full">
                          <ChevronLeft className="h-5 w-5" />
                        </button>
                      </div>
                      
                      {/* Center calendar button - Opens date picker */}
                      <Dialog open={datePickerOpen} onOpenChange={setDatePickerOpen}>
                        <DialogTrigger asChild>
                          <div className="bg-red-600 h-14 w-14 rounded-full shadow-md flex items-center justify-center cursor-pointer">
                            <CalendarIcon className="h-6 w-6 text-white" />
                          </div>
                        </DialogTrigger>
                        <DialogContent className="sm:max-w-md p-0" aria-describedby="date-picker-description">
                          <span id="date-picker-description" className="sr-only">Select a date from the calendar</span>
                          <DialogHeader className="px-4 pt-4 pb-2">
                            <DialogTitle>Select Date</DialogTitle>
                          </DialogHeader>
                          <div className="p-4 pt-0">
                            <CalendarComponent
                              mode="single"
                              selected={selectedDate}
                              onSelect={setSelectedDate}
                              className="rounded-md border shadow"
                            />
                          </div>
                          <DialogFooter className="px-4 pb-4">
                            <Button 
                              variant="outline" 
                              onClick={() => setDatePickerOpen(false)}
                              className="w-full sm:w-auto"
                            >
                              Cancel
                            </Button>
                            <Button 
                              onClick={() => handleDateSelect(selectedDate)}
                              className="w-full sm:w-auto"
                              disabled={!selectedDate}
                            >
                              Go to Date
                            </Button>
                          </DialogFooter>
                        </DialogContent>
                      </Dialog>
                    
                      <div className="bg-white border border-gray-200 h-12 w-12 rounded-full shadow flex items-center justify-center">
                        <button onClick={goToNextDay} aria-label="Next day" className="flex items-center justify-center w-full h-full">
                          <ChevronRight className="h-5 w-5" />
                        </button>
                      </div>
                    </div>
                  </div>
                  
                  {/* Fixed bottom right add project button */}
                  <div className="fixed bottom-6 right-4 z-50">
                    <Button 
                      className="bg-green-500 hover:bg-green-600 text-white shadow-lg h-14 w-14 rounded-full p-0 transition-all hover:scale-105"
                      onClick={() => window.location.href = "/projects/add"}
                    >
                      <Plus className="h-6 w-6" />
                    </Button>
                  </div>
                </div>
              )}
              
              {/* Content container for different views */}
              <div className="mt-4">
                <Tabs value={view}>
                  <TabsContent value="month" className="space-y-3 sm:space-y-4">
                    <div className="max-h-[60vh] overflow-y-auto pr-1 pb-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2 sm:gap-4">
                        {filteredEvents.map(event => (
                          <div 
                            key={`${event.type}-${event.id}`} 
                            className={`fancy-card ${event.type === 'jobsite' ? 'border-l-4 border-l-blue-100' : 'border-l-4 border-l-amber-100'}`}
                            onClick={() => handleSelectEvent(event)}
                          >
                            <div className="p-3 sm:p-4">
                              <div className="flex items-start justify-between">
                                <h3 className="text-sm sm:text-base font-medium text-card-foreground">
                                  {event.title}
                                </h3>
                                <Badge 
                                  variant="default"
                                  className={`text-xs font-semibold ${event.type === 'jobsite' ? 'bg-secondary text-white' : 'bg-accent text-accent-foreground'}`}
                                >
                                  {event.type === 'jobsite' ? 'Project' : 'Message'}
                                </Badge>
                              </div>
                              <div className="flex items-center mt-2 text-xs sm:text-sm text-card-foreground/80">
                                <Clock className="h-3 w-3 sm:h-3.5 sm:w-3.5 mr-1 text-card-foreground/70" />
                                {format(event.date, 'MMM do, h:mm a')}
                              </div>
                            </div>
                          </div>
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
                    </div>
                  </TabsContent>

                  <TabsContent value="day">
                    {/* Day view content is above the tabs, outside TabsContent */}
                    {/* This is just a placeholder to make the tab navigation work */}
                  </TabsContent>

                  <TabsContent value="list" className="space-y-2 sm:space-y-4">
                    <div className="space-y-2 sm:space-y-4 max-h-[60vh] overflow-y-auto pr-1 pb-4">
                      {filteredEvents.length > 0 ? (
                        filteredEvents
                          .sort((a, b) => a.date.getTime() - b.date.getTime())
                          .map(event => (
                            <div 
                              key={`${event.type}-${event.id}`} 
                              className={`fancy-card ${event.type === 'jobsite' ? 'border-l-4 border-l-blue-100' : 'border-l-4 border-l-amber-100'}`}
                              onClick={() => handleSelectEvent(event)}
                            >
                              <div className="py-2 px-3 sm:py-3 sm:px-4">
                                <div className="flex items-center justify-between">
                                  <div>
                                    <h3 className="text-sm sm:text-base font-medium text-card-foreground">
                                      {event.title}
                                    </h3>
                                    <div className="text-xs sm:text-sm mt-0.5 text-card-foreground/80">
                                      {format(event.date, 'EEE, MMM do')}
                                    </div>
                                  </div>
                                  <Badge 
                                    variant="default"
                                    className={`text-xs font-semibold ${event.type === 'jobsite' ? 'bg-secondary text-white' : 'bg-accent text-accent-foreground'}`}
                                  >
                                    {event.type === 'jobsite' ? 'Project' : 'Message'}
                                  </Badge>
                                </div>
                              </div>
                            </div>
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
                          <Badge className="text-xs font-medium px-2.5 py-1" variant="outline">{selectedEvent.status}</Badge>
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
                          <div className="w-full bg-slate-100 rounded-full h-2.5 border border-slate-200">
                            <div 
                              className="bg-blue-500 h-2.5 rounded-full" 
                              style={{ width: `${selectedEvent.progress}%` }}
                            ></div>
                          </div>
                          <p className="text-[10px] sm:text-xs text-right mt-1.5 font-medium">{selectedEvent.progress}% Complete</p>
                        </div>
                      )}
                    </>
                  )}
                  
                  {selectedEvent.type === 'message' && (
                    <div>
                      <h4 className="text-xs sm:text-sm font-medium mb-1">
                        {selectedEvent.relatedMessages && selectedEvent.relatedMessages.length > 1 
                          ? `Messages (${selectedEvent.relatedMessages.length})` 
                          : 'Message'}
                      </h4>
                      
                      {/* Show the selected/primary message */}
                      <div className="border rounded-md p-2.5 sm:p-3.5 bg-slate-50/70 mb-2 shadow-sm">
                        <p className="text-xs sm:text-sm font-medium text-slate-800">{selectedEvent.text}</p>
                        {selectedEvent.translatedText && (
                          <>
                            <Separator className="my-1.5 sm:my-2 bg-slate-200" />
                            <p className="text-xs sm:text-sm text-slate-500 italic">
                              {selectedEvent.translatedText}
                            </p>
                          </>
                        )}
                      </div>
                      
                      {/* If there are more related messages, show a sample of them */}
                      {selectedEvent.relatedMessages && selectedEvent.relatedMessages.length > 1 && (
                        <div className="space-y-2">
                          <h5 className="text-xs font-medium text-muted-foreground mb-1">Related messages:</h5>
                          
                          {/* Show up to 2 more messages */}
                          {selectedEvent.relatedMessages.slice(1, 3).map((message, index) => (
                            <div key={index} className="border rounded-md p-2 bg-slate-50/50 shadow-sm">
                              <p className="text-xs line-clamp-1 text-slate-700">{message.text}</p>
                            </div>
                          ))}
                          
                          {/* If there are more than 3 messages total, show message count */}
                          {selectedEvent.relatedMessages.length > 3 && (
                            <p className="text-xs text-muted-foreground text-center">
                              +{selectedEvent.relatedMessages.length - 3} more messages
                            </p>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </CardContent>
              <CardFooter className="p-3 sm:p-6 pt-0 sm:pt-0 border-t mt-2">
                {selectedEvent.type === 'jobsite' && (
                  <Button 
                    className="w-full h-9 sm:h-10 text-xs sm:text-sm" 
                    onClick={() => window.location.href = `/projects/${selectedEvent.id}`}
                  >
                    View Project Details
                  </Button>
                )}
                
                {selectedEvent.type === 'message' && (
                  <Button 
                    className="w-full h-9 sm:h-10 text-xs sm:text-sm" 
                    onClick={() => window.location.href = `/voice-commands${selectedEvent.jobsiteId ? `?jobsiteId=${selectedEvent.jobsiteId}` : ''}`}
                  >
                    <MessageCircle className="h-4 w-4 mr-2" />
                    View in Voice Commands
                  </Button>
                )}
              </CardFooter>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}