import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { BossManHeader } from '../components/BossManHeader';
import { SideNavigation } from '../components/SideNavigation';
import { ProfileCard } from '../components/ProfileCard';
import { WeatherAlerts } from '../components/WeatherAlerts';
import { RecentCommands } from '../components/RecentCommands';
import { VoiceChatbot } from '../components/VoiceChatbot';
import { JobsiteMap } from '../components/JobsiteMap';
import { useVoice } from '../contexts/VoiceContext';
import { useWebSocket } from '../contexts/WebSocketContext';
import { User, Command, WeatherAlert, Jobsite } from '../types';

const Dashboard: React.FC = () => {
  const { startListening } = useVoice();
  const { lastMessage } = useWebSocket();
  const [showMap, setShowMap] = useState(false);
  
  // Fetch user data
  const { data: user } = useQuery<User>({
    queryKey: ['/api/user/current'],
  });
  
  // Fetch jobsites
  const { data: jobsites } = useQuery<Jobsite[]>({
    queryKey: ['/api/jobsites'],
  });
  
  // Fetch weather alerts
  const { data: weatherAlerts } = useQuery<WeatherAlert[]>({
    queryKey: ['/api/weather-alerts'],
  });
  
  // Fetch recent commands
  const { data: commands } = useQuery<Command[]>({
    queryKey: ['/api/commands/recent'],
  });

  const [currentWeatherAlert, setCurrentWeatherAlert] = useState<string | undefined>(
    "It's raining heavily at the Downtown site. Update client!"
  );

  useEffect(() => {
    if (lastMessage && lastMessage.type === 'weather-alert') {
      setCurrentWeatherAlert(lastMessage.text);
    }
  }, [lastMessage]);

  const handleMicClick = () => {
    startListening((transcript) => {
      console.log('Voice command received:', transcript);
    });
  };

  return (
    <div className="min-h-screen bg-white">
      <BossManHeader 
        title="Boss-Man Jobsite Manager" 
        onMicClick={handleMicClick}
      />
      
      <div className="flex">
        <SideNavigation>
          {user && <ProfileCard user={user} />}
        </SideNavigation>
        
        <div className="flex-1 p-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {weatherAlerts && (
              <WeatherAlerts 
                weatherAlerts={weatherAlerts} 
                currentAlert={currentWeatherAlert} 
              />
            )}
            
            {commands && (
              <RecentCommands 
                commands={commands} 
                onViewMap={() => setShowMap(true)} 
              />
            )}
          </div>
          
          <VoiceChatbot />
          
          {(showMap || jobsites) && <JobsiteMap jobsites={jobsites || []} />}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
