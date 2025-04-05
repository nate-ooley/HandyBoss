import React from 'react';
import { AlertTriangle } from 'lucide-react';

interface WeatherAlertProps {
  message: string;
}

export const WeatherAlert: React.FC<WeatherAlertProps> = ({ message }) => {
  return (
    <div className="bg-warning bg-opacity-20 p-3 flex items-center space-x-3 border-l-4 border-warning">
      <AlertTriangle className="text-warning h-5 w-5" />
      <p className="text-dark font-medium">{message}</p>
    </div>
  );
};
