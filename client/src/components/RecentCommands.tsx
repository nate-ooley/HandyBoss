import React from 'react';
import { BossManCharacter } from './BossManCharacter';
import { Button } from '@/components/ui/button';
import { MapPin } from 'lucide-react';
import { Command } from '../types';

interface RecentCommandsProps {
  commands: Command[];
  onViewMap: () => void;
}

export const RecentCommands: React.FC<RecentCommandsProps> = ({ 
  commands,
  onViewMap 
}) => {
  const getMoodForCommand = (command: string): 'normal' | 'happy' | 'angry' | 'worried' | 'busy' => {
    if (command.toLowerCase().includes('late')) return 'worried';
    if (command.toLowerCase().includes('more') || command.toLowerCase().includes('need')) return 'busy';
    if (command.toLowerCase().includes('safety')) return 'angry';
    return 'normal';
  };

  return (
    <div className="border border-gray-200 rounded-xl p-4">
      <h2 className="text-xl font-bold text-dark mb-3">RECENT COMMANDS</h2>
      
      {commands.map((command, index) => (
        <div key={index} className="mb-3 flex items-start space-x-3">
          <BossManCharacter 
            size="sm" 
            mood={getMoodForCommand(command.text)} 
          />
          <div className="bg-light p-3 rounded-xl flex-1">
            <p className="text-dark">"{command.text}"</p>
          </div>
        </div>
      ))}
      
      <Button 
        className="bg-success text-white w-full py-3 rounded-xl mt-4 font-medium flex items-center justify-center"
        onClick={onViewMap}
      >
        <MapPin className="h-5 w-5 mr-2" />
        VIEW ALL JOBSITES ON MAP
      </Button>
    </div>
  );
};
