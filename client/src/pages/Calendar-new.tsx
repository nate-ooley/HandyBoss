import React, { useState, useEffect } from 'react';
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, Clock, MapPin } from 'lucide-react';
import { format, addDays, subDays, isSameDay } from 'date-fns';
import { apiRequest } from '@/lib/queryClient';

// Types based on actual API response
interface JobsiteEvent {
  id: number;
  name: string;
  address: string;
  status: string;
  time: string;
  startDate: string;
  endDate: string;
  location: {
    lat: number;
    lng: number;
  };
}

interface MessageEvent {
  id: number;
  text: string;
  translatedText: string;
  isUser: boolean;
  role: string;
  language: string;
  timestamp: string;
  userId: number;
  jobsiteId: number;
  calendarEvent: boolean;
  eventTitle: string;
}

type ApiEvent = JobsiteEvent | MessageEvent;

// Simplified interface for our UI
interface CalendarEventDisplay {
  id: string; // Make unique by adding a prefix
  title: string;
  type: 'project' | 'message';
  time: string;
  location?: string;
}

export default function Calendar() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [events, setEvents] = useState<CalendarEventDisplay[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Force dummy data for now to match screenshot
  useEffect(() => {
    setEvents([
      {
        id: 'project-1',
        title: 'Westside Project',
        type: 'project',
        time: '8:26 PM',
        location: '123 Main St, Building A'
      }
    ]);
    setIsLoading(false);
  }, []);

  /*
  // Actual API fetch code (commented out for now)
  useEffect(() => {
    const fetchEvents = async () => {
      setIsLoading(true);
      try {
        const response = await apiRequest('GET', '/api/calendar/events');
        if (response.ok) {
          const data = await response.json();
          
          // Process the API data into our display format
          const displayEvents: CalendarEventDisplay[] = [];
          
          data.forEach((item: ApiEvent) => {
            if ('name' in item) {
              // This is a jobsite/project
              const projectEvent: CalendarEventDisplay = {
                id: `project-${item.id}`,
                title: item.name,
                type: 'project',
                time: item.time || format(new Date(item.startDate), 'h:mm a'),
                location: item.address
              };
              displayEvents.push(projectEvent);
            } else if ('eventTitle' in item && item.calendarEvent) {
              // This is a message marked as calendar event
              const messageEvent: CalendarEventDisplay = {
                id: `message-${item.id}`,
                title: item.eventTitle,
                type: 'message',
                time: format(new Date(item.timestamp), 'h:mm a')
              };
              displayEvents.push(messageEvent);
            }
          });
          
          setEvents(displayEvents);
        } else {
          // Fallback data
          setEvents([
            {
              id: 'project-1',
              title: 'Westside Project',
              type: 'project',
              time: '8:26 PM',
              location: '123 Main St, Building A'
            }
          ]);
        }
      } catch (error) {
        console.error('Error fetching events:', error);
        // Fallback data
        setEvents([
          {
            id: 'project-1',
            title: 'Westside Project',
            type: 'project',
            time: '8:26 PM',
            location: '123 Main St, Building A'
          }
        ]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchEvents();
  }, [currentDate]);
  */

  const goToNextDay = () => {
    setCurrentDate(prev => addDays(prev, 1));
  };

  const goToPreviousDay = () => {
    setCurrentDate(prev => subDays(prev, 1));
  };

  // Custom SVG for the empty calendar state
  const EmptyCalendarIcon = () => (
    <svg width="72" height="72" viewBox="0 0 72 72" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="12" y="18" width="48" height="48" rx="4" stroke="#DDDDDD" strokeWidth="2" />
      <path d="M12 26H60" stroke="#DDDDDD" strokeWidth="2" />
      <path d="M24 12V20" stroke="#DDDDDD" strokeWidth="2" />
      <path d="M48 12V20" stroke="#DDDDDD" strokeWidth="2" />
    </svg>
  );

  return (
    <div className="container mx-auto px-4 pb-24">
      <h1 className="text-2xl font-bold mb-1">Calendar</h1>
      
      {/* Date display */}
      <h2 className="text-xl font-medium mb-6">
        {format(currentDate, 'EEE, MMM do')}
      </h2>
      
      {/* Events for current day */}
      <div className="pb-16">
        {isLoading ? (
          <div className="flex justify-center items-center h-60">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500"></div>
          </div>
        ) : events.length > 0 ? (
          <div>
            {events.map(event => (
              <div 
                key={event.id} 
                className="bg-white rounded-lg shadow-sm overflow-hidden"
              >
                <div className="flex">
                  {/* Left blue bar */}
                  <div className="w-1.5 bg-blue-400 flex-shrink-0"></div>
                  
                  {/* Content */}
                  <div className="flex-grow p-4">
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="font-bold text-xl">{event.title}</h3>
                      <span className="text-xs px-2 py-1 bg-blue-100 text-blue-800 rounded">
                        Project
                      </span>
                    </div>
                    
                    <div className="flex items-center text-gray-600 mb-2">
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
              </div>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-60 text-center">
            <div className="text-gray-300 mb-4">
              <EmptyCalendarIcon />
            </div>
            <p className="text-lg text-gray-700 font-medium">No events today</p>
            <p className="text-sm text-gray-500 mt-1">Try selecting a different date</p>
          </div>
        )}
      </div>
      
      {/* Bottom navigation */}
      <div className="fixed bottom-20 left-0 right-0 z-20 flex justify-center items-center">
        <div className="flex items-center space-x-6">
          {/* Left arrow button */}
          <div className="bg-white border border-gray-200 h-12 w-12 rounded-full shadow-sm flex items-center justify-center">
            <button 
              onClick={goToPreviousDay} 
              aria-label="Previous day" 
              className="flex items-center justify-center w-full h-full"
            >
              <ChevronLeft className="h-5 w-5 text-gray-600" />
            </button>
          </div>
          
          {/* Center calendar button */}
          <div className="bg-red-600 h-14 w-14 rounded-full shadow-sm flex items-center justify-center">
            <CalendarIcon className="h-6 w-6 text-white" />
          </div>
          
          {/* Right arrow button */}
          <div className="bg-white border border-gray-200 h-12 w-12 rounded-full shadow-sm flex items-center justify-center">
            <button 
              onClick={goToNextDay} 
              aria-label="Next day" 
              className="flex items-center justify-center w-full h-full"
            >
              <ChevronRight className="h-5 w-5 text-gray-600" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}