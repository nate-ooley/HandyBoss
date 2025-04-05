import React from 'react';
import { BossManCharacter } from './BossManCharacter';

interface VoiceCommandDisplayProps {
  command: string;
  mood?: 'normal' | 'happy' | 'angry' | 'worried' | 'busy';
}

export const VoiceCommandDisplay: React.FC<VoiceCommandDisplayProps> = ({ 
  command,
  mood = 'normal' 
}) => {
  return (
    <div className="m-4 p-4 border border-gray-200 rounded-xl relative">
      <div className="flex items-start space-x-3">
        <BossManCharacter size="md" mood={mood} />
        <div className="bg-light p-3 rounded-xl flex-1">
          <p className="text-dark font-medium">"{command}"</p>
        </div>
      </div>
    </div>
  );
};
