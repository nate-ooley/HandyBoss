import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { BossManHeader } from '../components/BossManHeader';
import { WeatherAlert } from '../components/WeatherAlert';
import { VoiceCommandDisplay } from '../components/VoiceCommandDisplay';
import { JobsitesList } from '../components/JobsitesList';
import { QuickCommands } from '../components/QuickCommands';
import { VoiceCommandButton } from '../components/VoiceCommandButton';
import { useVoice } from '../contexts/VoiceContext';
import { useWebSocket } from '../contexts/WebSocketContext';
import { Jobsite } from '../types';

const MobileApp: React.FC = () => {
  const [isBossMode, setIsBossMode] = useState(false);
  const [weatherAlertText, setWeatherAlertText] = useState('Weather Alert: Heavy Rain Expected');
  const [currentCommand, setCurrentCommand] = useState('"I\'ll be 20 minutes late to the Westside project!"');
  
  const { startListening, synthesizeSpeech } = useVoice();
  const { lastMessage, sendMessage } = useWebSocket();

  // Fetch jobsites
  const { data: jobsites } = useQuery<Jobsite[]>({
    queryKey: ['/api/jobsites'],
  });

  useEffect(() => {
    if (lastMessage) {
      if (lastMessage.type === 'weather-alert') {
        setWeatherAlertText(lastMessage.text);
      } else if (lastMessage.type === 'command-response') {
        synthesizeSpeech(lastMessage.text);
      }
    }
  }, [lastMessage, synthesizeSpeech]);

  const handleMicClick = () => {
    startListening((transcript) => {
      if (transcript) {
        setCurrentCommand(`"${transcript}"`);
        
        sendMessage({
          type: 'command',
          command: transcript,
          timestamp: new Date().toISOString(),
          bossMode: isBossMode
        });
      }
    });
  };

  const toggleBossMode = () => {
    setIsBossMode(!isBossMode);
    synthesizeSpeech(isBossMode ? 'Boss mode deactivated' : 'Boss mode activated');
  };

  return (
    <div className="min-h-screen bg-white flex flex-col">
      <BossManHeader 
        title="Boss-Man" 
        onMicClick={handleMicClick}
        isBossMode={isBossMode}
        toggleBossMode={toggleBossMode}
        isMobileView={true}
      />
      
      <WeatherAlert message={weatherAlertText} />
      
      <VoiceCommandDisplay 
        command={currentCommand.replace(/^"|"$/g, '')} 
        mood={currentCommand.toLowerCase().includes('late') ? 'worried' : 'normal'}
      />
      
      {/* Featured app section */}
      <div className="bg-primary/10 p-4 mb-4 rounded-lg mx-4 mt-4">
        <h2 className="text-xl font-bold mb-2 flex items-center">
          <span role="img" aria-label="Translator">🌐</span> 
          <span className="ml-2">Voice Translation</span>
        </h2>
        <p className="text-sm text-foreground font-medium mb-3">
          Communicate with your workers in real-time. You speak English, they hear Spanish; they speak Spanish, you hear English.
        </p>
        <a 
          href="/translate" 
          className="bg-primary text-primary-foreground px-4 py-2 rounded-lg flex items-center justify-center font-medium"
        >
          <span className="mr-2">Open Translator</span> 
          <span role="img" aria-label="Microphone">🎤</span>
        </a>
      </div>
      
      {jobsites && <JobsitesList jobsites={jobsites} />}
      
      <QuickCommands />
      
      <div className="fixed bottom-4 left-1/2 transform -translate-x-1/2 flex justify-center">
        <VoiceCommandButton 
          onCommand={(command) => {
            setCurrentCommand(`"${command}"`);
            
            sendMessage({
              type: 'command',
              command,
              timestamp: new Date().toISOString(),
              bossMode: isBossMode
            });
          }} 
        />
      </div>
    </div>
  );
};

export default MobileApp;
