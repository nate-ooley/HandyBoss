import React from 'react';
import { AlertTriangle } from 'lucide-react';

interface WeatherAlertProps {
  message: string;
}

export const WeatherAlert: React.FC<WeatherAlertProps> = ({ message }) => {
  return (
    <div className="weather-banner">
      <AlertTriangle className="text-black h-5 w-5" />
      <p className="text-black font-bold">{message}</p>
    </div>
  );
};
