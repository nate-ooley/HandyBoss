import React from 'react';

interface MapPlaceholderProps {
  lat?: number;
  lng?: number;
  address?: string;
  className?: string;
}

export const MapPlaceholder: React.FC<MapPlaceholderProps> = ({ 
  lat = 34.0522, 
  lng = -118.2437, 
  address = 'Location pin',
  className = ''
}) => {
  return (
    <div className={`relative bg-gray-100 rounded-lg overflow-hidden ${className}`}>
      <div className="absolute inset-0 bg-gradient-to-br from-blue-50 to-blue-100 opacity-70"></div>
      <div className="absolute inset-0">
        <div className="grid grid-cols-8 grid-rows-6 h-full w-full">
          {/* Grid lines */}
          {Array(8).fill(0).map((_, i) => (
            <div key={`v-${i}`} className="border-r border-blue-200 h-full"></div>
          ))}
          {Array(6).fill(0).map((_, i) => (
            <div key={`h-${i}`} className="border-b border-blue-200 w-full col-span-8"></div>
          ))}
          
          {/* Roads */}
          <div className="absolute top-1/4 left-0 right-0 h-2 bg-blue-300 opacity-60"></div>
          <div className="absolute top-2/3 left-0 right-0 h-3 bg-blue-300 opacity-60"></div>
          <div className="absolute left-1/3 top-0 bottom-0 w-2 bg-blue-300 opacity-60"></div>
          <div className="absolute left-3/4 top-0 bottom-0 w-2 bg-blue-300 opacity-60"></div>
        </div>
      </div>
      
      {/* Location pin */}
      <div className="absolute left-1/2 top-1/2 transform -translate-x-1/2 -translate-y-1/2 flex flex-col items-center">
        <div className="h-8 w-8 bg-red-500 rounded-full flex items-center justify-center">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
        </div>
        <div className="mt-1 px-2 py-1 bg-white rounded-md shadow-md">
          <span className="text-xs font-medium text-gray-700">{address}</span>
        </div>
      </div>
      
      {/* Compass */}
      <div className="absolute top-2 right-2 bg-white rounded-full p-1 shadow-md">
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5v-4m0 4h-4m4 0l-5-5" />
        </svg>
      </div>
      
      {/* Scale indicator */}
      <div className="absolute bottom-2 left-2 bg-white rounded px-2 py-0.5 shadow-md">
        <span className="text-xs font-medium text-gray-700">250 m</span>
      </div>
      
      <div className="text-xs text-center text-gray-400 pt-3 pb-2">
        Map data • Lat: {lat.toFixed(4)} • Lng: {lng.toFixed(4)}
      </div>
    </div>
  );
};