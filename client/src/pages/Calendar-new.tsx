import React, { useState, useEffect } from 'react';
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, Clock, MapPin } from 'lucide-react';
import { format, addDays, subDays } from 'date-fns';
import { apiRequest } from '@/lib/queryClient';

// Calendar event interface
interface CalendarEvent {
  id: number;
  title: string;
  type: 'project' | 'conversation';
  date: Date;
  time?: string;
  location?: string;
  description?: string;
}

export default function Calendar() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch events on component mount and when date changes
  useEffect(() => {
    const fetchEvents = async () => {
      setIsLoading(true);
      try {
        // Try to fetch from API first
        const response = await apiRequest('GET', '/api/calendar/events');
        if (response.ok) {
          const data = await response.json();
          // Convert API data to our calendar event format
          const formattedEvents = data.map((item: any) => {
            const eventDate = new Date(item.date || item.startDate || item.timestamp);
            
            if (item.name) {
              // This is a project
              return {
                id: item.id,
                title: item.name,
                type: 'project',
                date: eventDate,
                time: format(eventDate, 'h:mm a'),
                location: item.address,
                description: item.description
              };
            } else {
              // This is a conversation/message
              return {
                id: item.id,
                title: item.isCalendarEvent ? item.calendarTitle : `Message from ${item.sender}`,
                type: 'conversation',
                date: eventDate,
                time: format(eventDate, 'h:mm a'),
                description: item.text
              };
            }
          });
          
          setEvents(formattedEvents);
        } else {
          // Fallback sample data
          const sampleEvents: CalendarEvent[] = [
            { 
              id: 1, 
              title: 'Westside Project', 
              type: 'project', 
              date: new Date(), 
              time: '8:22 PM', 
              location: '123 Main St, Building A' 
            }
          ];
          setEvents(sampleEvents);
        }
      } catch (error) {
        console.error('Error fetching events:', error);
        // Fallback sample data
        const sampleEvents: CalendarEvent[] = [
          { 
            id: 1, 
            title: 'Westside Project', 
            type: 'project', 
            date: new Date(), 
            time: '8:22 PM', 
            location: '123 Main St, Building A' 
          }
        ];
        setEvents(sampleEvents);
      } finally {
        setIsLoading(false);
      }
    };

    fetchEvents();
  }, [currentDate]);

  const goToNextDay = () => {
    setCurrentDate(prev => addDays(prev, 1));
  };

  const goToPreviousDay = () => {
    setCurrentDate(prev => subDays(prev, 1));
  };

  // Filter events for the current date
  const currentEvents = events.filter(event => 
    event.date.getDate() === currentDate.getDate() &&
    event.date.getMonth() === currentDate.getMonth() &&
    event.date.getFullYear() === currentDate.getFullYear()
  );

  return (
    <div className="container mx-auto px-4 pb-24">
      <h1 className="text-3xl font-bold mb-2">Calendar</h1>
      
      {/* Date display */}
      <h2 className="text-xl font-medium mb-4">
        {format(currentDate, 'EEE, MMM do')}
      </h2>
      
      {/* Events for current day */}
      <div className="pb-16">
        {isLoading ? (
          <div className="flex justify-center items-center h-60">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500"></div>
          </div>
        ) : currentEvents.length > 0 ? (
          <div className="space-y-4">
            {currentEvents.map(event => (
              <div 
                key={event.id} 
                className="bg-white rounded-xl border-l-4 border-blue-400 shadow-md overflow-hidden"
              >
                <div className="p-4">
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="font-semibold text-lg">{event.title}</h3>
                    <span className="text-xs px-2 py-1 bg-blue-100 text-blue-800 rounded">
                      Project
                    </span>
                  </div>
                  
                  <div className="flex items-center text-gray-600 mb-1">
                    <Clock className="h-4 w-4 mr-2" />
                    <span>{event.time}</span>
                  </div>
                  
                  {event.location && (
                    <div className="flex items-center text-gray-600">
                      <MapPin className="h-4 w-4 mr-2" />
                      <span>{event.location}</span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-60 text-center">
            <div className="text-gray-300 mb-4">
              <CalendarIcon className="h-20 w-20 mx-auto" />
            </div>
            <p className="text-lg text-gray-600 font-medium">No events today</p>
            <p className="text-sm text-gray-500 mt-1">Try selecting a different date</p>
          </div>
        )}
      </div>
      
      {/* Bottom navigation */}
      <div className="fixed bottom-20 left-0 right-0 z-20 flex justify-center items-center">
        <div className="flex items-center space-x-6">
          {/* Left arrow button */}
          <div className="bg-white border border-gray-200 h-12 w-12 rounded-full shadow-md flex items-center justify-center">
            <button 
              onClick={goToPreviousDay} 
              aria-label="Previous day" 
              className="flex items-center justify-center w-full h-full"
            >
              <ChevronLeft className="h-6 w-6 text-gray-600" />
            </button>
          </div>
          
          {/* Center calendar button */}
          <div className="bg-red-600 h-14 w-14 rounded-full shadow-md flex items-center justify-center">
            <CalendarIcon className="h-6 w-6 text-white" />
          </div>
          
          {/* Right arrow button */}
          <div className="bg-white border border-gray-200 h-12 w-12 rounded-full shadow-md flex items-center justify-center">
            <button 
              onClick={goToNextDay} 
              aria-label="Next day" 
              className="flex items-center justify-center w-full h-full"
            >
              <ChevronRight className="h-6 w-6 text-gray-600" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}