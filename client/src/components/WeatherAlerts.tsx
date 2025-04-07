import React from 'react';
import BossManCharacter from "./BossManCharacter";
import { Umbrella } from 'lucide-react';
import { WeatherAlert as WeatherAlertType } from '../types';

interface WeatherAlertsProps {
  weatherAlerts: WeatherAlertType[];
  currentAlert?: string;
}

export const WeatherAlerts: React.FC<WeatherAlertsProps> = ({ 
  weatherAlerts, 
  currentAlert 
}) => {
  return (
    <div className="border border-gray-200 rounded-xl p-4">
      {currentAlert && (
        <div className="mb-4">
          <div className="flex items-start space-x-3">
            <BossManCharacter size="lg" mood="concerned" />
            <div className="bg-light p-4 rounded-xl flex-1">
              <p className="text-primary font-medium">"{currentAlert}"</p>
            </div>
          </div>
        </div>
      )}
      
      <h2 className="text-xl font-bold text-dark mb-3">WEATHER ALERTS</h2>
      
      {weatherAlerts.map((alert, index) => (
        <div 
          key={index} 
          className="border border-secondary rounded-xl p-4 bg-secondary bg-opacity-10 mb-3"
        >
          <div className="flex justify-between">
            <div>
              <h3 className="font-semibold text-dark">{alert.title}</h3>
              <p className="text-gray-600">{alert.location} - {alert.duration}</p>
              <p className="text-primary font-medium mt-1">{alert.impact}</p>
            </div>
            <div className="w-10 h-10 rounded-full flex items-center justify-center">
              <Umbrella className="text-secondary h-6 w-6" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};
