import React, { useState, useEffect } from 'react';
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, Clock, MapPin, MessageCircle } from 'lucide-react';
import { format, addDays, subDays } from 'date-fns';
import { apiRequest } from '@/lib/queryClient';

// Simple event interface for calendar
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
  const [datePickerOpen, setDatePickerOpen] = useState(false);
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Sample data - in a real app, this would come from an API
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
          // If API fails, use sample data
          const sampleEvents: CalendarEvent[] = [
            { 
              id: 1, 
              title: 'Westside Project', 
              type: 'project', 
              date: new Date(), 
              time: '9:00 AM', 
              location: '123 Main St, Westside' 
            },
            { 
              id: 2, 
              title: 'Message from Carlos', 
              type: 'conversation', 
              date: new Date(), 
              time: '10:30 AM',
              description: "I'll be 20 minutes late to the site today" 
            },
            { 
              id: 3, 
              title: 'Downtown Renovation', 
              type: 'project', 
              date: addDays(new Date(), 1), 
              time: '11:00 AM', 
              location: '456 Center Ave, Downtown' 
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
            time: '9:00 AM', 
            location: '123 Main St, Westside' 
          },
          { 
            id: 2, 
            title: 'Message from Carlos', 
            type: 'conversation', 
            date: new Date(), 
            time: '10:30 AM',
            description: "I'll be 20 minutes late to the site today" 
          },
          { 
            id: 3, 
            title: 'Downtown Renovation', 
            type: 'project', 
            date: addDays(new Date(), 1), 
            time: '11:00 AM', 
            location: '456 Center Ave, Downtown' 
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
    <div className="container max-w-md mx-auto p-4">
      <h1 className="text-2xl font-bold mb-2">Calendar</h1>
      
      {/* Date display */}
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-lg font-semibold">
          {format(currentDate, 'EEE, MMM do')}
          {currentDate.toDateString() === new Date().toDateString() && 
            <span className="ml-2 text-sm text-blue-600 font-medium">Today</span>
          }
        </h2>
      </div>
      
      {/* Events for current day */}
      <div className="mb-20">
        {isLoading ? (
          <div className="flex justify-center items-center h-40">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500"></div>
          </div>
        ) : currentEvents.length > 0 ? (
          <div className="space-y-4">
            {currentEvents.map(event => (
              <div 
                key={event.id} 
                className={`p-4 rounded-lg shadow ${
                  event.type === 'project' 
                    ? 'bg-white border-l-4 border-l-blue-400' 
                    : 'bg-white border-l-4 border-l-amber-400'
                }`}
              >
                <div className="flex justify-between">
                  <h3 className="font-medium">{event.title}</h3>
                  <span className={`text-xs px-2 py-1 rounded ${
                    event.type === 'project' 
                      ? 'bg-blue-100 text-blue-800' 
                      : 'bg-amber-100 text-amber-800'
                  }`}>
                    {event.type === 'project' ? 'Project' : 'Message'}
                  </span>
                </div>
                
                <div className="text-sm text-gray-600 mt-1 flex items-center">
                  <Clock className="h-3.5 w-3.5 mr-1" />
                  {event.time}
                </div>
                
                {event.location && (
                  <div className="text-sm text-gray-600 mt-1 flex items-center">
                    <MapPin className="h-3.5 w-3.5 mr-1" />
                    {event.location}
                  </div>
                )}
                
                {event.description && (
                  <div className="text-sm mt-2 text-gray-700">
                    {event.description}
                  </div>
                )}
                
                {event.type === 'conversation' && (
                  <button className="mt-3 text-xs px-3 py-1.5 border border-gray-300 rounded-md flex items-center text-gray-700 hover:bg-gray-50">
                    <MessageCircle className="h-3.5 w-3.5 mr-1.5" />
                    View in Voice Commands
                  </button>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-40 text-center">
            <div className="text-gray-400 mb-2">
              <CalendarIcon className="h-12 w-12 mx-auto mb-2 opacity-30" />
            </div>
            <p className="text-lg font-medium text-gray-600">No events today</p>
            <p className="text-sm text-gray-500 mt-1">Try selecting a different date</p>
          </div>
        )}
      </div>
      
      {/* Bottom navigation - EXACTLY as in screenshot */}
      <div className="fixed bottom-20 left-0 right-0 z-50 flex justify-center items-center">
        <div className="flex items-center space-x-6">
          {/* Left arrow button */}
          <div className="bg-white border border-gray-200 h-12 w-12 rounded-full shadow flex items-center justify-center">
            <button onClick={goToPreviousDay} aria-label="Previous day" className="flex items-center justify-center w-full h-full">
              <ChevronLeft className="h-5 w-5" />
            </button>
          </div>
          
          {/* Center calendar button */}
          <div 
            className="bg-red-600 h-14 w-14 rounded-full shadow-md flex items-center justify-center cursor-pointer"
            onClick={() => setDatePickerOpen(!datePickerOpen)}
          >
            <CalendarIcon className="h-6 w-6 text-white" />
          </div>
          
          {/* Right arrow button */}
          <div className="bg-white border border-gray-200 h-12 w-12 rounded-full shadow flex items-center justify-center">
            <button onClick={goToNextDay} aria-label="Next day" className="flex items-center justify-center w-full h-full">
              <ChevronRight className="h-5 w-5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}