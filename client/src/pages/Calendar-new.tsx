import React, { useState } from 'react';
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight } from 'lucide-react';

export default function Calendar() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [datePickerOpen, setDatePickerOpen] = useState(false);

  const goToNextDay = () => {
    // Logic to go to next day
    console.log('Go to next day');
  };

  const goToPreviousDay = () => {
    // Logic to go to previous day
    console.log('Go to previous day');
  };

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Calendar</h1>
      
      {/* Basic content */}
      <div className="h-[500px] flex items-center justify-center text-lg text-gray-500">
        Calendar content will appear here
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