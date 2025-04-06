import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { BossManHeader } from '../components/BossManHeader';
import { SideNavigation } from '../components/SideNavigation';
import { MobileNavigation } from '../components/MobileNavigation';
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
    <div className="min-h-screen bg-white pb-16 sm:pb-0">
      <BossManHeader 
        title="Boss-Man Jobsite Manager" 
        onMicClick={handleMicClick}
      />
      
      <div className="flex">
        {/* Only hide SideNavigation on very small screens (phones), show on sm and larger (iPad and web) */}
        <div className="hidden sm:block">
          <SideNavigation>
            {user && <ProfileCard user={user} />}
          </SideNavigation>
        </div>
        
        <div className="flex-1 p-4 md:p-6 w-full">
          {/* Featured translation app banner */}
          <div className="bg-gradient-to-r from-primary/20 to-primary/5 p-4 mb-6 rounded-lg border border-primary/20 shadow-sm">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-lg sm:text-xl font-bold mb-2 flex items-center">
                  <span role="img" aria-label="Globe">🌎</span>
                  <span className="ml-2">English-Spanish Voice Translation</span>
                </h2>
                <p className="text-xs sm:text-sm text-muted-foreground max-w-2xl">
                  Break language barriers on your jobsites! Speak in English and your workers hear Spanish. 
                  They reply in Spanish and you hear English. Try our new voice-first translation tool.
                </p>
              </div>
              <a 
                href="/translate" 
                className="bg-primary text-primary-foreground hover:bg-primary/90 px-4 py-2 rounded-lg flex items-center gap-2 font-medium whitespace-nowrap text-sm sm:text-base w-full sm:w-auto justify-center"
              >
                Open Translator <span role="img" aria-label="Microphone">🎤</span>
              </a>
            </div>
          </div>
          
          {/* Feature Options */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6 mb-6">
            <div className="bg-white rounded-lg border shadow-sm p-4">
              <h3 className="text-base md:text-lg font-semibold mb-2 flex items-center">
                <span role="img" aria-label="Speech" className="mr-2">🗣️</span>
                Voice Commands
              </h3>
              <p className="text-xs md:text-sm text-muted-foreground mb-3 md:mb-4">
                Control your jobsite with advanced voice commands. Create tasks, send alerts, or get information instantly.
              </p>
              <a 
                href="/voice-commands" 
                className="bg-primary text-primary-foreground hover:bg-primary/90 px-3 py-1.5 md:px-4 md:py-2 rounded-lg inline-block font-medium text-sm md:text-base w-full text-center"
              >
                Try Voice Commands
              </a>
            </div>
            
            <div className="bg-white rounded-lg border shadow-sm p-4">
              <h3 className="text-base md:text-lg font-semibold mb-2 flex items-center">
                <span role="img" aria-label="Money" className="mr-2">💵</span>
                Single Job Payment
              </h3>
              <p className="text-xs md:text-sm text-muted-foreground mb-3 md:mb-4">
                Need to process a quick payment for a completed job? Use our secure one-time payment processor.
              </p>
              <a 
                href="/checkout" 
                className="bg-primary text-primary-foreground hover:bg-primary/90 px-3 py-1.5 md:px-4 md:py-2 rounded-lg inline-block font-medium text-sm md:text-base w-full text-center"
              >
                Process Payment
              </a>
            </div>
            
            <div className="bg-white rounded-lg border shadow-sm p-4">
              <h3 className="text-base md:text-lg font-semibold mb-2 flex items-center">
                <span role="img" aria-label="Calendar" className="mr-2">📅</span>
                Subscription Plans
              </h3>
              <p className="text-xs md:text-sm text-muted-foreground mb-3 md:mb-4">
                Get full access to all features with our flexible subscription plans designed for teams of all sizes.
              </p>
              <a 
                href="/subscribe" 
                className="bg-primary text-primary-foreground hover:bg-primary/90 px-3 py-1.5 md:px-4 md:py-2 rounded-lg inline-block font-medium text-sm md:text-base w-full text-center"
              >
                View Plans
              </a>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
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
          
          <div className="mt-4 md:mt-6">
            <VoiceChatbot />
          </div>
          
          {(showMap || jobsites) && 
            <div className="mt-4 md:mt-6">
              <JobsiteMap jobsites={jobsites || []} />
            </div>
          }
        </div>
      </div>
      
      {/* Mobile Navigation - only visible on small mobile phones */}
      <div className="sm:hidden">
        <MobileNavigation />
      </div>

      {/* Floating Security Incident Button */}
      <div className="fixed bottom-20 right-6 sm:bottom-6 z-30">
        <button 
          onClick={() => {
            // Call the Socket WebSocket API with a command
            const ws = new WebSocket(
              `${window.location.protocol === 'https:' ? 'wss:' : 'ws:'}//${window.location.host}/ws`
            );
            
            ws.onopen = () => {
              ws.send(JSON.stringify({
                type: 'command',
                command: 'Safety Incident',
                timestamp: new Date().toISOString()
              }));
              
              // Close the connection after sending
              setTimeout(() => ws.close(), 500);
              
              // Show a notification to the user
              alert('Security incident reported. The boss has been notified.');
            };
          }}
          className="bg-red-600 hover:bg-red-700 text-white rounded-full w-16 h-16 flex items-center justify-center shadow-lg"
          title="Report Security Incident"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        </button>
      </div>
    </div>
  );
};

export default Dashboard;
